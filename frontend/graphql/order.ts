import { gql } from "@apollo/client";

export const CHECKOUT_MUTATION = gql`
  mutation Checkout($key: String) {
    checkout(idempotencyKey: $key) {
      id

      # server returns these as snake_case in your generated gql types
      user_id
      total_price
      product_admins

      # these are camelCase in your generated gql types
      status
      placedAt
      idempotencyKey

      products {
        product {
          id
          name
          price
          stock
          adminId
          image
          quantity
          createdAt
          updatedAt
        }
        quantity
        priceAtPurchase
      }

      items {
        productId
        quantity
        priceAtPurchase
        product {
          id
          name
          price
          stock
          adminId
          image
          quantity
          createdAt
          updatedAt
        }
      }
    }
  }
`;


// ✅ Get user's order history
export const GET_ORDER_HISTORY = gql`
  query {
    getOrderHistory {
      id
      total_price         # ✅ snake_case to match schema.graphqls
      status
      placedAt
      idempotencyKey
      products {
        product {
          id
          name
          image
          price
          quantity
        }
        quantity
        priceAtPurchase
      }
      items {
        productId
        quantity
        priceAtPurchase
        product {
          id
          name
          image
          price
        }
      }
    }
  }
`

// ✅ Optional admin-side query (same)
export const GET_ALL_ORDERS = gql`
  query GetOrderHistory {
    getOrderHistory {
      id
      total_price
      status
      placedAt
      idempotencyKey
      items {
        productId
        quantity
        priceAtPurchase
        product {
          id
          name
          image
          price
        }
      }
    }
  }
`
export const GET_MY_ORDERS = gql`
  query MyOrders {
    myOrders {
      id
      user_id
      total_price
      placedAt
      idempotencyKey
      products {
        product {
          id
          name
          price
          adminId
          image
        }
        quantity
        priceAtPurchase
      }
      items {
        productId
        quantity
        priceAtPurchase
      }
    }
  }
`;
