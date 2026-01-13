# 04. 개발 로드맵

## Phase 1: MVP (핵심 기능) ✅ 완료

### 1.1 환경 설정
- [x] Next.js 16 프로젝트 초기화
- [x] Tailwind CSS v4 설정
- [x] Prisma 7 + PostgreSQL 연동
- [x] TypeScript 설정 최적화
- [x] BlockNote 에디터 패키지 설치

### 1.2 데이터베이스 구축
- [x] Prisma 스키마 작성
- [x] 초기 마이그레이션 실행 (PostgreSQL 연결 완료)
- [x] 시드 데이터 작성

### 1.3 Course 관리 (Admin)
- [x] Course 목록 페이지
- [x] Course 생성/수정/삭제
- [x] Course 상세 페이지 (Curriculum 목록)

### 1.4 Curriculum 관리 (Admin)
- [x] Curriculum 목록 (Course 내)
- [x] Curriculum 생성/수정/삭제
- [x] Curriculum 순서 변경 (드래그앤드롭)

### 1.5 Page 관리 (Admin)
- [x] Page 목록 (Curriculum 내)
- [x] BlockNote 에디터 통합
- [x] Page 생성/수정/삭제
- [x] Page 순서 변경 (드래그앤드롭)
- [x] 콘텐츠 자동 저장

### 1.6 콘텐츠 뷰어 (Viewer)
- [x] Course 목록 조회
- [x] Curriculum/Page 네비게이션
- [x] BlockNote 콘텐츠 렌더링 (읽기 전용)

## Phase 2: 사용자 관리 & 미디어

### 2.1 인증 ✅ 완료
- [x] 로그인/로그아웃 (NextAuth.js v5)
- [x] 권한 관리 (Admin/Viewer Role)
- [x] 세션 관리 (JWT Strategy)

### 2.2 미디어 관리 ✅ 완료
- [x] 이미지 업로드 (로컬 저장소)
- [x] 파일 저장소 연동 (로컬 public/uploads/)
- [x] BlockNote 이미지 블록 커스터마이징 (uploadFile 핸들러)

### 2.3 버전 관리 ✅ 완료
- [x] Page 히스토리 저장 (PageVersion 모델)
- [x] 버전 비교 (버전 히스토리 모달)
- [x] 롤백 기능 (버전 복원 API)

## Phase 3: 연동 & 확장

### 3.1 TouchClass 연동 ✅ 완료
- [x] API 인터페이스 정의 (External API with API Key auth)
- [x] 콘텐츠 동기화 API (/api/external/courses, /api/external/pages)
- [x] 외부 시스템 연동 준비

### 3.2 내보내기 ✅ 완료
- [x] HTML 내보내기
- [x] Markdown 내보내기
- [x] JSON 내보내기 (API 연동용)
- [x] PDF 내보내기 (Puppeteer 사용)

### 3.3 협업

#### 3.3.1 기반 구축
- [ ] Yjs 관련 패키지 설치 (yjs, y-websocket, y-indexeddb, y-protocols)
- [ ] WebSocket 서버 코드 작성 (server/websocket-server.ts)
- [ ] 서버 실행 스크립트 추가 (npm run ws:dev)
- [ ] 환경 변수 설정 (WS_PORT, NEXT_PUBLIC_WS_URL)

#### 3.3.2 클라이언트 통합
- [ ] CollaborativeEditor 컴포넌트 생성
- [ ] useCollaboration 커스텀 훅 작성
- [ ] 사용자 presence UI 구현 (커서, 이름, 색상)
- [ ] 연결 상태 표시 UI

#### 3.3.3 서버 영속성
- [ ] 데이터베이스 마이그레이션 (YjsDocument, CollabSession 모델)
- [ ] y-websocket 서버에 PostgreSQL 영속성 레이어 추가
- [ ] 문서 저장/불러오기 API 구현
- [ ] 자동 저장 로직 구현 (30초 주기)

#### 3.3.4 인증 및 권한
- [ ] WebSocket 연결 인증 미들웨어 (JWT 검증)
- [ ] 페이지별 편집 권한 확인 (ADMIN만 편집)
- [ ] 세션 추적 및 정리

#### 3.3.5 사용자 경험 향상
- [ ] ActiveUsers 컴포넌트 (실시간 참여자 목록)
- [ ] 연결 복구 로직 개선
- [ ] 오프라인 모드 UI
- [ ] 동기화 상태 표시

#### 기타 협업 기능
- [x] 댓글/피드백 ✅ 완료
- [ ] 변경 알림 (향후 계획)

## 마일스톤

| Phase | 목표 | 상태 |
|-------|------|------|
| Phase 1 | MVP 완성 | ✅ 완료 |
| Phase 2 | 사용자 관리 | ✅ 완료 |
| Phase 3.1-3.2 | 외부 연동, 내보내기 | ✅ 완료 |
| Phase 3.3.1 | 실시간 협업 기반 구축 | ⏳ 예정 |
| Phase 3.3.2 | 클라이언트 협업 통합 | ⏳ 예정 |
| Phase 3.3.3 | 서버 영속성 | ⏳ 예정 |
| Phase 3.3.4 | 협업 인증/권한 | ⏳ 예정 |
| Phase 3.3.5 | 협업 UX 향상 | ⏳ 예정 |

## 현재 진행 상황

### 완료됨 ✅
- [x] 프로젝트 개요 정의
- [x] 기술 스택 선정
- [x] 데이터베이스 스키마 설계
- [x] CLAUDE.md 작성
- [x] docs/ 폴더 구조화
- [x] Next.js 16 프로젝트 초기화
- [x] Tailwind CSS v4 설정
- [x] TypeScript 설정
- [x] Prisma 7 설정 및 스키마 작성
- [x] BlockNote 에디터 패키지 설치
- [x] PostgreSQL 데이터베이스 연결 및 마이그레이션
- [x] Course CRUD (Admin)
- [x] Curriculum CRUD (Admin)
- [x] Page CRUD with BlockNote (Admin)
- [x] Content Viewer (Viewer)
- [x] Curriculum/Page 순서 변경 (드래그앤드롭)
- [x] 콘텐츠 자동 저장

### Phase 2 완료 ✅ (2026-01-13)
- [x] NextAuth.js v5 인증 시스템
- [x] 역할 기반 접근 제어 (ADMIN/VIEWER)
- [x] 이미지 업로드 API (로컬 저장소)
- [x] BlockNote 이미지 블록 통합
- [x] 페이지 버전 히스토리
- [x] 버전 복원/롤백 기능

### Phase 3 완료 ✅ (2026-01-13)
- [x] External API (TouchClass 연동용)
- [x] HTML/Markdown/JSON 내보내기
- [x] 내보내기 UI (모달)
- [x] PDF 내보내기 (Puppeteer)
- [x] 댓글/피드백 기능 (Comment 모델, 답글, 해결 상태)

### 향후 계획 ⏳
- 실시간 편집 (Phase 3.3) - 상세 계획 수립 완료 ✅
  - 계획 문서: `docs/planning/06-realtime-collaboration.md`
  - 기술 스택: Yjs + y-websocket + y-indexeddb
  - 5단계 구현 로드맵 정의
- 변경 알림 (Phase 3.3 이후)
