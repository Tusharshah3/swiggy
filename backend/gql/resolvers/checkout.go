package resolvers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/lib/pq"
	"gorm.io/datatypes"

	"swiggy-clone/backend/gql"
	"swiggy-clone/backend/middleware"
	"swiggy-clone/backend/models"
	"swiggy-clone/backend/redis"
)

// Helper to make *string easily
func strPtr(s string) *string {
	return &s
}

// ---------- safe conversion helpers ----------
func toFloat64(v interface{}) float64 {
	switch x := v.(type) {
	case float64:
		return x
	case float32:
		return float64(x)
	case int:
		return float64(x)
	case int64:
		return float64(x)
	case uint:
		return float64(x)
	case string:
		f, _ := strconv.ParseFloat(x, 64)
		return f
	default:
		return 0
	}
}

func toInt(v interface{}) int {
	switch x := v.(type) {
	case int:
		return x
	case int64:
		return int(x)
	case float64:
		return int(x)
	case float32:
		return int(x)
	case uint:
		return int(x)
	case string:
		i, _ := strconv.Atoi(x)
		return i
	default:
		return 0
	}
}

func toTime(v interface{}) time.Time {
	switch x := v.(type) {
	case time.Time:
		return x
	case string:
		t, _ := time.Parse(time.RFC3339, x)
		return t
	default:
		return time.Time{}
	}
}

// ---------- safe build helper ----------
func buildGQLProductItems(snapshots []map[string]interface{}) []*gql.ProductItem {
	var items []*gql.ProductItem
	for _, snap := range snapshots {
		id := fmt.Sprint(snap["id"])
		name := ""
		if v, ok := snap["name"].(string); ok {
			name = v
		}
		price := toFloat64(snap["price"])
		qty := toInt(snap["quantity"])
		imgPtr := (*string)(nil)
		if snap["image"] != nil {
			s := fmt.Sprint(snap["image"])
			imgPtr = &s
		}
		createdAt := toTime(snap["createdAt"])
		updatedAt := toTime(snap["updatedAt"])
		adminID := 0
		if snap["adminId"] != nil {
			adminID = toInt(snap["adminId"])
		}
		qStr := fmt.Sprint(qty)

		items = append(items, &gql.ProductItem{
			ProductID:       id,
			Quantity:        qty,
			PriceAtPurchase: price,
			Product: &gql.Product{
				ID:        id,
				Name:      name,
				Price:     price,
				Stock:     toInt(snap["stock"]),
				CreatedAt: createdAt,
				UpdatedAt: updatedAt,
				AdminID:   adminID,
				Image:     imgPtr,
				Quantity:  &qStr,
			},
		})
	}
	if items == nil {
		items = []*gql.ProductItem{} // never return nil
	}
	return items
}

// Checkout handles creating a new order from the user's cart
func (r *mutationResolver) Checkout(ctx context.Context, idempotencyKey *string) (*gql.Order, error) {
	uid, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthenticated")
	}

	// Get cart
	cartItems, err := redis.GetCart(ctx, uid)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch cart: %v", err)
	}
	if len(cartItems) == 0 {
		return nil, fmt.Errorf("cart is empty")
	}

	var (
		orderItems       []models.OrderItem
		gqlOrderItems    []*gql.OrderItem
		productSnapshots []map[string]interface{}
		totalPrice       float64
		adminSet         = map[uint]bool{}
		productAdminsArr pq.StringArray
	)

	// Build order items / snapshots from cart (but do not persist yet)
	for _, item := range cartItems {
		var product models.Product
		if err := r.DB.First(&product, item.ProductID).Error; err != nil {
			// log and continue; product might have been deleted
			log.Printf("checkout: skipping missing product id=%v: %v", item.ProductID, err)
			continue
		}

		// accumulate price and admin set
		totalPrice += product.Price * float64(item.Quantity)
		adminSet[uint(product.AdminID)] = true

		// prepare DB order item (ID zero by default)
		orderItems = append(orderItems, models.OrderItem{
			ProductID:       product.ID,
			Quantity:        item.Quantity,
			PriceAtPurchase: product.Price,
		})

		// build gql.Product for returning with OrderItem
		qStr := fmt.Sprintf("%d", item.Quantity)
		gqlProduct := &gql.Product{
			ID:        fmt.Sprint(product.ID),
			Name:      product.Name,
			Price:     product.Price,
			Stock:     product.Stock,
			Image:     product.Image,
			Quantity:  &qStr,
			AdminID:   int(product.AdminID),
			CreatedAt: product.CreatedAt,
			UpdatedAt: product.UpdatedAt,
		}

		gqlOrderItems = append(gqlOrderItems, &gql.OrderItem{
			ProductID:       fmt.Sprint(product.ID),
			Quantity:        item.Quantity,
			PriceAtPurchase: product.Price,
			Product:         gqlProduct,
		})

		// snapshot for JSON storage (camelCase keys)
		productSnapshots = append(productSnapshots, map[string]interface{}{
			"id":        product.ID,
			"name":      product.Name,
			"price":     product.Price,
			"stock":     product.Stock,
			"adminId":   product.AdminID,
			"image":     product.Image,
			"quantity":  item.Quantity,
			"createdAt": product.CreatedAt,
			"updatedAt": product.UpdatedAt,
		})
	}

	// If after filtering, no valid items left, fail early with informative error
	if len(gqlOrderItems) == 0 || len(productSnapshots) == 0 {
		return nil, fmt.Errorf("no valid products available in cart; aborting checkout")
	}

	for adminID := range adminSet {
		productAdminsArr = append(productAdminsArr, fmt.Sprint(adminID))
	}

	// Marshal snapshots for storing on Order
	prodBytes, err := json.Marshal(productSnapshots)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal products: %v", err)
	}

	// IDEMPOTENCY: if idempotencyKey provided, try to return existing order instead of creating a duplicate
	if idempotencyKey != nil && *idempotencyKey != "" {
		var existing models.Order
		// search for an existing order with the same idempotency key
		if err := r.DB.Preload("Items").Where("idempotency_key = ?", *idempotencyKey).First(&existing).Error; err == nil {
			// Build a minimal gql.Order to return (we avoid duplicating an order):
			existingProducts := []map[string]interface{}{}
			if len(existing.Products) > 0 {
				_ = json.Unmarshal(existing.Products, &existingProducts) // ignore unmarshal error here
			}
			return &gql.Order{
				ID:             fmt.Sprint(existing.ID),
				UserID:         fmt.Sprint(existing.UserID),
				Products:       buildGQLProductItems(existingProducts),
				ProductAdmins:  existing.ProductAdmins,
				TotalPrice:     existing.Total,
				Status:         gql.OrderStatus(existing.Status),
				PlacedAt:       existing.PlacedAt,
				Items:          gqlOrderItemsFromModel(existing.Items),
				IdempotencyKey: existing.IdempotencyKey,
			}, nil
		}
		// otherwise continue to create a new order
	}

	// Wrap order + order_items creation in a DB transaction
	// Pseudocode snippet: call inside Checkout mutation resolver
	tx := r.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1) Create order record without Items first (so GORM doesn't auto-insert items twice)
	order := &models.Order{
		UserID:         uid,
		Products:       datatypes.JSON(prodBytes),
		ProductAdmins:  productAdminsArr,
		Total:          totalPrice,
		Status:         models.OrderPending,
		PlacedAt:       time.Now(),
		IdempotencyKey: idempotencyKey,
	}

	if err := tx.Create(order).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create order: %v", err)
	}

	// 2) Create order items — ensure their ID is zero and OrderID set
	for i := range orderItems {
		orderItems[i].OrderID = order.ID
		orderItems[i].ID = 0
	}
	if len(orderItems) > 0 {
		if err := tx.Create(&orderItems).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to create order items: %v", err)
		}
	}

	// 3) Commit
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit order transaction: %v", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Clear cart (best-effort; do not fail checkout if redis clear fails)
	// if err := redis.ClearCart(ctx, uid); err != nil {
	// 	log.Printf("checkout: warning - failed to clear cart for user %v: %v", uid, err)
	// }

	// Build the GQL objects using safe helper
	gqlProducts := buildGQLProductItems(productSnapshots)

	log.Printf("checkout: created order id=%v total=%.2f items=%d", order.ID, totalPrice, len(gqlOrderItems))

	// Return GraphQL-ready order (matching gql generated types)
	return &gql.Order{
		ID:             fmt.Sprint(order.ID),
		UserID:         fmt.Sprint(uid),
		Products:       gqlProducts,
		ProductAdmins:  productAdminsArr,
		TotalPrice:     totalPrice,
		Status:         gql.OrderStatus(order.Status),
		PlacedAt:       order.PlacedAt,
		Items:          gqlOrderItems,
		IdempotencyKey: idempotencyKey,
	}, nil
}

// Helper to convert DB model OrderItem slice -> gql.OrderItem slice (defensive)
func gqlOrderItemsFromModel(items []models.OrderItem) []*gql.OrderItem {
	var out []*gql.OrderItem
	for _, it := range items {
		// Build product as nil (we don't have product struct preloaded here).
		out = append(out, &gql.OrderItem{
			ProductID:       fmt.Sprint(it.ProductID),
			Quantity:        it.Quantity,
			PriceAtPurchase: it.PriceAtPurchase,
			Product:         nil,
		})
	}
	if out == nil {
		out = []*gql.OrderItem{}
	}
	return out
}
