package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Email     string `gorm:"uniqueIndex"`
	Password  string // bcrypt hashed
	Name      string
	Role      string `gorm:"type:varchar(10);default:'user'"`
	Picture   *string
	CreatedAt time.Time
}

type Claims struct {
	UserID uint   `json:"sub"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}
