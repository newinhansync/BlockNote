'use client'

import { ReactNode, useEffect, useRef, useState, MouseEvent } from 'react'
import { createPortal } from 'react-dom'

interface Position {
  x: number
  y: number
}

interface ContextMenuProps {
  children: ReactNode
  position: Position | null
  onClose: () => void
}

export function ContextMenu({ children, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState<Position | null>(null)

  useEffect(() => {
    if (position && menuRef.current) {
      const menu = menuRef.current
      const rect = menu.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = position.x
      let y = position.y

      // Adjust if menu goes off right edge
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 8
      }

      // Adjust if menu goes off bottom edge
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 8
      }

      // Ensure minimum margins
      x = Math.max(8, x)
      y = Math.max(8, y)

      setAdjustedPosition({ x, y })
    }
  }, [position])

  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleScroll = () => {
      onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  if (!position) return null

  const finalPosition = adjustedPosition || position

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-fade-in"
      style={{
        left: finalPosition.x,
        top: finalPosition.y,
      }}
    >
      {children}
    </div>,
    document.body
  )
}

interface ContextMenuItemProps {
  children: ReactNode
  onClick: () => void
  icon?: ReactNode
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export function ContextMenuItem({
  children,
  onClick,
  icon,
  variant = 'default',
  disabled = false,
}: ContextMenuItemProps) {
  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      onClick()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
        disabled
          ? 'text-gray-300 cursor-not-allowed'
          : variant === 'danger'
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon && <span className="w-4 h-4 flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  )
}

export function ContextMenuDivider() {
  return <div className="my-1 h-px bg-gray-200" />
}
