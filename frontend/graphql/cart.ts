import { gql } from "@apollo/client";

export const MY_CART = gql`
  query MyCart {
    myCart {
      items {
        product {
          id
          name
          price
          image
        }
        quantity
      }
      total
    }
  }
`;

export const UPDATE_CART = gql`
  mutation UpdateCart($productId: ID!, $quantity: Int!) {
    updateCart(productId: $productId, quantity: $quantity) {
      items {
        product {
          id
          name
          price

        }
        quantity
      }
      total
    }
  }
`;

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($productId: ID!) {
    removeFromCart(productId: $productId) {
      items {
        product {
          id
          name
          price
        }
        quantity
      }
      total
    }
  }
`;
