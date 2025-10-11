'use client'

import { useQuery, useMutation } from "@apollo/client/react"
import { MY_CART, UPDATE_CART, REMOVE_FROM_CART } from "../../graphql/cart"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Utensils
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"

export default function CartPage() {
  const router = useRouter()
  console.log("[Render] CartPage mounted")

  const { data, loading, error, refetch } = useQuery(MY_CART)
  const [updateCart] = useMutation(UPDATE_CART)
  const [removeFromCart] = useMutation(REMOVE_FROM_CART)

  if (loading) {
    console.log("[State] Loading cart data...")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-orange-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading your cart...</p>
        </div>
      </div>
    )
  }

  if (error) {
    console.error("[Error] Failed to load cart:", error.message)
    return <div className="text-center text-red-500 mt-10">Error: {error.message}</div>
  }

  //@ts-ignore
  const cart = data?.myCart
  console.log("[Data] Fetched cart:", cart)

  const handleUpdate = async (productId: string, quantity: number) => {
    console.log(`[Action] Updating product ${productId} to quantity ${quantity}`)
    if (quantity < 1) return
    try {
      await updateCart({ variables: { productId, quantity } })
      console.log("[Success] Cart item updated successfully")
      refetch()
    } catch (err) {
      console.error("[Error] Failed to update cart:", err)
    }
  }

  const handleRemove = async (productId: string) => {
    console.log(`[Action] Removing product ${productId} from cart`)
    try {
      await removeFromCart({ variables: { productId } })
      console.log("[Success] Product removed from cart")
      refetch()
    } catch (err) {
      console.error("[Error] Failed to remove item:", err)
    }
  }

  const handleProceedToCheckout = () => {
    console.log("[Action] Proceeding to checkout")

    if (!cart || cart.items.length === 0) {
      console.warn("[Warning] Empty cart — checkout blocked")
      return
    }

    const cartItems = cart.items.map((item: any) => ({
      ...item,
      products: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        stock: item.product.stock,
        adminId: item.product.adminId,
        image: item.product.image,
        createdAt: item.product.createdAt,
        updatedAt: item.product.updatedAt,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      },
    }))

    const subtotal = cart.total
    const tax = subtotal * 0.05
    const total = subtotal + tax

    console.log("[Data] Checkout summary:", { subtotal, tax, total })
    console.log("[Data] Checkout cart items:", cartItems)

    const checkoutData = {
      cartItems,
      subtotal,
      tax,
      total,
      timestamp: new Date().toISOString(),
    }

    try {
      localStorage.setItem("checkoutData", JSON.stringify(checkoutData))
      console.log("[Success] Checkout data stored in localStorage")
      router.push("/user/checkout")
      console.log("[Navigation] Redirecting to /user/checkout")
    } catch (err) {
      console.error("[Error] Failed to store checkout data:", err)
    }
  }

  const getTotalItems = () => {
    const count = cart.items.reduce((total: number, item: any) => total + item.quantity, 0)
    console.log("[Debug] Total items in cart:", count)
    return count
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/user/products" className="flex items-center space-x-2">
            <Utensils className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">FoodExpress</span>
          </Link>
          <Link href="/user/products">
            <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </nav>

      {/* Cart Body */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <ShoppingCart className="h-10 w-10 text-orange-600" />
          Your Cart
        </h1>

        <p className="text-gray-600 mb-6">
          {cart.items.length > 0
            ? `You have ${getTotalItems()} item${getTotalItems() > 1 ? "s" : ""} in your cart`
            : "Your cart is empty"}
        </p>

        {cart.items.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center space-y-6">
              <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto" />
              <h3 className="text-2xl font-semibold text-gray-900">Your cart is empty</h3>
              <p className="text-gray-600">Add some delicious items to get started!</p>
              <Link href="/user/products">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item: any) => (
                <Card
                  key={item.product.id}
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <img
                        src={item.product.image || "https://source.unsplash.com/featured/?food"}
                        alt={item.product.name}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1 space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {item.product.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          ₹ {item.product.price.toFixed(2)} × {item.quantity}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex gap-3 bg-gray-100 p-2 rounded-lg">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                item.quantity > 1
                                  ? handleUpdate(item.product.id, item.quantity - 1)
                                  : handleRemove(item.product.id)
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold text-lg w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdate(item.product.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemove(item.product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>

                        <div className="pt-3 border-t">
                          <div className="flex justify-between text-gray-700">
                            <span>Subtotal:</span>
                            <span className="text-xl font-bold">
                              ₹{(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Order Summary</CardTitle>
                  <CardDescription>Review your order details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({getTotalItems()} items)</span>
                      <span>₹{cart.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee</span>
                      <span className="text-green-600 font-semibold">FREE</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax (5%)</span>
                      <span>₹{(cart.total * 0.05).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xl font-bold text-gray-900">Total</span>
                      <span className="text-3xl font-bold text-orange-600">
                        ₹{(cart.total * 1.05).toFixed(2)}
                      </span>
                    </div>

                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg"
                      onClick={handleProceedToCheckout}
                    >
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-green-800 font-semibold">✓ Free Delivery</p>
                    <p className="text-sm text-green-800 font-semibold">✓ 30-Minute Guarantee</p>
                    <p className="text-sm text-green-800 font-semibold">✓ Fresh & Hot Food</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
