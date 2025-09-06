'use client'

import { useState, useEffect } from 'react'
import { 
  Trophy, Medal, Star, Award, Target, BookOpen, Clock, Users, 
  Zap, Crown, Shield, Flame, CheckCircle, Lock, Calendar,
  TrendingUp, Brain, Code, Lightbulb, Rocket, Heart
} from 'lucide-react'
import { achievementsAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: 'course' | 'learning' | 'engagement' | 'special' | 'streak' | 'social'
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary'
  unlocked: boolean
  unlockedAt?: Date
  progress?: {
    current: number
    total: number
  }
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  xpReward: number
}

interface Badge {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  unlocked: boolean
  unlockedAt?: Date
  courseId?: string
  courseName?: string
}

interface UserStats {
  totalXP: number
  level: number
  completedCourses: number
  totalStudyHours: number
  longestStreak: number
  currentStreak: number
  achievements: number
  badges: number
}

// Utility Components
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

const Badge = ({ children, variant = 'default', className = '' }: any) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    bronze: 'bg-orange-100 text-orange-800',
    silver: 'bg-gray-100 text-gray-800',
    gold: 'bg-yellow-100 text-yellow-800',
    platinum: 'bg-purple-100 text-purple-800',
    legendary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bronze': return 'from-orange-400 to-orange-600'
      case 'silver': return 'from-gray-400 to-gray-600'
      case 'gold': return 'from-yellow-400 to-yellow-600'
      case 'platinum': return 'from-purple-400 to-purple-600'
      case 'legendary': return 'from-pink-500 via-purple-500 to-indigo-500'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 border-gray-300'
      case 'rare': return 'text-blue-600 border-blue-300'
      case 'epic': return 'text-purple-600 border-purple-300'
      case 'legendary': return 'text-yellow-600 border-yellow-300'
      default: return 'text-gray-600 border-gray-300'
    }
  }

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 ${
      achievement.unlocked 
        ? 'hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-green-500' 
        : 'opacity-70 grayscale'
    }`}>
      {/* Achievement Type Gradient Background */}
      <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${getTypeColor(achievement.type)}`}></div>
      
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 p-3 rounded-full ${
            achievement.unlocked 
              ? `bg-gradient-to-br ${getTypeColor(achievement.type)} text-white` 
              : 'bg-gray-200 text-gray-400'
          }`}>
            {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6" />}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className={`text-lg font-semibold ${
                achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {achievement.title}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant={achievement.type}>
                  {achievement.type}
                </Badge>
                <span className={`text-xs px-2 py-1 rounded border ${getRarityColor(achievement.rarity)}`}>
                  {achievement.rarity}
                </span>
              </div>
            </div>
            
            <p className={`text-sm mb-3 ${
              achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {achievement.description}
            </p>
            
            {/* Progress Bar */}
            {achievement.progress && !achievement.unlocked && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{achievement.progress.current}/{achievement.progress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(achievement.progress.current / achievement.progress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Bottom Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>{achievement.xpReward} XP</span>
              </div>
              
              {achievement.unlocked && achievement.unlockedAt && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const BadgeCard = ({ badge }: { badge: Badge }) => {
  return (
    <Card className={`text-center transition-all duration-300 ${
      badge.unlocked 
        ? 'hover:shadow-lg hover:-translate-y-1' 
        : 'opacity-70 grayscale'
    }`}>
      <CardContent className="p-6">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
          badge.unlocked ? badge.color : 'bg-gray-200'
        }`}>
          {badge.unlocked ? badge.icon : <Lock className="w-8 h-8 text-gray-400" />}
        </div>
        
        <h3 className={`font-semibold mb-2 ${
          badge.unlocked ? 'text-gray-900' : 'text-gray-500'
        }`}>
          {badge.name}
        </h3>
        
        <p className={`text-sm mb-3 ${
          badge.unlocked ? 'text-gray-600' : 'text-gray-400'
        }`}>
          {badge.description}
        </p>
        
        {badge.courseName && (
          <p className="text-xs text-blue-600 mb-2">
            From: {badge.courseName}
          </p>
        )}
        
        {badge.unlocked && badge.unlockedAt && (
          <div className="flex items-center justify-center gap-1 text-xs text-green-600">
            <CheckCircle className="w-3 h-3" />
            <span>Earned {new Date(badge.unlockedAt).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const AchievementsPage = () => {
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<'achievements' | 'badges'>('achievements')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    totalXP: 0,
    level: 1,
    completedCourses: 0,
    totalStudyHours: 0,
    longestStreak: 0,
    currentStreak: 0,
    achievements: 0,
    badges: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'api' | 'mock'>('mock')

  useEffect(() => {
    if (isAuthenticated) {
      loadUserAchievements()
    }
  }, [isAuthenticated])

  const loadUserAchievements = async () => {
    setIsLoading(true)
    try {
      // Check if user has a token
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      
      console.log('Auth check:', {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
        hasUser: !!user,
        isAuthenticated,
        userFromContext: user ? JSON.parse(user) : null
      })
      
      if (!token) {
        console.warn('No authentication token found, using mock data')
        loadMockData()
        return
      }

      console.log('Making API call to fetch achievements...')
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
      console.log('Full API URL would be:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/achievements`)
      
      // Test basic connectivity first
      try {
        console.log('Testing health endpoint first...')
        const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/health`)
        console.log('Health check status:', healthResponse.status)
        const healthData = await healthResponse.text()
        console.log('Health check response:', healthData)
      } catch (healthError) {
        console.error('Health check failed:', healthError)
      }
      
      const response = await achievementsAPI.getAchievements()
      
      if (response.data.success) {
        console.log('Successfully loaded achievements from API:', response.data.data)
        setUserStats(response.data.data.userStats)
        setAchievements(response.data.data.achievements)
        setBadges(response.data.data.badges)
        setDataSource('api')
      } else {
        console.log('API response not successful:', response.data)
        loadMockData()
      }
    } catch (error: any) {
      console.error('Error loading achievements:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
      
      // More specific error handling
      if (error.response?.status === 401) {
        console.error('Authentication failed - token may be expired')
        // Clear invalid token
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } else if (error.response?.status === 404) {
        console.error('Achievements endpoint not found')
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        console.error('Backend server not available')
      }
      
      console.log('Falling back to mock data due to error:', error.message)
      loadMockData()
    } finally {
      setIsLoading(false)
    }
  }

  const loadMockData = () => {
    console.log('Loading mock data...')
    setUserStats({
      totalXP: 2450,
      level: 8,
      completedCourses: 3,
      totalStudyHours: 127,
      longestStreak: 15,
      currentStreak: 7,
      achievements: 8,
      badges: 5
    })
    setAchievements(getMockAchievements())
    setBadges(getMockBadges())
    setDataSource('mock')
  }

  const getMockAchievements = (): Achievement[] => [
    // Course Achievements
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first course',
      icon: <BookOpen className="w-6 h-6" />,
      category: 'course',
      type: 'bronze',
      unlocked: true,
      unlockedAt: new Date('2025-08-15'),
      rarity: 'common',
      xpReward: 100
    },
    {
      id: '2',
      title: 'Knowledge Seeker',
      description: 'Complete 5 courses',
      icon: <Target className="w-6 h-6" />,
      category: 'course',
      type: 'silver',
      unlocked: false,
      progress: { current: 3, total: 5 },
      rarity: 'rare',
      xpReward: 250
    },
    {
      id: '3',
      title: 'Master Learner',
      description: 'Complete 10 courses',
      icon: <Crown className="w-6 h-6" />,
      category: 'course',
      type: 'gold',
      unlocked: false,
      progress: { current: 3, total: 10 },
      rarity: 'epic',
      xpReward: 500
    },
    
    // Learning Achievements
    {
      id: '4',
      title: 'Speed Demon',
      description: 'Complete a course in under 10 hours',
      icon: <Zap className="w-6 h-6" />,
      category: 'learning',
      type: 'silver',
      unlocked: true,
      unlockedAt: new Date('2025-08-20'),
      rarity: 'rare',
      xpReward: 200
    },
    {
      id: '5',
      title: 'Night Owl',
      description: 'Study for 5 hours between 10 PM and 6 AM',
      icon: <Shield className="w-6 h-6" />,
      category: 'learning',
      type: 'bronze',
      unlocked: true,
      unlockedAt: new Date('2025-08-25'),
      rarity: 'common',
      xpReward: 150
    },
    {
      id: '6',
      title: 'Marathon Runner',
      description: 'Study for 100 total hours',
      icon: <Clock className="w-6 h-6" />,
      category: 'learning',
      type: 'gold',
      unlocked: true,
      unlockedAt: new Date('2025-09-01'),
      rarity: 'epic',
      xpReward: 400
    },
    
    // Streak Achievements
    {
      id: '7',
      title: 'Consistent',
      description: 'Maintain a 7-day learning streak',
      icon: <Flame className="w-6 h-6" />,
      category: 'streak',
      type: 'bronze',
      unlocked: true,
      unlockedAt: new Date('2025-08-30'),
      rarity: 'common',
      xpReward: 150
    },
    {
      id: '8',
      title: 'Dedicated',
      description: 'Maintain a 30-day learning streak',
      icon: <Calendar className="w-6 h-6" />,
      category: 'streak',
      type: 'gold',
      unlocked: false,
      progress: { current: 7, total: 30 },
      rarity: 'epic',
      xpReward: 600
    },
    
    // Special Achievements
    {
      id: '9',
      title: 'Early Bird',
      description: 'Be among the first 100 users',
      icon: <Rocket className="w-6 h-6" />,
      category: 'special',
      type: 'legendary',
      unlocked: true,
      unlockedAt: new Date('2025-08-10'),
      rarity: 'legendary',
      xpReward: 1000
    },
    {
      id: '10',
      title: 'Perfect Score',
      description: 'Score 100% on any course assessment',
      icon: <Star className="w-6 h-6" />,
      category: 'learning',
      type: 'silver',
      unlocked: true,
      unlockedAt: new Date('2025-08-22'),
      rarity: 'rare',
      xpReward: 300
    },
    
    // Engagement Achievements
    {
      id: '11',
      title: 'Helpful',
      description: 'Help 10 fellow learners in discussions',
      icon: <Heart className="w-6 h-6" />,
      category: 'social',
      type: 'bronze',
      unlocked: false,
      progress: { current: 3, total: 10 },
      rarity: 'common',
      xpReward: 200
    },
    {
      id: '12',
      title: 'Brain Power',
      description: 'Complete all AI/ML related courses',
      icon: <Brain className="w-6 h-6" />,
      category: 'course',
      type: 'platinum',
      unlocked: false,
      progress: { current: 1, total: 4 },
      rarity: 'legendary',
      xpReward: 800
    }
  ]

  const getMockBadges = (): Badge[] => [
    {
      id: '1',
      name: 'Web Developer',
      description: 'Completed Full Stack Web Development course',
      icon: <Code className="w-8 h-8" />,
      color: 'bg-blue-500 text-white',
      unlocked: true,
      unlockedAt: new Date('2025-08-15'),
      courseId: 'course1',
      courseName: 'Full Stack Web Development'
    },
    {
      id: '2',
      name: 'Data Scientist',
      description: 'Completed Data Science Fundamentals course',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'bg-green-500 text-white',
      unlocked: true,
      unlockedAt: new Date('2025-08-25'),
      courseId: 'course2',
      courseName: 'Data Science Fundamentals'
    },
    {
      id: '3',
      name: 'AI Expert',
      description: 'Completed Machine Learning course',
      icon: <Brain className="w-8 h-8" />,
      color: 'bg-purple-500 text-white',
      unlocked: true,
      unlockedAt: new Date('2025-09-01'),
      courseId: 'course3',
      courseName: 'Machine Learning Basics'
    },
    {
      id: '4',
      name: 'Innovation Leader',
      description: 'Complete the Innovation Management course',
      icon: <Lightbulb className="w-8 h-8" />,
      color: 'bg-yellow-500 text-white',
      unlocked: false,
      courseId: 'course4',
      courseName: 'Innovation Management'
    },
    {
      id: '5',
      name: 'Cloud Master',
      description: 'Complete the Cloud Computing course',
      icon: <Shield className="w-8 h-8" />,
      color: 'bg-indigo-500 text-white',
      unlocked: false,
      courseId: 'course5',
      courseName: 'Cloud Computing Essentials'
    },
    {
      id: '6',
      name: 'Algorithm Expert',
      description: 'Complete the Algorithms course',
      icon: <Target className="w-8 h-8" />,
      color: 'bg-red-500 text-white',
      unlocked: false,
      courseId: 'course6',
      courseName: 'Advanced Algorithms'
    }
  ]

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  )

  const getNextLevel = (xp: number) => {
    return Math.floor(xp / 300) + 1
  }

  const getXPForNextLevel = (level: number) => {
    return level * 300
  }

  const progressToNextLevel = (userStats.totalXP % 300) / 300

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-4">
              Please log in to view your achievements and track your learning progress.
            </p>
            <Link
              href="/login?redirect=/achievements"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Log In
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Achievements & Badges</h1>
            <p className="text-xl opacity-90">
              Track your learning journey and celebrate your accomplishments
            </p>
            {/* Debug indicator */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 space-y-1">
                <div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    dataSource === 'api' 
                      ? 'bg-green-500/20 text-green-200' 
                      : 'bg-yellow-500/20 text-yellow-200'
                  }`}>
                    Data Source: {dataSource.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    isAuthenticated 
                      ? 'bg-green-500/20 text-green-200' 
                      : 'bg-red-500/20 text-red-200'
                  }`}>
                    Auth Status: {isAuthenticated ? 'LOGGED IN' : 'NOT LOGGED IN'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
              <CardContent className="text-center p-4">
                <div className="text-2xl font-bold mb-1">{userStats.level}</div>
                <div className="text-sm opacity-80">Level</div>
                <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressToNextLevel * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {userStats.totalXP} / {getXPForNextLevel(userStats.level + 1)} XP
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
              <CardContent className="text-center p-4">
                <div className="text-2xl font-bold mb-1">{userStats.completedCourses}</div>
                <div className="text-sm opacity-80">Courses Completed</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
              <CardContent className="text-center p-4">
                <div className="text-2xl font-bold mb-1">{userStats.currentStreak}</div>
                <div className="text-sm opacity-80">Current Streak</div>
                <div className="flex items-center justify-center mt-1">
                  <Flame className="w-4 h-4 text-orange-300 mr-1" />
                  <span className="text-xs opacity-70">days</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
              <CardContent className="text-center p-4">
                <div className="text-2xl font-bold mb-1">{userStats.totalStudyHours}</div>
                <div className="text-sm opacity-80">Study Hours</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 flex space-x-1 shadow-sm">
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'achievements'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Achievements
              <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {achievements.filter(a => a.unlocked).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'badges'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Medal className="w-4 h-4 inline mr-2" />
              Course Badges
              <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {badges.filter(b => b.unlocked).length}
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'achievements' && (
          <>
            {/* Category Filter */}
            <div className="flex justify-center mb-8">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="all">All Categories</option>
                <option value="course">Course Completion</option>
                <option value="learning">Learning Milestones</option>
                <option value="streak">Learning Streaks</option>
                <option value="social">Community</option>
                <option value="special">Special</option>
              </select>
            </div>

            {/* Achievements Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                    <div className="h-16 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'badges' && (
          <>
            {/* Badges Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {badges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Ready to unlock more achievements?
          </h3>
          <div className="flex justify-center gap-4">
            <Link
              href="/courses"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Courses
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AchievementsPage
