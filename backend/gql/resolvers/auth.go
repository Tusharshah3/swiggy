package resolvers

import (
	"context"
	"fmt"

	"swiggy-clone/backend/gql"
	"swiggy-clone/backend/middleware"
	"swiggy-clone/backend/models"
	"swiggy-clone/backend/services"
)

// Signup mutation
func (r *Resolver) Signup(ctx context.Context, email, password, name string) (*gql.AuthPayload, error) {
	s := services.AuthService{DB: r.DB, JWTSecret: r.JWTSecret}
	tok, u, err := s.Signup(email, name, password)
	if err != nil {
		return nil, err
	}
	return &gql.AuthPayload{
		Token: tok,
		User:  &gql.User{ID: fmt.Sprint(u.ID), Email: u.Email, Name: u.Name, Role: u.Role, Picture: u.Picture},
	}, nil
}

// Login mutation
func (r *Resolver) Login(ctx context.Context, email, password string) (*gql.AuthPayload, error) {
	s := services.AuthService{DB: r.DB, JWTSecret: r.JWTSecret}
	tok, u, err := s.Login(email, password)
	if err != nil {
		return nil, err
	}
	return &gql.AuthPayload{
		Token: tok,
		User:  &gql.User{ID: fmt.Sprint(u.ID), Email: u.Email, Name: u.Name, Role: u.Role, Picture: u.Picture},
	}, nil
}

// Me query (requires valid JWT)
func (r *Resolver) Me(ctx context.Context) (*gql.User, error) {
	uid, ok := middleware.UserIDFromCtx(ctx)
	if !ok {
		return nil, nil
	}

	var u models.User
	if err := r.DB.First(&u, uid).Error; err != nil {
		return nil, nil
	}

	return &gql.User{
		ID:        fmt.Sprint(u.ID),
		Email:     u.Email,
		Name:      u.Name,
		Role:      u.Role,
		Picture:   u.Picture,
		CreatedAt: u.CreatedAt, // ✅ now this will work
	}, nil
}
