import { gql } from "@apollo/client";


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
  query GetProducts($page: Int, $limit: Int) {
    getProducts(page: $page, limit: $limit) {
      id
      name
      price
      stock
      image
    }
  }
`;

// ✅ Add new product
export const CREATE_PRODUCT = gql`
  mutation CreateProduct($name: String!, $price: Float!, $stock: Int!, $image: String) {
    createProduct(name: $name, price: $price, stock: $stock, image: $image) {
      id
      name
      image
    }
  }
`;

// ✅ Update existing product
export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct(
    $id: ID!
    $name: String
    $price: Float
    $stock: Int
    $image: String
  ) {
    updateProduct(id: $id, name: $name, price: $price, stock: $stock, image: $image) {
      id
      name
      price
      stock
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
