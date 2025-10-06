package resolvers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"swiggy-clone/backend/gql"

	"swiggy-clone/backend/middleware"
	"swiggy-clone/backend/models"
	"swiggy-clone/backend/redis"
)

// CREATE
func (r *mutationResolver) CreateProduct(
	ctx context.Context,
	name string,
	price float64,
	stock int,
	image *string,
	Quantity *string,
) (*gql.Product, error) {

	userID, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		return nil, errors.New("unauthorized")
	}

	// 🔍 DEBUG: Log incoming values from GraphQL mutation

	// Create Product instance
	p := models.Product{
		Name:     name,
		Price:    price,
		Stock:    stock,
		Quantity: Quantity,
		AdminID:  userID,
		Image:    image,
	}

	// 🔍 DEBUG: Log mapped struct before saving
	fmt.Println("🛠️ [CreateProduct] Saving to DB:")
	fmt.Printf("%+v\n", p)

	// Save to DB
	if err := r.DB.Create(&p).Error; err != nil {
		fmt.Println("❌ [CreateProduct] Error saving to DB:", err)
		return nil, err
	}

	// Invalidate cache
	redis.DelPattern(ctx, "products:*")

	// 🔍 DEBUG: Final saved product (after auto-populated fields like ID, timestamps)
	fmt.Println("✅ [CreateProduct] Successfully saved product with ID:", p.ID)

	return mapProductToGQL(&p), nil
}

// UPDATE
func (r *mutationResolver) UpdateProduct(ctx context.Context, id string, name *string, price *float64, stock *int, image *string, Quantity *string) (*gql.Product, error) {
	var p models.Product
	fmt.Println("🚀 [CreateProduct] Received input:")
	fmt.Println("📝 Name:", name)
	fmt.Println("💰 Price:", price)
	fmt.Println("📦 Stock:", stock)
	fmt.Println("📏 Quantity:", *Quantity)
	fmt.Println("🖼️ Image:", *image)

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
	if image != nil {
		p.Image = image
	}
	if Quantity != nil {
		p.Quantity = Quantity
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
func (r *queryResolver) GetProducts(ctx context.Context, page int, limit int, search *string) ([]*gql.Product, error) {
	var modelsList []models.Product
	offset := (page - 1) * limit

	// ✅ Try to get user info (optional)
	userID, userOk := middleware.UserIDFromCtx(ctx)
	role, roleOk := middleware.RoleFromCtx(ctx)

	// ✅ Build base query
	query := r.DB.Model(&models.Product{})

	// 🔐 Apply admin-specific filter only if role is 'admin'
	if userOk && roleOk && role == "admin" {
		query = query.Where("admin_id = ?", userID)
	}

	// 🔍 Apply search filter if present
	if search != nil && *search != "" {
		log.Println("🔍 Performing DB search (bypassing cache)")
		query = query.Where("LOWER(name) LIKE ?", "%"+strings.ToLower(*search)+"%")
	}

	// ✅ Redis cache (only for public access or authenticated users)
	cacheKey := fmt.Sprintf("products:role=%s:user=%d:page=%d:limit=%d", role, userID, page, limit)
	if search == nil || *search == "" {
		if cached, err := redis.Get(ctx, cacheKey); err == nil {
			log.Println("📦 Products served from Redis cache")
			var products []*gql.Product
			if err := json.Unmarshal([]byte(cached), &products); err == nil {
				return products, nil
			}
		}
	}

	// ✅ Run paginated query
	if err := query.Limit(limit).Offset(offset).Find(&modelsList).Error; err != nil {
		return nil, err
	}

	// ✅ Convert to GraphQL output
	var result []*gql.Product
	for _, p := range modelsList {
		result = append(result, mapProductToGQL(&p))
	}

	// ✅ Cache result only if no search
	if search == nil || *search == "" {
		data, _ := json.Marshal(result)
		redis.Set(ctx, cacheKey, string(data), time.Minute*5)
		log.Println("💾 Products served from DB and cached")
	}

	return result, nil
}

func (r *queryResolver) GetProductsCount(ctx context.Context, search *string) (int, error) {
	var count int64

	// ✅ Get admin ID from context
	adminID, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		log.Println("❌ Unauthorized: missing admin ID in context")
		return 0, errors.New("unauthorized")
	}

	// ✅ Build query
	query := r.DB.Model(&models.Product{}).Where("admin_id = ?", adminID)

	// ✅ Optional search filter
	if search != nil && *search != "" {
		query = query.Where("LOWER(name) LIKE ?", "%"+strings.ToLower(*search)+"%")
	}

	// ✅ Run count query
	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}

	return int(count), nil
}

// Mapping function
func mapProductToGQL(p *models.Product) *gql.Product {
	return &gql.Product{
		ID:        fmt.Sprint(p.ID),
		Name:      p.Name,
		Price:     p.Price,
		Stock:     p.Stock,
		Image:     p.Image,
		Quantity:  p.Quantity,
		AdminID:   int(p.AdminID),
		CreatedAt: p.CreatedAt,
		UpdatedAt: p.UpdatedAt,
	}
}
