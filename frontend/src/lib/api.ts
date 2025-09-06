import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
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
}

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getLearners: (params?: any) => api.get('/admin/learners', { params }),
  getAnalytics: (params?: any) => api.get('/admin/analytics', { params }),
  createIntervention: (data: any) => api.post('/admin/intervention', data),
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
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId: string) => api.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  sendIntervention: (data: { learnerId: string, interventionType: string, message: string }) => 
    api.post('/notifications/send-intervention', data),
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
