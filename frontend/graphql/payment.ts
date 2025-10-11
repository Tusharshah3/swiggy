import { gql } from '@apollo/client'

export const CREATE_PAYMENTS_FROM_ORDER = gql`
  mutation CreatePaymentsFromOrder($orderId: ID!, $method: String!) {
    createPaymentsFromOrder(orderId: $orderId, method: $method) {
      id
      userId
      adminId
      orderId
      amount
      status
      method
      createdAt
    }
  }
`
