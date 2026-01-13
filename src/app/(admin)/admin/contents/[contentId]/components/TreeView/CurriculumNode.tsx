'use client'

import { MouseEvent, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronDown, ChevronRight, Folder, GripVertical } from 'lucide-react'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { PageNode } from './PageNode'
import { CurriculumItem } from './types'

interface CurriculumNodeProps {
  curriculum: CurriculumItem
  selectedPageId: string | null
  selectedCurriculumId: string | null
  editingNodeId: string | null
  activeId: string | null
  overId: string | null
  isDraggingPage?: boolean
  onSelectPage: (pageId: string) => void
  onSelectCurriculum: (curriculumId: string) => void
  onCurriculumContextMenu: (e: MouseEvent, curriculumId: string) => void
  onPageContextMenu: (e: MouseEvent, pageId: string, curriculumId: string) => void
  onRenameCurriculum: (curriculumId: string, title: string) => void
  onRenamePage: (pageId: string, title: string) => void
  onEditingChange: (nodeId: string | null) => void
}

export function CurriculumNode({
  curriculum,
  selectedPageId,
  selectedCurriculumId,
  editingNodeId,
  activeId,
  overId,
  isDraggingPage = false,
  onSelectPage,
  onSelectCurriculum,
  onCurriculumContextMenu,
  onPageContextMenu,
  onRenameCurriculum,
  onRenamePage,
  onEditingChange,
}: CurriculumNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: curriculum.id,
    data: {
      type: 'curriculum',
      curriculum,
    },
  })

  // Make curriculum header droppable for pages
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${curriculum.id}`,
    data: {
      type: 'curriculum',
      curriculumId: curriculum.id,
    },
  })

  // Make empty state area droppable for pages (when curriculum has no pages)
  const { setNodeRef: setEmptyDroppableRef, isOver: isOverEmpty } = useDroppable({
    id: `droppable-empty-${curriculum.id}`,
    data: {
      type: 'curriculum-empty',
      curriculumId: curriculum.id,
    },
    disabled: curriculum.pages.length > 0, // Only enable when empty
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCurriculumContextMenu(e, curriculum.id)
  }

  const isEditingThis = editingNodeId === curriculum.id
  const isSelectedCurriculum = selectedCurriculumId === curriculum.id && !selectedPageId

  const handleCurriculumClick = (e: MouseEvent) => {
    // Don't select if clicking on toggle, drag handle, or inline edit
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input')) {
      return
    }
    onSelectCurriculum(curriculum.id)
  }

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={isDragging ? 'ring-2 ring-blue-400 rounded' : ''}
    >
      {/* Curriculum Header */}
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer transition-colors hover:bg-gray-100 ${
          isOver ? 'bg-blue-50' : ''
        } ${isSelectedCurriculum ? 'bg-blue-100 ring-1 ring-blue-400' : ''}`}
        onClick={handleCurriculumClick}
        onContextMenu={handleContextMenu}
        ref={setDroppableRef}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>

        {/* Expand/Collapse Toggle */}
        <button
          onClick={handleToggle}
          className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Folder Icon */}
        <Folder size={16} className="text-yellow-500" />

        {/* Curriculum Title */}
        <div className="flex-1 min-w-0">
          <InlineEdit
            value={curriculum.title}
            onSave={(title) => onRenameCurriculum(curriculum.id, title)}
            isEditing={isEditingThis}
            onEditingChange={(editing) => onEditingChange(editing ? curriculum.id : null)}
            className="truncate text-sm font-medium text-gray-700"
            inputClassName="w-full"
          />
        </div>

        {/* Page Count */}
        <span className="text-xs text-gray-400 mr-1">
          {curriculum.pages.length}
        </span>
      </div>

      {/* Pages */}
      {isExpanded && curriculum.pages.length > 0 && (
        <div className="ml-6 mt-1 space-y-0.5">
          <SortableContext
            items={curriculum.pages.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {curriculum.pages.map((page, index) => (
              <PageNode
                key={page.id}
                page={page}
                curriculumId={curriculum.id}
                isSelected={selectedPageId === page.id}
                isEditing={editingNodeId === page.id}
                isDragOver={overId === page.id && activeId !== page.id}
                isBeingDragged={activeId === page.id}
                onSelect={() => onSelectPage(page.id)}
                onContextMenu={(e) => onPageContextMenu(e, page.id, curriculum.id)}
                onRename={(title) => onRenamePage(page.id, title)}
                onEditingChange={(editing) => onEditingChange(editing ? page.id : null)}
              />
            ))}
          </SortableContext>
        </div>
      )}

      {/* Empty State / Drop Zone */}
      {isExpanded && curriculum.pages.length === 0 && (
        <div
          ref={setEmptyDroppableRef}
          onClick={() => onSelectCurriculum(curriculum.id)}
          className={`ml-6 mt-1 py-4 px-2 rounded border-2 border-dashed transition-all cursor-pointer ${
            isDraggingPage
              ? isOver || isOverEmpty
                ? 'border-blue-500 bg-blue-100 text-blue-700 scale-[1.02]'
                : 'border-blue-300 bg-blue-50 text-blue-600'
              : isSelectedCurriculum
                ? 'border-blue-400 bg-blue-50 text-blue-600'
                : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="text-xs text-center">
            {isDraggingPage ? (
              <span className="font-medium">여기에 페이지를 놓으세요</span>
            ) : isSelectedCurriculum ? (
              <span className="font-medium">페이지 추가 버튼을 눌러 페이지를 추가하세요</span>
            ) : (
              <span>클릭하여 선택 후 페이지를 추가하세요</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
