export interface PageItem {
  id: string
  title: string
  order: number
  isPublished: boolean
}

export interface CurriculumItem {
  id: string
  title: string
  order: number
  pages: PageItem[]
}

export interface TreeContextMenuState {
  type: 'curriculum' | 'page'
  id: string
  curriculumId?: string
  position: { x: number; y: number }
}
