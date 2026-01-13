'use client'

import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { Block } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

interface BlockNoteEditorProps {
  initialContent?: Block[]
  onChange?: (content: Block[]) => void
  editable?: boolean
}

// Upload file handler for BlockNote
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '파일 업로드에 실패했습니다.')
  }

  const data = await response.json()
  return data.url
}

export function BlockNoteEditor({ initialContent, onChange, editable = true }: BlockNoteEditorProps) {
  const editor = useCreateBlockNote({
    initialContent: initialContent && initialContent.length > 0 ? initialContent : undefined,
    uploadFile,
  })

  return (
    <div className="blocknote-editor-wrapper">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={() => {
          if (onChange) {
            onChange(editor.document)
          }
        }}
        theme="light"
      />
    </div>
  )
}
