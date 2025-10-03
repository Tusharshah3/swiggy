package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"swiggy-clone/backend/models"
)

type AuthService struct {
	DB        *gorm.DB
	JWTSecret string
}

// Hash password + store user
func (s *AuthService) Signup(email, name, password string) (string, *models.User, error) {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), 12)
	u := &models.User{Email: email, Name: name, Password: string(hash)}
	if err := s.DB.Create(u).Error; err != nil {
		return "", nil, err
	}
	tok, _ := s.TokenFor(u)
	return tok, u, nil
}

// Check password + return token
func (s *AuthService) Login(email, password string) (string, *models.User, error) {
	var u models.User
	if err := s.DB.Where("email = ?", email).First(&u).Error; err != nil {
		return "", nil, err
	}
	if bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)) != nil {
		return "", nil, errors.New("invalid credentials")
	}
	tok, _ := s.TokenFor(&u)
	return tok, &u, nil
}

// Generate JWT for user
func (s *AuthService) TokenFor(u *models.User) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   fmt.Sprint(u.ID), // ✅ convert user ID to string
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.JWTSecret))
}
