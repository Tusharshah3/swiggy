// frontend/pages/user/payment.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Utensils,
  CreditCard,
  Wallet,
  Smartphone,
  Building2,
  ArrowLeft,
  Lock,
  DollarSign
} from 'lucide-react'
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { CREATE_PAYMENTS_FROM_ORDER } from '@/graphql/payment' // ensure this mutation is defined in your graphql file
import { GET_ME } from '@/graphql/auth' // adjust path if needed
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

// Query to fetch user's recent orders (used to resolve missing orderId)
const GET_MY_ORDERS = gql`
  query MyOrders {
    myOrders {
      id
      user_id
      total_price
      placedAt
      idempotencyKey
      products {
        product {
          id
          name
          price
          adminId
          image
        }
        quantity
        priceAtPurchase
      }
      items {
        productId
        quantity
        priceAtPurchase
      }
    }
  }
`

export default function PaymentPage() {
  const router = useRouter()
  const client = useApolloClient()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [checkoutData, setCheckoutData] = useState<any>(null)
  const [checkoutOrder, setCheckoutOrder] = useState<any>(null) // server-confirmed order snapshot (if any)
  const [userToken, setUserToken] = useState<string | null>(null)

  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  })
  const [upiForm, setUpiForm] = useState({ upiId: '' })

  const [createPaymentsFromOrder] = useMutation(CREATE_PAYMENTS_FROM_ORDER)
  const { data: meData, loading: meLoading } = useQuery(GET_ME)

  // ----------------- helpers for matching -----------------
  const ms = (mins: number) => mins * 60 * 1000

  function normalizeNumber(n: any) {
    if (n == null) return 0
    return typeof n === 'number' ? n : Number(n)
  }

  function approxEqual(a: number, b: number, epsilon = 0.01) {
    return Math.abs(a - b) <= epsilon
  }

  function orderContainsSameProducts(order: any, cartItems: any[]) {
    try {
      const orderProductIds = new Set<string>()
      if (order.products && Array.isArray(order.products)) {
        for (const p of order.products) {
          const pid = p?.product?.id ?? p?.productId ?? null
          if (pid) orderProductIds.add(String(pid))
        }
      }
      if (order.items && Array.isArray(order.items) && orderProductIds.size === 0) {
        for (const it of order.items) {
          if (it?.productId) orderProductIds.add(String(it.productId))
        }
      }

      for (const ci of cartItems) {
        const prod = ci?.products ?? ci?.product ?? ci
        const id = prod?.id ?? prod?.productId ?? null
        if (!id) return false
        if (!orderProductIds.has(String(id))) return false
      }
      return true
    } catch (e) {
      console.warn('[Matching] orderContainsSameProducts failed', e)
      return false
    }
  }
  // --------------------------------------------------------

  // Load token and checkout data; attempt to resolve order (localStorage -> server match)
  useEffect(() => {
    let mounted = true
    console.log('[Init] Loading PaymentPage...')
    const token = localStorage.getItem('token')
    const data = localStorage.getItem('checkoutData')
    const orderSnapshot = localStorage.getItem('checkoutOrder') // saved by checkout step (server-confirmed)
    const lastOrderId = localStorage.getItem('lastOrderId')

    if (!token) {
      console.warn('[Redirect] No token found — redirecting to /user/login')
      router.push('/user/login')
      return
    }

    if (!data && !orderSnapshot && !lastOrderId) {
      console.warn('[Redirect] No checkout data found — redirecting to /user/cart')
      router.push('/user/cart')
      return
    }

    ;(async () => {
      try {
        if (data) {
          const parsed = JSON.parse(data)
          console.log('[Data] Loaded checkoutData:', parsed)
          if (mounted) setCheckoutData(parsed)
        }
        if (orderSnapshot) {
          const parsedOrder = JSON.parse(orderSnapshot)
          console.log('[Data] Loaded checkoutOrder (server):', parsedOrder)
          if (mounted) setCheckoutOrder(parsedOrder)
        } else if (lastOrderId) {
          if (mounted) setCheckoutOrder({ id: lastOrderId })
        }

        setUserToken(token)

        // If there's no server-confirmed checkoutOrder, try to resolve from server using smart matching
        if (!orderSnapshot && !lastOrderId) {
          console.log('[Resolve] No checkoutOrder/local lastOrderId — attempting to fetch myOrders from server (smart match)')
          try {
            const resp = await client.query({
              query: GET_MY_ORDERS,
              fetchPolicy: 'network-only',
            })
            //@ts-ignore
            const orders = resp?.data?.myOrders ?? []
            console.log('[Resolve] myOrders returned count=', orders.length)

            if (orders.length > 0 && mounted && checkoutData) {
              const cartTotal = normalizeNumber(checkoutData.total ?? checkoutData.subtotal ?? 0)
              const cartTimestamp = checkoutData.timestamp ? new Date(checkoutData.timestamp).getTime() : null

              // Filter plausible orders by approximate total match
              const plausible = orders.filter((o: any) => {
                const opTotal = normalizeNumber(o.total_price ?? o.totalPrice ?? 0)
                return approxEqual(opTotal, cartTotal, 0.5) || approxEqual(opTotal, normalizeNumber(checkoutData.subtotal ?? 0), 0.5)
              })
              console.log('[Resolve] plausible orders by total:', plausible.length)

              // Further filter by product match
              const matched = plausible.filter((o: any) => orderContainsSameProducts(o, checkoutData.cartItems ?? []))
              console.log('[Resolve] orders matching products:', matched.length)

              let best: any = null
              if (matched.length === 1) {
                best = matched[0]
              } else if (matched.length > 1 && cartTimestamp) {
                let bestDiff = Infinity
                for (const o of matched) {
                  const placed = o.placedAt ? new Date(o.placedAt).getTime() : null
                  if (!placed) continue
                  const diff = Math.abs(placed - cartTimestamp)
                  if (diff < bestDiff) {
                    best = o
                    bestDiff = diff
                  }
                }
                if (best && Math.abs(new Date(best.placedAt).getTime() - cartTimestamp) > ms(15)) {
                  console.warn('[Resolve] best matched order is older/newer than 15 minutes — ignoring as unsafe match')
                  best = null
                }
              } else if (matched.length === 0 && plausible.length === 1) {
                best = plausible[0] // last-resort
              }

              if (best) {
                console.log('[Resolve] Selected order match:', best)
                if (mounted) setCheckoutOrder(best)
                localStorage.setItem('checkoutOrder', JSON.stringify(best))
                localStorage.setItem('lastOrderId', best.id)
              } else {
                console.warn('[Resolve] No good order match found (plausible=%d matched=%d)', plausible.length, matched.length)
              }
            } else {
              console.warn('[Resolve] No orders returned or no checkoutData to match against')
            }
          } catch (err) {
            console.warn('[Resolve] Failed to fetch myOrders:', err)
          }
        }
      } catch (err) {
        console.error('[Error] Failed to parse stored data:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, router])

  // Payment handler — now uses single server mutation createPaymentsFromOrder
  const handlePayment = async () => {
    console.log('[Action] handlePayment triggered')

    if (!userToken) {
      console.error('[Error] Missing user token')
      alert('Please login again.')
      return
    }

    // Prefer server-confirmed checkoutOrder, then fallback to checkoutData and lastOrderId
    // @ts-ignore
    const resolvedUserId =
      // @ts-ignore
      meLoading === false && meData?.me?.id
        // @ts-ignore
        ? meData.me.id
        : checkoutOrder?.userId ?? checkoutData?.userId ?? null

    const resolvedOrderId =
      checkoutOrder?.id ??
      localStorage.getItem('lastOrderId') ??
      checkoutData?.orderId ??
      checkoutData?.order?.id ??
      null

    if (!resolvedUserId) {
      console.error('[Error] Could not resolve userId. GET_ME result:', meData, 'checkoutOrder:', checkoutOrder)
      alert('Unable to determine user identity. Please login and try again.')
      return
    }

    if (!resolvedOrderId) {
      console.error('[Error] Could not resolve orderId. checkoutOrder:', checkoutOrder, 'checkoutData:', checkoutData)
      alert('Unable to determine order. Please try again from the checkout page.')
      return
    }

    // Validation for payment forms
    if (paymentMethod === 'card') {
      if (!cardForm.cardNumber || !cardForm.cardName || !cardForm.expiryDate || !cardForm.cvv) {
        alert('Please fill in all card details')
        return
      }
    }
    if (paymentMethod === 'upi' && !upiForm.upiId) {
      alert('Please enter your UPI ID')
      return
    }

    setProcessing(true)

    try {
      console.log('[Mutation] Calling createPaymentsFromOrder with orderId=', resolvedOrderId, 'method=', paymentMethod)
      const methodU = (paymentMethod || 'cod').toUpperCase()

      const { data } = await createPaymentsFromOrder({
        variables: {
          orderId: String(resolvedOrderId),
          method: methodU,
        },
      })

      console.log('[Response] createPaymentsFromOrder:', data)
      //@ts-ignore
      const createdPayments = data?.createPaymentsFromOrder ?? []

      // Save receipt
      const total = checkoutData?.total ?? checkoutOrder?.totalPrice ?? checkoutData?.subtotal ?? 0
      const receipt = {
        orderId: resolvedOrderId,
        total,
        method: paymentMethod,
        time: new Date().toISOString(),
        payments: createdPayments,
        cartItems: checkoutData?.cartItems ?? checkoutOrder?.items ?? [],
      }
      console.log('[Storage] Saving paymentReceipt:', receipt)
      localStorage.setItem('paymentReceipt', JSON.stringify(receipt))

      // Cleanup
      console.log('[Cleanup] Removing checkoutData and storing lastOrderId...')
      localStorage.removeItem('checkoutData')
      localStorage.setItem('lastOrderId', resolvedOrderId)

      // Redirect
      console.log('[Redirect] Payment successful — navigating to /user/receipt')
      setTimeout(() => {
        setProcessing(false)
        router.push('/user/receipt')
      }, 1200)
    } catch (err) {
      console.error('[Error] Payment mutation failed:', err)
      alert('Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  if (loading || meLoading) {
    console.log('[State] Loading checkoutData or user info...')
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading payment page...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/user/products" className="flex items-center space-x-2">
            <Utensils className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">FoodExpress</span>
          </Link>
          <Link href="/user/checkout">
            <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
              <ArrowLeft className="h-5 w-5 mr-2" /> Back to Checkout
            </Button>
          </Link>
        </div>
      </nav>

      {/* Payment Body */}
      <div className="max-w-4xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-8">
        {/* Left: Payment Options */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
              <CardDescription>All transactions are secure and encrypted</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => {
                  console.log('[Event] Payment method changed:', v)
                  setPaymentMethod(v)
                }}
              >
                <div className="space-y-3">
                  {[
                    { value: 'card', icon: <CreditCard className="h-5 w-5 text-blue-600" />, title: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
                    { value: 'upi', icon: <Smartphone className="h-5 w-5 text-green-600" />, title: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
                    { value: 'netbanking', icon: <Building2 className="h-5 w-5 text-orange-600" />, title: 'Net Banking', desc: 'All major banks' },
                    { value: 'wallet', icon: <Wallet className="h-5 w-5 text-purple-600" />, title: 'Wallet', desc: 'Paytm, Mobikwik, Amazon Pay' },
                    { value: 'cod', icon: <DollarSign className="h-5 w-5 text-gray-600" />, title: 'Cash on Delivery', desc: 'Pay when you receive' },
                  ].map((method) => (
                    <div key={method.value} className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-orange-50 cursor-pointer">
                      <RadioGroupItem value={method.value} id={method.value} />
                      <Label htmlFor={method.value} className="flex items-center gap-3 flex-1 cursor-pointer">
                        {method.icon}
                        <div>
                          <p className="font-semibold">{method.title}</p>
                          <p className="text-sm text-gray-600">{method.desc}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Card Form */}
          {paymentMethod === 'card' && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" /> Card Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Card Number" value={cardForm.cardNumber} onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })} />
                <Input placeholder="Cardholder Name" value={cardForm.cardName} onChange={(e) => setCardForm({ ...cardForm, cardName: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="MM/YY" value={cardForm.expiryDate} onChange={(e) => setCardForm({ ...cardForm, expiryDate: e.target.value })} />
                  <Input placeholder="CVV" type="password" value={cardForm.cvv} onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* UPI Form */}
          {paymentMethod === 'upi' && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-green-600" /> UPI Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input placeholder="username@upi" value={upiForm.upiId} onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg sticky top-24">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{(checkoutData?.subtotal ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="text-green-600 font-semibold">FREE</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (5%)</span>
                <span>₹{(checkoutData?.tax ?? 0).toFixed(2)}</span>
              </div>
              <div className="border-t pt-4 flex justify-between items-center mb-6">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-3xl font-bold text-orange-600">₹{(checkoutData?.total ?? 0).toFixed(2)}</span>
              </div>

              <Button
                onClick={handlePayment}
                disabled={processing}
                className={`w-full h-12 text-lg text-white flex items-center justify-center ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-5 w-5" /> Pay ₹{(checkoutData?.total ?? 0).toFixed(2)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
