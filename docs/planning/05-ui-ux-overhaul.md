# 05. UI/UX 전면 개편 계획서

## 개요

### 목표
기존 게시판 형태(Form-based) UI를 **Notion과 유사한 애플리케이션 UI**로 전면 개편하여 상용 SaaS 수준의 사용자 경험을 제공한다.

### 디자인 컨셉
**미니멀리즘(Minimalism)** - 불필요한 요소를 제거하고 핵심 기능에 집중하는 클린한 인터페이스

### 핵심 변경 사항
1. 용어 통일: '강의' → '콘텐츠'로 전면 변경
2. 레이아웃: Form 기반 → 애플리케이션 레이아웃 (사이드바 + 에디터)
3. 저장 방식: 수동 저장 → 자동 저장 + 게시(Publish) 시스템
4. 인터랙션: 기본 CRUD → 드래그앤드롭, 인라인 편집, 컨텍스트 메뉴

---

## Phase 1: 공통 기반 작업

### 1.1 용어 변경 (Terminology)

| 현재 용어 | 변경 후 |
|----------|--------|
| 강의 | 콘텐츠 |
| 강의 관리 | 콘텐츠 관리 |
| 강의 목록 | 콘텐츠 목록 |
| 새 강의 | 새 콘텐츠 |

**작업 범위:**
- [x] 데이터베이스 모델명은 유지 (Course) ✅
- [x] UI 텍스트 전면 변경 ✅
- [ ] URL 경로 변경 검토 (선택적)

### 1.2 Toast 알림 시스템

**구현 사항:**
- [x] Toast Provider 컴포넌트 생성 ✅
- [x] Toast 유형: success, error, warning, info ✅
- [x] 자동 사라짐 (3초) ✅
- [x] 수동 닫기 버튼 ✅

**적용 액션:**
- 저장 완료/실패
- 삭제 완료/실패
- 게시 완료/실패
- 복제 완료
- 순서 변경 완료

### 1.3 데이터베이스 스키마 변경

```prisma
model Course {
  id          String       @id @default(uuid())
  title       String
  description String?

  // 새로 추가할 필드
  isPublished Boolean      @default(false)  // 게시 상태
  publishedAt DateTime?                      // 최종 게시 시간
  draftContent Json?                         // 초안 내용 (선택적)

  curriculums Curriculum[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Page {
  id           String        @id @default(uuid())
  title        String
  content      Json          @default("[]")

  // 새로 추가할 필드
  isPublished  Boolean       @default(false)
  publishedContent Json?     // 게시된 콘텐츠
  publishedAt  DateTime?
  likeCount    Int           @default(0)     // 좋아요 수

  order        Int           @default(0)
  curriculum   Curriculum    @relation(...)
  curriculumId String
  versions     PageVersion[]
  comments     Comment[]
  likes        PageLike[]    // 좋아요 관계
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

// 새로 추가할 모델
model PageLike {
  id        String   @id @default(uuid())
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  pageId    String
  userId    String   // 익명 사용자면 sessionId
  createdAt DateTime @default(now())

  @@unique([pageId, userId])
  @@map("page_likes")
}

model UserProgress {
  id           String   @id @default(uuid())
  userId       String
  courseId     String
  completedPages String[] // 완료한 페이지 ID 배열
  lastPageId   String?   // 마지막으로 본 페이지
  progress     Float     @default(0) // 진행률 (0-100)
  updatedAt    DateTime  @updatedAt

  @@unique([userId, courseId])
  @@map("user_progress")
}
```

---

## Phase 2: 콘텐츠 저작 도구 (Authoring Tool)

### 2.1 전체 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────┐
│  [←] │     콘텐츠 타이틀 (편집 가능)     │ 저장됨 │ 미리보기 │ 게시 │
├──────┴───────────────────────────────────┴────────┴─────────┴──────┤
│         │                                                          │
│  사이드  │                                                          │
│  바      │              BlockNote 에디터                            │
│         │              (Full Height)                               │
│  Tree   │                                                          │
│  View   │                                                          │
│         │                                                          │
│  250px  │                          나머지 영역                      │
│         │                                                          │
└─────────┴──────────────────────────────────────────────────────────┘
```

**파일 구조:**
```
src/app/(admin)/admin/contents/
├── [contentId]/
│   ├── page.tsx              # 메인 에디터 페이지
│   ├── layout.tsx            # 에디터 레이아웃
│   └── components/
│       ├── EditorHeader.tsx      # 상단 헤더
│       ├── CurriculumSidebar.tsx # 좌측 사이드바
│       ├── ContentEditor.tsx     # 우측 에디터
│       ├── TreeView/
│       │   ├── TreeNode.tsx
│       │   ├── CurriculumNode.tsx
│       │   └── PageNode.tsx
│       └── ContextMenu.tsx       # 우클릭 메뉴
├── new/
│   └── page.tsx              # 새 콘텐츠 생성
└── page.tsx                  # 콘텐츠 목록 (대시보드)
```

### 2.2 상단 헤더 (EditorHeader)

**구성 요소:**
```tsx
interface EditorHeaderProps {
  contentId: string
  title: string
  saveStatus: 'saving' | 'saved' | 'error' | 'idle'
  isPublished: boolean
  onTitleChange: (title: string) => void
  onPreview: () => void
  onPublish: () => void
}
```

**UI 요소:**
- [ ] 뒤로가기 버튼 (← 대시보드로 이동)
- [ ] 타이틀 (인라인 편집 가능, 더블클릭 또는 클릭)
- [ ] 저장 상태 표시기
  - `saving`: 스피너 + "저장 중..."
  - `saved`: 체크 아이콘 + "저장됨" (회색, 작게)
  - `error`: 경고 아이콘 + "저장 실패" (빨간색)
- [ ] 미리보기 버튼 (새 탭에서 Viewer 열기)
- [ ] 게시하기 버튼 (Primary 스타일, 파란색)
  - 게시되지 않은 변경사항 있으면 "게시하기"
  - 최신 상태면 "게시됨 ✓"

### 2.3 좌측 사이드바 (CurriculumSidebar)

**기능 목록:**

#### A. 트리 뷰 구조
```
📁 커리큘럼 1
  └── 📄 페이지 1-1
  └── 📄 페이지 1-2
📁 커리큘럼 2
  └── 📄 페이지 2-1
```

#### B. 인터랙션
| 액션 | 동작 |
|------|------|
| 싱글 클릭 | 해당 페이지 선택 및 에디터에 로드 |
| 더블 클릭 | 타이틀 인라인 편집 모드 |
| 드래그 앤 드롭 | 순서 변경 (같은 레벨 내, 커리큘럼 간 이동) |
| 우클릭 | 컨텍스트 메뉴 표시 |
| 펼치기/접기 | 커리큘럼 노드의 화살표 클릭 |

#### C. 컨텍스트 메뉴
**커리큘럼 노드:**
- 페이지 추가
- 이름 변경
- 복제
- 삭제

**페이지 노드:**
- 이름 변경
- 복제
- 삭제

#### D. 상단 액션 버튼
- [+ 커리큘럼] - 새 커리큘럼 추가
- [+ 페이지] - 선택된 커리큘럼에 페이지 추가

**라이브러리 선택:**
- `@dnd-kit/core` + `@dnd-kit/sortable`: 드래그 앤 드롭
- 기존 dnd-kit 사용 중이므로 확장 구현

### 2.4 우측 에디터 (ContentEditor)

**구현 사항:**
- [ ] BlockNote 에디터 전체 높이 렌더링
- [ ] 자동 저장 로직 (debounce 1초)
- [ ] 이미지/파일 드래그 앤 드롭 업로드 유지
- [ ] 빈 상태 UI ("페이지를 선택하세요")

**자동 저장 흐름:**
```
변경 감지 → Debounce(1초) → API 호출 → 상태 업데이트 → Toast 알림(선택적)
```

### 2.5 게시(Publish) 시스템

**로직:**
1. 에디터 변경 → 자동 저장 (Draft)
2. "게시하기" 클릭 → 현재 Draft를 Published 버전으로 복사
3. Viewer에서는 Published 버전만 표시

**API 엔드포인트:**
```
POST /api/contents/[contentId]/publish
- 모든 페이지의 현재 content를 publishedContent로 복사
- isPublished = true
- publishedAt = now()
```

---

## Phase 3: 콘텐츠 뷰어 (Content Viewer)

### 3.1 레이아웃 구조

**데스크탑:**
```
┌─────────────────────────────────────────────────────────────┐
│  로고 │     콘텐츠 타이틀     │ 진행률 ████░░░░ 45% │ 프로필 │
├───────┴──────────────────────┴──────────────────────┴───────┤
│         │                                          │        │
│  목차   │                                          │ 댓글   │
│  사이드 │         콘텐츠 영역                       │ 드로어 │
│  바     │         (BlockNote Readonly)             │ (숨김) │
│         │                                          │        │
│  250px  │         [< 이전] [다음 >]                │        │
│         │         👍 좋아요 12 │ 💬 댓글 5          │        │
└─────────┴──────────────────────────────────────────┴────────┘
```

**모바일:**
```
┌─────────────────────┐
│  [≡] 콘텐츠 타이틀  │
├─────────────────────┤
│                     │
│    콘텐츠 영역      │
│                     │
├─────────────────────┤
│ [< 이전] [다음 >]   │
│ 👍 12  💬 5         │
└─────────────────────┘
```

### 3.2 이전/다음 네비게이션

**구현 사항:**
- [ ] 페이지 하단에 고정 위치 네비게이션
- [ ] 이전/다음 페이지 타이틀 표시
- [ ] 첫 페이지: 이전 버튼 비활성화
- [ ] 마지막 페이지: "학습 완료!" 표시

```tsx
interface PageNavigationProps {
  prevPage: { id: string; title: string } | null
  nextPage: { id: string; title: string } | null
}
```

### 3.3 좋아요 기능

**UI:**
- 하트 또는 엄지 아이콘
- 클릭 시 토글 (좋아요/취소)
- 현재 좋아요 수 표시

**API:**
```
POST /api/pages/[pageId]/like
DELETE /api/pages/[pageId]/like
GET /api/pages/[pageId]/like (상태 확인)
```

### 3.4 댓글 드로어

**기능:**
- [ ] 우측에서 슬라이드 인/아웃
- [ ] 기존 CommentSection 컴포넌트 재사용
- [ ] 열기/닫기 애니메이션
- [ ] 모바일: 하단 시트(Bottom Sheet) 형태

**트리거:**
- 💬 댓글 버튼 클릭
- ESC 키로 닫기
- 바깥 영역 클릭으로 닫기

### 3.5 학습 진행률

**계산 방식:**
```
진행률 = (완료한 페이지 수 / 전체 페이지 수) × 100
```

**완료 기준:**
- 페이지 스크롤 70% 이상 또는
- 다음 페이지로 이동

**UI 표시:**
- 헤더: 프로그레스 바 + 퍼센트
- 사이드바: 완료된 페이지 옆에 체크 표시

---

## Phase 4: 컴포넌트 설계

### 4.1 공통 컴포넌트

```
src/components/
├── ui/
│   ├── Toast/
│   │   ├── ToastProvider.tsx
│   │   ├── Toast.tsx
│   │   └── useToast.ts
│   ├── ContextMenu/
│   │   ├── ContextMenu.tsx
│   │   └── ContextMenuItem.tsx
│   ├── Drawer/
│   │   └── Drawer.tsx
│   ├── InlineEdit/
│   │   └── InlineEdit.tsx
│   └── ProgressBar/
│       └── ProgressBar.tsx
├── editor/
│   └── ... (기존 유지)
└── viewer/
    ├── PageNavigation.tsx
    ├── LikeButton.tsx
    ├── CommentDrawer.tsx
    └── ProgressIndicator.tsx
```

### 4.2 상태 관리

**전역 상태 (Context):**
```tsx
// EditorContext - 에디터 상태 관리
interface EditorState {
  contentId: string
  selectedPageId: string | null
  saveStatus: SaveStatus
  curriculums: CurriculumWithPages[]
  isDirty: boolean
}

// ViewerContext - 뷰어 상태 관리
interface ViewerState {
  contentId: string
  currentPageId: string
  progress: number
  completedPages: string[]
  isCommentDrawerOpen: boolean
}
```

---

## Phase 5: API 설계

### 5.1 콘텐츠 관리 API

```
# 콘텐츠 CRUD
GET    /api/contents                    # 목록
POST   /api/contents                    # 생성
GET    /api/contents/[id]               # 조회
PUT    /api/contents/[id]               # 수정
DELETE /api/contents/[id]               # 삭제

# 게시
POST   /api/contents/[id]/publish       # 게시하기

# 커리큘럼 (기존 유지, 경로만 변경 검토)
# 페이지 (기존 유지)
```

### 5.2 뷰어 API

```
# 좋아요
POST   /api/pages/[pageId]/like
DELETE /api/pages/[pageId]/like
GET    /api/pages/[pageId]/like/status

# 진행률
GET    /api/contents/[id]/progress
POST   /api/contents/[id]/progress      # 페이지 완료 마킹
```

---

## 개발 우선순위 및 단계

### Step 1: 기반 작업 (1-2일)
1. Toast 알림 시스템 구현
2. 데이터베이스 스키마 변경 및 마이그레이션
3. 용어 변경 (강의 → 콘텐츠)

### Step 2: 저작 도구 레이아웃 (2-3일)
1. 새로운 레이아웃 구조 생성
2. EditorHeader 컴포넌트
3. 기본 사이드바 구조

### Step 3: 트리 뷰 구현 (2-3일)
1. 트리 노드 컴포넌트
2. 드래그 앤 드롭 (dnd-kit 확장)
3. 인라인 편집
4. 컨텍스트 메뉴

### Step 4: 자동 저장 & 게시 (1-2일)
1. 자동 저장 로직 구현
2. 저장 상태 표시
3. 게시(Publish) API 및 UI

### Step 5: 뷰어 개선 (2-3일)
1. 반응형 레이아웃
2. 이전/다음 네비게이션
3. 좋아요 기능
4. 댓글 드로어

### Step 6: 진행률 & 마무리 (1-2일)
1. 학습 진행률 구현
2. 전체 테스트
3. 버그 수정 및 폴리싱

---

## 기술 스택 및 라이브러리

### 기존 유지
- Next.js 16 (App Router)
- Tailwind CSS v4
- BlockNote Editor
- Prisma 7 + PostgreSQL
- dnd-kit (드래그앤드롭)

### 신규 추가 (검토)
- `@radix-ui/react-context-menu`: 컨텍스트 메뉴
- `@radix-ui/react-toast`: Toast 알림 (또는 직접 구현)
- `framer-motion`: 애니메이션 (선택적)

---

## 와이어프레임 참조

### 저작 도구 메인 화면
```
┌────────────────────────────────────────────────────────────────┐
│ ← │ 📝 React 기초 강좌                    │ ✓ 저장됨 │ 👁 │ 게시 │
├───┴────────────────────────────────────────┴─────────┴────┴─────┤
│ + 커리큘럼  + 페이지                │                           │
├────────────────────────────────────┤                           │
│ ▼ 📁 1장. 소개                     │  # 환영합니다!            │
│   └ 📄 소개 페이지 ←(선택됨, 파란색)│                           │
│   └ 📄 시작하기                    │  React는 Facebook에서     │
│ ▶ 📁 2장. 컴포넌트                 │  만든 UI 라이브러리입니다. │
│ ▶ 📁 3장. 상태관리                 │                           │
│                                    │  [이미지 드래그 앤 드롭]   │
│                                    │                           │
└────────────────────────────────────┴───────────────────────────┘
```

### 뷰어 메인 화면
```
┌────────────────────────────────────────────────────────────────┐
│ 🏠 │ React 기초 강좌           │ ████████░░ 80% │ 👤 학습자 │
├────┴───────────────────────────┴──────────────────┴────────────┤
│ 📚 목차              │                                   │ 💬 │
│                      │    # 환영합니다!                  │    │
│ ✓ 1장. 소개          │                                   │    │
│   ✓ 소개 페이지      │    React는 Facebook에서           │    │
│   ● 시작하기 (현재)  │    만든 UI 라이브러리입니다.      │    │
│ ○ 2장. 컴포넌트      │                                   │    │
│                      │    ...                            │    │
│                      │                                   │    │
│                      │ ┌─────────────────────────────┐   │    │
│                      │ │ ← 소개 페이지  │  설치하기 → │   │    │
│                      │ └─────────────────────────────┘   │    │
│                      │         👍 좋아요 24  💬 댓글 8   │    │
└──────────────────────┴───────────────────────────────────┴────┘
```

---

## 체크리스트

### Phase 1: 공통 ✅ 완료
- [x] Toast 알림 시스템 ✅
- [x] 용어 변경 (강의 → 콘텐츠) ✅
- [x] DB 스키마 변경 (isPublished, publishedContent, PageLike, UserProgress) ✅

### Phase 2: 저작 도구 ✅ 완료
- [x] 애플리케이션 레이아웃 구조 ✅
- [x] EditorHeader (타이틀 편집, 저장 상태, 미리보기, 게시) ✅
- [x] CurriculumSidebar (트리 뷰) ✅
- [x] 드래그 앤 드롭 순서 변경 ✅
- [x] 더블클릭 인라인 편집 ✅
- [x] 우클릭 컨텍스트 메뉴 ✅
- [x] 자동 저장 + Draft 시스템 ✅
- [x] 게시(Publish) 기능 ✅

### Phase 3: 뷰어 ✅ 완료
- [x] 반응형 레이아웃 ✅
- [x] 이전/다음 네비게이션 ✅
- [x] 좋아요 기능 ✅
- [x] 댓글 드로어 ✅
- [x] 학습 진행률 ✅

---

## 예상 일정

| Phase | 작업 내용 | 예상 소요 |
|-------|----------|----------|
| Phase 1 | 공통 기반 작업 | 1-2일 |
| Phase 2 | 저작 도구 전면 개편 | 5-7일 |
| Phase 3 | 뷰어 개선 | 3-4일 |
| Phase 4 | 테스트 및 버그 수정 | 1-2일 |
| **총계** | | **10-15일** |

---

## 참고 사항

### 디자인 가이드라인
- 색상: Tailwind 기본 팔레트 활용 (gray, blue 중심)
- 간격: 일관된 4/8/16px 체계
- 폰트: 시스템 폰트 스택 유지
- 아이콘: Lucide React 아이콘 사용

### 접근성
- 키보드 네비게이션 지원
- ARIA 레이블 적용
- 충분한 색상 대비

### 성능 고려
- 트리 뷰 가상화 (대량 페이지 시)
- 에디터 지연 로딩
- 이미지 최적화
