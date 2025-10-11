package models

import (
	"time"
)

type Payment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    string    `json:"user_id"`
	AdminID   string    `json:"admin_id"`
	OrderID   string    `json:"order_id"`
	Amount    float64   `json:"amount"`
	Status    string    `json:"status"` // SUCCESS, PENDING, FAILED
	Method    string    `json:"method"` // CARD, UPI, COD
	CreatedAt time.Time `json:"created_at"`
}
