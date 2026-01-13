'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Edit, Plus, FileText, GripVertical } from 'lucide-react'

interface Page {
  id: string
  title: string
  order: number
}

interface Curriculum {
  id: string
  title: string
  order: number
  pages: Page[]
}

interface SortableCurriculumListProps {
  courseId: string
  initialCurriculums: Curriculum[]
}

function SortableCurriculumItem({
  curriculum,
  courseId,
  index,
}: {
  curriculum: Curriculum
  courseId: string
  index: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: curriculum.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-6 rounded-lg shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
            title="드래그하여 순서 변경"
          >
            <GripVertical size={20} />
          </button>
          <div>
            <span className="text-gray-400 text-sm">Chapter {index + 1}</span>
            <h3 className="text-lg font-medium">{curriculum.title}</h3>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/courses/${courseId}/curriculums/${curriculum.id}/pages/new`}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            <Plus size={14} />
            페이지 추가
          </Link>
          <Link
            href={`/admin/courses/${courseId}/curriculums/${curriculum.id}/edit`}
            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
            title="커리큘럼 수정"
          >
            <Edit size={16} />
          </Link>
        </div>
      </div>

      {curriculum.pages.length === 0 ? (
        <p className="text-gray-400 text-sm">페이지가 없습니다.</p>
      ) : (
        <SortablePageList
          courseId={courseId}
          curriculumId={curriculum.id}
          initialPages={curriculum.pages}
        />
      )}
    </div>
  )
}

function SortablePageItem({
  page,
  courseId,
  curriculumId,
  index,
}: {
  page: Page
  courseId: string
  curriculumId: string
  index: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li ref={setNodeRef} style={style}>
      <div className="flex items-center gap-3 p-3 rounded hover:bg-gray-50 transition-colors">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
          title="드래그하여 순서 변경"
        >
          <GripVertical size={16} />
        </button>
        <Link
          href={`/admin/courses/${courseId}/curriculums/${curriculumId}/pages/${page.id}`}
          className="flex items-center gap-3 flex-1"
        >
          <FileText size={16} className="text-gray-400" />
          <span className="text-gray-500 text-sm">{index + 1}.</span>
          <span>{page.title}</span>
        </Link>
      </div>
    </li>
  )
}

function SortablePageList({
  courseId,
  curriculumId,
  initialPages,
}: {
  courseId: string
  curriculumId: string
  initialPages: Page[]
}) {
  const [pages, setPages] = useState(initialPages)
  const [isSaving, setIsSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.id === active.id)
      const newIndex = pages.findIndex((p) => p.id === over.id)

      const newPages = arrayMove(pages, oldIndex, newIndex)
      setPages(newPages)

      // Save to server
      setIsSaving(true)
      try {
        await fetch(
          `/api/courses/${courseId}/curriculums/${curriculumId}/pages/reorder`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageIds: newPages.map((p) => p.id) }),
          }
        )
      } catch (error) {
        console.error('Failed to save page order:', error)
        // Revert on error
        setPages(initialPages)
      } finally {
        setIsSaving(false)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={pages} strategy={verticalListSortingStrategy}>
        <ul className={`space-y-2 ${isSaving ? 'opacity-50' : ''}`}>
          {pages.map((page, index) => (
            <SortablePageItem
              key={page.id}
              page={page}
              courseId={courseId}
              curriculumId={curriculumId}
              index={index}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

export function SortableCurriculumList({
  courseId,
  initialCurriculums,
}: SortableCurriculumListProps) {
  const [curriculums, setCurriculums] = useState(initialCurriculums)
  const [isSaving, setIsSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = curriculums.findIndex((c) => c.id === active.id)
      const newIndex = curriculums.findIndex((c) => c.id === over.id)

      const newCurriculums = arrayMove(curriculums, oldIndex, newIndex)
      setCurriculums(newCurriculums)

      // Save to server
      setIsSaving(true)
      try {
        await fetch(`/api/courses/${courseId}/curriculums/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            curriculumIds: newCurriculums.map((c) => c.id),
          }),
        })
      } catch (error) {
        console.error('Failed to save curriculum order:', error)
        // Revert on error
        setCurriculums(initialCurriculums)
      } finally {
        setIsSaving(false)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={curriculums}
        strategy={verticalListSortingStrategy}
      >
        <div className={`space-y-4 ${isSaving ? 'opacity-50' : ''}`}>
          {curriculums.map((curriculum, index) => (
            <SortableCurriculumItem
              key={curriculum.id}
              curriculum={curriculum}
              courseId={courseId}
              index={index}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
