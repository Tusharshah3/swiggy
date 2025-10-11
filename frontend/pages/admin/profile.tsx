'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@apollo/client/react'
import { GET_ME } from '@/graphql/auth'

import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  Utensils,
  User,
  Mail,
  Camera,
  CreditCard as Edit2,
  Save,
  X,
  ArrowLeft
} from 'lucide-react'

export default function AdminProfilePage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) {
      router.push('/admin/login')
    } else {
      setToken(t)
    }
  }, [router])

  const { data, loading, error } = useQuery(GET_ME, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    skip: !token,
  })

  //@ts-ignore
  const user = data?.me

  const [form, setForm] = useState({ name: '', picture: '' })

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        picture: user.picture || 'https://i.pravatar.cc/150?img=1.png',
      })
    }
  }, [user])

  const handleSave = () => {
    localStorage.setItem('name', form.name)
    localStorage.setItem('picture', form.picture)
    setEditing(false)
  }

  const handleCancel = () => {
    setForm({
      name: user?.name || '',
      picture: user?.picture || '',
    })
    setEditing(false)
  }

  const initials = form.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const formattedDate = useMemo(() => {
    if (!user?.createdAt) return 'N/A'
    return new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [user?.createdAt])

  if (!token || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <p>{error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin/products" className="flex items-center space-x-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">FoodExpress</span>
            </Link>
            <Link href="/admin/products">
              <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Products
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your admin account</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
                {!editing ? (
                  <Button onClick={() => setEditing(true)} variant="outline">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleCancel} variant="outline" disabled={saving}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-orange-600 hover:bg-orange-700"
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-4 pb-6 border-b">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage src={form.picture} />
                    <AvatarFallback className="text-3xl bg-orange-100 text-orange-600">
                      {initials || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {editing && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                {editing && (
                  <div className="w-full max-w-md">
                    <Label htmlFor="picture" className="text-sm text-gray-600">
                      Profile Picture URL
                    </Label>
                    <Input
                      id="picture"
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={form.picture}
                      onChange={(e) => setForm({ ...form, picture: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    Full Name
                  </Label>
                  {editing ? (
                    <Input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter your name"
                      className="h-12"
                    />
                  ) : (
                    <div className="h-12 px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {form.name || 'Not set'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    Email Address
                  </Label>
                  <div className="h-12 px-4 py-3 bg-gray-100 rounded-lg text-gray-500 cursor-not-allowed">
                    {user?.email}
                  </div>
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-700">Role</Label>
                  <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-700 capitalize">
                    {user?.role}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Account ID</p>
                  <p className="font-mono text-sm bg-gray-50 p-3 rounded-lg break-all">
                    {user?.id}
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {formattedDate}
                  </p>
                </div>
               
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Account Status</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
