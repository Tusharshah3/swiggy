'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { GET_PRODUCTS, ADD_TO_CART } from '@/graphql/product'
import { useEffect, useState } from 'react'
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

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  useEffect(() => {
    if (!token) {
      router.push('/login')
    }
  }, [token])

  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: { page: 1, limit: 12 },
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
  })

  const [addToCart] = useMutation(ADD_TO_CART, {
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
  })

  const handleAdd = async (id: string) => {
    try {
      setAdding(id)
      await addToCart({ variables: { productId: id, quantity: 1 } })
      setShowCartButton(true)
    } catch (err) {
      alert('Failed to add to cart ❌')
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
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Error: {error.message}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">FoodExpress</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/cart">
              <Button variant="ghost" className="relative hover:text-orange-600">
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -top-0.5 -right-0.5 h-2 w-2 p-0 bg-orange-600 flex items-center justify-center">
                </Badge>
              </Button>
              </Link>

              <div className="flex items-center space-x-2 hover:text-orange-600">
                <Link href="profile">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">You</span>
                </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    localStorage.removeItem('token')
                    router.push('/')
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            What would you like to eat today?
          </h1>
          <p className="text-gray-600">
            Choose from our wide variety of delicious options
          </p>
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* @ts-ignore */}
          {data.getProducts
            .filter((product: any) =>
              product.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((product: any) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden group"
              >
                <div className="relative h-48">
                  <img
                    src={product.image || 'https://placehold.co/300x200?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) =>
                      (e.currentTarget.src =
                        'https://placehold.co/300x200?text=No+Image')
                    }
                  />
                  <Badge className="absolute top-3 right-3 bg-white text-gray-900">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {product.rating ?? '4.5'}
                  </Badge>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-2xl font-bold text-orange-600">
                      ₹{product.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAdd(product.id)}
                      disabled={adding === product.id}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {adding === product.id ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {showCartButton && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg"
            onClick={() => router.push('/cart')}
          >
            🛒 View Cart
          </Button>
        </div>
      )}
    </div>
  )
}
