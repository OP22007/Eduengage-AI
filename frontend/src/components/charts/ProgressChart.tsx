'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ProgressData {
  courseTitle: string
  progress: number
  riskScore: number
  status: string
}

interface ProgressChartProps {
  data: ProgressData[]
}

export default function ProgressChart({ data }: ProgressChartProps) {
  const chartData = data.map(item => ({
    course: item.courseTitle.length > 15 ? item.courseTitle.substring(0, 15) + '...' : item.courseTitle,
    progress: Math.round(item.progress * 100),
    risk: Math.round(item.riskScore * 100),
    status: item.status
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            Progress: {payload[0]?.value}%
          </p>
          <p className="text-sm text-red-600">
            Risk Score: {payload[1]?.value}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="course" 
            stroke="#6b7280"
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="progress" 
            fill="#3b82f6" 
            name="Progress %" 
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="risk" 
            fill="#ef4444" 
            name="Risk Score %" 
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
