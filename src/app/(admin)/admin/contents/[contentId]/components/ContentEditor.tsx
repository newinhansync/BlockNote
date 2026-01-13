'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Block } from '@blocknote/core'
import { BlockNoteEditor } from '@/components/editor/BlockNoteEditor'
import { FileText } from 'lucide-react'

interface ContentEditorProps {
  pageId: string | null
  pageTitle: string | null
  content: Block[] | null
  onChange: (content: Block[]) => void
  isLoading?: boolean
}

export function ContentEditor({
  pageId,
  pageTitle,
  content,
  onChange,
  isLoading = false,
}: ContentEditorProps) {
  const editorKey = useRef(0)

  // Force re-render editor when page changes
  useEffect(() => {
    editorKey.current += 1
  }, [pageId])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!pageId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">페이지를 선택하세요</p>
          <p className="text-sm text-gray-400 mt-1">
            왼쪽 사이드바에서 편집할 페이지를 선택하거나
            <br />
            새 페이지를 추가하세요
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* BlockNote Editor - Page title hidden in authoring view */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <BlockNoteEditor
          key={editorKey.current}
          initialContent={content || undefined}
          onChange={onChange}
          editable={true}
        />
      </div>
    </div>
  )
}
