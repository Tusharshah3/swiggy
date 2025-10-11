'use client'

import {
  Package,
  ShoppingCart,
  TrendingUp,
  IndianRupee as DollarSign,
  Plus,
  Edit2,
  Trash2,
  Search,
  Utensils,
  User,
  LogOut,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client/react'
import {
  GET_PRODUCTS,
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
  GET_PRODUCTS_COUNT,
} from '@/graphql/product'
import { GET_ADMIN_ORDERS } from '@/graphql/adminOrder'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', quantity: '', stock: '', image: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [salesPeriod, setSalesPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month')
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalProducts, setTotalProducts] = useState(0)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token || role !== 'admin') {
      router.push('/user/login')
    } else {
      setAuthorized(true)
    }
  }, [router])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  //  Reset page when search or limit changes
  useEffect(() => {
    setPage(1)
  }, [search, limit])
  const { data: productData, loading: productLoading, refetch } = useQuery(GET_PRODUCTS, {
    variables: { page, limit, search },
    skip: !authorized,
    fetchPolicy: 'cache-and-network'
  })

  const { data: countData } = useQuery<{ getProductsCount: number }>(GET_PRODUCTS_COUNT, {
    variables: { search },
    skip: !authorized,
    fetchPolicy: 'cache-and-network',
  })



  useEffect(() => {
    if (countData?.getProductsCount !== undefined) {
      setTotalProducts(countData.getProductsCount)
    }
  }, [countData])

  const { data: orderData } = useQuery(GET_ADMIN_ORDERS, { skip: !authorized })

  const [createProduct] = useMutation(CREATE_PRODUCT)
  const [updateProduct] = useMutation(UPDATE_PRODUCT)
  const [deleteProduct] = useMutation(DELETE_PRODUCT)

  // @ts-ignore
  const products = productData?.getProducts || []
  // @ts-ignore
  const orders = orderData?.getAdminOrders  || []

const handleCreateOrUpdate = async () => {
  try {
    let imageUrl = form.image?.trim();

    // ✅ Auto-generate image if not provided
    if (!imageUrl) {
      const name = form.name?.trim() || 'food';
      const res = await fetch(`/api/generate-image?name=${encodeURIComponent(name)}`);
      const data = await res.json();

      if (!data?.image) throw new Error("Failed to fetch image from Foodish API");
      imageUrl = data.image;
      console.log("📸 Generated image URL from Foodish:", imageUrl);
    }

    const variables = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      quantity: form.quantity.trim(),  // ✅ FIXED
      image: imageUrl,                 // ✅ FIXED
    };

    // ✅ Debug log here
    console.log("🛰️ Sending mutation with variables:", variables);

    if (editingId) {
      console.log("✏️ Updating product with ID:", editingId);
      await updateProduct({ variables: { id: editingId, ...variables } });
      setEditingId(null);
    } else {
      console.log("🆕 Creating new product");
      await createProduct({ variables });
    }

    // ✅ Reset form and refetch products
    setForm({ name: '', price: '', quantity: '', stock: '', image: '' });
    refetch();
  } catch (error: any) {
    console.error("🚨 Error in handleCreateOrUpdate:", error.message);
    alert('Failed to create or update product');
  }
};



  const handleEdit = (product: any) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      quantity: product.quantity ? product.quantity.toString() : '',
      image: product.image || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
  if (deleteId) {
    await deleteProduct({ variables: { id: deleteId } })
    refetch()
    setDeleteId(null)
    setShowConfirm(false)
  }
}


  const resetForm = () => {
    setForm({ name: '', price: '', quantity: '', stock: '', image: ''})
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
  // if (productLoading) return <p className="text-center mt-10">Loading...</p>

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">FoodExpress</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/admin/profile">
                <Button variant="ghost" className="flex items-center space-x-2 text-gray-700 hover:text-orange-600">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">You</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => setShowLogoutConfirm(true)}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>

            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">🧑‍🍳 Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow hover:shadow-md"><CardContent className="pt-6"><div className="flex justify-between"><div><p className="text-sm text-gray-500">Products</p><p className="text-2xl font-bold text-orange-600">{products.length}</p></div><Package className="text-orange-600" /></div></CardContent></Card>
          <Card className="bg-white shadow hover:shadow-md"><CardContent className="pt-6"><div className="flex justify-between"><div><p className="text-sm text-gray-500">Orders</p><p className="text-2xl font-bold text-green-600">{totalOrders}</p></div><ShoppingCart className="text-green-600" /></div></CardContent></Card>
          <Card className="bg-white shadow hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">₹{totalSales.toFixed(0)}</p>
                </div>
                <span className="text-blue-600 text-xl font-bold">₹</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow hover:shadow-md"><CardContent className="pt-6"><div className="flex justify-between"><div><p className="text-sm text-gray-500">Items Sold</p><p className="text-2xl font-bold text-red-600">{totalItems}</p></div><TrendingUp className="text-red-600" /></div></CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products">
          <TabsList className="grid grid-cols-4 mb-6 bg-orange-100 rounded-lg">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="top">Top Selling</TabsTrigger>
          </TabsList>

          {/* Product Tab */}
          <TabsContent value="products" className="space-y-6">
           <Card className="shadow">
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-gray-900">Manage Products</CardTitle>
                    <CardDescription className="text-gray-500">Create, edit, or remove items</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Responsive grid with labels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Product name"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="Enter price"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantity</Label>
                    <Input
                      id="quantity"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      placeholder="e.g. 200g / 1L / 1 unit"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="stock" className="text-sm font-medium text-gray-700">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      placeholder="Current stock"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                    <Label htmlFor="image" className="text-sm font-medium text-gray-700">Image URL</Label>
                    <Input
                      id="image"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleCreateOrUpdate}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                  {editingId && (
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>


            <Card className="shadow">
                
                <div className="relative flex items-center">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      {productLoading && (
                        <div className="absolute right-3 top-2.5">
                          <div className="h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>

              </Card>

            <Card className="shadow">
                <CardContent className="space-y-6">
                <div className="space-y-4 mt-6 ">
                    {productLoading ? (
                        <div className="flex justify-center items-center py-10">
                          <div className="h-5 w-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                          <p className="ml-3 text-sm text-gray-600">Searching...</p>
                        </div>
                      ) :filteredProducts.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                          <p>No products found for "<span className="font-medium text-orange-600">{search}</span>"</p>
                          <p className="text-sm mt-1">Try adjusting your search or clearing the filter.</p>
                        </div>
                      ) : (
                        filteredProducts.map((product: any) => {
                          let stockColor = 'text-gray-700'
                          if (product.stock === 0) stockColor = 'text-red-600'
                          else if (product.stock > 0 && product.stock < 10) stockColor = 'text-orange-600'

                          return (
                            <div
                              key={product.id}
                              className="border p-4 rounded-lg bg-orange-50 hover:shadow-md transition"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  <img
                                    src={product.image || 'https://via.placeholder.com/100'}
                                    className="w-14 h-14 rounded object-cover"
                                    alt={product.name}
                                  />
                                  <div>
                                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                    <p className="text-gray-600">
                                      ₹ {product.price} | <span className={stockColor}>Stock: {product.stock}</span>{' '}
                                      | <span className="text-gray-500">Quantity: {product.quantity}</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="space-x-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setDeleteId(product.id)
                                      setShowConfirm(true)
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}

                  </div>

                {/* Pagination Controls */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Limit Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show per page:</span>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(parseInt(e.target.value))}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {[10, 25, 50].map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  {/* Page Controls */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {page} of {Math.ceil(totalProducts / limit) || 1}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page * limit >= totalProducts}
                      onClick={() => setPage((prev) => prev + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory */}
          <TabsContent value="inventory">
            <Card className="shadow mb-4">
              <CardHeader>
                <CardTitle className="text-gray-800">Total Products You Added</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{totalProducts}</p>
              </CardContent>
            </Card>
            <Card className="shadow">
              <CardHeader><CardTitle className="text-yellow-600">Low Stock</CardTitle></CardHeader>
              <CardContent>{lowStock.map((p: any) => (
                <div key={p.id} className="flex justify-between p-2 border rounded-lg bg-yellow-50 mb-2">
                  <span className="text-gray-900">{p.name}</span><Badge className="bg-yellow-500">Stock: {p.stock}</Badge>
                </div>))}</CardContent>
            </Card>
            <Card className="shadow mt-4">
              <CardHeader><CardTitle className="text-red-600">Out of Stock</CardTitle></CardHeader>
              <CardContent>{outOfStock.map((p: any) => (
                <div key={p.id} className="flex justify-between p-2 border rounded-lg bg-red-50 mb-2">
                  <span className="text-gray-900">{p.name}</span><Badge variant="destructive">Out</Badge>
                </div>))}</CardContent>
            </Card>
          </TabsContent>

          {/* Sales */}
          <TabsContent value="sales">
            <Card className="shadow">
              <CardHeader>
                <CardTitle className="text-gray-900">Sales Analytics</CardTitle>
                <CardDescription className="text-gray-500">Stats by period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {['week', 'month', 'year', 'all'].map((p) => {
                    const isActive = salesPeriod === p
                    return (
                      <Button
                        key={p}
                        onClick={() => setSalesPeriod(p as any)}
                        className={
                          isActive
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                            : 'border border-orange-300 text-orange-700 hover:bg-orange-50'
                        }
                        variant={isActive ? 'default' : 'outline'}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card><CardContent><p className="font-bold text-blue-600">Revenue</p><p>₹{totalSales.toFixed(2)}</p></CardContent></Card>
                  <Card><CardContent><p className="font-bold text-green-600">Orders</p><p>{totalOrders}</p></CardContent></Card>
                  <Card><CardContent><p className="font-bold text-orange-600">Items</p><p>{totalItems}</p></CardContent></Card>
                </div>
                <div className="space-y-2">
                  {recentOrders.map((order: any) => (
                    <div key={order.id} className="border p-2 rounded-lg bg-white">
                      <p className="font-semibold text-gray-900">#{order.id.slice(0, 8)} | ₹{order.total}</p>
                      <p className="text-sm text-gray-600">{new Date(order.placedAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Selling */}
          <TabsContent value="top">
            <Card className="shadow">
              <CardHeader><CardTitle className="text-orange-600">Top Selling</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {topSelling.map((item: any, i: number) => (
                  <div key={i} className="border p-2 rounded-lg bg-white flex justify-between hover:shadow">
                    <div className="text-gray-900">{item.product.name}</div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-green-600 font-semibold">₹{item.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[90%] max-w-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Logout</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300"
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
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl w-[90%] max-w-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Delete</h2>
          <p className="text-gray-600 mb-6">Are you sure you want to delete this product?</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowConfirm(false)
                setDeleteId(null)
              }}
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      
    )}

    </div>
  )
}
