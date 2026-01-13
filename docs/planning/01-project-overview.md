# 01. 프로젝트 개요

## 프로젝트명
BlockNote 기반 콘텐츠 저작 도구

## 목표
TouchClass와 연동 가능한 형태를 지향하되, 현재는 독립적으로 동작하는 **Standalone 콘텐츠 저작 도구** 개발

## 사용자 역할

### 관리자 (Admin)
- 콘텐츠 생성/수정/삭제
- Course, Curriculum, Page 계층 구조 관리
- BlockNote 에디터를 통한 Page 콘텐츠 저작

### 일반 사용자 (Viewer)
- 생성된 콘텐츠 조회
- 마크다운/JSON 형태로 렌더링된 콘텐츠 열람

## 데이터 구조

```
Course (강의/코스)
├── id: string (UUID)
├── title: string
├── description: string
├── createdAt: datetime
├── updatedAt: datetime
└── curriculums: Curriculum[]

Curriculum (챕터/커리큘럼)
├── id: string (UUID)
├── title: string
├── order: number
├── courseId: string (FK)
├── createdAt: datetime
├── updatedAt: datetime
└── pages: Page[]

Page (페이지)
├── id: string (UUID)
├── title: string
├── content: JSON (BlockNote 에디터 데이터)
├── order: number
├── curriculumId: string (FK)
├── createdAt: datetime
└── updatedAt: datetime
```

## 핵심 기능

### MVP (Phase 1)
- [ ] Course CRUD
- [ ] Curriculum CRUD
- [ ] Page CRUD with BlockNote 에디터
- [ ] 콘텐츠 뷰어 (읽기 전용)

### Phase 2
- [ ] 사용자 인증/권한
- [ ] 콘텐츠 버전 관리
- [ ] 미디어 파일 업로드

### Phase 3
- [ ] TouchClass API 연동
- [ ] 콘텐츠 내보내기 (PDF, HTML)
- [ ] 협업 기능

## 진행 상태
- [x] 프로젝트 초기화
- [x] CLAUDE.md 생성
- [x] docs/ 폴더 구조 생성
- [ ] Next.js 환경 설정
- [ ] 데이터베이스 스키마 설계
- [ ] BlockNote 에디터 통합
