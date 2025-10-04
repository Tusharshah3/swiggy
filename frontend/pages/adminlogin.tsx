'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@apollo/client/react'
import { LOGIN_MUTATION } from '@/graphql/auth'
import {
  Utensils,
  Mail,
  Lock,
  ArrowRight,
  Loader as Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    try {
      const { data } = await login({ variables: form })
        //@ts-ignore
      if (data?.login?.token) {
        //@ts-ignore
        localStorage.setItem('token', data.login.token)
        router.push('/admin/page') // ✅ redirect to admin dashboard
      } else {
        setLocalError('Invalid credentials')
      }
    } catch (err) {
      console.error('Login error:', err)
      setLocalError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex flex-col">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">FoodExpress</span>
            </Link>
            <div className="flex items-center justify-between h-16">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
                User Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
                User Signup
              </Button>
            </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
              <p className="text-gray-600 text-sm">Enter your admin credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {(localError || error) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {localError || error?.message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login as Admin
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Admin access only. Unauthorized use prohibited.
          </p>
        </div>
      </div>
    </div>
  )
}
