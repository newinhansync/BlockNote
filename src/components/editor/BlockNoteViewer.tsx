'use client'

import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { Block } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

interface BlockNoteViewerProps {
  content: Block[]
}

export function BlockNoteViewer({ content }: BlockNoteViewerProps) {
  const editor = useCreateBlockNote({
    initialContent: content && content.length > 0 ? content : undefined,
  })

  return (
    <div className="blocknote-viewer-wrapper">
      <BlockNoteView
        editor={editor}
        editable={false}
        theme="light"
      />
    </div>
  )
}
