'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface ProgressData {
  completedPages: string[]
  progress: number
  isLoading: boolean
}

const ProgressContext = createContext<ProgressData>({
  completedPages: [],
  progress: 0,
  isLoading: true,
})

export function useProgress() {
  return useContext(ProgressContext)
}

interface CourseProgressWrapperProps {
  courseId: string
  children: ReactNode
}

export function CourseProgressWrapper({
  courseId,
  children,
}: CourseProgressWrapperProps) {
  const [completedPages, setCompletedPages] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/progress`)
        if (response.ok) {
          const data = await response.json()
          setCompletedPages(data.completedPages || [])
          setProgress(data.progress || 0)
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgress()
  }, [courseId])

  return (
    <ProgressContext.Provider value={{ completedPages, progress, isLoading }}>
      {children}
    </ProgressContext.Provider>
  )
}
