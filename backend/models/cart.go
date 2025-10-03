package models

type CartItem struct {
	ProductID uint `json:"productId"`
	Quantity  int  `json:"quantity"`
}
