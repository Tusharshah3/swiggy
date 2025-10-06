import { gql } from "@apollo/client";

// ✅ Add to Cart
export const ADD_TO_CART = gql`
  mutation AddToCart($productId: ID!, $quantity: Int!) {
    addToCart(productId: $productId, quantity: $quantity) {
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

// ✅ Get paginated list of products
export const GET_PRODUCTS = gql`
  query GetProducts($page: Int!, $limit: Int!, $search: String) {
    getProducts(page: $page, limit: $limit, search: $search) {
      id
      name
      price
      stock
      quantity
      image
      adminId
    }
  }
`;

// ✅ Count of filtered products
export const GET_PRODUCTS_COUNT = gql`
  query GetProductsCount($search: String) {
    getProductsCount(search: $search)
  }
`;

// ✅ Add new product (correct order + quantity)
export const CREATE_PRODUCT = gql`
  mutation CreateProduct(
    $name: String!
    $price: Float!
    $stock: Int!
    $quantity: String
    $image: String
  ) {
    createProduct(
      name: $name
      price: $price
      stock: $stock
      quantity: $quantity
      image: $image
    ) {
      id
      name
      price
      stock
      quantity
      image
      adminId
    }
  }
`;

// ✅ Update existing product (with optional quantity)
export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct(
    $id: ID!
    $name: String
    $price: Float
    $stock: Int
    $quantity: String
    $image: String
  ) {
    updateProduct(
      id: $id
      name: $name
      price: $price
      stock: $stock
      quantity: $quantity
      image: $image
    ) {
      id
      name
      price
      stock
      quantity
      image
    }
  }
`;

// ✅ Delete product
export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;
