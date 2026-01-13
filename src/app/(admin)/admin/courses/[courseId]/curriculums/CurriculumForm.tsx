'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Curriculum } from '@/generated/prisma'

interface CurriculumFormProps {
  courseId: string
  curriculum?: Curriculum
}

export function CurriculumForm({ courseId, curriculum }: CurriculumFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(curriculum?.title || '')

  const isEditing = !!curriculum

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const url = isEditing
        ? `/api/courses/${courseId}/curriculums/${curriculum.id}`
        : `/api/courses/${courseId}/curriculums`
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      })

      if (!res.ok) {
        throw new Error('Failed to save curriculum')
      }

      router.push(`/admin/courses/${courseId}`)
      router.refresh()
    } catch (error) {
      console.error('Error saving curriculum:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          커리큘럼 제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="예: 1장. 시작하기"
          required
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : isEditing ? '수정하기' : '만들기'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  )
}
