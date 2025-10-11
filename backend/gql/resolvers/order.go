package resolvers

import (
	"context"
	"encoding/json"
	"fmt"

	"swiggy-clone/backend/gql"
	"swiggy-clone/backend/middleware"
	"swiggy-clone/backend/models"

	"github.com/lib/pq"
)

// GetOrderHistory fetches all orders for the current user with full product details
func (r *queryResolver) GetOrderHistory(ctx context.Context) ([]*gql.Order, error) {
	uid, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthorized")
	}

	// Fetch all orders for user
	var orders []models.Order
	if err := r.DB.
		Preload("Items"). // Load associated order items
		Where("user_id = ?", uid).
		Order("placed_at DESC").
		Find(&orders).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch orders: %v", err)
	}

	var gqlOrders []*gql.Order

	for _, o := range orders {
		// Unmarshal stored JSON product snapshots
		var snapshots []map[string]interface{}
		if len(o.Products) > 0 {
			if err := json.Unmarshal(o.Products, &snapshots); err != nil {
				fmt.Println("❌ failed to unmarshal products JSON:", err)
				snapshots = []map[string]interface{}{}
			}
		}

		// Convert to gql.ProductItem slices
		productItems := buildGQLProductItems(snapshots)

		// Convert OrderItems for GQL
		var gqlOrderItems []*gql.OrderItem
		for _, item := range o.Items {
			var product *gql.Product
			// Try to match item.ProductID with snapshot for richer details
			for _, snap := range snapshots {
				if fmt.Sprint(snap["id"]) == fmt.Sprint(item.ProductID) {
					imgStr := fmt.Sprint(snap["image"])
					qStr := fmt.Sprintf("%v", snap["quantity"])
					product = &gql.Product{
						ID:       fmt.Sprint(snap["id"]),
						Name:     snap["name"].(string),
						Price:    snap["price"].(float64),
						Image:    &imgStr,
						Quantity: &qStr,
					}
					break
				}
			}

			gqlOrderItems = append(gqlOrderItems, &gql.OrderItem{
				ProductID:       fmt.Sprint(item.ProductID),
				Quantity:        item.Quantity,
				PriceAtPurchase: item.PriceAtPurchase,
				Product:         product,
			})
		}

		// Build the final GQL order
		gqlOrders = append(gqlOrders, &gql.Order{
			ID:             fmt.Sprint(o.ID),
			UserID:         fmt.Sprint(o.UserID),
			Products:       productItems,
			ProductAdmins:  o.ProductAdmins,
			TotalPrice:     o.Total,
			Status:         gql.OrderStatus(o.Status),
			PlacedAt:       o.PlacedAt,
			Items:          gqlOrderItems,
			IdempotencyKey: o.IdempotencyKey,
		})
	}

	return gqlOrders, nil
}
func (r *queryResolver) GetAdminOrders(ctx context.Context) ([]*gql.Order, error) {
	uid, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthorized")
	}

	// 1️⃣ Fetch orders where admin's ID is in product_admins[]
	var orders []models.Order
	if err := r.DB.
		Where("? = ANY(product_admins)", fmt.Sprint(uid)).
		Order("placed_at DESC").
		Find(&orders).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch admin orders: %v", err)
	}

	// 2️⃣ Convert to gql.Order format
	var gqlOrders []*gql.Order
	for _, o := range orders {
		// Unmarshal product snapshots (stored JSON)
		var snapshots []map[string]interface{}
		if len(o.Products) > 0 {
			if err := json.Unmarshal(o.Products, &snapshots); err != nil {
				fmt.Println("❌ failed to unmarshal products:", err)
				snapshots = []map[string]interface{}{}
			}
		}

		// Convert products snapshot to gql type
		productItems := buildGQLProductItems(snapshots)

		gqlOrders = append(gqlOrders, &gql.Order{
			ID:             fmt.Sprint(o.ID),
			UserID:         fmt.Sprint(o.UserID),
			Products:       productItems,
			ProductAdmins:  pq.StringArray(o.ProductAdmins),
			TotalPrice:     o.Total,
			Status:         gql.OrderStatus(o.Status),
			PlacedAt:       o.PlacedAt,
			IdempotencyKey: o.IdempotencyKey,
		})
	}

	return gqlOrders, nil
}
