package middleware

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type ctxKey string

const UserIDKey ctxKey = "uid"

// JWT middleware

func JWT(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Read and buffer the body so we can read it again later
		var buf bytes.Buffer
		tee := io.TeeReader(r.Body, &buf)
		bodyBytes, err := io.ReadAll(tee)
		if err != nil {
			http.Error(w, "failed to read request body", http.StatusBadRequest)
			return
		}
		r.Body = io.NopCloser(&buf)

		bodyStr := string(bodyBytes)
		if strings.Contains(bodyStr, "login") || strings.Contains(bodyStr, "signup") || strings.Contains(bodyStr, "IntrospectionQuery") {
			fmt.Println("[JWT MIDDLEWARE] Public operation detected, skipping auth")
			next.ServeHTTP(w, r)
			return
		}

		// JWT processing
		authHeader := r.Header.Get("Authorization")
		// fmt.Println("[JWT MIDDLEWARE] Authorization header =", authHeader)

		if authHeader == "" {
			// fmt.Println("[JWT MIDDLEWARE ] Missing Authorization header")
			http.Error(w, "missing auth header", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			// fmt.Println("[JWT MIDDLEWARE ] Invalid Authorization header format")
			http.Error(w, "invalid token format", http.StatusUnauthorized)
			return
		}

		tokenStr := parts[1]
		// fmt.Println("[JWT MIDDLEWARE] Token string =", tokenStr)
		// fmt.Println("[JWT MIDDLEWARE] JWT_SECRET =", os.Getenv("JWT_SECRET"))

		claims := jwt.RegisteredClaims{}
		token, err := jwt.ParseWithClaims(tokenStr, &claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil {
			// fmt.Println("[JWT MIDDLEWARE ] Token parsing error:", err)
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}
		if !token.Valid {
			// fmt.Println("[JWT MIDDLEWARE ] Token is NOT valid")
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		if claims.Subject == "" {
			// fmt.Println("[JWT MIDDLEWARE ] Token subject is missing")
			http.Error(w, "no subject in token", http.StatusUnauthorized)
			return
		}

		//  Token is valid
		// fmt.Println("[JWT MIDDLEWARE ] Token is valid. Subject:", claims.Subject)

		ctx := context.WithValue(r.Context(), UserIDKey, claims.Subject)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func UserIDFromCtx(ctx context.Context) (uint, bool) {
	v := ctx.Value(UserIDKey)
	// fmt.Println(" [UserIDFromCtx] context value =", v)

	strID, ok := v.(string)
	if !ok {
		fmt.Println("[UserIDFromCtx] context value is NOT a string")
		return 0, false
	}

	var uid uint
	_, err := fmt.Sscanf(strID, "%d", &uid)
	if err != nil {
		fmt.Println("[UserIDFromCtx] failed to parse string to uint:", err)
		return 0, false
	}

	fmt.Println("[UserIDFromCtx] extracted user ID =", uid)
	return uid, true
}
func RoleFromCtx(ctx context.Context) (string, bool) {
	role, ok := ctx.Value("role").(string)
	return role, ok
}
