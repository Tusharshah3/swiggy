# Swiggy Clone Backend

This is the backend part of the Swiggy Clone project, which implements a cart and checkout system using Go, PostgreSQL, Redis, and GraphQL.

## Project Structure

- **cmd/server/main.go**: Entry point of the application.
- **internal/config/config.go**: Configuration settings and environment variable loading.
- **internal/database/db.go**: Database connection and initialization for PostgreSQL.
- **internal/graph/resolver.go**: Resolver functions for the GraphQL API.
- **internal/graph/schema.graphql**: GraphQL schema definitions.
- **internal/middleware/auth.go**: JWT authentication and authorization middleware.
- **internal/models/**: Contains the data models for cart, order, and user.
- **internal/redis/client.go**: Utilities for interacting with Redis.
- **internal/services/cart.go**: Business logic for cart operations.
- **go.mod**: Go module file specifying dependencies.

## Getting Started

1. Clone the repository.
2. Set up the PostgreSQL database and Redis.
3. Configure environment variables as needed.
4. Run the application using `go run cmd/server/main.go`.

## License

This project is licensed under the MIT License.