swiggy-clone
├── backend
│   ├── cmd
│   │   └── server
│   │       └── main.go
│   ├── internal
│   │   ├── config
│   │   │   └── config.go
│   │   ├── database
│   │   │   └── db.go
│   │   ├── graph
│   │   │   ├── resolver.go
│   │   │   └── schema.graphql
│   │   ├── middleware
│   │   │   └── auth.go
│   │   ├── models
│   │   │   ├── cart.go
│   │   │   ├── order.go
│   │   │   └── user.go
│   │   ├── redis
│   │   │   └── client.go
│   │   └── services
│   │       └── cart.go
│   ├── go.mod
│   └── README.md
├── frontend
│   ├── src
│   │   ├── components
│   │   │   ├── cart
│   │   │   │   └── Cart.tsx
│   │   │   └── checkout
│   │   │       └── Checkout.tsx
│   │   ├── graphql
│   │   │   └── queries.ts
│   │   ├── pages
│   │   │   ├── _app.tsx
│   │   │   ├── cart.tsx
│   │   │   └── checkout.tsx
│   │   └── types
│   │       └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
└── README.md