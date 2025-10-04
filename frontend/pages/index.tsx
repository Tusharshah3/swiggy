'use client'

import Link from 'next/link'
import { ArrowRight, ShoppingBag, Clock, Star, Utensils } from 'lucide-react'
import { Button } from '../components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Utensils className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">FoodExpress</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden pt-20 pb-32 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium">
                  <Star className="h-4 w-4 fill-current" />
                  <span>Trusted by 10,000+ food lovers</span>
                </div>

                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Order your favorite food in
                  <span className="text-orange-600"> minutes</span>
                </h1>

                <p className="text-xl text-gray-600 leading-relaxed">
                  Discover thousands of restaurants and get your favorite meals delivered hot and fresh to your doorstep.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/signup">
                    <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white text-lg h-14 px-8 w-full sm:w-auto">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/adminlogin">
                    <Button size="lg" variant="outline" className="text-lg h-14 px-8 border-2 w-full sm:w-auto">
                      Admin Portal
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-8 pt-8 border-t">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">500+</div>
                    <div className="text-sm text-gray-600">Restaurants</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">50K+</div>
                    <div className="text-sm text-gray-600">Orders</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">4.8</div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                </div>
              </div>

              <div className="relative lg:h-[600px] hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl transform rotate-3"></div>
                <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl p-8 transform -rotate-1">
                  <div className="h-full flex flex-col justify-center space-y-6">
                    <div className="bg-gray-50 rounded-2xl p-6 transform hover:scale-105 transition-transform">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-orange-100 rounded-xl flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Quick Ordering</div>
                          <div className="text-sm text-gray-600">Browse and order in seconds</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 transform hover:scale-105 transition-transform">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-green-100 rounded-xl flex items-center justify-center">
                          <Clock className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Fast Delivery</div>
                          <div className="text-sm text-gray-600">Get your food within 30 mins</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 transform hover:scale-105 transition-transform">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-yellow-100 rounded-xl flex items-center justify-center">
                          <Star className="h-8 w-8 text-yellow-600 fill-current" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Quality Food</div>
                          <div className="text-sm text-gray-600">Only the best restaurants</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 mb-16 max-w-2xl mx-auto">
              Three simple steps to satisfy your cravings
            </p>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-orange-600">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Browse Menu</h3>
                <p className="text-gray-600">
                  Explore hundreds of restaurants and thousands of dishes
                </p>
              </div>

              <div className="space-y-4">
                <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-orange-600">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Place Order</h3>
                <p className="text-gray-600">
                  Add items to cart and checkout with secure payment
                </p>
              </div>

              <div className="space-y-4">
                <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-orange-600">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Enjoy Food</h3>
                <p className="text-gray-600">
                  Get fresh, hot food delivered to your doorstep
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-orange-600 to-red-600 py-20 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready to order delicious food?
            </h2>
            <p className="text-xl text-orange-100">
              Join thousands of satisfied customers today
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 text-lg h-14 px-8">
                Create Your Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Utensils className="h-6 w-6 text-orange-600" />
            <span className="text-xl font-bold text-white">FoodExpress</span>
          </div>
          <p className="text-sm">
            &copy; 2025 FoodExpress. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
