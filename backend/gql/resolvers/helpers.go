package resolvers

import (
	"context"
	"errors"
)

func GetUserIDFromCtx(ctx context.Context) (uint, error) {
	userIDRaw := ctx.Value("userID")
	if userIDRaw == nil {
		return 0, errors.New("unauthorized: no userID in context")
	}

	userID, ok := userIDRaw.(uint)
	if !ok {
		return 0, errors.New("unauthorized: invalid userID type")
	}

	return userID, nil
}
