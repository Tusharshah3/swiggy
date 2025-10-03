package resolvers

import (
	"context"
	"fmt"

	"swiggy-clone/backend/gql"
	"swiggy-clone/backend/middleware"
)

func (r *mutationResolver) Checkout(ctx context.Context, idempotencyKey *string) (*gql.Order, error) {
	uid, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthorized")
	}

	order, err := r.CheckoutService.Checkout(ctx, uint(uid), idempotencyKey)
	if err != nil {
		return nil, err
	}

	// Map DB order → GraphQL order
	var gqlItems []*gql.OrderItem
	for _, item := range order.Items {
		gqlItems = append(gqlItems, &gql.OrderItem{
			ProductID:       fmt.Sprint(item.ProductID),
			Quantity:        item.Quantity,
			PriceAtPurchase: item.PriceAtPurchase,
		})
	}

	return &gql.Order{
		ID:             fmt.Sprint(order.ID),
		Total:          order.Total,
		Status:         gql.OrderStatus(order.Status),
		PlacedAt:       order.PlacedAt,
		Items:          gqlItems,
		IdempotencyKey: order.IdempotencyKey,
	}, nil
}
