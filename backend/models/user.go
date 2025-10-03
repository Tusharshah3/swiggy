package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Email     string `gorm:"uniqueIndex"`
	Password  string // stored as a bcrypt hash
	Name      string
	CreatedAt time.Time
}
type Claims struct {
	UserID uint   `json:"sub"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}
