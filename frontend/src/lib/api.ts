import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 60000, // Increased to 60 seconds for AI operations
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string, role: string = 'learner') =>
    api.post('/auth/register', { email, password, name, role }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// Learner API
export const learnerAPI = {
  getDashboard: () => api.get('/learners/dashboard'),
  getProgress: () => api.get('/learners/progress'),
  getAchievements: () => api.get('/learners/achievements'),
  logActivity: (data: any) => api.post('/learners/activity', data),
  getAIRecommendations: () => api.get('/learners/ai-recommendations'),
  getRiskAssessment: () => api.get('/learners/risk-assessment'),
}

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getLearners: (params?: any) => api.get('/admin/learners', { params }),
  getAnalytics: (params?: any) => api.get('/admin/analytics', { params }),
  createIntervention: (data: any) => api.post('/admin/intervention', data),
  getGeminiInsights: () => api.get('/admin/gemini-insights', { timeout: 120000 }), // 2 minutes for AI processing
  getInterventionSuggestions: (learnerId: string) => 
    api.post('/admin/intervention-suggestions', { learnerId }, { timeout: 60000 }), // 1 minute for interventions
  updateRiskScores: () => api.post('/admin/update-risk-scores', {}, { timeout: 180000 }), // 3 minutes for risk updates
  getRiskHistory: (params?: any) => api.get('/admin/risk-history', { params }),
  getLearnerRisk: (learnerId: string) => api.get(`/admin/learner-risk/${learnerId}`),
}

// Courses API
export const coursesAPI = {
  getCourses: (params?: any) => api.get('/courses', { params }),
  getEnrolledCourses: () => api.get('/courses/enrolled'),
  getAvailableCourses: () => api.get('/courses/available'),
  getCourse: (id: string) => api.get(`/courses/${id}`),
  getCourseModules: (id: string) => api.get(`/courses/${id}/modules`),
  enrollInCourse: (id: string) => api.post(`/courses/${id}/enroll`),
  updateProgress: (id: string, data: any) => api.post(`/courses/${id}/progress`, data),
  getCategories: () => api.get('/courses/categories'),
}

// Analytics API (ML Integration)
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  predictRisk: (learnerId: string) => api.post('/analytics/predict-risk', { learner_id: learnerId }),
  predictRiskForUser: (userId: string) => api.post('/analytics/predict-risk', { user_id: userId }),
  predictRiskForMe: () => api.get('/analytics/predict-risk/me'),
  predictBatch: (learnerIds: string[]) => api.post('/analytics/predict-batch', { learner_ids: learnerIds }),
  getLearnerAnalysis: (learnerId: string) => api.get(`/analytics/learner/${learnerId}/analysis`),
  getLearnerId: () => api.get('/analytics/learner-id'),
  getMLStatus: () => api.get('/analytics/ml-status'),
}

// Notifications API
export const notificationsAPI = {
  getNotifications: (params?: any) => api.get('/notifications', { params }),
  markAsRead: (notificationId: string) => api.post(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  trackClick: (notificationId: string) => api.post(`/notifications/${notificationId}/click`),
  dismiss: (notificationId: string) => api.delete(`/notifications/${notificationId}`),
  sendIntervention: (data: { learnerId: string, interventionType: string, message: string, riskLevel?: string }) => 
    api.post('/notifications/send-intervention', data),
  getStats: (days?: number) => api.get('/notifications/stats', { params: { days } }),
  testRiskSystem: () => api.post('/notifications/test-risk-system'),
  processRiskNotifications: () => api.post('/notifications/process-risk-notifications'),
}

// Achievements API
export const achievementsAPI = {
  getAchievements: () => api.get('/achievements'),
  updateProgress: (achievementId: string, progress: any) => 
    api.post('/achievements/update', { achievementId, progress }),
  unlockAchievement: (achievementId: string) => 
    api.post(`/achievements/unlock/${achievementId}`),
}

export default api
