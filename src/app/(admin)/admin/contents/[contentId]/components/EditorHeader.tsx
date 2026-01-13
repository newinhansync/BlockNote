'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2, AlertCircle, Eye, Send } from 'lucide-react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface EditorHeaderProps {
  contentId: string
  title: string
  saveStatus: SaveStatus
  isPublished: boolean
  hasUnpublishedChanges: boolean
  onTitleChange: (title: string) => void
  onPublish: () => void
}

export function EditorHeader({
  contentId,
  title,
  saveStatus,
  isPublished,
  hasUnpublishedChanges,
  onTitleChange,
  onPublish,
}: EditorHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setEditTitle(title)
  }, [title])

  const handleTitleClick = () => {
    setIsEditing(true)
  }

  const handleTitleBlur = () => {
    setIsEditing(false)
    if (editTitle.trim() && editTitle !== title) {
      onTitleChange(editTitle.trim())
    } else {
      setEditTitle(title)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur()
    } else if (e.key === 'Escape') {
      setEditTitle(title)
      setIsEditing(false)
    }
  }

  const handlePreview = () => {
    window.open(`/viewer/courses/${contentId}`, '_blank')
  }

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1 text-gray-400 text-sm">
            <Loader2 size={14} className="animate-spin" />
            저장 중...
          </span>
        )
      case 'saved':
        return (
          <span className="flex items-center gap-1 text-gray-400 text-sm">
            <Check size={14} />
            저장됨
          </span>
        )
      case 'error':
        return (
          <span className="flex items-center gap-1 text-red-500 text-sm">
            <AlertCircle size={14} />
            저장 실패
          </span>
        )
      default:
        return null
    }
  }

  return (
    <header className="h-14 border-b border-gray-200 flex items-center px-4 gap-4 bg-white flex-shrink-0">
      {/* Back Button */}
      <Link
        href="/admin/contents"
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="대시보드로 돌아가기"
      >
        <ArrowLeft size={20} />
      </Link>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200" />

      {/* Title */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleKeyDown}
            className="w-full text-lg font-medium bg-transparent border-b-2 border-blue-500 outline-none py-1"
            placeholder="콘텐츠 제목"
          />
        ) : (
          <button
            onClick={handleTitleClick}
            className="text-lg font-medium truncate hover:bg-gray-100 px-2 py-1 rounded transition-colors text-left max-w-full"
            title="클릭하여 제목 수정"
          >
            {title || '제목 없음'}
          </button>
        )}
      </div>

      {/* Save Status */}
      <div className="flex-shrink-0">
        {renderSaveStatus()}
      </div>

      {/* Preview Button */}
      <button
        onClick={handlePreview}
        className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
        title="새 탭에서 미리보기"
      >
        <Eye size={18} />
        <span className="hidden sm:inline">미리보기</span>
      </button>

      {/* Publish Button */}
      <button
        onClick={onPublish}
        disabled={!hasUnpublishedChanges && isPublished}
        className={`flex items-center gap-2 px-4 py-1.5 rounded font-medium transition-colors ${
          hasUnpublishedChanges || !isPublished
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-green-100 text-green-700 cursor-default'
        }`}
      >
        {hasUnpublishedChanges || !isPublished ? (
          <>
            <Send size={16} />
            게시하기
          </>
        ) : (
          <>
            <Check size={16} />
            게시됨
          </>
        )}
      </button>
    </header>
  )
}
