'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function NewContentPage() {
  const router = useRouter()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('제목을 입력해주세요')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      })

      if (response.ok) {
        const course = await response.json()
        toast.success('콘텐츠가 생성되었습니다')
        router.push(`/admin/contents/${course.id}`)
      } else {
        throw new Error('Failed to create content')
      }
    } catch {
      toast.error('콘텐츠 생성에 실패했습니다')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Back Link */}
      <Link
        href="/admin/contents"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={18} />
        콘텐츠 목록으로
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">새 콘텐츠 만들기</h1>
        <p className="text-gray-500 mt-1">
          새로운 콘텐츠를 생성하고 편집을 시작하세요
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="콘텐츠 제목을 입력하세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            설명 <span className="text-gray-400">(선택)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="콘텐츠에 대한 간단한 설명을 입력하세요"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Link
            href="/admin/contents"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-center text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                생성 중...
              </>
            ) : (
              <>
                <Plus size={20} />
                콘텐츠 만들기
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
