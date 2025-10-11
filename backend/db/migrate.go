package db

import (
	"log"

	"swiggy-clone/backend/models"

	"gorm.io/gorm"
)

func AutoMigrate(gdb *gorm.DB) {
	err := gdb.AutoMigrate(
		&models.User{},
		&models.Product{},
		&models.Order{},
		&models.OrderItem{},
		&models.CartItem{},
		&models.Payment{}, // ✅ add this line
	)
	if err != nil {
		log.Fatalf("migration failed: %v", err)
	}
}
