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

export default api
