package db

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Open(url string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(url), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to DB: %v", err)
	}
	return db
}
