'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Plus, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Target,
  TrendingUp,
  Users,
  Activity,
  Zap
} from 'lucide-react'
import { api } from '@/lib/api'

interface Intervention {
  _id: string
  learnerId?: {
    _id: string
    userId?: {
      profile?: {
        name?: string
      }
      email?: string
    }
  }
  type: string
  trigger: string
  content?: {
    subject?: string
    message?: string
  }
  scheduling?: {
    immediate?: boolean
    scheduledFor?: string
  }
  status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'responded' | 'failed'
  effectiveness?: {
    status: 'pending' | 'successful' | 'failed'
    metrics?: {
      opened: boolean
      clicked: boolean
      responded: boolean
      improvedEngagement: boolean
    }
  }
  createdAt: string
  updatedAt: string
}

interface InterventionStats {
  total: number
  pending: number
  sent: number
  successful: number
  failed: number
  responseRate: number
  avgResponseTime: number
}

const INTERVENTION_TYPES = [
  { value: 'personalized_nudge', label: 'Personalized Nudge', icon: MessageSquare, color: 'bg-blue-500' },
  { value: 'motivational_message', label: 'Motivational Message', icon: Zap, color: 'bg-green-500' },
  { value: 'learning_support', label: 'Learning Support', icon: Target, color: 'bg-purple-500' },
  { value: 'progress_reminder', label: 'Progress Reminder', icon: Clock, color: 'bg-orange-500' },
  { value: 'peer_connection', label: 'Peer Connection', icon: Users, color: 'bg-pink-500' },
  { value: 'instructor_outreach', label: 'Instructor Outreach', icon: Phone, color: 'bg-red-500' }
]

const TRIGGER_TYPES = [
  { value: 'high_risk_score', label: 'High Risk Score' },
  { value: 'inactivity', label: 'Inactivity Period' },
  { value: 'declining_performance', label: 'Declining Performance' },
  { value: 'missed_deadline', label: 'Missed Deadline' },
  { value: 'manual_admin', label: 'Manual Admin' },
  { value: 'automated_system', label: 'Automated System' }
]

export default function AdminInterventionsPage() {
  const router = useRouter()
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [stats, setStats] = useState<InterventionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchInterventions()
    fetchStats()
  }, [currentPage, statusFilter, typeFilter, searchTerm])

  const fetchInterventions = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await api.get(`/admin/interventions?${params}`)
      if (response.data.success) {
        setInterventions(response.data.data.interventions)
        setTotalPages(response.data.data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching interventions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/interventions/stats')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching intervention stats:', error)
    }
  }

  const getStatusBadge = (status?: string) => {
    // Handle undefined or null status
    if (!status || typeof status !== 'string') {
      status = 'pending'
    }
    
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      sent: { color: 'bg-blue-100 text-blue-800', icon: Send },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      opened: { color: 'bg-purple-100 text-purple-800', icon: Eye },
      responded: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.color} font-medium`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    const typeConfig = INTERVENTION_TYPES.find(t => t.value === type)
    if (!typeConfig) return MessageSquare
    return typeConfig.icon
  }

  const getTypeColor = (type: string) => {
    const typeConfig = INTERVENTION_TYPES.find(t => t.value === type)
    return typeConfig?.color || 'bg-gray-500'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewIntervention = (intervention: Intervention) => {
    // Show intervention details - for now just log
    console.log('View intervention:', intervention)
  }

  const handleEditIntervention = (intervention: Intervention) => {
    // Edit intervention - for now just log
    console.log('Edit intervention:', intervention)
  }

  const handleDeleteIntervention = async (interventionId: string) => {
    if (confirm('Are you sure you want to delete this intervention?')) {
      try {
        await api.delete(`/admin/interventions/${interventionId}`)
        fetchInterventions()
      } catch (error) {
        console.error('Error deleting intervention:', error)
      }
    }
  }

  const StatsCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
    <Card className="relative overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-600 mb-2 tracking-wide uppercase">{title}</p>
            <p className="text-4xl font-bold text-gray-900 mb-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 flex items-center gap-2 mt-2">
                {trend && <TrendingUp className="h-4 w-4 text-green-500" />}
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-4 ${color} rounded-2xl shadow-lg`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>
        {/* Decorative gradient */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${color} opacity-60`}></div>
      </CardContent>
    </Card>
  )

  if (isLoading && interventions.length === 0) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Intervention Management
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Monitor and manage learner interventions with intelligent insights</p>
            </div>
            <Button 
              onClick={() => router.push('/admin/learners')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Intervention
            </Button>
          </div>
        </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Interventions"
            value={stats.total}
            subtitle="All time"
            icon={MessageSquare}
            color="bg-blue-500"
          />
          <StatsCard
            title="Success Rate"
            value={`${Math.round(stats.responseRate)}%`}
            subtitle="Response rate"
            icon={Target}
            color="bg-green-500"
            trend={true}
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            subtitle="Awaiting delivery"
            icon={Clock}
            color="bg-orange-500"
          />
          <StatsCard
            title="Active Today"
            value={stats.sent}
            subtitle="Sent today"
            icon={Activity}
            color="bg-purple-500"
          />
        </div>
      )}

      {/* Filters and Search */}
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by learner name, email, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="all" className="text-gray-900 hover:bg-blue-50 focus:bg-blue-50">All Status</SelectItem>
                  <SelectItem value="pending" className="text-gray-900 hover:bg-blue-50 focus:bg-blue-50">Pending</SelectItem>
                  <SelectItem value="sent" className="text-gray-900 hover:bg-blue-50 focus:bg-blue-50">Sent</SelectItem>
                  <SelectItem value="delivered" className="text-gray-900 hover:bg-blue-50 focus:bg-blue-50">Delivered</SelectItem>
                  <SelectItem value="opened" className="text-gray-900 hover:bg-blue-50 focus:bg-blue-50">Opened</SelectItem>
                  <SelectItem value="responded" className="text-gray-900 hover:bg-blue-50 focus:bg-blue-50">Responded</SelectItem>
                  <SelectItem value="failed" className="text-gray-900 hover:bg-blue-50 focus:bg-blue-50">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48 bg-white border-gray-300 text-gray-900 hover:border-blue-400 focus:border-blue-500">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="all" className="text-gray-900 hover:bg-blue-50 focus:bg-blue-50">All Types</SelectItem>
                  {INTERVENTION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-gray-900 hover:bg-blue-50 focus:bg-blue-50">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Interventions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Interventions List */}
          <Card className="bg-white shadow-lg border border-gray-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Recent Interventions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {interventions.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No interventions found</h3>
                  <p className="text-gray-500 mb-6">Get started by creating your first intervention</p>
                  <Button 
                    onClick={() => router.push('/admin/learners')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Intervention
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {interventions.map((intervention) => {
                    const TypeIcon = getTypeIcon(intervention.type)
                    return (
                      <div
                        key={intervention._id}
                        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-2 ${getTypeColor(intervention.type)} rounded-lg`}>
                              <TypeIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {intervention.content?.subject || 'No subject'}
                                </h3>
                                {getStatusBadge(intervention.status || 'pending')}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                To: {intervention.learnerId?.userId?.profile?.name || 'Unknown User'} ({intervention.learnerId?.userId?.email || 'No email'})
                              </p>
                              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                {intervention.content?.message || 'No message content'}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(intervention.createdAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {TRIGGER_TYPES.find(t => t.value === intervention.trigger)?.label || intervention.trigger}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewIntervention(intervention)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditIntervention(intervention)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteIntervention(intervention._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <Card className="bg-white shadow-lg border border-gray-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Activity className="h-5 w-5 text-green-600" />
                Active Interventions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Activity className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Active Interventions View</h3>
                <p className="text-gray-600">Real-time monitoring of ongoing interventions</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="bg-white shadow-lg border border-gray-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Intervention Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <div className="bg-purple-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600">Comprehensive intervention performance metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
