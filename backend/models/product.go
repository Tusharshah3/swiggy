package models

import "time"

type Product struct {
	ID        uint    `gorm:"primaryKey"`
	Name      string  `gorm:"not null"`
	Price     float64 `gorm:"not null"`
	Stock     int     `gorm:"not null"`
	Quantity  *string `gorm:"column:quantity"` // not 'image'
	Image     *string `gorm:"column:image"`    // not 'quantity'
	AdminID   uint    `gorm:"not null"`        // Foreign key to User (Admin)
	Admin     User    `gorm:"foreignKey:AdminID"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
