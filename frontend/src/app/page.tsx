'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Shield, 
  BarChart, 
  Target, 
  Zap,
  ArrowRight,
  Star
} from 'lucide-react'

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const features = [
    {
      icon: TrendingUp,
      title: 'AI Risk Prediction',
      description: 'Identify at-risk learners before they drop out with 85% accuracy using machine learning algorithms.',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: Target,
      title: 'Smart Interventions',
      description: 'Automated, personalized nudges and support messages to re-engage learners at the right time.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BarChart,
      title: 'Real-time Analytics',
      description: 'Comprehensive dashboards with live engagement metrics and learning progress insights.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: 'Learner Insights',
      description: 'Personal learning profiles with achievement tracking and personalized recommendations.',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: Zap,
      title: 'Instant Notifications',
      description: 'Real-time alerts for administrators and proactive support for learners.',
      color: 'from-orange-500 to-yellow-500'
    },
    {
      icon: Shield,
      title: 'Advanced Security',
      description: 'Enterprise-grade security with role-based access control and data protection.',
      color: 'from-gray-600 to-gray-800'
    }
  ]

  const stats = [
    { label: 'Learners Supported', value: '10,000+', icon: Users },
    { label: 'Dropout Prevention', value: '25%', icon: TrendingUp },
    { label: 'Engagement Increase', value: '40%', icon: Target },
    { label: 'Response Time', value: '<2min', icon: Zap }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">EduEngage AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Star className="h-4 w-4" />
              <span>AI-Powered Learning Analytics Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Learning with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Intelligent Insights
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Predict, prevent, and personalize learning experiences with our AI-powered engagement analytics. 
              Reduce dropout rates by 25% and increase engagement by 40%.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Learning
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to understand, engage, and retain your learners with data-driven insights.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Accounts Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Try Our Demo</h2>
          <p className="text-xl text-gray-600 mb-12">
            Experience the full platform with our pre-configured demo accounts
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <CardTitle className="text-blue-900">Administrator</CardTitle>
                <CardDescription>Full platform management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>Email:</strong> admin@demo.com</p>
                  <p><strong>Password:</strong> admin123</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-green-900">Demo Learner</CardTitle>
                <CardDescription>Sample learner profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-green-800">
                  <p><strong>Email:</strong> learner@demo.com</p>
                  <p><strong>Password:</strong> learner123</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8">
            <Link href="/login">
              <Button size="lg">
                Try Demo Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <BookOpen className="h-8 w-8" />
              <span className="text-xl font-bold">EduEngage AI</span>
            </div>
            <p className="text-gray-400 text-center md:text-right">
              © 2025 EduEngage AI. Built for the Upgrad Hackathon.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
