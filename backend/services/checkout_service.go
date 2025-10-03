package services

import (
	"context"
	"fmt"
	"time"

	"swiggy-clone/backend/kafka"
	"swiggy-clone/backend/models"
	"swiggy-clone/backend/redis"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// CheckoutService handles all logic related to order placement
type CheckoutService struct {
	DB    *gorm.DB
	Redis redis.Client
	Queue kafka.OrderQueue
}

// CartItemFromRedis matches the structure stored in Redis
type CartItemFromRedis struct {
	ProductID uint `json:"productId"`
	Quantity  int  `json:"quantity"`
}

// CartFromRedis represents the full cart object stored in Redis
type CartFromRedis struct {
	Items []CartItemFromRedis `json:"items"`
}

// Checkout does everything needed to place an order
func (s *CheckoutService) Checkout(ctx context.Context, userID uint, idempotencyKey *string) (*models.Order, error) {
	// 1. Get cart
	var cartItems []CartItemFromRedis
	found, err := s.Redis.GetJSON(ctx, fmt.Sprintf("user:%d:cart", userID), &cartItems)
	if err != nil {
		return nil, fmt.Errorf("redis error: %w", err)
	}
	if !found || len(cartItems) == 0 {
		return nil, fmt.Errorf("cart is empty")
	}

	// 2. Begin DB transaction
	var order *models.Order
	err = s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Map productId → quantity
		qtyMap := make(map[uint]int)
		ids := []uint{}
		for _, item := range cartItems {
			qtyMap[item.ProductID] = item.Quantity
			ids = append(ids, item.ProductID)
		}

		// 3. Fetch product rows with FOR UPDATE (lock for stock check)
		type productData struct {
			ID    uint
			Price float64
			Stock int
		}
		var products []productData
		if err := tx.
			Table("products").
			Where("id IN ?", ids).
			Select("id, price, stock").
			Clauses(clause.Locking{Strength: "UPDATE"}).
			Scan(&products).Error; err != nil {
			return err
		}

		// 4. Validate stock & calculate total
		var total float64
		orderItems := make([]models.OrderItem, 0, len(products))

		for _, p := range products {
			qty := qtyMap[p.ID]
			if qty <= 0 || qty > p.Stock {
				return fmt.Errorf("invalid or insufficient stock for product %d", p.ID)
			}
			total += float64(qty) * p.Price

			orderItems = append(orderItems, models.OrderItem{
				ProductID:       p.ID,
				Quantity:        qty,
				PriceAtPurchase: p.Price,
			})
		}

		// 5. Create order
		order = &models.Order{
			UserID:         userID,
			Total:          roundToTwo(total),
			Status:         models.OrderPending,
			PlacedAt:       time.Now(),
			IdempotencyKey: idempotencyKey,
		}
		if err := tx.Create(order).Error; err != nil {
			return fmt.Errorf("order create failed: %w", err)
		}

		// 6. Add order_id to each item and insert
		for i := range orderItems {
			orderItems[i].OrderID = order.ID
		}
		if err := tx.Create(&orderItems).Error; err != nil {
			return err
		}

		// 7. Decrement product stock
		for _, p := range products {
			qty := qtyMap[p.ID]
			if err := tx.Model(&models.Product{}).
				Where("id = ? AND stock >= ?", p.ID, qty).
				UpdateColumn("stock", gorm.Expr("stock - ?", qty)).Error; err != nil {
				return fmt.Errorf("stock update failed: %w", err)
			}
		}

		// Attach items back to order struct
		order.Items = orderItems
		return nil
	})
	if err != nil {
		return nil, err
	}

	// 8. Clear cart in Redis
	_ = s.Redis.Del(ctx, fmt.Sprintf("user:%d:cart", userID))

	// 9. (Next step) Send to async worker/queue
	if s.Queue != nil {
		go s.Queue.Publish(ctx, order.ID)
	}

	// e.g., s.Queue.Publish(order.ID)

	return order, nil
}
func roundToTwo(val float64) float64 {
	return float64(int(val*100+0.5)) / 100
}
