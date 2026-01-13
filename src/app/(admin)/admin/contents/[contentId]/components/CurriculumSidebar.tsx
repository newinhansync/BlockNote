'use client'

import { useState, MouseEvent } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, FolderPlus, FilePlus } from 'lucide-react'
import { ContextMenu, ContextMenuItem, ContextMenuDivider } from '@/components/ui/ContextMenu'
import { CurriculumNode, CurriculumItem, TreeContextMenuState } from './TreeView'
import { Edit, Copy, Trash2 } from 'lucide-react'

interface CurriculumSidebarProps {
  contentId: string
  curriculums: CurriculumItem[]
  selectedPageId: string | null
  onSelectPage: (pageId: string) => void
  onCurriculumsChange: (curriculums: CurriculumItem[]) => void
  onAddCurriculum: () => void
  onAddPage: (curriculumId: string) => void
  onRenameCurriculum: (curriculumId: string, title: string) => void
  onRenamePage: (pageId: string, title: string) => void
  onDuplicateCurriculum: (curriculumId: string) => void
  onDuplicatePage: (pageId: string, curriculumId: string) => void
  onDeleteCurriculum: (curriculumId: string) => void
  onDeletePage: (pageId: string, curriculumId: string) => void
  onReorderCurriculums: (curriculumIds: string[]) => void
  onReorderPages: (curriculumId: string, pageIds: string[]) => void
  onMovePageToCurriculum: (pageId: string, fromCurriculumId: string, toCurriculumId: string) => void
}

export function CurriculumSidebar({
  contentId,
  curriculums,
  selectedPageId,
  onSelectPage,
  onCurriculumsChange,
  onAddCurriculum,
  onAddPage,
  onRenameCurriculum,
  onRenamePage,
  onDuplicateCurriculum,
  onDuplicatePage,
  onDeleteCurriculum,
  onDeletePage,
  onReorderCurriculums,
  onReorderPages,
  onMovePageToCurriculum,
}: CurriculumSidebarProps) {
  const [contextMenu, setContextMenu] = useState<TreeContextMenuState | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDragType, setActiveDragType] = useState<'curriculum' | 'page' | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    setActiveDragType(active.data.current?.type || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over for moving pages between curriculums
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setActiveDragType(null)

    if (!over) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    // Curriculum reordering
    if (activeType === 'curriculum' && overType === 'curriculum') {
      if (active.id !== over.id) {
        const oldIndex = curriculums.findIndex((c) => c.id === active.id)
        const newIndex = curriculums.findIndex((c) => c.id === over.id)
        const newCurriculums = arrayMove(curriculums, oldIndex, newIndex)
        onCurriculumsChange(newCurriculums)
        onReorderCurriculums(newCurriculums.map((c) => c.id))
      }
      return
    }

    // Page reordering within same curriculum
    if (activeType === 'page' && overType === 'page') {
      const activeCurriculumId = active.data.current?.curriculumId
      const overCurriculumId = over.data.current?.curriculumId

      if (activeCurriculumId === overCurriculumId) {
        const curriculum = curriculums.find((c) => c.id === activeCurriculumId)
        if (curriculum) {
          const oldIndex = curriculum.pages.findIndex((p) => p.id === active.id)
          const newIndex = curriculum.pages.findIndex((p) => p.id === over.id)

          if (oldIndex !== newIndex) {
            const newPages = arrayMove(curriculum.pages, oldIndex, newIndex)
            const newCurriculums = curriculums.map((c) =>
              c.id === activeCurriculumId ? { ...c, pages: newPages } : c
            )
            onCurriculumsChange(newCurriculums)
            onReorderPages(activeCurriculumId, newPages.map((p) => p.id))
          }
        }
      } else {
        // Moving page to different curriculum
        onMovePageToCurriculum(active.id as string, activeCurriculumId, overCurriculumId)
      }
      return
    }

    // Page dropped on curriculum (move to that curriculum)
    if (activeType === 'page' && over.id.toString().startsWith('droppable-')) {
      const toCurriculumId = over.data.current?.curriculumId
      const fromCurriculumId = active.data.current?.curriculumId

      if (toCurriculumId !== fromCurriculumId) {
        onMovePageToCurriculum(active.id as string, fromCurriculumId, toCurriculumId)
      }
    }
  }

  const handleCurriculumContextMenu = (e: MouseEvent, curriculumId: string) => {
    setContextMenu({
      type: 'curriculum',
      id: curriculumId,
      position: { x: e.clientX, y: e.clientY },
    })
  }

  const handlePageContextMenu = (e: MouseEvent, pageId: string, curriculumId: string) => {
    setContextMenu({
      type: 'page',
      id: pageId,
      curriculumId,
      position: { x: e.clientX, y: e.clientY },
    })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return

    switch (action) {
      case 'rename':
        setEditingNodeId(contextMenu.id)
        break
      case 'addPage':
        if (contextMenu.type === 'curriculum') {
          onAddPage(contextMenu.id)
        }
        break
      case 'duplicate':
        if (contextMenu.type === 'curriculum') {
          onDuplicateCurriculum(contextMenu.id)
        } else if (contextMenu.curriculumId) {
          onDuplicatePage(contextMenu.id, contextMenu.curriculumId)
        }
        break
      case 'delete':
        if (contextMenu.type === 'curriculum') {
          onDeleteCurriculum(contextMenu.id)
        } else if (contextMenu.curriculumId) {
          onDeletePage(contextMenu.id, contextMenu.curriculumId)
        }
        break
    }

    closeContextMenu()
  }

  // Find selected curriculum for "Add Page" button
  const selectedCurriculumId = selectedPageId
    ? curriculums.find((c) => c.pages.some((p) => p.id === selectedPageId))?.id
    : curriculums[0]?.id

  return (
    <aside className="w-64 border-r border-gray-200 flex flex-col bg-gray-50 flex-shrink-0">
      {/* Header with action buttons */}
      <div className="p-3 border-b border-gray-200 flex gap-2">
        <button
          onClick={onAddCurriculum}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          title="새 커리큘럼 추가"
        >
          <FolderPlus size={16} />
          커리큘럼
        </button>
        <button
          onClick={() => selectedCurriculumId && onAddPage(selectedCurriculumId)}
          disabled={!selectedCurriculumId}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="선택된 커리큘럼에 페이지 추가"
        >
          <FilePlus size={16} />
          페이지
        </button>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={curriculums.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {curriculums.map((curriculum) => (
                <CurriculumNode
                  key={curriculum.id}
                  curriculum={curriculum}
                  selectedPageId={selectedPageId}
                  editingNodeId={editingNodeId}
                  onSelectPage={onSelectPage}
                  onCurriculumContextMenu={handleCurriculumContextMenu}
                  onPageContextMenu={handlePageContextMenu}
                  onRenameCurriculum={onRenameCurriculum}
                  onRenamePage={onRenamePage}
                  onEditingChange={setEditingNodeId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {curriculums.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-3">커리큘럼이 없습니다</p>
            <button
              onClick={onAddCurriculum}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              첫 커리큘럼 만들기
            </button>
          </div>
        )}
      </div>

      {/* Context Menu */}
      <ContextMenu position={contextMenu?.position || null} onClose={closeContextMenu}>
        {contextMenu?.type === 'curriculum' && (
          <>
            <ContextMenuItem
              icon={<FilePlus size={14} />}
              onClick={() => handleContextMenuAction('addPage')}
            >
              페이지 추가
            </ContextMenuItem>
            <ContextMenuDivider />
            <ContextMenuItem
              icon={<Edit size={14} />}
              onClick={() => handleContextMenuAction('rename')}
            >
              이름 변경
            </ContextMenuItem>
            <ContextMenuItem
              icon={<Copy size={14} />}
              onClick={() => handleContextMenuAction('duplicate')}
            >
              복제
            </ContextMenuItem>
            <ContextMenuDivider />
            <ContextMenuItem
              icon={<Trash2 size={14} />}
              variant="danger"
              onClick={() => handleContextMenuAction('delete')}
            >
              삭제
            </ContextMenuItem>
          </>
        )}
        {contextMenu?.type === 'page' && (
          <>
            <ContextMenuItem
              icon={<Edit size={14} />}
              onClick={() => handleContextMenuAction('rename')}
            >
              이름 변경
            </ContextMenuItem>
            <ContextMenuItem
              icon={<Copy size={14} />}
              onClick={() => handleContextMenuAction('duplicate')}
            >
              복제
            </ContextMenuItem>
            <ContextMenuDivider />
            <ContextMenuItem
              icon={<Trash2 size={14} />}
              variant="danger"
              onClick={() => handleContextMenuAction('delete')}
            >
              삭제
            </ContextMenuItem>
          </>
        )}
      </ContextMenu>
    </aside>
  )
}
