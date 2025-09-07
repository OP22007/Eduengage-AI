'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, Filter, Grid, List, ChevronDown, BookOpen, Users, Clock, 
  Star, Trophy, Play, CheckCircle2, Sparkles, BookOpenCheck, 
  Brain, GraduationCap, Target, SortDesc, TrendingUp, UserPlus
} from 'lucide-react'
import { coursesAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

// Tab types
type TabType = 'all' | 'enrolled' | 'available'

interface Course {
  _id: string
  title: string
  description: string
  thumbnail?: string
  instructor: {
    name: string
    email: string
    bio?: string
    avatar?: string
  }
  category: string
  difficulty: string
  duration: number
  modules: any[]
  stats: {
    totalEnrolled: number
    avgRating: number
    totalRatings: number
  }
  isEnrolled?: boolean
  progress?: number
  status?: string
  enrolledAt?: string
  isActive: boolean
  riskScore?: number
  riskLevel?: 'low' | 'medium' | 'high'
  mlInsights?: {
    interventionNeeded?: boolean
    recommendations?: string[]
  }
}

// Button Component
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  [key: string]: any
}

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, ...props }: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  } as const
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  } as const
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  return (
    <button
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${disabledClasses} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

// Badge Component
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
}

const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-blue-100 text-blue-800',
    outline: 'border border-gray-300 bg-white text-gray-700',
  } as const
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

// Card Components
const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children, className = '' }: any) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
)

const CardContent = ({ children, className = '' }: any) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
)

const CardTitle = ({ children, className = '' }: any) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
)

const CardDescription = ({ children, className = '' }: any) => (
  <p className={`text-sm text-gray-600 ${className}`}>
    {children}
  </p>
)

// CourseCard Component
interface CourseCardProps {
  course: Course
  onEnroll: (courseId: string) => void
  viewMode?: 'grid' | 'list'
  isAuthenticated?: boolean
  showEnrollmentStatus?: boolean
  user?: any // Add user prop
}

const CourseCard = ({ course, onEnroll, viewMode = 'grid', isAuthenticated = false, showEnrollmentStatus = false, user }: CourseCardProps) => {
  const router = useRouter()
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskLevelColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const RiskIndicator = ({ course }: { course: Course }) => {
    // Only show risk indicators to admin and instructor users
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) return null
    if (!course.isEnrolled || !course.riskScore) return null
    
    const riskPercentage = Math.round(course.riskScore * 100)
    const riskLevel = course.riskLevel || (
      course.riskScore > 0.7 ? 'high' : 
      course.riskScore > 0.4 ? 'medium' : 'low'
    )
    
    return (
      <div className="flex items-center gap-2 mt-2">
        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(riskLevel)}`}>
          Risk: {riskLevel} ({riskPercentage}%)
        </div>
        {course.mlInsights?.interventionNeeded && (
          <div className="flex items-center gap-1 text-amber-600">
            <Sparkles className="h-3 w-3" />
            <span className="text-xs">AI Alert</span>
          </div>
        )}
      </div>
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'programming': return <BookOpen className="h-4 w-4" />
      case 'data science': return <Brain className="h-4 w-4" />
      case 'web development': return <GraduationCap className="h-4 w-4" />
      case 'ai/ml': return <Target className="h-4 w-4" />
      default: return <BookOpenCheck className="h-4 w-4" />
    }
  }

  const handleContinueLearning = () => {
    router.push(`/courses/${course._id}/modules`)
  }

  const handleViewCourse = () => {
    router.push(`/courses/${course._id}`)
  }

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/courses')
      return
    }
    onEnroll(course._id)
  }

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              <div className="w-32 h-20 rounded-lg overflow-hidden relative">
                {course.thumbnail ? (
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to gradient background if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                
                {/* Fallback gradient background */}
                <div 
                  className={`w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center absolute inset-0 ${course.thumbnail ? 'hidden' : 'flex'}`}
                  style={{ display: course.thumbnail ? 'none' : 'flex' }}
                >
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
                    <Link href={`/courses/${course._id}`}>
                      {course.title}
                    </Link>
                  </h3>
                  <p className="text-gray-700 text-sm line-clamp-2">{course.description}</p>
                </div>
                {showEnrollmentStatus && course.isEnrolled && (
                  <Badge className="bg-green-100 text-green-800">Enrolled</Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                  {course.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  {getCategoryIcon(course.category)}
                  <span>{course.category}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}h</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-900">{course.stats.avgRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-600">({course.stats.totalRatings})</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <Users className="h-4 w-4" />
                    <span>{course.stats.totalEnrolled.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {course.isEnrolled ? (
                    <Button onClick={handleContinueLearning} className="bg-green-600 hover:bg-green-700">
                      <Play className="h-4 w-4 mr-2" />
                      Continue Learning
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleEnrollClick}
                      disabled={!isAuthenticated}
                    >
                      {isAuthenticated ? 'Enroll Now' : 'Login to Enroll'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress bar for enrolled courses */}
              {course.isEnrolled && course.progress !== undefined && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(course.progress * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress * 100}%` }}
                    ></div>
                  </div>
                  <RiskIndicator course={course} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className="relative">
        {/* Course Thumbnail */}
        <div className="w-full h-48 relative overflow-hidden bg-gray-100">
          {course.thumbnail ? (
            <img 
              src={course.thumbnail} 
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback to gradient background if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          
          {/* Fallback gradient background */}
          <div 
            className={`w-full h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center absolute inset-0 ${course.thumbnail ? 'hidden' : 'flex'}`}
            style={{ display: course.thumbnail ? 'none' : 'flex' }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <BookOpen className="h-16 w-16 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          
          {/* Enrollment Status Badge */}
          {showEnrollmentStatus && course.isEnrolled && (
            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-20">
              <CheckCircle2 className="h-3 w-3 inline mr-1" />
              Enrolled
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-20">
            {getCategoryIcon(course.category)}
            {course.category}
          </div>
          
          {/* Progress Bar for Active Courses */}
          {course.isEnrolled && course.progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-95 p-3 z-20">
              <div className="flex items-center justify-between text-xs text-gray-700 mb-1">
                <span>Progress</span>
                <span className="font-semibold">{(course.progress * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${course.progress * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
            {course.difficulty}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-900">{course.stats.avgRating.toFixed(1)}</span>
          </div>
        </div>
        
        <CardTitle className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          <Link href={`/courses/${course._id}`}>
            {course.title}
          </Link>
        </CardTitle>
        
        <CardDescription className="text-sm text-gray-600 line-clamp-3">
          {course.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration}h</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.stats.totalEnrolled.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 text-sm text-gray-700">
            by {course.instructor.name}
          </div>
        </div>
        
        {course.isEnrolled ? (
          <Button 
            onClick={handleContinueLearning}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Continue Learning
          </Button>
        ) : (
          <Button 
            onClick={handleEnrollClick}
            className="w-full"
            disabled={!isAuthenticated}
          >
            {isAuthenticated ? 'Enroll Now' : 'Login to Enroll'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

const CoursesPage = () => {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchCategories()
    fetchCoursesByTab(activeTab)
    
    // Prefetch all course data when authenticated to get correct counts
    if (isAuthenticated) {
      prefetchAllCourseData()
    }
  }, [activeTab, isAuthenticated])

  // Separate effect for authentication changes to refresh counts
  useEffect(() => {
    if (isAuthenticated) {
      prefetchAllCourseData()
    } else {
      // Clear enrolled and available courses when not authenticated
      setEnrolledCourses([])
      setAvailableCourses([])
    }
  }, [isAuthenticated])

  const prefetchAllCourseData = async () => {
    try {
      // Fetch all course types in parallel for accurate counts
      const [allCoursesRes, enrolledRes, availableRes] = await Promise.all([
        coursesAPI.getCourses({ sortBy }),
        coursesAPI.getEnrolledCourses().catch(() => ({ data: { data: [] } })),
        coursesAPI.getAvailableCourses().catch(() => ({ data: { data: [] } }))
      ])
      
      // Update all course states
      setCourses(allCoursesRes.data.data || [])
      setEnrolledCourses(enrolledRes.data.data || [])
      setAvailableCourses(availableRes.data.data || [])
    } catch (err) {
      console.error('Error prefetching course data:', err)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await coursesAPI.getCategories()
      setCategories(response.data.data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const fetchCoursesByTab = async (tab: TabType) => {
    try {
      setIsLoading(true)
      let response
      
      switch (tab) {
        case 'enrolled':
          if (!isAuthenticated) {
            setEnrolledCourses([])
            return
          }
          response = await coursesAPI.getEnrolledCourses()
          setEnrolledCourses(response.data.data || [])
          break
        case 'available':
          if (!isAuthenticated) {
            setAvailableCourses([])
            return
          }
          response = await coursesAPI.getAvailableCourses()
          setAvailableCourses(response.data.data || [])
          break
        case 'all':
        default:
          response = await coursesAPI.getCourses({ sortBy })
          setCourses(response.data.data || [])
          break
      }
      setError('')
    } catch (err: any) {
      setError(`Failed to fetch ${tab} courses`)
      console.error(`Error fetching ${tab} courses:`, err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/courses')
      return
    }

    try {
      await coursesAPI.enrollInCourse(courseId)
      
      // Update local state
      setCourses(prev => prev.map(course => 
        course._id === courseId 
          ? { ...course, isEnrolled: true, status: 'active', progress: 0 }
          : course
      ))
      
      // Refresh all course data to update counts
      await prefetchAllCourseData()
      alert('Successfully enrolled in course!')
    } catch (err: any) {
      console.error('Enrollment failed:', err)
      
      if (err.response?.status === 400) {
        alert('You are already enrolled in this course!')
      } else if (err.response?.status === 401) {
        alert('Please log in to enroll in courses')
      } else {
        alert('Failed to enroll in course. Please try again.')
      }
    }
  }

  const getCurrentCourses = () => {
    switch (activeTab) {
      case 'enrolled':
        return enrolledCourses
      case 'available':
        return availableCourses
      default:
        return courses
    }
  }

  const filterCourses = () => {
    let filtered = [...getCurrentCourses()]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => 
        course.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => 
        course.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
      )
    }

    return filtered
  }

  const filteredCourses = filterCourses()

  const getTabCount = (tab: TabType) => {
    switch (tab) {
      case 'enrolled':
        return enrolledCourses.length
      case 'available':
        return availableCourses.length
      default:
        return courses.length
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            {/* Navigation */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Course Catalog</h1>
                <p className="text-lg text-gray-600">
                  Discover new skills, advance your career, and achieve your learning goals.
                </p>
              </div>
              {isAuthenticated && (
                <div className="flex items-center gap-4">
                  <Link
                    href="/achievements"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Trophy className="h-4 w-4" />
                    Achievements
                  </Link>
                  <Link
                    href="/analytics"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Brain className="h-4 w-4" />
                    ML Analytics
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Dashboard
                  </Link>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 rounded-lg p-1 flex space-x-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Courses
                  <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {getTabCount('all')}
                  </span>
                </button>
                {isAuthenticated && (
                  <>
                    <button
                      onClick={() => setActiveTab('enrolled')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'enrolled'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      My Courses
                      <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {getTabCount('enrolled')}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('available')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'available'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Available
                      <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {getTabCount('available')}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                {/* Difficulty Filter */}
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === 'enrolled' ? 'My Enrolled Courses' : 
               activeTab === 'available' ? 'Available Courses' : 'All Courses'}
            </h2>
            <p className="text-gray-600">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Auth Required Message for Enrolled/Available tabs */}
            {!isAuthenticated && (activeTab === 'enrolled' || activeTab === 'available') ? (
              <div className="text-center py-12">
                <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h3>
                <p className="text-gray-600 mb-4">
                  Please log in to view your {activeTab} courses.
                </p>
                <button
                  onClick={() => router.push('/login?redirect=/courses')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Log In
                </button>
              </div>
            ) : (
              <>
                {/* Courses Grid/List */}
                {filteredCourses.length > 0 ? (
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "space-y-4"
                  }>
                    {filteredCourses.map((course) => (
                      <CourseCard 
                        key={course._id} 
                        course={course} 
                        onEnroll={handleEnroll}
                        viewMode={viewMode}
                        isAuthenticated={isAuthenticated}
                        showEnrollmentStatus={activeTab === 'enrolled'}
                        user={user}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
                    <p className="text-gray-600">
                      {activeTab === 'enrolled' 
                        ? "You haven't enrolled in any courses yet." 
                        : activeTab === 'available'
                        ? "No available courses to enroll in."
                        : "Try adjusting your search criteria or browse all courses."}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CoursesPage
