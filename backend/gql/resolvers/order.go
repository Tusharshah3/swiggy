package resolvers

import (
	"context"
	"fmt"
	"swiggy-clone/backend/gql"
	"swiggy-clone/backend/middleware"
	"swiggy-clone/backend/models"
)

func (r *queryResolver) GetOrderHistory(ctx context.Context) ([]*gql.Order, error) {
	uid, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthorized")
	}

	var orders []models.Order
	if err := r.DB.Preload("Items").Where("user_id = ?", uid).Order("placed_at DESC").Find(&orders).Error; err != nil {
		return nil, err
	}

	var result []*gql.Order
	for _, o := range orders {
		var items []*gql.OrderItem
		for _, item := range o.Items {
			items = append(items, &gql.OrderItem{
				ProductID:       fmt.Sprint(item.ProductID),
				Quantity:        item.Quantity,
				PriceAtPurchase: item.PriceAtPurchase,
			})
		}

		result = append(result, &gql.Order{
			ID:             fmt.Sprint(o.ID),
			Total:          o.Total,
			Status:         gql.OrderStatus(o.Status),
			PlacedAt:       o.PlacedAt,
			Items:          items,
			IdempotencyKey: o.IdempotencyKey,
		})
	}

	return result, nil
}
