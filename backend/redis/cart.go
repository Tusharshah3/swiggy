package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"swiggy-clone/backend/models"
)

const cartTTL = 1000 * time.Minute

func cartKey(userID uint) string {
	return fmt.Sprintf("user:%d:cart", userID)
}

func SetCart(ctx context.Context, userID uint, cart []models.CartItem) error {
	data, err := json.Marshal(cart)
	if err != nil {
		return err
	}
	return RDB.Set(ctx, cartKey(userID), data, cartTTL).Err()
}

func GetCart(ctx context.Context, userID uint) ([]models.CartItem, error) {
	val, err := RDB.Get(ctx, cartKey(userID)).Result()
	if err != nil {
		return nil, err
	}

	var cart []models.CartItem
	if err := json.Unmarshal([]byte(val), &cart); err != nil {
		return nil, err
	}
	return cart, nil
}

func ClearCart(ctx context.Context, userID uint) error {
	return RDB.Del(ctx, cartKey(userID)).Err()
}
