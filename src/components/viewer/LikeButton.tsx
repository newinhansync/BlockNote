'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'

interface LikeButtonProps {
  pageId: string
  initialCount: number
  initialLiked?: boolean
  size?: 'sm' | 'md'
}

export function LikeButton({ pageId, initialCount, initialLiked = false, size = 'md' }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(initialLiked)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check like status on mount
    const checkLikeStatus = async () => {
      try {
        const response = await fetch(`/api/pages/${pageId}/like`)
        if (response.ok) {
          const data = await response.json()
          setLiked(data.liked)
          setCount(data.count)
        }
      } catch (error) {
        console.error('Failed to check like status:', error)
      }
    }
    checkLikeStatus()
  }, [pageId])

  const handleClick = async () => {
    if (isLoading) return

    setIsLoading(true)
    const previousLiked = liked
    const previousCount = count

    // Optimistic update
    setLiked(!liked)
    setCount(liked ? count - 1 : count + 1)

    try {
      const response = await fetch(`/api/pages/${pageId}/like`, {
        method: liked ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        // Revert on error
        setLiked(previousLiked)
        setCount(previousCount)
      } else {
        const data = await response.json()
        setCount(data.count)
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      setLiked(previousLiked)
      setCount(previousCount)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = size === 'sm'
    ? 'gap-1 px-2 py-1 text-xs'
    : 'gap-1.5 px-3 py-1.5 text-sm'
  const iconSize = size === 'sm' ? 14 : 18

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center rounded-full border transition-all ${sizeClasses} ${
        liked
          ? 'border-red-200 bg-red-50 text-red-600'
          : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:text-red-500'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <Heart
        size={iconSize}
        className={`transition-all ${liked ? 'fill-current' : ''}`}
      />
      <span className="font-medium">{count}</span>
    </button>
  )
}
