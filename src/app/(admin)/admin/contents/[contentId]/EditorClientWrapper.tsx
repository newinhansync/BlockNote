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

interface CollaborationUser {
  id: string
  name: string
  email: string
}

interface EditorClientWrapperProps {
  initialData: InitialData
  user: CollaborationUser
  isPopup?: boolean
}

function EditorContent({ isPopup = false }: { isPopup?: boolean }) {
  const {
    contentId,
    title,
    saveStatus,
    isPublished,
    hasUnpublishedChanges,
    curriculums,
    selectedPageId,
    selectedCurriculumId,
    currentPageContent,
    currentPageTitle,
    isLoading,
    user,
    setTitle,
    selectPage,
    selectCurriculum,
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
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar */}
        <CurriculumSidebar
          contentId={contentId}
          curriculums={curriculums}
          selectedPageId={selectedPageId}
          selectedCurriculumId={selectedCurriculumId}
          onSelectPage={selectPage}
          onSelectCurriculum={selectCurriculum}
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

        {/* Editor with Real-time Collaboration */}
        <ContentEditor
          pageId={selectedPageId}
          pageTitle={currentPageTitle}
          content={currentPageContent}
          onChange={setCurrentPageContent}
          isLoading={isLoading}
          user={user}
        />
      </div>
    </>
  )
}

export function EditorClientWrapper({ initialData, user, isPopup = false }: EditorClientWrapperProps) {
  return (
    <EditorProvider initialData={initialData} user={user}>
      <EditorContent isPopup={isPopup} />
    </EditorProvider>
  )
}
