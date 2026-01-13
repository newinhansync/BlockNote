'use client'

import dynamic from 'next/dynamic'
import type { Block } from '@blocknote/core'

const BlockNoteViewer = dynamic(
  () => import('@/components/editor/BlockNoteViewer').then(mod => mod.BlockNoteViewer),
  { ssr: false, loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" /> }
)

interface PageContentViewerProps {
  content: Block[]
}

export function PageContentViewer({ content }: PageContentViewerProps) {
  return <BlockNoteViewer content={content} />
}
