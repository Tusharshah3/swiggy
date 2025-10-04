import { gql } from "@apollo/client";

export const GET_PRODUCTS = gql`
  query GetProducts($page: Int, $limit: Int) {
    getProducts(page: $page, limit: $limit) {
      id
      name
      price
      stock
    }
  }
`;

export const ADD_TO_CART = gql`
  mutation AddToCart($productId: ID!, $quantity: Int!) {
    addToCart(productId: $productId, quantity: $quantity) {
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

