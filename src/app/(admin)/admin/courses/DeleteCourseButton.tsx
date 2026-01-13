'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteCourseButtonProps {
  courseId: string
  courseTitle: string
}

export function DeleteCourseButton({ courseId, courseTitle }: DeleteCourseButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`"${courseTitle}" 콘텐츠를 삭제하시겠습니까?\n연결된 모든 커리큘럼과 페이지도 함께 삭제됩니다.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete course')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('콘텐츠 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
      title="삭제"
    >
      <Trash2 size={18} />
    </button>
  )
}
