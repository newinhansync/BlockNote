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

### 실시간 협업 (Real-time Collaboration)
- **Yjs**: CRDT 기반 실시간 동기화 라이브러리
  - https://github.com/yjs/yjs
  - 충돌 없는 분산 데이터 구조 (CRDT)
  - 오프라인 지원 및 자동 동기화
- **y-websocket**: WebSocket 기반 통신 Provider
  - 자체 서버 운영으로 완전한 제어
  - 커스텀 인증/권한 통합 가능
- **y-indexeddb**: 브라우저 로컬 저장소
  - 오프라인 편집 지원
  - 네트워크 복구 시 자동 동기화

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

# WebSocket Server (실시간 협업)
WS_PORT=1234
NEXT_PUBLIC_WS_URL="ws://localhost:1234"
# Production: NEXT_PUBLIC_WS_URL="wss://your-domain.com/ws"
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
  "lucide-react": "^0.300.0",
  "yjs": "^13.6.0",
  "y-websocket": "^2.0.0",
  "y-indexeddb": "^9.0.0",
  "y-protocols": "^1.0.0"
}
```

### Development
```json
{
  "typescript": "^5.0.0",
  "prisma": "^5.0.0",
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "@types/ws": "^8.0.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^15.0.0",
  "concurrently": "^8.0.0"
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

### ADR-004: 실시간 협업 - Yjs + y-websocket 선택
- **결정**: Yjs CRDT 라이브러리 + y-websocket Provider 사용
- **이유**:
  - BlockNote 공식 지원 협업 솔루션
  - CRDT 기반으로 충돌 없는 동시 편집 보장
  - 자체 WebSocket 서버로 완전한 제어권 확보
  - 인증/권한 시스템과 긴밀한 통합 가능
  - 향후 Hocuspocus/Redis로 수평 확장 용이
- **대안 검토**:
  - Liveblocks: 관리형 서비스로 빠른 구축 가능하나 비용/벤더 종속
  - PartyKit: 서버리스이나 커스터마이징 제한
  - y-webrtc: P2P로 서버 불필요하나 NAT/방화벽 이슈

### ADR-005: 오프라인 지원 - y-indexeddb 선택
- **결정**: y-indexeddb로 브라우저 로컬 저장
- **이유**:
  - 네트워크 끊김 시에도 편집 지속 가능
  - 재연결 시 자동 동기화
  - 사용자 경험 향상 (끊김 없는 편집)
