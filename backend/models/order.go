package models

import (
	"time"

	"github.com/lib/pq"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// OrderStatus is typed to make status usage consistent across codebase
type OrderStatus string

const (
	OrderPending    OrderStatus = "PENDING"
	OrderProcessing OrderStatus = "PROCESSING"
	OrderSuccess    OrderStatus = "SUCCESS"
	OrderFailed     OrderStatus = "FAILED"
)

// Order represents a stored order.
// Products is stored as JSONB (snapshot of product details at purchase time).

type Order struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	UserID         uint           `json:"user_id"`
	Products       datatypes.JSON `gorm:"type:jsonb" json:"products"`
	ProductAdmins  pq.StringArray `gorm:"type:text[]" json:"product_admins"` // ✅ FIXED
	Total          float64        `json:"total"`
	Status         OrderStatus    `gorm:"type:varchar(20)" json:"status"`
	PlacedAt       time.Time      `json:"placed_at"`
	Items          []OrderItem    `gorm:"foreignKey:OrderID" json:"items"`
	IdempotencyKey *string        `json:"idempotency_key,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}
