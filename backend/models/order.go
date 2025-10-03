package models

import "time"

type OrderStatus string

const (
	OrderPending    OrderStatus = "PENDING"
	OrderProcessing OrderStatus = "PROCESSING"
	OrderSuccess    OrderStatus = "SUCCESS"
	OrderFailed     OrderStatus = "FAILED"
)

type Order struct {
	ID             uint `gorm:"primaryKey"`
	UserID         uint `gorm:"index"`
	Total          float64
	Status         OrderStatus `gorm:"type:varchar(20)"`
	PlacedAt       time.Time
	IdempotencyKey *string     `gorm:"uniqueIndex;size:64"`
	Items          []OrderItem `gorm:"foreignKey:OrderID"`
}

type OrderItem struct {
	ID              uint `gorm:"primaryKey"`
	OrderID         uint `gorm:"index"`
	ProductID       uint `gorm:"index"`
	Quantity        int
	PriceAtPurchase float64
}
