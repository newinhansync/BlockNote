# 02. 기술 스택

## Frontend

### Framework
- **Next.js 15** (App Router)
  - React Server Components
  - Server Actions
  - Parallel Routes (admin/viewer 분리)

### UI
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Shadcn UI**: 재사용 가능한 컴포넌트 라이브러리
- **Lucide React**: 아이콘

### Editor
- **BlockNote**: 블록 기반 리치 텍스트 에디터
  - https://www.blocknotejs.org/
  - React 네이티브 지원
  - JSON 형식으로 콘텐츠 저장
  - 커스텀 블록 확장 가능

## Backend

### Database
- **PostgreSQL**: 관계형 데이터베이스
  - 안정성과 확장성
  - JSON 타입 지원 (BlockNote 콘텐츠 저장)

### ORM
- **Prisma**: 타입 안전한 데이터베이스 액세스
  - 자동 타입 생성
  - 마이그레이션 관리
  - Prisma Studio GUI

## Development Tools

### Language
- **TypeScript**: 정적 타입 시스템

### Linting & Formatting
- **ESLint**: 코드 품질 검사
- **Prettier**: 코드 포매팅

### Package Manager
- **npm**: 의존성 관리

## 환경 변수

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/blocknote"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 의존성 목록

### Production
```json
{
  "next": "^15.0.0",
  "@blocknote/core": "latest",
  "@blocknote/react": "latest",
  "@blocknote/mantine": "latest",
  "@prisma/client": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "lucide-react": "^0.300.0"
}
```

### Development
```json
{
  "typescript": "^5.0.0",
  "prisma": "^5.0.0",
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^15.0.0"
}
```

## 아키텍처 결정 기록 (ADR)

### ADR-001: Next.js App Router 선택
- **결정**: App Router 사용
- **이유**:
  - Server Components로 성능 최적화
  - Parallel Routes로 admin/viewer 분리 용이
  - Server Actions로 API 코드 간소화

### ADR-002: BlockNote 에디터 선택
- **결정**: BlockNote 사용
- **이유**:
  - 모던 블록 기반 에디터
  - React 네이티브 지원
  - JSON 형태로 저장하여 유연성 확보
  - 커스텀 블록 확장 가능

### ADR-003: Prisma ORM 선택
- **결정**: Prisma 사용
- **이유**:
  - TypeScript와 완벽한 타입 통합
  - 마이그레이션 관리 용이
  - Prisma Studio로 데이터 관리 편의성
