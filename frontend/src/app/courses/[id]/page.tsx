'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { coursesAPI } from '@/lib/api'
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Play,
  CheckCircle2,
  ArrowLeft,
  Award,
  Target,
  TrendingUp,
  Calendar,
  User
} from 'lucide-react'

interface Course {
  _id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  duration: number
  thumbnail?: string
  modules: Array<{
    moduleId: string
    title: string
    description?: string
    duration: number
    order: number
    isCompleted?: boolean
  }>
  instructor: {
    name: string
    email?: string
    bio?: string
    avatar?: string
  }
  stats: {
    totalEnrolled: number
    avgRating: number
    totalRatings: number
    completionRate: number
  }
  isEnrolled?: boolean
  progress?: number
  status?: 'not_enrolled' | 'active' | 'completed'
  enrollmentDate?: string
  lastActivity?: string
  completedModules?: string[]
}

interface CourseDetailPageProps {
  params: {
    id: string
  }
}

const CourseDetailPage = ({ params }: CourseDetailPageProps) => {
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Course['modules']>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchCourse()
  }, [params.id])

  const fetchCourse = async () => {
    try {
      setIsLoading(true)
      const response = await coursesAPI.getCourse(params.id)
      setCourse(response.data.data)
      
      // Use the modules from the course data
      setModules(response.data.data.modules || [])
      
      setError('')
    } catch (err: any) {
      setError('Failed to fetch course details')
      console.error('Error fetching course:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!course) return
    
    try {
      setEnrolling(true)
      await coursesAPI.enrollInCourse(course._id)
      
      // Refresh course data
      await fetchCourse()
    } catch (err: any) {
      console.error('Enrollment failed:', err)
      setError('Failed to enroll in course')
    } finally {
      setEnrolling(false)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Course</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const completedModulesCount = modules.filter(m => m.isCompleted).length
  const progressPercentage = modules.length > 0 ? (completedModulesCount / modules.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                      {course.difficulty}
                    </Badge>
                    <span className="text-sm text-gray-600">{course.category}</span>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {course.title}
                  </h1>
                  
                  <p className="text-lg text-gray-600 mb-6">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration} hours</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.stats.totalEnrolled.toLocaleString()} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{course.stats.avgRating.toFixed(1)} ({course.stats.totalRatings} reviews)</span>
                    </div>
                  </div>
                  
                  {/* Instructor */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{course.instructor.name}</div>
                      {course.instructor.bio && (
                        <div className="text-sm text-gray-600">{course.instructor.bio}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enrollment Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>
                    {course.isEnrolled ? 'Your Progress' : 'Start Learning'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.isEnrolled ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="w-full" />
                        <div className="text-xs text-gray-600">
                          {completedModulesCount} of {modules.length} modules completed
                        </div>
                      </div>
                      
                      <Button className="w-full" size="lg">
                        <Play className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Button>
                      
                      {course.status === 'completed' && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Course Completed!
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-center py-4">
                        <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                        <p className="text-gray-600 mb-4">
                          Join {course.stats.totalEnrolled.toLocaleString()} students learning this course
                        </p>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >
                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                      </Button>
                      
                      <div className="text-xs text-gray-500 text-center">
                        Free enrollment • Lifetime access
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Modules */}
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>
                  {modules.length} modules • {course.duration} hours total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {modules.map((module, index) => (
                    <div 
                      key={module.moduleId} 
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {course.isEnrolled && module.isCompleted ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {index + 1}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{module.title}</h4>
                        {module.description && (
                          <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{module.duration}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Completion Rate</span>
                  </div>
                  <span className="font-medium">{(course.stats.completionRate * 100).toFixed(0)}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Average Rating</span>
                  </div>
                  <span className="font-medium">{course.stats.avgRating.toFixed(1)}/5</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Total Students</span>
                  </div>
                  <span className="font-medium">{course.stats.totalEnrolled.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* What you'll learn */}
            <Card>
              <CardHeader>
                <CardTitle>What You'll Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {modules.slice(0, 5).map((module) => (
                    <li key={module.moduleId} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{module.title}</span>
                    </li>
                  ))}
                  {modules.length > 5 && (
                    <li className="text-gray-500">
                      And {modules.length - 5} more modules...
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetailPage