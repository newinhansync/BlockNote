'use client'

import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react'
import { Block } from '@blocknote/core'
import { useToast } from '@/components/ui/Toast'
import { CurriculumItem, PageItem } from '../components/TreeView'
import { SaveStatus } from '../components/EditorHeader'

interface EditorState {
  contentId: string
  title: string
  isPublished: boolean
  publishedAt: Date | null
  curriculums: CurriculumItem[]
  selectedPageId: string | null
  currentPageContent: Block[] | null
  currentPageTitle: string | null
  saveStatus: SaveStatus
  isDirty: boolean
  isLoading: boolean
  hasUnpublishedChanges: boolean
}

interface EditorContextType extends EditorState {
  setTitle: (title: string) => void
  selectPage: (pageId: string) => void
  setCurrentPageContent: (content: Block[]) => void
  setCurriculums: (curriculums: CurriculumItem[]) => void
  addCurriculum: () => Promise<void>
  addPage: (curriculumId: string) => Promise<void>
  renameCurriculum: (curriculumId: string, title: string) => Promise<void>
  renamePage: (pageId: string, title: string) => Promise<void>
  duplicateCurriculum: (curriculumId: string) => Promise<void>
  duplicatePage: (pageId: string, curriculumId: string) => Promise<void>
  deleteCurriculum: (curriculumId: string) => Promise<void>
  deletePage: (pageId: string, curriculumId: string) => Promise<void>
  reorderCurriculums: (curriculumIds: string[]) => Promise<void>
  reorderPages: (curriculumId: string, pageIds: string[]) => Promise<void>
  movePageToCurriculum: (pageId: string, fromCurriculumId: string, toCurriculumId: string) => Promise<void>
  saveContent: () => Promise<void>
  publish: () => Promise<void>
  refreshData: () => Promise<void>
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

interface EditorProviderProps {
  children: ReactNode
  initialData: {
    contentId: string
    title: string
    isPublished: boolean
    publishedAt: Date | null
    curriculums: CurriculumItem[]
  }
}

export function EditorProvider({ children, initialData }: EditorProviderProps) {
  const toast = useToast()
  const [state, setState] = useState<EditorState>({
    contentId: initialData.contentId,
    title: initialData.title,
    isPublished: initialData.isPublished,
    publishedAt: initialData.publishedAt,
    curriculums: initialData.curriculums,
    selectedPageId: null,
    currentPageContent: null,
    currentPageTitle: null,
    saveStatus: 'idle',
    isDirty: false,
    isLoading: false,
    hasUnpublishedChanges: false,
  })

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingContentRef = useRef<Block[] | null>(null)

  // Auto-save with debounce
  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (pendingContentRef.current && state.selectedPageId) {
        setState((prev) => ({ ...prev, saveStatus: 'saving' }))

        try {
          const curriculum = state.curriculums.find((c) =>
            c.pages.some((p) => p.id === state.selectedPageId)
          )

          if (curriculum) {
            const response = await fetch(
              `/api/courses/${state.contentId}/curriculums/${curriculum.id}/pages/${state.selectedPageId}`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: pendingContentRef.current }),
              }
            )

            if (response.ok) {
              setState((prev) => ({
                ...prev,
                saveStatus: 'saved',
                isDirty: false,
                hasUnpublishedChanges: true,
              }))
            } else {
              throw new Error('Save failed')
            }
          }
        } catch {
          setState((prev) => ({ ...prev, saveStatus: 'error' }))
          toast.error('저장에 실패했습니다')
        }

        pendingContentRef.current = null
      }
    }, 1000) // 1 second debounce
  }, [state.contentId, state.selectedPageId, state.curriculums])

  // Load page content when selected
  const selectPage = useCallback(async (pageId: string) => {
    // Save pending changes before switching
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    setState((prev) => ({
      ...prev,
      selectedPageId: pageId,
      isLoading: true,
    }))

    try {
      const curriculum = state.curriculums.find((c) =>
        c.pages.some((p) => p.id === pageId)
      )

      if (curriculum) {
        const response = await fetch(
          `/api/courses/${state.contentId}/curriculums/${curriculum.id}/pages/${pageId}`
        )

        if (response.ok) {
          const page = await response.json()
          setState((prev) => ({
            ...prev,
            currentPageContent: page.content || [],
            currentPageTitle: page.title,
            isLoading: false,
          }))
        } else {
          throw new Error('Failed to load page')
        }
      }
    } catch {
      toast.error('페이지를 불러오는데 실패했습니다')
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [state.contentId, state.curriculums])

  const setCurrentPageContent = useCallback((content: Block[]) => {
    pendingContentRef.current = content
    setState((prev) => ({
      ...prev,
      currentPageContent: content,
      isDirty: true,
      saveStatus: 'idle',
    }))
    scheduleAutoSave()
  }, [scheduleAutoSave])

  const setTitle = useCallback(async (title: string) => {
    try {
      const response = await fetch(`/api/courses/${state.contentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (response.ok) {
        setState((prev) => ({ ...prev, title, hasUnpublishedChanges: true }))
        toast.success('제목이 변경되었습니다')
      } else {
        throw new Error('Failed to update title')
      }
    } catch {
      toast.error('제목 변경에 실패했습니다')
    }
  }, [state.contentId])

  const setCurriculums = useCallback((curriculums: CurriculumItem[]) => {
    setState((prev) => ({ ...prev, curriculums }))
  }, [])

  const addCurriculum = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${state.contentId}/curriculums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `새 커리큘럼 ${state.curriculums.length + 1}`,
          order: state.curriculums.length,
        }),
      })

      if (response.ok) {
        const newCurriculum = await response.json()
        setState((prev) => ({
          ...prev,
          curriculums: [...prev.curriculums, { ...newCurriculum, pages: [] }],
          hasUnpublishedChanges: true,
        }))
        toast.success('커리큘럼이 추가되었습니다')
      } else {
        throw new Error('Failed to add curriculum')
      }
    } catch {
      toast.error('커리큘럼 추가에 실패했습니다')
    }
  }, [state.contentId, state.curriculums.length])

  const addPage = useCallback(async (curriculumId: string) => {
    try {
      const curriculum = state.curriculums.find((c) => c.id === curriculumId)
      if (!curriculum) return

      const response = await fetch(
        `/api/courses/${state.contentId}/curriculums/${curriculumId}/pages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `새 페이지 ${curriculum.pages.length + 1}`,
            order: curriculum.pages.length,
          }),
        }
      )

      if (response.ok) {
        const newPage = await response.json()
        setState((prev) => ({
          ...prev,
          curriculums: prev.curriculums.map((c) =>
            c.id === curriculumId
              ? { ...c, pages: [...c.pages, newPage] }
              : c
          ),
          hasUnpublishedChanges: true,
        }))
        toast.success('페이지가 추가되었습니다')
      } else {
        throw new Error('Failed to add page')
      }
    } catch {
      toast.error('페이지 추가에 실패했습니다')
    }
  }, [state.contentId, state.curriculums])

  const renameCurriculum = useCallback(async (curriculumId: string, title: string) => {
    try {
      const response = await fetch(
        `/api/courses/${state.contentId}/curriculums/${curriculumId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        }
      )

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          curriculums: prev.curriculums.map((c) =>
            c.id === curriculumId ? { ...c, title } : c
          ),
          hasUnpublishedChanges: true,
        }))
      } else {
        throw new Error('Failed to rename curriculum')
      }
    } catch {
      toast.error('커리큘럼 이름 변경에 실패했습니다')
    }
  }, [state.contentId])

  const renamePage = useCallback(async (pageId: string, title: string) => {
    const curriculum = state.curriculums.find((c) =>
      c.pages.some((p) => p.id === pageId)
    )

    if (!curriculum) return

    try {
      const response = await fetch(
        `/api/courses/${state.contentId}/curriculums/${curriculum.id}/pages/${pageId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        }
      )

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          curriculums: prev.curriculums.map((c) =>
            c.id === curriculum.id
              ? {
                  ...c,
                  pages: c.pages.map((p) =>
                    p.id === pageId ? { ...p, title } : p
                  ),
                }
              : c
          ),
          currentPageTitle: prev.selectedPageId === pageId ? title : prev.currentPageTitle,
          hasUnpublishedChanges: true,
        }))
      } else {
        throw new Error('Failed to rename page')
      }
    } catch {
      toast.error('페이지 이름 변경에 실패했습니다')
    }
  }, [state.contentId, state.curriculums])

  const duplicateCurriculum = useCallback(async (curriculumId: string) => {
    try {
      const response = await fetch(
        `/api/courses/${state.contentId}/curriculums/${curriculumId}/duplicate`,
        { method: 'POST' }
      )

      if (response.ok) {
        // Refresh data to get updated curriculums
        await refreshData()
        toast.success('커리큘럼이 복제되었습니다')
      } else {
        throw new Error('Failed to duplicate curriculum')
      }
    } catch {
      toast.error('커리큘럼 복제에 실패했습니다')
    }
  }, [state.contentId])

  const duplicatePage = useCallback(async (pageId: string, curriculumId: string) => {
    try {
      const response = await fetch(
        `/api/courses/${state.contentId}/curriculums/${curriculumId}/pages/${pageId}/duplicate`,
        { method: 'POST' }
      )

      if (response.ok) {
        const newPage = await response.json()
        setState((prev) => ({
          ...prev,
          curriculums: prev.curriculums.map((c) =>
            c.id === curriculumId
              ? { ...c, pages: [...c.pages, newPage] }
              : c
          ),
          hasUnpublishedChanges: true,
        }))
        toast.success('페이지가 복제되었습니다')
      } else {
        throw new Error('Failed to duplicate page')
      }
    } catch {
      toast.error('페이지 복제에 실패했습니다')
    }
  }, [state.contentId])

  const deleteCurriculum = useCallback(async (curriculumId: string) => {
    if (!confirm('이 커리큘럼을 삭제하시겠습니까? 포함된 모든 페이지도 함께 삭제됩니다.')) {
      return
    }

    try {
      const response = await fetch(
        `/api/courses/${state.contentId}/curriculums/${curriculumId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setState((prev) => {
          const deletedCurriculum = prev.curriculums.find((c) => c.id === curriculumId)
          const wasSelectedPageDeleted = deletedCurriculum?.pages.some(
            (p) => p.id === prev.selectedPageId
          )

          return {
            ...prev,
            curriculums: prev.curriculums.filter((c) => c.id !== curriculumId),
            selectedPageId: wasSelectedPageDeleted ? null : prev.selectedPageId,
            currentPageContent: wasSelectedPageDeleted ? null : prev.currentPageContent,
            currentPageTitle: wasSelectedPageDeleted ? null : prev.currentPageTitle,
            hasUnpublishedChanges: true,
          }
        })
        toast.success('커리큘럼이 삭제되었습니다')
      } else {
        throw new Error('Failed to delete curriculum')
      }
    } catch {
      toast.error('커리큘럼 삭제에 실패했습니다')
    }
  }, [state.contentId])

  const deletePage = useCallback(async (pageId: string, curriculumId: string) => {
    if (!confirm('이 페이지를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/courses/${state.contentId}/curriculums/${curriculumId}/pages/${pageId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          curriculums: prev.curriculums.map((c) =>
            c.id === curriculumId
              ? { ...c, pages: c.pages.filter((p) => p.id !== pageId) }
              : c
          ),
          selectedPageId: prev.selectedPageId === pageId ? null : prev.selectedPageId,
          currentPageContent: prev.selectedPageId === pageId ? null : prev.currentPageContent,
          currentPageTitle: prev.selectedPageId === pageId ? null : prev.currentPageTitle,
          hasUnpublishedChanges: true,
        }))
        toast.success('페이지가 삭제되었습니다')
      } else {
        throw new Error('Failed to delete page')
      }
    } catch {
      toast.error('페이지 삭제에 실패했습니다')
    }
  }, [state.contentId])

  const reorderCurriculums = useCallback(async (curriculumIds: string[]) => {
    try {
      await fetch(`/api/courses/${state.contentId}/curriculums/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curriculumIds }),
      })
      setState((prev) => ({ ...prev, hasUnpublishedChanges: true }))
    } catch {
      toast.error('순서 변경에 실패했습니다')
    }
  }, [state.contentId])

  const reorderPages = useCallback(async (curriculumId: string, pageIds: string[]) => {
    try {
      await fetch(
        `/api/courses/${state.contentId}/curriculums/${curriculumId}/pages/reorder`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageIds }),
        }
      )
      setState((prev) => ({ ...prev, hasUnpublishedChanges: true }))
    } catch {
      toast.error('순서 변경에 실패했습니다')
    }
  }, [state.contentId])

  const movePageToCurriculum = useCallback(async (
    pageId: string,
    fromCurriculumId: string,
    toCurriculumId: string
  ) => {
    try {
      const response = await fetch(
        `/api/courses/${state.contentId}/curriculums/${fromCurriculumId}/pages/${pageId}/move`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toCurriculumId }),
        }
      )

      if (response.ok) {
        setState((prev) => {
          const fromCurriculum = prev.curriculums.find((c) => c.id === fromCurriculumId)
          const page = fromCurriculum?.pages.find((p) => p.id === pageId)

          if (!page) return prev

          return {
            ...prev,
            curriculums: prev.curriculums.map((c) => {
              if (c.id === fromCurriculumId) {
                return { ...c, pages: c.pages.filter((p) => p.id !== pageId) }
              }
              if (c.id === toCurriculumId) {
                return { ...c, pages: [...c.pages, page] }
              }
              return c
            }),
            hasUnpublishedChanges: true,
          }
        })
        toast.success('페이지가 이동되었습니다')
      } else {
        throw new Error('Failed to move page')
      }
    } catch {
      toast.error('페이지 이동에 실패했습니다')
    }
  }, [state.contentId])

  const saveContent = useCallback(async () => {
    if (pendingContentRef.current && state.selectedPageId) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }

      setState((prev) => ({ ...prev, saveStatus: 'saving' }))

      try {
        const curriculum = state.curriculums.find((c) =>
          c.pages.some((p) => p.id === state.selectedPageId)
        )

        if (curriculum) {
          const response = await fetch(
            `/api/courses/${state.contentId}/curriculums/${curriculum.id}/pages/${state.selectedPageId}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: pendingContentRef.current }),
            }
          )

          if (response.ok) {
            setState((prev) => ({
              ...prev,
              saveStatus: 'saved',
              isDirty: false,
              hasUnpublishedChanges: true,
            }))
            pendingContentRef.current = null
          } else {
            throw new Error('Save failed')
          }
        }
      } catch {
        setState((prev) => ({ ...prev, saveStatus: 'error' }))
        toast.error('저장에 실패했습니다')
      }
    }
  }, [state.contentId, state.selectedPageId, state.curriculums])

  const publish = useCallback(async () => {
    try {
      // Save any pending changes first
      await saveContent()

      const response = await fetch(`/api/courses/${state.contentId}/publish`, {
        method: 'POST',
      })

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          isPublished: true,
          publishedAt: new Date(),
          hasUnpublishedChanges: false,
        }))
        toast.success('콘텐츠가 게시되었습니다')
      } else {
        throw new Error('Publish failed')
      }
    } catch {
      toast.error('게시에 실패했습니다')
    }
  }, [state.contentId, saveContent])

  const refreshData = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${state.contentId}`)
      if (response.ok) {
        const data = await response.json()
        setState((prev) => ({
          ...prev,
          title: data.title,
          isPublished: data.isPublished,
          publishedAt: data.publishedAt,
          curriculums: data.curriculums.map((c: CurriculumItem & { pages: PageItem[] }) => ({
            ...c,
            pages: c.pages || [],
          })),
        }))
      }
    } catch {
      toast.error('데이터를 불러오는데 실패했습니다')
    }
  }, [state.contentId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const value: EditorContextType = {
    ...state,
    setTitle,
    selectPage,
    setCurrentPageContent,
    setCurriculums,
    addCurriculum,
    addPage,
    renameCurriculum,
    renamePage,
    duplicateCurriculum,
    duplicatePage,
    deleteCurriculum,
    deletePage,
    reorderCurriculums,
    reorderPages,
    movePageToCurriculum,
    saveContent,
    publish,
    refreshData,
  }

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}
