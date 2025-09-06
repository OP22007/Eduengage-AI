'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { coursesAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Search,
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  Award,
  Play,
  CheckCircle2,
  Sparkles,
  BookOpenCheck,
  GraduationCap,
  Target,
  Brain
} from 'lucide-react'

interface Course {
  _id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  duration: number
  instructor: {
    name: string
    avatar?: string
  }
  stats: {
    totalEnrolled: number
    avgRating: number
    totalRatings: number
    completionRate: number
  }
  featured?: boolean
  isEnrolled?: boolean
  progress?: number
  status?: 'not_enrolled' | 'active' | 'completed'
  thumbnail?: string
  createdAt?: string
}

const CoursesPage = () => {
  const { user, isAuthenticated } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchCourses()
    fetchCategories()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, selectedCategory, selectedDifficulty, sortBy])

  const fetchCourses = async () => {
    try {
      setIsLoading(true)
      const response = await coursesAPI.getCourses({ sortBy })
      setCourses(response.data.data || [])
      setError('')
    } catch (err: any) {
      setError('Failed to fetch courses')
      console.error('Error fetching courses:', err)
    } finally {
      setIsLoading(false)
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

  const filterCourses = () => {
    let filtered = [...courses]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty === selectedDifficulty)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.stats.avgRating - a.stats.avgRating
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        case 'popular':
        default:
          return b.stats.totalEnrolled - a.stats.totalEnrolled
      }
    })

    setFilteredCourses(filtered)
  }

  const handleEnroll = async (courseId: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert('Please log in to enroll in courses')
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
      alert('Successfully enrolled in course!')
    } catch (err: any) {
      console.error('Enrollment failed:', err)
      
      // Show user-friendly error message
      if (err.response?.status === 400) {
        alert('You are already enrolled in this course!')
      } else if (err.response?.status === 401) {
        alert('Please log in to enroll in courses')
      } else {
        alert('Failed to enroll in course. Please try again.')
      }
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

  const featuredCourses = courses.filter(course => course.featured)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Discover Your Next Learning Journey
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our comprehensive collection of courses designed to help you master new skills 
              and advance your career with AI-powered personalized learning.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search courses, skills, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>

              {/* Filter Toggle */}
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="h-12 px-6"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>

              {/* View Mode */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className="rounded-none h-12"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="rounded-none h-12"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="popular">Most Popular</option>
                      <option value="rating">Highest Rated</option>
                      <option value="newest">Newest</option>
                      <option value="alphabetical">A-Z</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Featured Courses Section */}
        {featuredCourses.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Courses</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.slice(0, 3).map((course) => (
                <CourseCard key={course._id} course={course} onEnroll={handleEnroll} featured isAuthenticated={isAuthenticated} />
              ))}
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredCourses.length === courses.length ? 'All Courses' : 'Search Results'}
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
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or browse all courses.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Course Card Component
interface CourseCardProps {
  course: Course
  onEnroll: (courseId: string) => void
  featured?: boolean
  viewMode?: 'grid' | 'list'
  isAuthenticated?: boolean
}

const CourseCard = ({ course, onEnroll, featured = false, viewMode = 'grid', isAuthenticated = false }: CourseCardProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
                    <Link href={`/courses/${course._id}`}>
                      {course.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{course.description}</p>
                </div>
                {featured && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                  {course.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  {getCategoryIcon(course.category)}
                  <span>{course.category}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}h</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{course.stats.avgRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">({course.stats.totalRatings})</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{course.stats.totalEnrolled.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {course.isEnrolled ? (
                    <Link href={`/courses/${course._id}`}>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Continue
                      </Button>
                    </Link>
                  ) : (
                    <Button onClick={() => onEnroll(course._id)}>
                      Enroll Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden ${
      featured ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
    }`}>
      <div className="relative">
        {/* Course Thumbnail */}
        <div className="w-full h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <BookOpen className="h-16 w-16 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
          
          {/* Featured Badge */}
          {featured && (
            <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="h-3 w-3 inline mr-1" />
              Featured
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            {getCategoryIcon(course.category)}
            {course.category}
          </div>
          
          {/* Status Badge */}
          {course.status === 'completed' && (
            <div className="absolute bottom-4 right-4 bg-green-500 text-white p-2 rounded-full">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
          
          {/* Progress Bar for Active Courses */}
          {course.status === 'active' && course.progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-95 p-3">
              <div className="flex items-center justify-between text-xs text-gray-700 mb-1">
                <span>Progress</span>
                <span className="font-semibold">{course.progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${course.progress}%` }}
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
            <span className="text-sm font-medium">{course.stats.avgRating.toFixed(1)}</span>
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
          <div className="flex items-center gap-4 text-sm text-gray-600">
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
          <div className="flex-1 text-sm text-gray-600">
            by {course.instructor.name}
          </div>
        </div>
        
        {course.isEnrolled ? (
          <Link href={`/courses/${course._id}`} className="w-full">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              {course.status === 'completed' ? 'Review Course' : 'Continue Learning'}
            </Button>
          </Link>
        ) : (
          <Button 
            onClick={() => onEnroll(course._id)}
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

export default CoursesPage
