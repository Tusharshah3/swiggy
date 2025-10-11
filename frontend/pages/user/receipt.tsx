'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Utensils,
  CheckCircle2,
  Calendar,
  CreditCard,
  IndianRupee,
  Printer,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReceiptPage() {
  const router = useRouter()
  const [receipt, setReceipt] = useState<any>(null)

  useEffect(() => {
    const data = localStorage.getItem('paymentReceipt')
    if (!data) {
      router.push('/user/orders')
      return
    }
    setReceipt(JSON.parse(data))
  }, [router])

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-orange-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your receipt...</p>
        </div>
      </div>
    )
  }

  const { orderId, total, method, time, cartItems } = receipt

  return (
    <div className="bg-white shadow-xl p-8 rounded-lg print:shadow-none print:border-none">

    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/user/products" className="flex items-center space-x-2">
            <Utensils className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">FoodExpress</span>
          </Link>
          <Link href="/user/orders">
            <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6">


        <Card className="shadow-xl border border-orange-100">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <CardTitle className="text-3xl font-bold text-gray-900">
              Payment Successful 🎉
            </CardTitle>
            <p className="text-gray-500">Thank you for ordering with FoodExpress</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Receipt Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Order ID:</p>
                <p className="text-orange-600 font-mono">#{orderId?.slice(0, 8)}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Payment Method:</p>
                <p className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-500" /> {method.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Date & Time:</p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  {new Date(time).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Status:</p>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                  SUCCESS
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Items Purchased</h3>
              <ul className="space-y-3">
                {cartItems?.map((item: any, idx: number) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center bg-white border rounded-lg p-3 hover:bg-orange-50"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.products?.image || 'https://placehold.co/64x64'}
                        alt={item.products?.name}
                        className="w-14 h-14 rounded-lg object-cover border"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.products?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          ₹{item.products.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-orange-600">
                      ₹{(item.products.price * item.quantity).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Total Summary */}
            <div className="border-t pt-4 flex justify-between items-center text-lg font-bold">
              <span>Total Amount Paid</span>
              <span className="text-orange-600 flex items-center">
                <IndianRupee className="h-5 w-5 mr-1" />
                {total.toFixed(2)}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                onClick={() => window.print()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center gap-2"
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </Button>
              <Button
                onClick={() => router.push('/user/orders')}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                View Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  )
}
