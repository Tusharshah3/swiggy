package resolvers

import (
	"context"
	"fmt"
	"strconv"

	gql "swiggy-clone/backend/gql"
	"swiggy-clone/backend/middleware"
	"swiggy-clone/backend/models"
	"swiggy-clone/backend/redis"
)

func (r *mutationResolver) AddToCart(ctx context.Context, productId string, quantity int) (*gql.Cart, error) {
	// ✅ Extract user ID from context
	uid, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthorized: no user ID in context (addToCart)")
	}
	userID := uid

	// Parse product ID
	pid, err := strconv.Atoi(productId)
	if err != nil {
		return nil, fmt.Errorf("invalid product ID")
	}

	// Get existing cart
	cart, _ := redis.GetCart(ctx, userID)

	// Check if item already exists
	found := false
	for i, item := range cart {
		if item.ProductID == uint(pid) {
			cart[i].Quantity += quantity
			found = true
			break
		}
	}
	if !found {
		cart = append(cart, models.CartItem{
			ProductID: uint(pid),
			Quantity:  quantity,
		})
	}

	// Save back to Redis
	if err := redis.SetCart(ctx, userID, cart); err != nil {
		return nil, err
	}

	return r.buildCart(ctx, cart)
}

func (r *mutationResolver) UpdateCart(ctx context.Context, productId string, quantity int) (*gql.Cart, error) {
	uid, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthorized: no user ID in context (updateCart)")
	}
	userID := uid

	pid, err := strconv.Atoi(productId)
	if err != nil {
		return nil, fmt.Errorf("invalid product ID")
	}

	cart, _ := redis.GetCart(ctx, userID)

	for i, item := range cart {
		if item.ProductID == uint(pid) {
			cart[i].Quantity = quantity
			break
		}
	}

	redis.SetCart(ctx, userID, cart)
	return r.buildCart(ctx, cart)
}

func (r *mutationResolver) RemoveFromCart(ctx context.Context, productId string) (*gql.Cart, error) {
	uid, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthorized: no user ID in context (removeFromCart)")
	}
	userID := uid

	pid, err := strconv.Atoi(productId)
	if err != nil {
		return nil, fmt.Errorf("invalid product ID")
	}

	cart, _ := redis.GetCart(ctx, userID)

	// Filter out the item
	newCart := []models.CartItem{}
	for _, item := range cart {
		if item.ProductID != uint(pid) {
			newCart = append(newCart, item)
		}
	}

	redis.SetCart(ctx, userID, newCart)
	return r.buildCart(ctx, newCart)
}

func (r *queryResolver) MyCart(ctx context.Context) (*gql.Cart, error) {
	uid, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthorized: no user ID in context (myCart)")
	}
	userID := uid

	cart, _ := redis.GetCart(ctx, userID)
	return r.buildCart(ctx, cart)
}

func (r *Resolver) buildCart(ctx context.Context, cart []models.CartItem) (*gql.Cart, error) {
	var gqlItems []*gql.CartItem
	var total float64

	for _, item := range cart {
		var product models.Product
		if err := r.DB.First(&product, item.ProductID).Error; err != nil {
			continue // skip missing
		}
		total += product.Price * float64(item.Quantity)
		gqlItems = append(gqlItems, &gql.CartItem{
			Product:  mapProductToGQL(&product),
			Quantity: item.Quantity,
		})
	}

	return &gql.Cart{
		Items: gqlItems,
		Total: total,
	}, nil
}
