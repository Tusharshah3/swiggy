'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@apollo/client/react'
import { SIGNUP_MUTATION } from '@/graphql/auth'
import {
  Utensils,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader as Loader2,
  CircleCheck as CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const pathname = usePathname()

  // Automatically assign role based on path
  const role = pathname.startsWith('/admin') ? 'admin' : 'user'

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [signup, { loading, error }] = useMutation(SIGNUP_MUTATION)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    try {
      const { data } = await signup({
        variables: {
          input: {
            name: form.name,
            email: form.email,
            password: form.password,
            role: role, // ✅ Set role based on pathname
          },
        },
      })
      //@ts-ignore
      if (data?.signup?.token) {
        //@ts-ignore
        localStorage.setItem('token', data.signup.token)
        //@ts-ignore
        localStorage.setItem('role', data.signup.user.role)
            //@ts-ignore
        localStorage.setItem('name', data.signup.user.name)
        //@ts-ignore
        localStorage.setItem('email', data.signup.user.email)
        //@ts-ignore
        localStorage.setItem('picture', data.signup.user.picture || '')
            //@ts-ignore
        localStorage.setItem('user_id', data.signup.user.id)
        //@ts-ignore
        const userRole = data.signup.user.role
        router.push(userRole === 'admin' ? '/admin/product' : '/user/products')
      }
    } catch (err) {
      console.error('Signup failed:', err)
      setLocalError('Signup failed. Try again.')
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
            <div className="flex items-center space-x-4">
              <Link href="/admin/login">
                <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
                  Admin Login
                </Button>
              </Link>
              <Link href="/user/login">
                <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
                 User Login
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
              <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
              <p className="text-gray-600">Join thousands of food lovers today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tushar Shah"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
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

             

              {/* Error Message */}
              {(error || localError) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {localError || error?.message}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Sign In Redirect */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <Link href="/admin/login">
              <Button variant="outline" className="w-full h-12 text-lg border-2">
                Sign In
              </Button>
            </Link>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
