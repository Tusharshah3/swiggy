'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  Utensils,
  ArrowLeft,
  CreditCard,
  ShoppingBag,
  CircleCheck as CheckCircle2,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useMutation } from '@apollo/client/react'
import { CHECKOUT_MUTATION } from '@/graphql/order'

export default function CheckoutPage() {
  const router = useRouter()
  console.log('[Render] CheckoutPage mounted')

  const [checkout, { loading: checkoutLoading, error: checkoutError }] = useMutation(CHECKOUT_MUTATION)
  const [processing, setProcessing] = useState(false)
  const [deliveryType, setDeliveryType] = useState('delivery')
  const [done, setDone] = useState(false)

  const [cartItems, setCartItems] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    instructions: '',
  })

  // Load Checkout Data
  useEffect(() => {
    console.log('[Effect] Loading checkout data from localStorage...')
    const stored = localStorage.getItem('checkoutData')
    if (!stored) {
      console.warn('No checkout data found. Redirecting to /user/cart')
      router.push('/user/cart')
      return
    }

    try {
      const parsed = JSON.parse(stored)
      console.log('Loaded checkout data:', parsed)

      setForm({
        name: parsed.name || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        address: parsed.address || '',
        city: parsed.city || '',
        pincode: parsed.pincode || '',
        instructions: parsed.instructions || '',
      })
      setCartItems(parsed.cartItems || [])
      setDeliveryType(parsed.deliveryType || 'delivery')
    } catch (err) {
      console.error('Error parsing checkout data:', err)
    }
  }, [])

  // Helpers
  const calculateTotal = () => {
    const total = cartItems.reduce((sum, item) => sum + item.products.price * item.quantity, 0)
    console.log('[Debug] Calculated Total:', total)
    return total
  }

  const getTotalItems = () => {
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    console.log('[Debug] Total Items:', count)
    return count
  }

  // Checkout
  const handleCheckout = async () => {
    console.log('[Action] handleCheckout triggered')
    console.log('Form Data:', form)
    console.log('Cart Items:', cartItems)

    if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
      console.warn('Missing required delivery details')
      alert('Please fill in all required delivery details')
      return
    }

    try {
      setProcessing(true)
      console.log('Processing checkout...')

      const key = 'order-' + Math.random().toString(36).substring(2, 8)
      console.log('Generated order key:', key)

      const { data } = await checkout({ variables: { key } })
      console.log('Checkout response:', data)

      //@ts-ignore
      // inside handleCheckout after receiving data
if (data?.checkout) {
  //@ts-ignore
  console.log('Checkout successful, saving checkoutOrder and lastOrderId to localStorage', data.checkout)

  // Save server-confirmed order snapshot and minimal checkoutData
  try {  //@ts-ignore
    localStorage.setItem('checkoutOrder', JSON.stringify(data.checkout)) //@ts-ignore
    localStorage.setItem('lastOrderId', String(data.checkout.id))

    // also (optional) save a more complete checkoutData snapshot used by payment UI
    const savedCheckoutData = {
      cartItems,
      subtotal: calculateTotal(),
      tax: calculateTotal() * 0.05,
      total: calculateTotal() * 1.05,
      timestamp: new Date().toISOString(),
      //@ts-ignore
      orderId: String(data.checkout.id),
      // any other helpful fields...
    }
    localStorage.setItem('checkoutData', JSON.stringify(savedCheckoutData))
  } catch (e) {
    console.warn('Failed to save checkout info to localStorage', e)
  }

  setDone(true)
  setTimeout(() => {
    router.push('/user/payment')
  }, 700) // can be short; user gets confirmation
}
 else {
        console.error('Checkout mutation returned no valid data:', data)
      }
    } catch (err) {
      console.error('Checkout Error:', err)
    } finally {
      console.log('Resetting processing state')
      setProcessing(false)
    }
  }

  // Empty Cart Handling
  if (cartItems.length === 0) {
    console.warn('[Debug] Empty cart state detected')
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Cart is empty</h2>
          <p className="mb-4 text-gray-600">Redirecting you to the cart...</p>
        </div>
      </div>
    )
  }

  // JSX
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/user/products" className="flex items-center space-x-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">FoodExpress</span>
            </Link>
            <Link href="/user/cart">
              <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Cart
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <CheckCircle2 className="h-10 w-10 text-orange-600" />
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Type */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Delivery Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={deliveryType}
                  onValueChange={(value) => {
                    console.log('Delivery type changed to:', value)
                    setDeliveryType(value)
                  }}
                >
                  <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-orange-50 cursor-pointer">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                      <p className="font-semibold">Home Delivery</p>
                      <p className="text-sm text-gray-600">Delivered to your door</p>
                    </Label>
                    <span className="text-green-600 font-semibold">FREE</span>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-orange-50 cursor-pointer mt-2">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <p className="font-semibold">Self Pickup</p>
                      <p className="text-sm text-gray-600">Collect it from our outlet</p>
                    </Label>
                    <span className="text-green-600 font-semibold">FREE</span>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Delivery Form */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  Delivery Details
                </CardTitle>
                <CardDescription>Where should we deliver your order?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      <User className="h-4 w-4 inline text-gray-500 mr-1" />
                      Full Name *
                    </Label>
                    <Input
                      value={form.name}
                      onChange={(e) => {
                        console.log('Updating name:', e.target.value)
                        setForm({ ...form, name: e.target.value })
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      <Phone className="h-4 w-4 inline text-gray-500 mr-1" />
                      Phone *
                    </Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => {
                        console.log('Updating phone:', e.target.value)
                        setForm({ ...form, phone: e.target.value })
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    <Mail className="h-4 w-4 inline text-gray-500 mr-1" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      console.log('Updating email:', e.target.value)
                      setForm({ ...form, email: e.target.value })
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Address *</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => {
                      console.log('Updating address:', e.target.value)
                      setForm({ ...form, address: e.target.value })
                    }}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => {
                        console.log('Updating city:', e.target.value)
                        setForm({ ...form, city: e.target.value })
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode *</Label>
                    <Input
                      value={form.pincode}
                      onChange={(e) => {
                        console.log('Updating pincode:', e.target.value)
                        setForm({ ...form, pincode: e.target.value })
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Input
                    value={form.instructions}
                    onChange={(e) => {
                      console.log('Updating instructions:', e.target.value)
                      setForm({ ...form, instructions: e.target.value })
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side: Order Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-orange-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex gap-3 pb-3 border-b">
                      <img
                        src={item.products.image || 'https://placehold.co/64x64'}
                        alt={item.products.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.products.name}</p>
                        <p className="text-xs text-gray-600">
                          ₹{item.products.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-orange-600">
                        ₹{(item.products.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="text-green-600 font-semibold">FREE</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (5%)</span>
                    <span>₹{(calculateTotal() * 0.05).toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-bold">Total</span>
                    <span className="text-3xl font-bold text-orange-600">
                      ₹{(calculateTotal() * 1.05).toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={processing || checkoutLoading || done}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {processing || checkoutLoading
                      ? 'Processing...'
                      : done
                      ? 'Processed'
                      : 'Proceed to Payment'}
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You’ll be redirected to complete your payment.
                  </p>
                </div>

                {checkoutError && (
                  <p className="text-red-600 text-sm pt-2">
                    Checkout Error: {checkoutError.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
