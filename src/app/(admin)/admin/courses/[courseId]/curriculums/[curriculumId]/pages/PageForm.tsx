'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { Page } from '@/generated/prisma'
import type { Block } from '@blocknote/core'
import { Save, Check, Loader2, Archive } from 'lucide-react'

// BlockNote는 클라이언트 전용이므로 동적 임포트
const BlockNoteEditor = dynamic(
  () => import('@/components/editor/BlockNoteEditor').then(mod => mod.BlockNoteEditor),
  { ssr: false, loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" /> }
)

interface PageFormProps {
  courseId: string
  curriculumId: string
  page?: Page
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function PageForm({ courseId, curriculumId, page }: PageFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(page?.title || '')
  const [autoSaveStatus, setAutoSaveStatus] = useState<SaveStatus>('idle')
  const [isSavingVersion, setIsSavingVersion] = useState(false)
  const contentRef = useRef<Block[]>((page?.content as Block[]) || [])
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContentRef = useRef<string>(JSON.stringify(page?.content || []))

  const isEditing = !!page

  // 자동 저장 함수
  const performAutoSave = useCallback(async () => {
    if (!isEditing || !page) return

    const currentContent = JSON.stringify(contentRef.current)
    if (currentContent === lastSavedContentRef.current) {
      return // 변경 없음
    }

    setAutoSaveStatus('saving')

    try {
      const res = await fetch(
        `/api/courses/${courseId}/curriculums/${curriculumId}/pages/${page.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            content: contentRef.current,
          }),
        }
      )

      if (!res.ok) {
        throw new Error('Auto-save failed')
      }

      lastSavedContentRef.current = currentContent
      setAutoSaveStatus('saved')

      // 3초 후 상태 초기화
      setTimeout(() => {
        setAutoSaveStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('Auto-save error:', error)
      setAutoSaveStatus('error')
    }
  }, [isEditing, page, courseId, curriculumId, title])

  const handleContentChange = useCallback((newContent: Block[]) => {
    contentRef.current = newContent

    // 기존 타이머 취소
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // 수정 모드에서만 자동 저장 활성화
    if (isEditing) {
      // 2초 후 자동 저장
      autoSaveTimeoutRef.current = setTimeout(() => {
        performAutoSave()
      }, 2000)
    }
  }, [isEditing, performAutoSave])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // 버전 저장 함수
  const handleSaveVersion = async () => {
    if (!isEditing || !page) return

    setIsSavingVersion(true)

    try {
      // 먼저 현재 콘텐츠를 저장
      await fetch(
        `/api/courses/${courseId}/curriculums/${curriculumId}/pages/${page.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            content: contentRef.current,
          }),
        }
      )

      // 버전 저장
      const res = await fetch(
        `/api/courses/${courseId}/curriculums/${curriculumId}/pages/${page.id}/versions`,
        { method: 'POST' }
      )

      if (!res.ok) {
        throw new Error('버전 저장에 실패했습니다.')
      }

      alert('현재 버전이 저장되었습니다.')
    } catch (error) {
      console.error('Version save error:', error)
      alert('버전 저장에 실패했습니다.')
    } finally {
      setIsSavingVersion(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    // 자동 저장 타이머 취소
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    setIsSubmitting(true)

    try {
      const url = isEditing
        ? `/api/courses/${courseId}/curriculums/${curriculumId}/pages/${page.id}`
        : `/api/courses/${courseId}/curriculums/${curriculumId}/pages`
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: contentRef.current,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save page')
      }

      router.push(`/admin/courses/${courseId}`)
      router.refresh()
    } catch (error) {
      console.error('Error saving page:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderAutoSaveStatus = () => {
    if (!isEditing) return null

    switch (autoSaveStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            자동 저장 중...
          </span>
        )
      case 'saved':
        return (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check size={14} />
            자동 저장됨
          </span>
        )
      case 'error':
        return (
          <span className="flex items-center gap-1 text-sm text-red-600">
            자동 저장 실패
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 text-sm text-gray-400">
            <Save size={14} />
            변경 시 자동 저장
          </span>
        )
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          페이지 제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="페이지 제목을 입력하세요"
          required
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            콘텐츠
          </label>
          {renderAutoSaveStatus()}
        </div>
        <div className="border rounded-lg overflow-hidden min-h-96">
          <BlockNoteEditor
            initialContent={(page?.content as Block[]) || []}
            onChange={handleContentChange}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : isEditing ? '수정하기' : '만들기'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={handleSaveVersion}
            disabled={isSavingVersion}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Archive size={16} />
            {isSavingVersion ? '저장 중...' : '버전 저장'}
          </button>
        )}
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
