package models

import "time"

// OrderItem represents each item row tied to an order
type OrderItem struct {
	ID              uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID         uint      `gorm:"not null;index" json:"order_id"`
	ProductID       uint      `gorm:"not null;index" json:"product_id"`
	Quantity        int       `gorm:"not null" json:"quantity"`
	PriceAtPurchase float64   `gorm:"not null" json:"price_at_purchase"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
