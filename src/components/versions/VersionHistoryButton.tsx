'use client'

import { useState } from 'react'
import { History, X, RotateCcw, Eye, Trash2 } from 'lucide-react'

interface Version {
  id: string
  createdAt: string
  versionNumber: number
  contentPreview: string
}

interface VersionHistoryButtonProps {
  courseId: string
  curriculumId: string
  pageId: string
}

export function VersionHistoryButton({ courseId, curriculumId, pageId }: VersionHistoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [versionContent, setVersionContent] = useState<unknown>(null)
  const [restoring, setRestoring] = useState(false)

  const fetchVersions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/courses/${courseId}/curriculums/${curriculumId}/pages/${pageId}/versions`
      )
      if (!response.ok) {
        throw new Error('버전 목록을 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      setVersions(data.versions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    fetchVersions()
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedVersion(null)
    setVersionContent(null)
  }

  const handleViewVersion = async (version: Version) => {
    setSelectedVersion(version)
    try {
      const response = await fetch(
        `/api/courses/${courseId}/curriculums/${curriculumId}/pages/${pageId}/versions/${version.id}`
      )
      if (response.ok) {
        const data = await response.json()
        setVersionContent(data.content)
      }
    } catch {
      // Ignore error for now
    }
  }

  const handleRestoreVersion = async (version: Version) => {
    if (!confirm(`버전 ${version.versionNumber}으로 복원하시겠습니까? 현재 내용은 새 버전으로 저장됩니다.`)) {
      return
    }

    setRestoring(true)
    try {
      const response = await fetch(
        `/api/courses/${courseId}/curriculums/${curriculumId}/pages/${pageId}/versions/${version.id}`,
        { method: 'POST' }
      )
      if (!response.ok) {
        throw new Error('버전 복원에 실패했습니다.')
      }
      // Reload page to show restored content
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setRestoring(false)
    }
  }

  const handleDeleteVersion = async (version: Version) => {
    if (!confirm(`버전 ${version.versionNumber}을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/courses/${courseId}/curriculums/${curriculumId}/pages/${pageId}/versions/${version.id}`,
        { method: 'DELETE' }
      )
      if (!response.ok) {
        throw new Error('버전 삭제에 실패했습니다.')
      }
      // Refresh versions list
      fetchVersions()
      if (selectedVersion?.id === version.id) {
        setSelectedVersion(null)
        setVersionContent(null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <History size={18} />
        버전 히스토리
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">버전 히스토리</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Version List */}
              <div className="w-1/3 border-r overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">로딩 중...</div>
                ) : error ? (
                  <div className="p-4 text-center text-red-500">{error}</div>
                ) : versions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    저장된 버전이 없습니다.
                  </div>
                ) : (
                  <ul className="divide-y">
                    {versions.map((version) => (
                      <li
                        key={version.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer ${
                          selectedVersion?.id === version.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleViewVersion(version)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">버전 {version.versionNumber}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRestoreVersion(version)
                              }}
                              disabled={restoring}
                              className="p-1 hover:bg-blue-100 rounded transition-colors"
                              title="이 버전으로 복원"
                            >
                              <RotateCcw size={14} className="text-blue-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteVersion(version)
                              }}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                              title="버전 삭제"
                            >
                              <Trash2 size={14} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(version.createdAt)}
                        </div>
                        {version.contentPreview && (
                          <div className="text-sm text-gray-400 mt-1 truncate">
                            {version.contentPreview}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Version Preview */}
              <div className="w-2/3 overflow-y-auto p-4">
                {selectedVersion ? (
                  <div>
                    <div className="mb-4 pb-4 border-b">
                      <h3 className="font-bold text-lg">버전 {selectedVersion.versionNumber}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(selectedVersion.createdAt)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Eye size={16} />
                        콘텐츠 미리보기
                      </h4>
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-auto max-h-96">
                        {JSON.stringify(versionContent, null, 2)}
                      </pre>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleRestoreVersion(selectedVersion)}
                        disabled={restoring}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw size={16} />
                        {restoring ? '복원 중...' : '이 버전으로 복원'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    버전을 선택하면 미리보기가 표시됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
