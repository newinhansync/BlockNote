# BlockNote 기반 콘텐츠 저작 도구

TouchClass와 연동 가능한 형태를 지향하는 독립형(Standalone) 콘텐츠 저작 도구입니다.

## 주요 기능

### 사용자 역할
- **관리자**: BlockNote 에디터를 사용하여 콘텐츠 생성/저작
- **사용자**: 생성된 마크다운/JSON 콘텐츠 조회

### 데이터 구조 (3단 계층)
```
Course (강의/코스)
  └── Curriculum (챕터/커리큘럼)
        └── Page (페이지 - BlockNote 에디터로 콘텐츠 저작)
```

### 핵심 기능
- BlockNote 기반 리치 텍스트 에디터
- 드래그 앤 드롭으로 페이지/커리큘럼 순서 변경
- 실시간 자동 저장 (1초 디바운스)
- 버전 관리 지원
- 콘텐츠 게시/미게시 관리

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | Tailwind CSS v4 |
| Editor | BlockNote (React) with Mantine UI |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Language | TypeScript |
| Auth | NextAuth.js |

## 시작하기

### 사전 요구 사항
- Node.js 18+
- PostgreSQL
- pnpm/npm/yarn

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 DATABASE_URL 설정

# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 마이그레이션
npm run db:push

# (선택) 시드 데이터 추가
npm run db:seed

# 개발 서버 시작
npm run dev
```

### 개발 명령어

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run lint         # 린터 실행
npm run db:generate  # Prisma 클라이언트 생성
npm run db:push      # 스키마를 DB에 푸시
npm run db:migrate   # 마이그레이션 실행
npm run db:studio    # Prisma Studio GUI 실행
npm run db:seed      # 시드 스크립트 실행
```

## 프로젝트 구조

```
/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── (admin)/            # 관리자 라우트 (콘텐츠 저작)
│   │   ├── (viewer)/           # 뷰어 라우트 (콘텐츠 조회)
│   │   └── api/                # API 라우트
│   ├── components/
│   │   ├── editor/             # BlockNote 에디터 컴포넌트
│   │   └── ui/                 # UI 컴포넌트
│   ├── lib/
│   │   ├── db.ts               # 데이터베이스 연결 (Prisma)
│   │   └── utils.ts            # 유틸리티 함수
│   └── types/                  # TypeScript 타입 정의
├── prisma/
│   ├── schema.prisma           # 데이터베이스 스키마
│   └── seed.ts                 # 시드 데이터 스크립트
├── prisma.config.ts            # Prisma 7 설정
└── docs/                       # 프로젝트 문서
    └── planning/               # 계획 문서
```

## 최근 업데이트

### 페이지 추가 기능 개선 (2025-01)

페이지 추가 UX가 다음과 같이 개선되었습니다:

1. **빈 커리큘럼 선택 기능**
   - 페이지가 없는 커리큘럼도 클릭하여 선택 가능
   - 선택된 커리큘럼은 파란색 하이라이트로 표시
   - 선택 후 페이지 추가 버튼으로 해당 커리큘럼에 페이지 추가

2. **스마트 페이지 추가**
   - 페이지 편집 중 "페이지 추가" 클릭 시 현재 페이지 바로 뒤에 새 페이지 삽입
   - 커리큘럼만 선택된 상태에서는 해당 커리큘럼 끝에 페이지 추가
   - 아무것도 선택되지 않은 경우 커리큘럼 선택 드롭다운 표시

3. **시각적 피드백**
   - 페이지 추가 버튼이 선택 상태에 따라 색상 변경 (파란색 하이라이트)
   - 빈 커리큘럼 영역에 안내 메시지 표시

## 라이선스

Private - 무단 배포 금지
