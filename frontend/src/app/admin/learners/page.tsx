'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { adminAPI } from '@/lib/api'
import { 
  Search,
  Filter,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Brain,
  MessageSquare,
  MoreVertical,
  Eye,
  Send,
  Download,
  RefreshCw,
  Target,
  Award,
  Calendar,
  Activity,
  UserCheck,
  AlertCircle,
  Star,
  Zap
} from 'lucide-react'
import { formatPercentage, cn } from '@/lib/utils'
import Link from 'next/link'
import LearnerDetailModal from '@/components/LearnerDetailModal'

interface Learner {
  _id: string
  userId: {
    _id: string
    profile: {
      name: string
      joinDate: string
    }
    email: string
  }
  enrollments: Array<{
    courseId: {
      _id: string
      title: string
      difficulty: string
      category: string
    }
    progress: number
    status: string
    riskScore: number
    lastActivity: string
  }>
  engagement: {
    totalHours: number
    streakDays: number
    lastLogin: string
    avgSessionTime: number
    completionRate: number
  }
  actualLastActivity?: string  // New field from backend
}

interface LearnersData {
  learners: Learner[]
  pagination: {
    current: number
    pages: number
    total: number
  }
}

export default function AdminLearnersPage() {
  const [learnersData, setLearnersData] = useState<LearnersData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showInterventionModal, setShowInterventionModal] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    riskLevel: 'all',
    status: 'all',
    sortBy: 'riskScore',
    sortOrder: 'desc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchLearners()
  }, [filters.riskLevel, filters.status, filters.sortBy, filters.sortOrder, currentPage])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search !== '') {
        fetchLearners()
      }
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [filters.search])

  // Fetch immediately when search is cleared
  useEffect(() => {
    if (filters.search === '') {
      fetchLearners()
    }
  }, [filters.search])

  const fetchLearners = async () => {
    try {
      setIsLoading(true)
      
      // Filter out "all" values and empty strings before sending to API
      const apiFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== 'all' && value !== '' && value.trim() !== '') {
          acc[key] = value.trim()
        }
        return acc
      }, {} as Record<string, string>)

      console.log('Sending API filters:', apiFilters) // Debug log
      
      const response = await adminAPI.getLearners({
        page: currentPage,
        limit: 20,
        ...apiFilters
      })
      
      console.log('API response:', response.data) // Debug log
      setLearnersData(response.data.data)
    } catch (error) {
      console.error('Error fetching learners:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setFilters({
      search: '',
      riskLevel: 'all',
      status: 'all',
      sortBy: 'riskScore',
      sortOrder: 'desc'
    })
    setCurrentPage(1)
    setActiveTab('all')
  }

  const handleSendIntervention = async (learner: Learner, type: string, message: string) => {
    try {
      await adminAPI.createIntervention({
        learnerId: learner._id,
        type,
        trigger: 'manual_admin',
        content: {
          subject: 'Message from Instructor',
          message
        },
        scheduling: {
          immediate: true,
          scheduledFor: new Date()
        }
      })
      alert('Intervention sent successfully!')
      setShowInterventionModal(false)
    } catch (error) {
      console.error('Error sending intervention:', error)
      alert('Failed to send intervention')
    }
  }

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 0.7) return 'destructive'
    if (riskScore >= 0.4) return 'secondary'
    return 'default'
  }

  const getRiskIcon = (riskScore: number) => {
    if (riskScore >= 0.7) return <AlertTriangle className="h-4 w-4" />
    if (riskScore >= 0.4) return <Clock className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'active': return 'secondary'
      case 'at-risk': return 'destructive'
      default: return 'outline'
    }
  }

  const filterLearnersByTab = (learners: Learner[]) => {
    if (!learners) return []
    
    switch (activeTab) {
      case 'high-risk':
        return learners.filter(learner => {
          const avgRisk = learner.enrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / learner.enrollments.length
          return avgRisk >= 0.7
        })
      case 'medium-risk':
        return learners.filter(learner => {
          const avgRisk = learner.enrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / learner.enrollments.length
          return avgRisk >= 0.4 && avgRisk < 0.7
        })
      case 'low-risk':
        return learners.filter(learner => {
          const avgRisk = learner.enrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / learner.enrollments.length
          return avgRisk < 0.4
        })
      case 'active':
        return learners.filter(learner => 
          learner.enrollments.some(e => e.status === 'active')
        )
      default:
        return learners
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  const filteredLearners = filterLearnersByTab(learnersData?.learners || [])

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            Learner Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Monitor, analyze, and support your learners with AI-powered insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={fetchLearners} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2 hover:bg-blue-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Total Learners</p>
                <p className="text-3xl font-bold text-blue-900">
                  {learnersData?.pagination.total || 0}
                </p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  Active users
                </p>
              </div>
              <div className="p-4 bg-blue-200 rounded-xl">
                <Users className="h-8 w-8 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">High Risk</p>
                <p className="text-3xl font-bold text-red-900">
                  {filteredLearners.filter(l => {
                    const avgRisk = l.enrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / l.enrollments.length
                    return avgRisk >= 0.7
                  }).length}
                </p>
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Need attention
                </p>
              </div>
              <div className="p-4 bg-red-200 rounded-xl">
                <AlertTriangle className="h-8 w-8 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Active Today</p>
                <p className="text-3xl font-bold text-green-900">
                  {filteredLearners.filter(l => {
                    const lastActivity = l.actualLastActivity 
                      ? new Date(l.actualLastActivity)
                      : l.engagement?.lastLogin 
                        ? new Date(l.engagement.lastLogin)
                        : null
                    
                    if (!lastActivity) return false
                    
                    const today = new Date()
                    return lastActivity.toDateString() === today.toDateString()
                  }).length}
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <Activity className="h-3 w-3" />
                  Learning now
                </p>
              </div>
              <div className="p-4 bg-green-200 rounded-xl">
                <Activity className="h-8 w-8 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Avg Completion</p>
                <p className="text-3xl font-bold text-purple-900">
                  {Math.round(
                    filteredLearners.reduce((sum, l) => sum + (l.engagement?.completionRate || 0), 0) / 
                    (filteredLearners.length || 1) * 100
                  )}%
                </p>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                  <Target className="h-3 w-3" />
                  Course progress
                </p>
              </div>
              <div className="p-4 bg-purple-200 rounded-xl">
                <Target className="h-8 w-8 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search learners by name or email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-11 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={filters.riskLevel} onValueChange={(value) => handleFilterChange('riskLevel', value)}>
                <SelectTrigger className="w-40 h-12 border-gray-300 font-bold text-gray-900 bg-white">
                  <Filter className="h-4 w-4 mr-2 text-gray-700" />
                  <SelectValue placeholder="Risk Level" className="font-bold text-gray-900" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-medium text-gray-900">All Levels</SelectItem>
                  <SelectItem value="high" className="font-medium text-gray-900">High Risk</SelectItem>
                  <SelectItem value="medium" className="font-medium text-gray-900">Medium Risk</SelectItem>
                  <SelectItem value="low" className="font-medium text-gray-900">Low Risk</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-40 h-12 border-gray-300 font-bold text-gray-900 bg-white">
                  <SelectValue placeholder="Status" className="font-bold text-gray-900" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-medium text-gray-900">All Status</SelectItem>
                  <SelectItem value="active" className="font-medium text-gray-900">Active</SelectItem>
                  <SelectItem value="completed" className="font-medium text-gray-900">Completed</SelectItem>
                  <SelectItem value="at-risk" className="font-medium text-gray-900">At Risk</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger className="w-40 h-12 border-gray-300 font-bold text-gray-900 bg-white">
                  <SelectValue placeholder="Sort By" className="font-bold text-gray-900" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="riskScore" className="font-medium text-gray-900">Risk Score</SelectItem>
                  <SelectItem value="lastActivity" className="font-medium text-gray-900">Last Activity</SelectItem>
                  <SelectItem value="progress" className="font-medium text-gray-900">Progress</SelectItem>
                  <SelectItem value="completionRate" className="font-medium text-gray-900">Completion Rate</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="h-12 px-4 border-gray-300 hover:bg-gray-50"
                title="Clear all filters"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learners Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 rounded-md">
            <TabsTrigger value="all" className="flex items-center gap-2 font-bold text-gray-800 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700">
              <Users className="h-4 w-4" />
              All Learners
            </TabsTrigger>
            <TabsTrigger value="high-risk" className="flex items-center gap-2 font-bold text-gray-800 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-700">
              <AlertTriangle className="h-4 w-4" />
              High Risk
            </TabsTrigger>
            <TabsTrigger value="medium-risk" className="flex items-center gap-2 font-bold text-gray-800 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-yellow-700">
              <Clock className="h-4 w-4" />
              Medium Risk
            </TabsTrigger>
            <TabsTrigger value="low-risk" className="flex items-center gap-2 font-bold text-gray-800 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-700">
              <CheckCircle className="h-4 w-4" />
              Low Risk
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2 font-bold text-gray-800 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700">
              <Activity className="h-4 w-4" />
              Active Today
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Learners Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLearners.map((learner) => {
              const avgRiskScore = learner.enrollments.length > 0 ? 
                learner.enrollments.reduce((sum, e) => sum + (e.riskScore || 0), 0) / learner.enrollments.length : 0
              const activeCourses = learner.enrollments.filter(e => e.status === 'active').length
              const completedCourses = learner.enrollments.filter(e => e.status === 'completed').length
              
              return (
                <Card key={learner._id} className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {learner.userId?.profile?.name?.charAt(0) || 'L'}
                            </span>
                          </div>
                          {learner.userId?.profile?.name || 'Unknown Learner'}
                          {avgRiskScore >= 0.7 && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              High Risk
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {learner.userId?.email}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLearner(learner)
                            setShowInterventionModal(true)
                          }}
                          className="p-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          title="Send Message"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="p-2 hover:bg-green-50 hover:border-green-300 transition-colors"
                          onClick={() => {
                            setSelectedLearner(learner)
                            setShowDetailModal(true)
                          }}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Risk Score */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getRiskIcon(avgRiskScore)}
                        <span className="text-sm font-bold text-gray-900">Risk Score</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              avgRiskScore >= 0.7 ? 'bg-red-500' :
                              avgRiskScore >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                            )}
                            style={{ width: `${avgRiskScore * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {formatPercentage(avgRiskScore)}
                        </span>
                      </div>
                    </div>

                    {/* Learning Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-lg font-bold text-blue-600">{activeCourses}</p>
                        <p className="text-xs text-blue-800">Active Courses</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <p className="text-lg font-bold text-green-600">{completedCourses}</p>
                        <p className="text-xs text-green-800">Completed</p>
                      </div>
                    </div>

                    {/* Engagement Metrics */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-800">Learning Streak</span>
                        <span className="text-sm font-bold flex items-center gap-1 text-gray-900">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {learner.engagement?.streakDays || 0} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-800">Total Hours</span>
                        <span className="text-sm font-bold text-gray-900">
                          {Math.round(learner.engagement?.totalHours || 0)}h
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-800">Completion Rate</span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatPercentage(learner.engagement?.completionRate || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Last Activity */}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">Last Activity</span>
                        <span className="text-xs font-semibold text-gray-900">
                          {learner.actualLastActivity 
                            ? new Date(learner.actualLastActivity).toLocaleDateString()
                            : learner.engagement?.lastLogin 
                              ? new Date(learner.engagement.lastLogin).toLocaleDateString()
                              : 'Never'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Current Courses */}
                    {learner.enrollments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-900">Current Courses</p>
                        <div className="space-y-1">
                          {learner.enrollments.slice(0, 2).map((enrollment, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="truncate flex-1 font-medium text-gray-800">
                                {enrollment.courseId?.title || 'Unknown Course'}
                              </span>
                              <div className="flex items-center gap-1 ml-2">
                                <Badge 
                                  variant={getStatusBadgeColor(enrollment.status)}
                                  className="text-xs px-1 py-0 font-medium"
                                >
                                  {enrollment.status}
                                </Badge>
                                <span className="font-bold text-gray-900">
                                  {formatPercentage(enrollment.progress)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Insights Button */}
                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200"
                      onClick={() => {
                        setSelectedLearner(learner)
                        setShowDetailModal(true)
                      }}
                    >
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="text-purple-700">View Details & AI Insights</span>
                      <Zap className="h-4 w-4 text-purple-600" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {learnersData?.pagination && learnersData.pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: learnersData.pagination.pages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                disabled={currentPage === learnersData.pagination.pages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          )}

          {/* Empty State */}
          {filteredLearners.length === 0 && !isLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No learners found</h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'all' 
                    ? 'No learners match your current filters.'
                    : `No learners in the ${activeTab.replace('-', ' ')} category.`
                  }
                </p>
                <Button onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Learner Detail Modal */}
      <LearnerDetailModal
        learner={selectedLearner}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedLearner(null)
        }}
        onSendIntervention={handleSendIntervention}
      />

      {/* Intervention Modal */}
      {showInterventionModal && selectedLearner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Send Intervention</CardTitle>
              <CardDescription>
                Send a personalized message to {selectedLearner.userId?.profile?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Message Type</label>
                <Select defaultValue="personalized_nudge">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personalized_nudge">Personalized Nudge</SelectItem>
                    <SelectItem value="motivational_message">Motivational Message</SelectItem>
                    <SelectItem value="study_reminder">Study Reminder</SelectItem>
                    <SelectItem value="resource_recommendation">Resource Recommendation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  rows={4}
                  placeholder="Enter your message here..."
                  defaultValue="Hi! I noticed you might need some support with your current courses. Would you like to schedule a quick check-in to discuss your learning goals?"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const message = (document.querySelector('textarea') as HTMLTextAreaElement)?.value || ''
                    handleSendIntervention(selectedLearner, 'personalized_nudge', message)
                  }}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowInterventionModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
