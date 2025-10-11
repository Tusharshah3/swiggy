package models

import (
	"fmt"
)

// CartItem is the structure you store in Redis (and use across services)
type CartItem struct {
	ProductID uint    `json:"productId"`
	AdminID   uint    `json:"adminId"` // optional analytics/tracking
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

// QuantityAsString returns the quantity as *string (used by some resolvers)
func (c CartItem) QuantityAsString() *string {
	q := fmt.Sprintf("%d", c.Quantity)
	return &q
}
