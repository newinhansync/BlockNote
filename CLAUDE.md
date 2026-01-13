# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BlockNote 기반 콘텐츠 저작 도구** - TouchClass와 연동 가능한 형태를 지향하는 독립형(Standalone) 콘텐츠 저작 도구

### 기능
- **관리자**: 콘텐츠 생성/저작 (BlockNote 에디터 사용)
- **사용자**: 생성된 마크다운/JSON 콘텐츠 조회

### 데이터 구조 (3단 계층)
```
Course (강의/코스)
  └── Curriculum (챕터/커리큘럼)
        └── Page (페이지 - BlockNote 에디터로 콘텐츠 저작)
```

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: Tailwind CSS v4
- **Editor**: BlockNote (React) with Mantine UI
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **Language**: TypeScript

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Database commands (Prisma 7)
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run migrations in development
npm run db:studio      # Open Prisma Studio GUI
npm run db:seed        # Run seed script
```

## Architecture

```
/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (admin)/            # Admin routes (콘텐츠 저작)
│   │   ├── (viewer)/           # Viewer routes (콘텐츠 조회)
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── editor/             # BlockNote 에디터 컴포넌트
│   │   └── ui/                 # UI 컴포넌트
│   ├── lib/
│   │   ├── db.ts               # Database connection (Prisma)
│   │   └── utils.ts            # Utility functions (cn helper)
│   └── types/                  # TypeScript type definitions
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data script
├── prisma.config.ts            # Prisma 7 configuration
└── docs/                       # 프로젝트 계획 및 문서
    └── planning/               # 계획 문서들
```

## 핵심 작업 규칙 (Docs-Driven Development)

### 필수 워크플로우
1. **계획 우선**: 모든 기획, 아키텍처, 로드맵은 `./docs/` 폴더 내에 마크다운으로 관리
2. **읽고 수행**: 작업 시작 전 반드시 `./docs/` 내의 계획 파일을 읽고 문맥 파악
3. **문서 동기화**: 변경사항이나 완료된 진행률은 즉시 `./docs/` 내의 파일에 업데이트

### 금지 사항
- 계획 없이 코드를 먼저 작성하지 않는다
- `./docs/`의 계획 문서를 무시하고 작업하지 않는다

## Prisma 7 Notes

Prisma 7에서는 datasource URL이 `prisma.config.ts`에서 관리됨:
- `.env` 파일에 `DATABASE_URL` 설정
- `prisma.config.ts`가 dotenv를 로드하여 URL 전달
- `prisma/schema.prisma`에는 provider만 명시

## BlockNote Integration

BlockNote (https://github.com/TypeCellOS/BlockNote) 관련:
- 공식 문서: https://www.blocknotejs.org/docs
- Mantine UI 테마 사용 (`@blocknote/mantine`)
- JSON 형태로 콘텐츠 저장 (PostgreSQL Json 타입)
- 커스텀 블록 타입 확장 가능

## Planning Documents

자세한 계획은 `./docs/planning/` 참조:
- `01-project-overview.md` - 프로젝트 개요 및 기능 정의
- `02-tech-stack.md` - 기술 스택 상세 및 ADR
- `03-database-schema.md` - DB 스키마 및 Prisma 모델
- `04-roadmap.md` - 개발 로드맵 및 진행 상황
