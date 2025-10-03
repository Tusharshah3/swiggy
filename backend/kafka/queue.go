package kafka

import (
	"context"
	"log"
)

type OrderQueue interface {
	Publish(ctx context.Context, orderID uint) error
}

type InMemoryQueue struct {
	ch chan uint
}

func NewInMemoryQueue(size int) *InMemoryQueue {
	return &InMemoryQueue{
		ch: make(chan uint, size),
	}
}

func (q *InMemoryQueue) Publish(ctx context.Context, orderID uint) error {
	select {
	case q.ch <- orderID:
		return nil
	default:
		log.Println("⚠️ Queue is full, dropping order:", orderID)
		return nil
	}
}

func (q *InMemoryQueue) StartWorker(ctx context.Context, handle func(context.Context, uint)) {
	go func() {
		log.Println("🛠️ Order worker started...")
		for {
			select {
			case <-ctx.Done():
				return
			case orderID := <-q.ch:
				handle(ctx, orderID)
			}
		}
	}()
}
