import { gql } from "@apollo/client";

export const CHECKOUT_MUTATION = gql`
  mutation Checkout($key: String) {
    checkout(idempotencyKey: $key) {
      id
      total
      status
      placedAt
      items {
        productId
        quantity
        priceAtPurchase
      }
    }
  }
`;
export const GET_ORDER_HISTORY = gql`
  query {
    getOrderHistory {
      id
      total
      status
      placedAt
      items {
        productId
        quantity
        priceAtPurchase
      }
    }
  }
`;
