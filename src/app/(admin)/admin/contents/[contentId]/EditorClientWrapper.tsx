'use client'

import { EditorProvider, useEditor } from './context/EditorContext'
import { EditorHeader } from './components/EditorHeader'
import { CurriculumSidebar } from './components/CurriculumSidebar'
import { ContentEditor } from './components/ContentEditor'
import { CurriculumItem } from './components/TreeView'

interface InitialData {
  contentId: string
  title: string
  isPublished: boolean
  publishedAt: Date | null
  curriculums: CurriculumItem[]
}

interface EditorClientWrapperProps {
  initialData: InitialData
}

function EditorContent() {
  const {
    contentId,
    title,
    saveStatus,
    isPublished,
    hasUnpublishedChanges,
    curriculums,
    selectedPageId,
    currentPageContent,
    currentPageTitle,
    isLoading,
    setTitle,
    selectPage,
    setCurrentPageContent,
    setCurriculums,
    addCurriculum,
    addPage,
    renameCurriculum,
    renamePage,
    duplicateCurriculum,
    duplicatePage,
    deleteCurriculum,
    deletePage,
    reorderCurriculums,
    reorderPages,
    movePageToCurriculum,
    publish,
  } = useEditor()

  return (
    <>
      {/* Header */}
      <EditorHeader
        contentId={contentId}
        title={title}
        saveStatus={saveStatus}
        isPublished={isPublished}
        hasUnpublishedChanges={hasUnpublishedChanges}
        onTitleChange={setTitle}
        onPublish={publish}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <CurriculumSidebar
          contentId={contentId}
          curriculums={curriculums}
          selectedPageId={selectedPageId}
          onSelectPage={selectPage}
          onCurriculumsChange={setCurriculums}
          onAddCurriculum={addCurriculum}
          onAddPage={addPage}
          onRenameCurriculum={renameCurriculum}
          onRenamePage={renamePage}
          onDuplicateCurriculum={duplicateCurriculum}
          onDuplicatePage={duplicatePage}
          onDeleteCurriculum={deleteCurriculum}
          onDeletePage={deletePage}
          onReorderCurriculums={reorderCurriculums}
          onReorderPages={reorderPages}
          onMovePageToCurriculum={movePageToCurriculum}
        />

        {/* Editor */}
        <ContentEditor
          pageId={selectedPageId}
          pageTitle={currentPageTitle}
          content={currentPageContent}
          onChange={setCurrentPageContent}
          isLoading={isLoading}
        />
      </div>
    </>
  )
}

export function EditorClientWrapper({ initialData }: EditorClientWrapperProps) {
  return (
    <EditorProvider initialData={initialData}>
      <EditorContent />
    </EditorProvider>
  )
}
