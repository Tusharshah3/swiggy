package resolvers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"swiggy-clone/backend/gql"
	"swiggy-clone/backend/models"
	"swiggy-clone/backend/redis"
)

// CREATE
func (r *mutationResolver) CreateProduct(ctx context.Context, name string, price float64, stock int) (*gql.Product, error) {
	p := models.Product{Name: name, Price: price, Stock: stock}
	if err := r.DB.Create(&p).Error; err != nil {
		return nil, err
	}

	redis.DelPattern(ctx, "products:*") // invalidate cache
	return mapProductToGQL(&p), nil
}

// UPDATE
func (r *mutationResolver) UpdateProduct(ctx context.Context, id string, name *string, price *float64, stock *int) (*gql.Product, error) {
	var p models.Product
	if err := r.DB.First(&p, id).Error; err != nil {
		return nil, err
	}
	if name != nil {
		p.Name = *name
	}
	if price != nil {
		p.Price = *price
	}
	if stock != nil {
		p.Stock = *stock
	}
	if err := r.DB.Save(&p).Error; err != nil {
		return nil, err
	}
	redis.DelPattern(ctx, "products:*")

	return mapProductToGQL(&p), nil
}

// DELETE
func (r *mutationResolver) DeleteProduct(ctx context.Context, id string) (bool, error) {
	if err := r.DB.Delete(&models.Product{}, id).Error; err != nil {
		return false, err
	}
	redis.DelPattern(ctx, "products:*")

	return true, nil
}

// GET PRODUCTS (paginated)
func (r *queryResolver) GetProducts(ctx context.Context, page *int, limit *int) ([]*gql.Product, error) {
	cacheKey := fmt.Sprintf("products:page=%d:limit=%d", *page, *limit)

	// Try cache
	if cached, err := redis.Get(ctx, cacheKey); err == nil {
		log.Println(" served from Redis")
		var products []*gql.Product
		if err := json.Unmarshal([]byte(cached), &products); err == nil {
			return products, nil
		}
	}

	// Fallback to DB
	var modelsList []models.Product
	offset := (*page - 1) * (*limit)
	if err := r.DB.Limit(*limit).Offset(offset).Find(&modelsList).Error; err != nil {
		return nil, err
	}

	var result []*gql.Product
	for _, p := range modelsList {
		result = append(result, mapProductToGQL(&p))
	}

	// Cache result
	data, _ := json.Marshal(result)
	redis.Set(ctx, cacheKey, string(data), time.Minute*5) // ⏱️ 5 min TTL

	log.Println("served from DB and cached")

	return result, nil
}

// Mapping function
func mapProductToGQL(p *models.Product) *gql.Product {
	return &gql.Product{
		ID:        fmt.Sprint(p.ID),
		Name:      p.Name,
		Price:     p.Price,
		Stock:     p.Stock,
		CreatedAt: p.CreatedAt,
		UpdatedAt: p.UpdatedAt,
	}
}
