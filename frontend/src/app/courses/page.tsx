'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { learnerAPI } from '@/lib/api'
import Link from 'next/link'
import { 
  BookOpen, 
  Play, 
  Clock, 
  Users, 
  Star, 
  CheckCircle, 
  Lock,
  TrendingUp,
  BarChart3,
  Target,
  ArrowRight
} from 'lucide-react'

interface Course {
  _id: string
  title: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  category: string
  duration: number
  modules: Array<{
    _id: string
    title: string
    description: string
    duration: number
    order: number
    isCompleted?: boolean
    isUnlocked?: boolean
  }>
  thumbnail?: string
  instructor: string
  rating: number
  enrolledCount: number
  progress?: number
  status?: 'not_enrolled' | 'active' | 'completed'
  riskScore?: number
}

interface Enrollment {
  courseId: Course
  progress: number
  status: string
  riskScore: number
  lastActivity: string
  completedModules: string[]
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all')

  useEffect(() => {
    fetchCoursesAndEnrollments()
  }, [])

  const fetchCoursesAndEnrollments = async () => {
    try {
      setIsLoading(true)
      
      // Get learner dashboard data which includes enrollments
      const dashboardResponse = await learnerAPI.getDashboard()
      const enrollmentsData = dashboardResponse.data.data.enrollments || []
      setEnrollments(enrollmentsData)

      // Create mock courses data (in real app, this would come from API)
      const mockCourses: Course[] = [
        {
          _id: '1',
          title: 'Complete Web Development Bootcamp',
          description: 'Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build real projects and deploy them.',
          difficulty: 'Beginner',
          category: 'Web Development',
          duration: 120,
          instructor: 'Dr. Angela Yu',
          rating: 4.7,
          enrolledCount: 2543,
          thumbnail: '/webdev-course.jpg',
          modules: [
            { _id: 'm1', title: 'HTML Fundamentals', description: 'Learn the basics of HTML', duration: 180, order: 1 },
            { _id: 'm2', title: 'CSS Styling', description: 'Master CSS for beautiful designs', duration: 240, order: 2 },
            { _id: 'm3', title: 'JavaScript Basics', description: 'Programming fundamentals with JavaScript', duration: 300, order: 3 },
            { _id: 'm4', title: 'React Framework', description: 'Build dynamic UIs with React', duration: 360, order: 4 },
            { _id: 'm5', title: 'Backend with Node.js', description: 'Server-side development', duration: 420, order: 5 },
            { _id: 'm6', title: 'Database with MongoDB', description: 'Store and manage data', duration: 240, order: 6 },
            { _id: 'm7', title: 'Deployment & DevOps', description: 'Deploy your applications', duration: 180, order: 7 }
          ]
        },
        {
          _id: '2',
          title: 'Data Science with Python',
          description: 'Master data analysis, visualization, and machine learning with Python, pandas, and scikit-learn.',
          difficulty: 'Intermediate',
          category: 'Data Science',
          duration: 150,
          instructor: 'Prof. John Hopkins',
          rating: 4.8,
          enrolledCount: 1876,
          thumbnail: '/datascience-course.jpg',
          modules: [
            { _id: 'ds1', title: 'Python for Data Science', description: 'Python basics and libraries', duration: 240, order: 1 },
            { _id: 'ds2', title: 'Data Analysis with Pandas', description: 'Manipulate and analyze data', duration: 300, order: 2 },
            { _id: 'ds3', title: 'Data Visualization', description: 'Create charts and graphs', duration: 180, order: 3 },
            { _id: 'ds4', title: 'Statistical Analysis', description: 'Statistical methods and testing', duration: 360, order: 4 },
            { _id: 'ds5', title: 'Machine Learning Basics', description: 'Introduction to ML algorithms', duration: 420, order: 5 },
            { _id: 'ds6', title: 'Advanced ML Techniques', description: 'Deep learning and neural networks', duration: 480, order: 6 }
          ]
        },
        {
          _id: '3',
          title: 'UX/UI Design Masterclass',
          description: 'Design beautiful, user-friendly interfaces. Learn Figma, design principles, and user research.',
          difficulty: 'Intermediate',
          category: 'Design',
          duration: 90,
          instructor: 'Sarah Design',
          rating: 4.6,
          enrolledCount: 987,
          thumbnail: '/uiux-course.jpg',
          modules: [
            { _id: 'ux1', title: 'Design Thinking', description: 'User-centered design approach', duration: 120, order: 1 },
            { _id: 'ux2', title: 'User Research', description: 'Understanding user needs', duration: 180, order: 2 },
            { _id: 'ux3', title: 'Wireframing & Prototyping', description: 'Create design mockups', duration: 240, order: 3 },
            { _id: 'ux4', title: 'Visual Design', description: 'Colors, typography, and layouts', duration: 300, order: 4 },
            { _id: 'ux5', title: 'Figma Mastery', description: 'Professional design tools', duration: 200, order: 5 }
          ]
        },
        {
          _id: '4',
          title: 'Artificial Intelligence & Machine Learning',
          description: 'Deep dive into AI concepts, neural networks, and building intelligent systems.',
          difficulty: 'Advanced',
          category: 'AI/ML',
          duration: 200,
          instructor: 'Dr. Andrew Ng',
          rating: 4.9,
          enrolledCount: 3421,
          thumbnail: '/ai-course.jpg',
          modules: [
            { _id: 'ai1', title: 'Introduction to AI', description: 'AI fundamentals and history', duration: 150, order: 1 },
            { _id: 'ai2', title: 'Machine Learning Algorithms', description: 'Core ML algorithms', duration: 360, order: 2 },
            { _id: 'ai3', title: 'Neural Networks', description: 'Deep learning foundations', duration: 420, order: 3 },
            { _id: 'ai4', title: 'Computer Vision', description: 'Image processing and recognition', duration: 480, order: 4 },
            { _id: 'ai5', title: 'Natural Language Processing', description: 'Text analysis and generation', duration: 540, order: 5 },
            { _id: 'ai6', title: 'AI Ethics & Future', description: 'Responsible AI development', duration: 240, order: 6 }
          ]
        }
      ]

      // Map enrollments to courses and add progress data
      const coursesWithProgress = mockCourses.map(course => {
        const enrollment = enrollmentsData.find(e => e.courseId?._id === course._id || e.courseId?.title === course.title)
        
        if (enrollment) {
          return {
            ...course,
            progress: enrollment.progress * 100,
            status: enrollment.status,
            riskScore: enrollment.riskScore,
            modules: course.modules.map((module, index) => ({
              ...module,
              isCompleted: (enrollment.progress * 100) > (index * (100 / course.modules.length)),
              isUnlocked: (enrollment.progress * 100) >= (index * (100 / course.modules.length))
            }))
          }
        }
        
        return {
          ...course,
          status: 'not_enrolled',
          progress: 0,
          modules: course.modules.map((module, index) => ({
            ...module,
            isCompleted: false,
            isUnlocked: index === 0
          }))
        }
      })

      setCourses(coursesWithProgress)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch courses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnrollCourse = async (courseId: string) => {
    try {
      // In real app, this would call an enrollment API
      // For now, we'll simulate enrollment
      setCourses(prev => prev.map(course => 
        course._id === courseId 
          ? { ...course, status: 'active', progress: 0 }
          : course
      ))
    } catch (err: any) {
      setError('Failed to enroll in course')
    }
  }

  const filteredCourses = courses.filter(course => {
    if (filter === 'enrolled') return course.status !== 'not_enrolled'
    if (filter === 'available') return course.status === 'not_enrolled'
    return true
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (riskScore?: number) => {
    if (!riskScore) return ''
    if (riskScore >= 0.7) return 'border-l-4 border-l-red-500 bg-red-50'
    if (riskScore >= 0.4) return 'border-l-4 border-l-yellow-500 bg-yellow-50'
    return 'border-l-4 border-l-green-500 bg-green-50'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-2">
            Discover and enroll in courses to advance your skills
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Courses
          </Button>
          <Button
            variant={filter === 'enrolled' ? 'default' : 'outline'}
            onClick={() => setFilter('enrolled')}
          >
            My Courses
          </Button>
          <Button
            variant={filter === 'available' ? 'default' : 'outline'}
            onClick={() => setFilter('available')}
          >
            Available
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card 
            key={course._id} 
            className={`hover:shadow-xl transition-all duration-300 ${getRiskColor(course.riskScore)}`}
          >
            <div className="relative">
              <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-white" />
              </div>
              {course.riskScore && course.riskScore >= 0.6 && (
                <div className="absolute top-2 right-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  At Risk: {(course.riskScore * 100).toFixed(0)}%
                </div>
              )}
            </div>
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">
                    {course.title}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getDifficultyColor(course.difficulty)}>
                      {course.difficulty}
                    </Badge>
                    <span className="text-sm text-gray-500">{course.category}</span>
                  </div>
                </div>
              </div>
              
              <CardDescription className="text-sm text-gray-600 line-clamp-3 mb-3">
                {course.description}
              </CardDescription>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}h</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{course.enrolledCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{course.rating}</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Progress for enrolled courses */}
              {course.status !== 'not_enrolled' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">{course.progress?.toFixed(0)}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                  
                  {/* Risk indicator */}
                  {course.riskScore && (
                    <div className="mt-2 flex items-center space-x-2">
                      <TrendingUp className={`h-4 w-4 ${
                        course.riskScore >= 0.7 ? 'text-red-500' : 
                        course.riskScore >= 0.4 ? 'text-yellow-500' : 'text-green-500'
                      }`} />
                      <span className="text-xs text-gray-600">
                        Risk Level: {course.riskScore >= 0.7 ? 'High' : course.riskScore >= 0.4 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                {course.status === 'not_enrolled' ? (
                  <Button 
                    onClick={() => handleEnrollCourse(course._id)}
                    className="flex-1"
                  >
                    Enroll Now
                  </Button>
                ) : (
                  <Link href={`/courses/${course._id}`} className="flex-1">
                    <Button className="w-full">
                      {course.status === 'completed' ? 'Review' : 'Continue'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="icon">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">
            {filter === 'enrolled' 
              ? "You haven't enrolled in any courses yet."
              : filter === 'available'
              ? "All available courses are already in your learning path."
              : "No courses available at the moment."
            }
          </p>
        </div>
      )}
    </div>
  )
}
