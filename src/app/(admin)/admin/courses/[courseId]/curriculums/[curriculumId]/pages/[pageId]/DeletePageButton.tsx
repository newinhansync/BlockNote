'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeletePageButtonProps {
  courseId: string
  curriculumId: string
  pageId: string
  pageTitle: string
}

export function DeletePageButton({ courseId, curriculumId, pageId, pageTitle }: DeletePageButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`"${pageTitle}" 페이지를 삭제하시겠습니까?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/curriculums/${curriculumId}/pages/${pageId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete page')
      }

      router.push(`/admin/courses/${courseId}`)
      router.refresh()
    } catch (error) {
      console.error('Error deleting page:', error)
      alert('페이지 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      <Trash2 size={18} />
      삭제
    </button>
  )
}
