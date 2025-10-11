'use client'

import { useQuery } from "@apollo/client/react"
import { GET_ORDER_HISTORY } from "../../graphql/order"
import Link from "next/link"
import {
  Utensils,
  Package,
  Clock,
  IndianRupee,
  Truck,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function OrdersPage() {
  const { data, loading, error } = useQuery(GET_ORDER_HISTORY)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-orange-600 rounded-full mx-auto" />
          <p className="text-gray-600 mt-4">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-medium">Error: {error.message}</p>
      </div>
    )
  }

  //@ts-ignore
  const orders = data?.getOrderHistory || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/user/products" className="flex items-center space-x-2">
            <Utensils className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">FoodExpress</span>
          </Link>

          <Link href="/user/products">
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-orange-600"
            >
              <Home className="mr-2 h-5 w-5" /> Back to Menu
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Section */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <Package className="h-10 w-10 text-orange-600" />
          Your Orders
        </h1>

        {orders.length === 0 ? (
          <Card className="text-center shadow-xl border-dashed border-2 border-gray-300 py-16">
            <CardContent>
              <Package className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-700">
                No orders found
              </h3>
              <p className="text-gray-500 mb-6">
                Looks like you haven’t placed any orders yet.
              </p>
              <Link href="/user/products">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  Start Ordering
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <Card
                key={order.id}
                className="shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-300"
              >
                <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-50 rounded-t-lg">
                  <CardTitle className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Order ID:{" "}
                      <span className="text-orange-600 font-mono">
                        #{order.id.slice(0, 8)}
                      </span>
                    </span>
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        order.status === "SUCCESS"
                          ? "bg-green-100 text-green-700"
                          : order.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between text-gray-600 text-sm">
                    <p>
                      <Clock className="inline h-4 w-4 mr-1 text-orange-500" />
                      Placed: {new Date(order.placedAt).toLocaleString()}
                    </p>
                    <p className="flex items-center">
                      <Truck className="h-4 w-4 mr-1 text-orange-500" />
                      Estimated:{" "}
                      <span className="ml-1 font-semibold">30–40 mins</span>
                    </p>
                  </div>

                  {/* Product List */}
                  <ul className="space-y-3 border-t pt-3">
                    {order.items.map((item: any, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between bg-white border rounded-lg p-3 hover:bg-orange-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.product?.image ||
                              "https://placehold.co/64x64"
                            }
                            alt={item.product?.name || "Product"}
                            className="w-16 h-16 rounded-lg object-cover border"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.product?.name || `Product ${item.productId}`}
                            </p>
                            <p className="text-gray-600 text-sm">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="font-semibold text-orange-600">
                          ₹{(item.priceAtPurchase * item.quantity).toFixed(2)}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Total */}
                  <div className="flex justify-between border-t pt-3 mt-3 text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-orange-600 flex items-center">
                      <IndianRupee className="h-5 w-5 mr-1" />
                      {order.total_price.toFixed(2)}

                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
