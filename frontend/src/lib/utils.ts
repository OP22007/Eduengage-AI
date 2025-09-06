import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function calculateRiskLevel(score: number): {
  level: 'low' | 'medium' | 'high'
  color: string
  bgColor: string
} {
  if (score >= 0.8) {
    return { level: 'high', color: 'text-red-600', bgColor: 'bg-red-100' }
  } else if (score >= 0.6) {
    return { level: 'medium', color: 'text-amber-600', bgColor: 'bg-amber-100' }
  } else {
    return { level: 'low', color: 'text-green-600', bgColor: 'bg-green-100' }
  }
}

export function formatPercentage(value: number) {
  return `${Math.round(value * 100)}%`
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
