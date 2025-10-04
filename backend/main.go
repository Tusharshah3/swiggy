package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors" // ✅ ADD THIS LINE

	"swiggy-clone/backend/config"
	"swiggy-clone/backend/db"
	"swiggy-clone/backend/gql"
	"swiggy-clone/backend/gql/resolvers"
	"swiggy-clone/backend/kafka"
	custommiddleware "swiggy-clone/backend/middleware"
	"swiggy-clone/backend/models"
	"swiggy-clone/backend/redis"
	"swiggy-clone/backend/services"
)

func main() {
	cfg := config.Load()
	gdb := db.Open(cfg.DatabaseURL)
	db.AutoMigrate(gdb)
	redis.InitRedis(cfg.RedisURL)

	// ✅ Step 1: Create queue
	queue := kafka.NewInMemoryQueue(100)

	// ✅ Step 2: Start worker
	ctx := context.Background()
	queue.StartWorker(ctx, func(ctx context.Context, orderID uint) {
		log.Printf("⏳ Processing order %d...\n", orderID)
		time.Sleep(3 * time.Second)

		// Update status to SUCCESS
		if err := gdb.Model(&models.Order{}).
			Where("id = ?", orderID).
			Update("status", models.OrderSuccess).Error; err != nil {
			log.Printf("❌ Failed to update order %d: %v", orderID, err)
			return
		}

		log.Printf("✅ Order %d marked as SUCCESS", orderID)
	})

	// ✅ Step 3: Inject everything into resolver
	res := &resolvers.Resolver{
		DB:        gdb,
		JWTSecret: os.Getenv("JWT_SECRET"),
		CheckoutService: &services.CheckoutService{
			DB:    gdb,
			Redis: redis.RedisClient{},
			Queue: queue,
		},
	}

	srv := handler.NewDefaultServer(
		gql.NewExecutableSchema(gql.Config{Resolvers: res}),
	)

	r := chi.NewRouter()

	// ✅ Step 4: ADD CORS middleware BEFORE JWT
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"}, // frontend dev URL
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.Logger)

	// ✅ JWT-protected GraphQL endpoint
	r.Handle("/query", custommiddleware.JWT(srv))

	// GraphQL Playground
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		playground.Handler("GraphQL playground", "/query").ServeHTTP(w, r)
	})

	log.Println("🚀 Listening on :" + cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, r))
}
