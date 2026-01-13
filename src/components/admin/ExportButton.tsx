'use client'

import { useState } from 'react'
import { Download, FileText, FileCode, File, X } from 'lucide-react'

interface ExportButtonProps {
  courseId: string
  courseTitle: string
}

export function ExportButton({ courseId, courseTitle }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'json' | 'html' | 'markdown' | 'pdf') => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/export?courseId=${courseId}&format=${format}`)

      if (!response.ok) {
        throw new Error('내보내기에 실패했습니다.')
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Set filename based on format
      const extension = format === 'markdown' ? 'md' : format
      a.download = `${courseTitle}.${extension}`

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setIsOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : '오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        <Download size={18} />
        내보내기
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">콘텐츠 내보내기</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              &quot;{courseTitle}&quot; 콘텐츠를 내보낼 형식을 선택하세요.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleExport('html')}
                disabled={isExporting}
                className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FileCode size={24} className="text-orange-500" />
                <div className="text-left">
                  <div className="font-medium">HTML</div>
                  <div className="text-sm text-gray-500">웹 페이지 형식으로 내보내기</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('markdown')}
                disabled={isExporting}
                className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FileText size={24} className="text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Markdown</div>
                  <div className="text-sm text-gray-500">마크다운 형식으로 내보내기</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FileCode size={24} className="text-green-500" />
                <div className="text-left">
                  <div className="font-medium">JSON</div>
                  <div className="text-sm text-gray-500">데이터 형식으로 내보내기 (API 연동용)</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <File size={24} className="text-red-500" />
                <div className="text-left">
                  <div className="font-medium">PDF</div>
                  <div className="text-sm text-gray-500">PDF 문서로 내보내기</div>
                </div>
              </button>
            </div>

            {isExporting && (
              <div className="mt-4 text-center text-gray-500">
                내보내는 중...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
