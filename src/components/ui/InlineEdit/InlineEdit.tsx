'use client'

import { useState, useRef, useEffect, KeyboardEvent, MouseEvent } from 'react'

interface InlineEditProps {
  value: string
  onSave: (value: string) => void
  className?: string
  inputClassName?: string
  placeholder?: string
  isEditing?: boolean
  onEditingChange?: (isEditing: boolean) => void
}

export function InlineEdit({
  value,
  onSave,
  className = '',
  inputClassName = '',
  placeholder = '입력하세요',
  isEditing: externalIsEditing,
  onEditingChange,
}: InlineEditProps) {
  const [internalIsEditing, setInternalIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Use external or internal editing state
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing
  const setIsEditing = onEditingChange || setInternalIsEditing

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleDoubleClick = (e: MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editValue.trim() && editValue !== value) {
      onSave(editValue.trim())
    } else {
      setEditValue(value)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setEditValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white border border-blue-500 rounded px-2 py-1 outline-none text-sm ${inputClassName}`}
        placeholder={placeholder}
      />
    )
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={`cursor-text select-none ${className}`}
      title="더블클릭하여 수정"
    >
      {value || placeholder}
    </span>
  )
}
