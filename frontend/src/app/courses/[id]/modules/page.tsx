'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { coursesAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, PlayCircle, CheckCircle2, Clock, BookOpen, Award } from 'lucide-react'

interface Module {
  _id: string
  title: string
  description: string
  duration: number
  order: number
  content: string
  isCompleted: boolean
}

interface CourseModulesData {
  course: {
    _id: string
    title: string
    description: string
    instructor: {
      name: string
    }
  }
  modules: Module[]
  progress: number
  status: string
  completedModules: string[]
}

export default function CourseModulesPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [courseData, setCourseData] = useState<CourseModulesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)

  const courseId = params.id as string

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${courseId}/modules`)
      return
    }

    fetchCourseModules()
  }, [courseId, isAuthenticated])

  const fetchCourseModules = async () => {
    try {
      setLoading(true)
      const response = await coursesAPI.getCourseModules(courseId)
      setCourseData(response.data.data)
      
      // Select first incomplete module or first module
      const modules = response.data.data.modules
      const firstIncomplete = modules.find((m: Module) => !m.isCompleted)
      setSelectedModule(firstIncomplete || modules[0])
    } catch (err: any) {
      console.error('Error fetching course modules:', err)
      if (err.response?.status === 403) {
        setError('You must be enrolled to access course modules')
      } else if (err.response?.status === 404) {
        setError('Course not found')
      } else {
        setError('Failed to load course modules')
      }
    } finally {
      setLoading(false)
    }
  }

  const markModuleComplete = async (moduleId: string) => {
    try {
      // Update progress (this would typically be a separate API call)
      await coursesAPI.updateProgress(courseId, {
        moduleId,
        completed: true
      })
      
      // Update local state
      setCourseData(prev => {
        if (!prev) return prev
        
        const updatedModules = prev.modules.map(module =>
          module._id === moduleId ? { ...module, isCompleted: true } : module
        )
        
        const completedCount = updatedModules.filter(m => m.isCompleted).length
        const newProgress = (completedCount / updatedModules.length) * 100
        
        return {
          ...prev,
          modules: updatedModules,
          progress: newProgress,
          completedModules: [...prev.completedModules, moduleId]
        }
      })
    } catch (err) {
      console.error('Error marking module complete:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course modules...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/courses')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!courseData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/courses')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{courseData.course.title}</h1>
                  <p className="text-gray-600">by {courseData.course.instructor.name}</p>
                </div>
              </div>
              
              {/* Progress */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Progress</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {Math.round(courseData.progress)}%
                  </div>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${courseData.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Modules Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Modules
              </h2>
              
              <div className="space-y-3">
                {courseData.modules.map((module, index) => (
                  <div
                    key={module._id}
                    onClick={() => setSelectedModule(module)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedModule?._id === module._id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {module.isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <PlayCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {index + 1}. {module.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{module.duration} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Module Content */}
          <div className="lg:col-span-2">
            {selectedModule ? (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedModule.title}
                      </h1>
                      <p className="text-gray-600">{selectedModule.description}</p>
                    </div>
                    {selectedModule.isCompleted && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="prose max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: selectedModule.content || '<p>Module content will be available here.</p>' 
                      }} 
                    />
                  </div>
                  
                  {!selectedModule.isCompleted && (
                    <div className="mt-8 pt-6 border-t">
                      <button
                        onClick={() => markModuleComplete(selectedModule._id)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Mark as Complete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Module
                </h3>
                <p className="text-gray-600">
                  Choose a module from the sidebar to start learning
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
