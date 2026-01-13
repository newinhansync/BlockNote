'use client'

import { ReactNode } from 'react'

interface EditorLayoutProps {
  children: ReactNode
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-white">
      {children}
    </div>
  )
}
