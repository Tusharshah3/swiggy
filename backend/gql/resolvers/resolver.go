package resolvers

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

import (
	"swiggy-clone/backend/services"

	"gorm.io/gorm"
)

type Resolver struct {
	AuthService     *services.AuthService
	DB              *gorm.DB
	JWTSecret       string
	CheckoutService *services.CheckoutService
}
