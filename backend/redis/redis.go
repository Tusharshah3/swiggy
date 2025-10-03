package redis

import (
	"context"
	"encoding/json"
	"log"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

var RDB *goredis.Client

func InitRedis(redisURL string) {
	opt, err := goredis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("failed to parse redis URL: %v", err)
	}

	RDB = goredis.NewClient(opt)
	if err := RDB.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("failed to connect to redis: %v", err)
	}

	log.Println(" Redis connected")
}

func DelPattern(ctx context.Context, pattern string) {
	iter := RDB.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		RDB.Del(ctx, iter.Val())
		log.Println("Cache invalidated:", pattern)

	}
}

func Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	return RDB.Set(ctx, key, value, ttl).Err()
}

func Get(ctx context.Context, key string) (string, error) {
	return RDB.Get(ctx, key).Result()
}

func Del(ctx context.Context, key string) error {
	return RDB.Del(ctx, key).Err()
}

// GetJSON unmarshals Redis value into a Go struct
func GetJSON(ctx context.Context, key string, dest any) (bool, error) {
	data, err := RDB.Get(ctx, key).Result()
	if err == goredis.Nil {
		return false, nil // key not found
	}
	if err != nil {
		return false, err
	}
	if err := json.Unmarshal([]byte(data), dest); err != nil {
		return false, err
	}
	return true, nil
}

// SetJSON marshals a Go struct and stores it in Redis with TTL
func SetJSON(ctx context.Context, key string, value any, ttl time.Duration) error {
	bytes, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return RDB.Set(ctx, key, bytes, ttl).Err()
}

type Client interface {
	GetJSON(ctx context.Context, key string, dest any) (bool, error)
	SetJSON(ctx context.Context, key string, value any, ttl time.Duration) error
	Del(ctx context.Context, key string) error
}

type RedisClient struct{}

func (RedisClient) GetJSON(ctx context.Context, key string, dest any) (bool, error) {
	return GetJSON(ctx, key, dest)
}

func (RedisClient) SetJSON(ctx context.Context, key string, value any, ttl time.Duration) error {
	return SetJSON(ctx, key, value, ttl)
}

func (RedisClient) Del(ctx context.Context, key string) error {
	return Del(ctx, key)
}
