'use client'

import { MouseEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FileText, GripVertical } from 'lucide-react'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { PageItem } from './types'

interface PageNodeProps {
  page: PageItem
  curriculumId: string
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onContextMenu: (e: MouseEvent) => void
  onRename: (title: string) => void
  onEditingChange: (isEditing: boolean) => void
}

export function PageNode({
  page,
  curriculumId,
  isSelected,
  isEditing,
  onSelect,
  onContextMenu,
  onRename,
  onEditingChange,
}: PageNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    data: {
      type: 'page',
      curriculumId,
      page,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (!isEditing) {
      onSelect()
    }
  }

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu(e)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-100 text-blue-700'
          : 'hover:bg-gray-100 text-gray-700'
      } ${isDragging ? 'ring-2 ring-blue-400' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
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

      {/* Page Icon */}
      <FileText size={16} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />

      {/* Page Title */}
      <div className="flex-1 min-w-0">
        <InlineEdit
          value={page.title}
          onSave={onRename}
          isEditing={isEditing}
          onEditingChange={onEditingChange}
          className={`truncate text-sm ${isSelected ? 'font-medium' : ''}`}
          inputClassName="w-full"
        />
      </div>
    </div>
  )
}
