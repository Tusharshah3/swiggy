import { gql } from "@apollo/client";

export const GET_ADMIN_ORDERS = gql`
  query {
    getAdminOrders {
      id
      total_price
      status
      placedAt
      items {
        productId
        quantity
        priceAtPurchase
        product {
          id
          name
          price
          image
        }
      }
    }
  }
`;
