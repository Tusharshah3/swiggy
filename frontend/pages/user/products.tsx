'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { GET_PRODUCTS, ADD_TO_CART } from '@/graphql/product'
import { MY_CART } from '@/graphql/cart'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Utensils,
  ShoppingCart,
  Search,
  Filter,
  Star,
  Plus,
  LogOut,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function ProductsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [showCartButton, setShowCartButton] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  useEffect(() => {
    if (!token) {
      router.push('/user/login')
    }
  }, [token])

  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: { page: 1, limit: 20 },
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
    fetchPolicy: 'cache-and-network',
  })

  const [addToCart] = useMutation(ADD_TO_CART, {
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
  })
    const { data: cartData } = useQuery(MY_CART, {
      
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
    skip: !token,
    fetchPolicy: 'cache-and-network',
    
  })
  console.log("🔍 Cart Data:", cartData)

// 1. Extract cart items safely
//@ts-ignore
  const cartItems = cartData?.getMyCart?.items || []

  // 2. Use cartItems.length to control the button visibility
  useEffect(() => {
    console.log("🛒 Cart Items:", cartItems.length)
    setShowCartButton(cartItems.length > 0)
  }, [cartItems.length])


  const handleAdd = async (id: string) => {
    try {
      setAdding(id)
      await addToCart({ variables: { productId: id, quantity: 1 } })
      setShowCartButton(true)
    } catch (err) {
      alert('Failed to add to cart ')
    } finally {
      setAdding(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-orange-600">
        Error: {error.message}
      </div>
    )
  }
  //@ts-ignore
  const products = data?.getProducts || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">FoodExpress</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/user/cart">
                <Button variant="ghost" className="relative hover:text-orange-600">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/user/profile">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">You</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => setShowLogoutConfirm(true)}
                className="text-orange-600 hover:text-orange-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            What would you like to eat today?
          </h1>
          <p className="text-gray-600">
            Choose from our wide variety of delicious options
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Button variant="outline" className="h-12">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </Button>
        </div>

        {/* In-Stock Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
          {products
            .filter(
              (product: any) =>
                product.stock > 0 &&
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((product: any) => {
              const isLow = product.stock > 0 && product.stock < 10

              return (
                <div
                  key={product.id}
                  className="bg-white border rounded-xl shadow-sm hover:shadow-md transition overflow-hidden group"
                >
                  <div className="relative h-48">
                    <img
                      src={product.image || 'https://placehold.co/300x200?text=No+Image'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) =>
                        (e.currentTarget.src = 'https://placehold.co/300x200?text=No+Image')
                      }
                    />
                    <Badge className="absolute top-3 right-3 bg-white text-gray-900 shadow">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                      {product.rating ?? '4.5'}
                    </Badge>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ₹{product.price.toFixed(2)}{' '}
                        {isLow && (
                          <Badge className="ml-2 bg-yellow-500 text-white">
                            Low Stock
                          </Badge>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xl font-bold text-orange-600">
                        ₹{product.price.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleAdd(product.id)}
                        disabled={adding === product.id}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {adding === product.id ? 'Adding...' : 'Add'}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Out-of-Stock Section */}
        <details className="mb-16">
          <summary className="text-lg font-semibold text-red-600 cursor-pointer hover:underline">
          Out-of-Stock Items
          </summary>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {products
              .filter(
                (product: any) =>
                  product.stock === 0 &&
                  product.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((product: any) => (
                <div
                  key={product.id}
                  className="bg-red-50 border border-red-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden group"
                >
                  <div className="relative h-48">
                    <img
                      src={product.image || 'https://placehold.co/300x200?text=No+Image'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) =>
                        (e.currentTarget.src =
                          'https://placehold.co/300x200?text=No+Image')
                      }
                    />
                    <Badge className="absolute top-3 right-3 bg-white text-gray-900 shadow">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                      {product.rating ?? '4.5'}
                    </Badge>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-red-600">Out of Stock</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xl font-bold text-gray-400 line-through">
                        ₹{product.price.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        disabled
                        className="bg-gray-300 text-gray-600 cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Unavailable
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </details>
      </div>

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[90%] max-w-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Logout</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token')
                  localStorage.removeItem('role')
                  setShowLogoutConfirm(false)
                  router.push('/')
                }}
                className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {showCartButton && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg"
            onClick={() => router.push('/user/cart')}
          >
            🛒 View Cart
          </Button>
        </div>
      )}
    </div>
  )
}
