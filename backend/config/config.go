package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	RedisURL    string
}

func Load() *Config {
	_ = godotenv.Load() // Load .env into os.Getenv

	port := getOrDefault("PORT", "8080")
	dbURL := mustGet("DATABASE_URL")
	redisURL := mustGet("REDIS_URL")

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		RedisURL:    redisURL,
	}
}

func getOrDefault(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func mustGet(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("Missing required env var: %s", key)
	}
	return val
}
