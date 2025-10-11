package resolvers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"swiggy-clone/backend/gql"
	"swiggy-clone/backend/middleware"
	"swiggy-clone/backend/models"
)

// safe conversion helpers (re-use if you already have them)
// func toFloat64(v interface{}) float64 {
// 	switch x := v.(type) {
// 	case float64:
// 		return x
// 	case float32:
// 		return float64(x)
// 	case int:
// 		return float64(x)
// 	case int64:
// 		return float64(x)
// 	case uint:
// 		return float64(x)
// 	case string:
// 		f, _ := strconv.ParseFloat(x, 64)
// 		return f
// 	default:
// 		return 0
// 	}
// }

// func toInt(v interface{}) int {
// 	switch x := v.(type) {
// 	case int:
// 		return x
// 	case int64:
// 		return int(x)
// 	case float64:
// 		return int(x)
// 	case float32:
// 		return int(x)
// 	case uint:
// 		return int(x)
// 	case string:
// 		i, _ := strconv.Atoi(x)
// 		return i
// 	default:
// 		return 0
// 	}
// }

// ✅ Mutation: CreatePayment (with debug logs)
// CreatePaymentsFromOrder creates payment rows for an order by splitting amounts by admin.
func (r *mutationResolver) CreatePaymentsFromOrder(ctx context.Context, orderId string, method string) ([]*gql.Payment, error) {
	// ensure user is authenticated (optional, but good)
	uid, ok := middleware.UserIDFromCtx(ctx)

	if !ok {
		return nil, fmt.Errorf("unauthenticated")
	}
	log.Printf(" [DEBUG] CreatePaymentsFromOrder called by user %v for order %v with method %v\n", uid, orderId, method)
	// find order by id (orderId is string in GraphQL)
	var order models.Order
	if err := r.DB.Preload("Items").First(&order, orderId).Error; err != nil {
		return nil, fmt.Errorf("order not found: %v", err)
	}

	// Parse order.Products JSON snapshot into []map[string]interface{}
	var snapshots []map[string]interface{}
	if len(order.Products) > 0 {
		if err := json.Unmarshal(order.Products, &snapshots); err != nil {
			// log but continue — fallback to use order.Items if needed
			log.Printf("warning: failed to unmarshal order.Products for order %v: %v", order.ID, err)
			snapshots = []map[string]interface{}{}
		}
	}

	// Aggregate amount per adminId.
	// We'll use snapshot adminId when available, otherwise we attempt to resolve from order.Items (if product->admin missing).
	amountsByAdmin := map[string]float64{}

	// Prefer snapshots (they contain adminId and price snapshot)
	if len(snapshots) > 0 {
		for _, snap := range snapshots {
			// get admin id (may be int/float64/string)
			adminRaw := snap["adminId"]
			adminKey := fmt.Sprint(adminRaw) // string key

			price := toFloat64(snap["price"])
			qty := toInt(snap["quantity"])
			if qty <= 0 {
				qty = 1
			}
			amountsByAdmin[adminKey] += price * float64(qty)
		}
	} else {
		// fallback: use order.Items and load product priceAtPurchase, but we don't have adminId here.
		// If OrderItem doesn't include adminId, we cannot split — fallback to assign full amount to first admin in ProductAdmins.
		for _, it := range order.Items {
			amt := it.PriceAtPurchase * float64(it.Quantity)
			// if product admin info not available, try to attribute to first product_admin in order.ProductAdmins
			adminKey := "0"
			if len(order.ProductAdmins) > 0 {
				adminKey = order.ProductAdmins[0]
			}
			amountsByAdmin[adminKey] += amt
		}
	}

	// If there are still no admins (unlikely), attribute total to "0"
	if len(amountsByAdmin) == 0 {
		amountsByAdmin["0"] = order.Total
	}

	// Prepare payments to insert
	var payments []models.Payment
	now := time.Now()
	methodU := strings.ToUpper(strings.TrimSpace(method))
	status := "SUCCESS" // or "PENDING" depending on your flow

	for adminKey, amt := range amountsByAdmin {
		p := models.Payment{
			UserID:    fmt.Sprint(order.UserID), // order.UserID is uint -> convert to string
			AdminID:   adminKey,
			OrderID:   fmt.Sprint(order.ID),
			Amount:    amt,
			Status:    status,
			Method:    methodU,
			CreatedAt: now,
		}
		payments = append(payments, p)
	}

	// Save payments in a transaction
	tx := r.DB.Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("failed to start transaction: %v", tx.Error)
	}

	if err := tx.Create(&payments).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to insert payments: %v", err)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit payment transaction: %v", err)
	}

	// Build gql.Payment list for response
	var gqlPayments []*gql.Payment
	for _, p := range payments {
		gqlPayments = append(gqlPayments, &gql.Payment{
			ID:        fmt.Sprint(p.ID),
			UserID:    p.UserID,
			AdminID:   p.AdminID,
			OrderID:   p.OrderID,
			Amount:    p.Amount,
			Status:    p.Status,
			Method:    p.Method,
			CreatedAt: p.CreatedAt,
		})
	}

	return gqlPayments, nil
}

// ✅ Query: Get all payments (with logging)
func (r *queryResolver) Payments(ctx context.Context) ([]*gql.Payment, error) {
	log.Println(" [DEBUG] Fetching all payments from DB...")

	var payments []models.Payment
	if err := r.DB.Find(&payments).Error; err != nil {
		log.Printf(" [ERROR] DB fetch failed: %v\n", err)
		return nil, fmt.Errorf("failed to fetch payments: %v", err)
	}

	var gqlPayments []*gql.Payment
	for _, p := range payments {
		gqlPayments = append(gqlPayments, &gql.Payment{
			ID:        fmt.Sprint(p.ID),
			UserID:    p.UserID,
			AdminID:   p.AdminID,
			OrderID:   p.OrderID,
			Amount:    p.Amount,
			Method:    p.Method,
			Status:    p.Status,
			CreatedAt: p.CreatedAt,
		})
	}
	log.Printf("✅ [DEBUG] Found %d payments\n", len(gqlPayments))
	return gqlPayments, nil
}

// ✅ Query: Get single payment by ID (with logging)
func (r *queryResolver) Payment(ctx context.Context, id string) (*gql.Payment, error) {
	log.Printf(" [DEBUG] Fetching payment with ID=%v\n", id)

	var p models.Payment
	if err := r.DB.First(&p, "id = ?", id).Error; err != nil {
		log.Printf(" [ERROR] Payment not found: %v\n", err)
		return nil, fmt.Errorf("payment not found: %v", err)
	}

	return &gql.Payment{
		ID:      fmt.Sprint(p.ID),
		UserID:  p.UserID,
		AdminID: p.AdminID,
		OrderID: p.OrderID,
		Amount:  p.Amount,
		Method:  p.Method,
		Status:  p.Status,

		CreatedAt: p.CreatedAt,
	}, nil
}
func (r *queryResolver) MyOrders(ctx context.Context) ([]*gql.Order, error) {
	uid, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthenticated")
	}

	var orders []models.Order
	// Preload Items and order by placed_at descending
	if err := r.DB.Preload("Items").Where("user_id = ?", uid).Order("placed_at desc").Find(&orders).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch orders: %v", err)
	}

	var gqlOrders []*gql.Order
	for _, o := range orders {
		// parse stored products JSON snapshot to build GQL product items
		var snapshots []map[string]interface{}
		if len(o.Products) > 0 {
			_ = json.Unmarshal(o.Products, &snapshots) // ignore unmarshal error; fallback later
		}

		gqlOrders = append(gqlOrders, &gql.Order{
			ID:             fmt.Sprint(o.ID),
			UserID:         fmt.Sprint(o.UserID),
			Products:       buildGQLProductItems(snapshots),
			ProductAdmins:  o.ProductAdmins,
			TotalPrice:     o.Total,
			Status:         gql.OrderStatus(o.Status),
			PlacedAt:       o.PlacedAt,
			Items:          gqlOrderItemsFromModel(o.Items),
			IdempotencyKey: o.IdempotencyKey,
		})
	}

	if gqlOrders == nil {
		gqlOrders = []*gql.Order{}
	}
	return gqlOrders, nil
}
