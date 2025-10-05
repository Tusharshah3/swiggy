'use client'

import {
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react'
import { Utensils, User, LogOut } from 'lucide-react'
import Link from 'next/link'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client/react'
import {
  GET_PRODUCTS,
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
} from '@/graphql/product'
import { GET_ALL_ORDERS } from '@/graphql/order'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', stock: '', image: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [salesPeriod, setSalesPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token || role !== 'admin') {
      router.push('/login')
    } else {
      setAuthorized(true)
    }
  }, [router])

  const { data: productData, loading: productLoading, refetch } = useQuery(GET_PRODUCTS, {
    variables: { page: 1, limit: 100 },
    skip: !authorized,
  })

  const { data: orderData } = useQuery(GET_ALL_ORDERS, {
    skip: !authorized,
  })

  const [createProduct] = useMutation(CREATE_PRODUCT)
  const [updateProduct] = useMutation(UPDATE_PRODUCT)
  const [deleteProduct] = useMutation(DELETE_PRODUCT)
//@ts-ignore
  const products = productData?.getProducts || []
  //@ts-ignore
  const orders = orderData?.getOrderHistory || []

  const handleCreateOrUpdate = async () => {
    try {
      const vars = {
        name: form.name,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        image: form.image || undefined,
      }

      if (editingId) {
        await updateProduct({ variables: { id: editingId, ...vars } })
        setEditingId(null)
      } else {
        await createProduct({ variables: vars })
      }

      setForm({ name: '', price: '', stock: '', image: '' })
      refetch()
    } catch {
      alert('Action failed')
    }
  }

  const handleEdit = (product: any) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image: product.image || '',
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete product?')) return
    await deleteProduct({ variables: { id } })
    refetch()
  }

  const resetForm = () => {
    setForm({ name: '', price: '', stock: '', image: '' })
    setEditingId(null)
  }

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = products.filter((p: any) => p.stock > 0 && p.stock < 10)
  const outOfStock = products.filter((p: any) => p.stock === 0)

  const getTopSelling = () => {
    const map = new Map()
    for (const order of orders) {
      for (const item of order.items) {
        const prod = products.find((p: any) => p.id === item.productId)
        if (prod) {
          const key = item.productId
          const existing = map.get(key) || { product: prod, quantity: 0, revenue: 0 }
          map.set(key, {
            product: prod,
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + item.priceAtPurchase * item.quantity,
          })
        }
      }
    }

    return Array.from(map.values()).sort((a: any, b: any) => b.quantity - a.quantity).slice(0, 5)
  }

  const getSalesStats = () => {
    const now = new Date()
    const filtered = orders.filter((order: any) => {
      const date = new Date(order.placedAt)
      if (salesPeriod === 'week') return date >= new Date(now.getTime() - 7 * 864e5)
      if (salesPeriod === 'month') return date >= new Date(now.getTime() - 30 * 864e5)
      if (salesPeriod === 'year') return date >= new Date(now.getTime() - 365 * 864e5)
      return true
    })

    const totalSales = filtered.reduce((sum: number, o: any) => sum + o.total, 0)
    const totalOrders = filtered.length
    const totalItems = filtered.reduce(
      (sum: number, o: any) => sum + o.items.reduce((s: number, i: any) => s + i.quantity, 0),
      0
    )

    return { totalSales, totalOrders, totalItems, recentOrders: filtered.slice(0, 5) }
  }

  const { totalSales, totalOrders, totalItems, recentOrders } = getSalesStats()
  const topSelling = getTopSelling()

  if (!authorized) return <p className="text-center mt-10">Checking admin access...</p>
  if (productLoading) return <p className="text-center mt-10">Loading...</p>

  return (
    <><nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Utensils className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">FoodExpress</span>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 hover:text-orange-600">
              <Link href="/user/profile">
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
    
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">🛠️ Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card><CardContent className="pt-6"><div className="flex justify-between"><div><p className="text-sm">Products</p><p className="text-2xl font-bold">{products.length}</p></div><Package /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex justify-between"><div><p className="text-sm">Orders</p><p className="text-2xl font-bold">{totalOrders}</p></div><ShoppingCart /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex justify-between"><div><p className="text-sm">Revenue</p><p className="text-2xl font-bold">₹{totalSales.toFixed(0)}</p></div><DollarSign /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex justify-between"><div><p className="text-sm">Items Sold</p><p className="text-2xl font-bold">{totalItems}</p></div><TrendingUp /></div></CardContent></Card>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="top">Top Selling</TabsTrigger>
        </TabsList>

        {/* Product Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle>Manage Products</CardTitle>
                  <CardDescription>Create, edit, or remove items</CardDescription>
                </div>
                <Button onClick={resetForm} className="bg-orange-600"><Plus className="mr-2 h-4 w-4" /> New</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" />
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Stock" />
                <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="Image URL" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateOrUpdate} className="bg-green-600">{editingId ? 'Update' : 'Create'}</Button>
                {editingId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="space-y-4">
                {filteredProducts.map((product: any) => (
                  <div key={product.id} className="border p-4 rounded flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <img src={product.image || 'https://via.placeholder.com/100'} className="w-14 h-14 rounded object-cover" />
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p>₹ {product.price} | Stock: {product.stock}</p>
                      </div>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(product)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory */}
        <TabsContent value="inventory">
          <Card><CardHeader><CardTitle>Low Stock</CardTitle></CardHeader><CardContent>{lowStock.map((p: any) => (
            <div key={p.id} className="flex justify-between p-2 border rounded mb-2">
              <span>{p.name}</span><Badge className="bg-yellow-500">Stock: {p.stock}</Badge>
            </div>))}</CardContent></Card>

          <Card><CardHeader><CardTitle>Out of Stock</CardTitle></CardHeader><CardContent>{outOfStock.map((p: any) => (
            <div key={p.id} className="flex justify-between p-2 border rounded mb-2">
              <span>{p.name}</span><Badge variant="destructive">Out</Badge>
            </div>))}</CardContent></Card>
        </TabsContent>

        {/* Sales */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>Stats by period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {['week', 'month', 'year', 'all'].map((p) => (
                  <Button key={p} onClick={() => setSalesPeriod(p as any)} variant={salesPeriod === p ? 'default' : 'outline'}>
                    {p}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Card><CardContent><p>Revenue: ₹{totalSales.toFixed(2)}</p></CardContent></Card>
                <Card><CardContent><p>Orders: {totalOrders}</p></CardContent></Card>
                <Card><CardContent><p>Items: {totalItems}</p></CardContent></Card>
              </div>
              <div className="space-y-2">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="border p-2 rounded">
                    <p className="font-semibold">#{order.id.slice(0, 8)} | ₹{order.total}</p>
                    <p className="text-sm text-gray-600">{new Date(order.placedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Selling */}
        <TabsContent value="top">
          <Card>
            <CardHeader><CardTitle>Top Selling</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {topSelling.map((item: any, i: number) => (
                <div key={i} className="border p-2 rounded flex justify-between">
                  <div>{item.product.name}</div>
                  <div className="text-right">
                    <p>Qty: {item.quantity}</p>
                    <p>₹{item.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  )
}
