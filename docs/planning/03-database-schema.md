# 03. 데이터베이스 스키마

## ER 다이어그램

### 기본 구조 (Course → Curriculum → Page)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Course    │       │  Curriculum  │       │    Page     │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)      │──┐    │ id (PK)     │
│ title       │  │    │ title        │  │    │ title       │
│ description │  │    │ order        │  │    │ content     │
│ createdAt   │  └───<│ courseId(FK) │  └───<│curriculumId │
│ updatedAt   │       │ createdAt    │       │ order       │
└─────────────┘       │ updatedAt    │       │ createdAt   │
                      └──────────────┘       │ updatedAt   │
                                             └─────────────┘
```

### 실시간 협업 확장 구조

```
┌─────────────┐
│    Page     │
├─────────────┤
│ id (PK)     │────┬────────────────────────────────┐
│ title       │    │                                │
│ content     │    │                                │
│ ...         │    │                                │
└─────────────┘    │                                │
                   │                                │
          ┌────────▼────────┐              ┌────────▼────────┐
          │  YjsDocument    │              │  CollabSession  │
          ├─────────────────┤              ├─────────────────┤
          │ id (PK)         │              │ id (PK)         │
          │ pageId (FK,UQ)  │              │ pageId (FK)     │
          │ state (Bytes)   │              │ userId (FK)     │
          │ stateVector     │              │ color           │
          │ createdAt       │              │ lastSeen        │
          │ updatedAt       │              │ metadata        │
          └─────────────────┘              └────────┬────────┘
                                                   │
                                           ┌───────▼───────┐
                                           │     User      │
                                           ├───────────────┤
                                           │ id (PK)       │
                                           │ name          │
                                           │ email         │
                                           │ role          │
                                           └───────────────┘
```

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Course {
  id          String       @id @default(uuid())
  title       String
  description String?
  curriculums Curriculum[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@map("courses")
}

model Curriculum {
  id        String   @id @default(uuid())
  title     String
  order     Int      @default(0)
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId  String
  pages     Page[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("curriculums")
}

model Page {
  id           String     @id @default(uuid())
  title        String
  content      Json       @default("[]") // BlockNote JSON 데이터
  order        Int        @default(0)
  curriculum   Curriculum @relation(fields: [curriculumId], references: [id], onDelete: Cascade)
  curriculumId String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  // 실시간 협업 관계
  yjsDocument    YjsDocument?
  collabSessions CollabSession[]

  @@map("pages")
}

// ========================================
// 실시간 협업 모델 (Phase 3.3)
// ========================================

/// Yjs 문서 상태 저장 (바이너리 형태)
/// CRDT 상태를 PostgreSQL에 영구 저장
model YjsDocument {
  id          String   @id @default(uuid())
  pageId      String   @unique
  page        Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)

  /// Yjs 문서 상태 (Y.encodeStateAsUpdate 결과)
  state       Bytes

  /// 상태 벡터 (효율적인 동기화를 위한 체크포인트)
  stateVector Bytes?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("yjs_documents")
}

/// 협업 세션 (현재 접속 사용자 추적)
/// 실시간 참여자 목록 및 커서 정보 관리
model CollabSession {
  id        String   @id @default(uuid())
  pageId    String
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  /// 사용자 커서 색상 (헥스 코드)
  color     String   @default("#3B82F6")

  /// 마지막 활동 시간 (비활성 세션 정리용)
  lastSeen  DateTime @default(now())

  /// 세션 메타데이터 (커서 위치, 선택 영역 등)
  metadata  Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([pageId, userId]) // 한 페이지에 사용자당 하나의 세션
  @@index([pageId])
  @@index([userId])
  @@index([lastSeen]) // 비활성 세션 정리 쿼리 최적화
  @@map("collab_sessions")
}
```

## 인덱스 전략

```prisma
model Curriculum {
  // ... fields
  @@index([courseId])
  @@index([courseId, order])
}

model Page {
  // ... fields
  @@index([curriculumId])
  @@index([curriculumId, order])
}

// 실시간 협업 인덱스
model CollabSession {
  // ... fields
  @@index([pageId])       // 페이지별 세션 조회
  @@index([userId])       // 사용자별 세션 조회
  @@index([lastSeen])     // 비활성 세션 정리 (WHERE lastSeen < ?)
}
```

## User 모델 확장 (협업 관계 추가)

기존 User 모델에 협업 세션 관계를 추가해야 합니다:

```prisma
model User {
  id            String          @id @default(uuid())
  name          String?
  email         String          @unique
  password      String?
  role          Role            @default(VIEWER)

  // 기존 관계들...

  // 협업 세션 관계 추가
  collabSessions CollabSession[]

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@map("users")
}
```

## 마이그레이션 명령어

```bash
# 스키마 변경 후 마이그레이션 생성
npx prisma migrate dev --name init

# 프로덕션 마이그레이션 적용
npx prisma migrate deploy

# 스키마를 DB에 직접 푸시 (개발용)
npx prisma db push

# Prisma Client 재생성
npx prisma generate
```

### 실시간 협업 마이그레이션 (Phase 3.3)

```bash
# 협업 테이블 추가 마이그레이션
npx prisma migrate dev --name add_collaboration_tables

# 마이그레이션 내용:
# 1. yjs_documents 테이블 생성
# 2. collab_sessions 테이블 생성
# 3. pages 테이블에 관계 추가
# 4. users 테이블에 관계 추가
```

## 시드 데이터

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const course = await prisma.course.create({
    data: {
      title: '샘플 강의',
      description: '테스트용 샘플 강의입니다.',
      curriculums: {
        create: [
          {
            title: '1장. 시작하기',
            order: 0,
            pages: {
              create: [
                {
                  title: '소개',
                  order: 0,
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: '환영합니다!' }],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    },
  })
  console.log({ course })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## BlockNote Content JSON 구조

```typescript
// BlockNote의 JSON 포맷 예시
type BlockNoteContent = {
  id: string
  type: string // 'paragraph', 'heading', 'bulletListItem', etc.
  props: Record<string, any>
  content: InlineContent[]
  children: Block[]
}[]

// 예시 데이터
const exampleContent = [
  {
    id: 'block-1',
    type: 'heading',
    props: { level: 1 },
    content: [{ type: 'text', text: '제목입니다' }],
    children: [],
  },
  {
    id: 'block-2',
    type: 'paragraph',
    props: {},
    content: [{ type: 'text', text: '본문 내용입니다.' }],
    children: [],
  },
]
```

## Yjs 문서 상태 데이터 구조 (Phase 3.3)

### YjsDocument.state (Bytes)

Yjs 문서의 전체 상태를 바이너리 형태로 저장합니다.

```typescript
import * as Y from 'yjs'

// 문서 상태 인코딩 (저장 시)
const doc = new Y.Doc()
const state: Uint8Array = Y.encodeStateAsUpdate(doc)
// → PostgreSQL Bytes 타입으로 저장

// 문서 상태 디코딩 (로드 시)
const newDoc = new Y.Doc()
Y.applyUpdate(newDoc, state)
```

### YjsDocument.stateVector (Bytes)

효율적인 동기화를 위한 상태 벡터입니다. 클라이언트가 어떤 업데이트까지 받았는지 추적합니다.

```typescript
// 상태 벡터 인코딩
const stateVector: Uint8Array = Y.encodeStateVector(doc)

// 차분(diff) 계산 - 클라이언트에 없는 업데이트만 전송
const diff = Y.encodeStateAsUpdate(doc, clientStateVector)
```

### CollabSession.metadata (Json)

사용자 세션의 추가 정보를 저장합니다.

```typescript
interface CollabSessionMetadata {
  // 커서 위치
  cursor?: {
    blockId: string
    offset: number
  }
  // 선택 영역
  selection?: {
    anchor: { blockId: string; offset: number }
    focus: { blockId: string; offset: number }
  }
  // 클라이언트 정보
  clientInfo?: {
    browser: string
    os: string
    lastActivity: string
  }
}

// 예시 데이터
const metadata: CollabSessionMetadata = {
  cursor: {
    blockId: 'block-1',
    offset: 15
  },
  selection: null,
  clientInfo: {
    browser: 'Chrome 120',
    os: 'macOS',
    lastActivity: '2024-01-15T10:30:00Z'
  }
}
```

### 데이터 동기화 흐름

```
1. 페이지 열기
   Client → GET /api/collaboration/document/{pageId}
   Server → YjsDocument.state 반환 (없으면 빈 문서)

2. 실시간 편집
   Client ←→ WebSocket ←→ y-websocket Server
   (Yjs 업데이트가 실시간으로 전파)

3. 주기적 저장 (30초)
   y-websocket Server → YjsDocument.state/stateVector UPDATE

4. 세션 관리
   Client Connect → CollabSession INSERT/UPDATE
   Client Disconnect → CollabSession DELETE (또는 lastSeen UPDATE)

5. 비활성 세션 정리 (Cron Job)
   DELETE FROM collab_sessions WHERE lastSeen < NOW() - INTERVAL '5 minutes'
```
