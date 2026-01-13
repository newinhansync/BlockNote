# 06. 실시간 협업 기능 (Real-time Collaboration)

## 개요

BlockNote 에디터에 Yjs 기반 실시간 협업 기능을 추가하여, 여러 사용자가 동시에 같은 문서를 편집할 수 있는 시스템을 구축한다.

### 목표
- 다중 사용자 실시간 동시 편집
- 커서 위치 및 사용자 presence 표시
- 오프라인 편집 후 자동 동기화
- 안정적인 충돌 해결 (CRDT 기반)
- 기존 시스템과의 원활한 통합

### 범위
- Phase 3.3의 "실시간 편집" 구현
- Page 단위 협업 (Curriculum/Course 메타데이터는 제외)

---

## 기술 스택

### 핵심 라이브러리

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| `yjs` | ^13.6.x | CRDT 핵심 라이브러리 |
| `y-websocket` | ^2.0.x | WebSocket 통신 Provider |
| `y-indexeddb` | ^9.0.x | 오프라인 로컬 저장소 |
| `y-protocols` | ^1.0.x | Yjs 프로토콜 유틸리티 |

### Provider 선택 비교

| Provider | 장점 | 단점 | 적합성 |
|----------|------|------|--------|
| **y-websocket** | 자체 서버 운영, 커스터마이징 가능 | 서버 구축 필요 | **선택** ✅ |
| Liveblocks | 완전 관리형, 빠른 구축 | 비용 발생, 벤더 종속 | - |
| PartyKit | 서버리스, Cloudflare 기반 | 제한된 커스터마이징 | - |
| y-webrtc | P2P, 서버 불필요 | 시그널링 서버 필요, NAT 문제 | - |
| Hocuspocus | Redis 스케일링, 웹훅 | 추가 의존성 | 향후 고려 |

### 선택 이유: y-websocket
1. **완전한 제어**: 자체 서버로 보안, 인증, 로깅 완전 제어
2. **비용 효율**: 추가 SaaS 비용 없음
3. **확장성**: 향후 Hocuspocus나 Redis로 마이그레이션 용이
4. **학습 가치**: Yjs 생태계 깊은 이해 가능

---

## 시스템 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              클라이언트                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Next.js Frontend                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │   BlockNote  │──│  Y.Doc       │──│  WebsocketProvider   │  │   │
│  │  │   Editor     │  │  (CRDT)      │  │  + IndexeddbProvider │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────┬───────────┘  │   │
│  └────────────────────────────────────────────────│────────────────┘   │
└──────────────────────────────────────────────────│──────────────────────┘
                                                   │
                                     WebSocket (ws://)
                                                   │
┌──────────────────────────────────────────────────│──────────────────────┐
│                              서버                 │                       │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    y-websocket Server                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │    │
│  │  │  Connection  │──│  Document    │──│  Persistence        │ │    │
│  │  │  Manager     │  │  Store       │  │  (PostgreSQL)       │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Next.js API Routes                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │    │
│  │  │  Auth API    │  │  Page API    │  │  Collaboration API   │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                      PostgreSQL                                 │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │    │
│  │  │  Pages       │  │  YjsDocument │  │  CollabSession       │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 데이터 흐름

```
1. 편집 시작
   User A → BlockNote Edit → Y.Doc Update → WebSocket → Server
                                                         ↓
                                                    Y.Doc Merge
                                                         ↓
                                              Broadcast to All Clients
                                                         ↓
   User B ← BlockNote Render ← Y.Doc Update ← WebSocket ←┘

2. 오프라인 → 온라인 동기화
   Offline Edit → IndexedDB Save → Reconnect → Sync with Server → Merge
```

---

## 데이터베이스 스키마 변경

### 신규 모델

```prisma
// prisma/schema.prisma 추가

/// Yjs 문서 상태 저장 (바이너리 형태)
model YjsDocument {
  id        String   @id @default(uuid())
  pageId    String   @unique
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)

  /// Yjs 문서 상태 (Y.encodeStateAsUpdate)
  state     Bytes

  /// 상태 벡터 (동기화 효율화용)
  stateVector Bytes?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("yjs_documents")
}

/// 협업 세션 (현재 접속 사용자 추적)
model CollabSession {
  id        String   @id @default(uuid())
  pageId    String
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  /// 사용자 커서 색상
  color     String   @default("#3B82F6")

  /// 마지막 활동 시간
  lastSeen  DateTime @default(now())

  /// 세션 메타데이터 (커서 위치 등)
  metadata  Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([pageId, userId])
  @@index([pageId])
  @@index([userId])
  @@map("collab_sessions")
}

/// Page 모델 수정 (관계 추가)
model Page {
  id           String          @id @default(uuid())
  title        String
  content      Json            @default("[]")
  order        Int             @default(0)
  curriculum   Curriculum      @relation(fields: [curriculumId], references: [id], onDelete: Cascade)
  curriculumId String

  /// 협업 관련 관계
  yjsDocument  YjsDocument?
  collabSessions CollabSession[]

  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  @@index([curriculumId])
  @@index([curriculumId, order])
  @@map("pages")
}
```

### ER 다이어그램 (협업 확장)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Course    │       │  Curriculum  │       │    Page     │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)      │──┐    │ id (PK)     │────┐
│ title       │  │    │ title        │  │    │ title       │    │
│ description │  │    │ order        │  │    │ content     │    │
│ createdAt   │  └───<│ courseId(FK) │  └───<│curriculumId │    │
│ updatedAt   │       │ createdAt    │       │ order       │    │
└─────────────┘       │ updatedAt    │       │ createdAt   │    │
                      └──────────────┘       │ updatedAt   │    │
                                             └─────────────┘    │
                                                    │           │
                               ┌────────────────────┴───────────┤
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
                      └─────────────────┘              │ createdAt       │
                                                      │ updatedAt       │
                                                      └─────────────────┘
                                                             │
                                                      ┌──────▼──────┐
                                                      │    User     │
                                                      ├─────────────┤
                                                      │ id (PK)     │
                                                      │ name        │
                                                      │ email       │
                                                      └─────────────┘
```

---

## 구현 단계별 계획

### Phase 3.3.1: 기반 구축 (1단계)

#### 목표
- 패키지 설치 및 환경 설정
- y-websocket 서버 구축
- 기본 연결 테스트

#### 작업 항목
- [ ] Yjs 관련 패키지 설치
- [ ] WebSocket 서버 코드 작성
- [ ] 서버 실행 스크립트 추가
- [ ] 환경 변수 설정

#### 산출물
```bash
# 패키지 설치
npm install yjs y-websocket y-indexeddb y-protocols

# 개발 의존성
npm install -D @types/ws
```

```typescript
// server/websocket-server.ts
import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'

const wss = new WebSocketServer({ port: 1234 })

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req)
})

console.log('WebSocket server running on ws://localhost:1234')
```

### Phase 3.3.2: 클라이언트 통합 (2단계)

#### 목표
- BlockNote 에디터에 협업 기능 통합
- 커서 awareness 구현
- 오프라인 저장소 연동

#### 작업 항목
- [ ] CollaborativeEditor 컴포넌트 생성
- [ ] useCollaboration 커스텀 훅 작성
- [ ] 사용자 presence UI 구현
- [ ] 연결 상태 표시 UI

#### 산출물
```typescript
// src/components/editor/CollaborativeEditor.tsx
'use client'

import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import { useEffect, useMemo, useState } from 'react'

interface CollaborativeEditorProps {
  pageId: string
  user: {
    id: string
    name: string
    color: string
  }
  onSave?: (content: any) => void
}

export function CollaborativeEditor({
  pageId,
  user,
  onSave
}: CollaborativeEditorProps) {
  const [isConnected, setIsConnected] = useState(false)

  // Yjs 문서 및 Provider 설정
  const { doc, provider, fragment } = useMemo(() => {
    const doc = new Y.Doc()

    // WebSocket Provider (실시간 동기화)
    const wsProvider = new WebsocketProvider(
      process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234',
      `page-${pageId}`,
      doc
    )

    // IndexedDB Provider (오프라인 지원)
    const idbProvider = new IndexeddbPersistence(`page-${pageId}`, doc)

    // 연결 상태 모니터링
    wsProvider.on('status', ({ status }: { status: string }) => {
      setIsConnected(status === 'connected')
    })

    return {
      doc,
      provider: wsProvider,
      fragment: doc.getXmlFragment('document-store')
    }
  }, [pageId])

  // BlockNote 에디터 생성
  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment,
      user: {
        name: user.name,
        color: user.color
      },
      showCursorLabels: 'activity' // 'always' | 'activity'
    }
  })

  // 클린업
  useEffect(() => {
    return () => {
      provider.destroy()
      doc.destroy()
    }
  }, [provider, doc])

  return (
    <div className="relative">
      {/* 연결 상태 표시 */}
      <div className="absolute top-2 right-2 z-10">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          isConnected
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          <span className={`w-2 h-2 rounded-full mr-1 ${
            isConnected ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          {isConnected ? '연결됨' : '연결 중...'}
        </span>
      </div>

      {/* 에디터 */}
      <BlockNoteView
        editor={editor}
        theme="light"
      />
    </div>
  )
}
```

### Phase 3.3.3: 서버 영속성 (3단계)

#### 목표
- Yjs 문서 상태를 PostgreSQL에 저장
- 서버 재시작 시 상태 복원
- 주기적 자동 저장

#### 작업 항목
- [ ] 데이터베이스 마이그레이션 실행
- [ ] y-websocket 서버에 영속성 레이어 추가
- [ ] 문서 저장/불러오기 API 구현
- [ ] 자동 저장 로직 구현

#### 산출물
```typescript
// server/persistence.ts
import { PrismaClient } from '@prisma/client'
import * as Y from 'yjs'

const prisma = new PrismaClient()

export async function getYjsDocument(pageId: string): Promise<Uint8Array | null> {
  const doc = await prisma.yjsDocument.findUnique({
    where: { pageId }
  })
  return doc?.state ? Buffer.from(doc.state) : null
}

export async function saveYjsDocument(
  pageId: string,
  state: Uint8Array,
  stateVector?: Uint8Array
): Promise<void> {
  await prisma.yjsDocument.upsert({
    where: { pageId },
    create: {
      pageId,
      state: Buffer.from(state),
      stateVector: stateVector ? Buffer.from(stateVector) : null
    },
    update: {
      state: Buffer.from(state),
      stateVector: stateVector ? Buffer.from(stateVector) : null,
      updatedAt: new Date()
    }
  })
}

// Yjs 문서를 BlockNote JSON으로 변환 (기존 content 필드 동기화용)
export function yjsToBlockNoteJson(doc: Y.Doc): any[] {
  const fragment = doc.getXmlFragment('document-store')
  // BlockNote의 내부 변환 로직 활용
  // ... 변환 로직
  return []
}
```

### Phase 3.3.4: 인증 및 권한 (4단계)

#### 목표
- WebSocket 연결 시 인증 검증
- 페이지별 편집 권한 확인
- 세션 관리

#### 작업 항목
- [ ] WebSocket 연결 인증 미들웨어
- [ ] JWT 토큰 검증 로직
- [ ] 권한 기반 접근 제어
- [ ] 세션 추적 및 정리

#### 산출물
```typescript
// server/auth-middleware.ts
import { IncomingMessage } from 'http'
import { WebSocket } from 'ws'
import jwt from 'jsonwebtoken'

interface AuthenticatedRequest extends IncomingMessage {
  user?: {
    id: string
    name: string
    role: string
  }
}

export function authenticateWsConnection(
  ws: WebSocket,
  req: AuthenticatedRequest
): boolean {
  try {
    // URL에서 토큰 추출 (ws://host/page-id?token=xxx)
    const url = new URL(req.url!, `http://${req.headers.host}`)
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(4001, 'Authentication required')
      return false
    }

    // JWT 검증
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
    req.user = {
      id: decoded.sub,
      name: decoded.name,
      role: decoded.role
    }

    // ADMIN만 편집 가능
    if (decoded.role !== 'ADMIN') {
      ws.close(4003, 'Insufficient permissions')
      return false
    }

    return true
  } catch (error) {
    ws.close(4001, 'Invalid token')
    return false
  }
}
```

### Phase 3.3.5: 사용자 경험 향상 (5단계)

#### 목표
- 실시간 참여자 목록 표시
- 충돌 해결 UX
- 연결 끊김 시 복구 UX

#### 작업 항목
- [ ] ActiveUsers 컴포넌트 구현
- [ ] 연결 복구 로직 개선
- [ ] 오프라인 모드 UI
- [ ] 동기화 상태 표시

#### 산출물
```typescript
// src/components/editor/ActiveUsers.tsx
'use client'

import { useEffect, useState } from 'react'
import { Awareness } from 'y-protocols/awareness'

interface User {
  id: string
  name: string
  color: string
}

interface ActiveUsersProps {
  awareness: Awareness
  currentUserId: string
}

export function ActiveUsers({ awareness, currentUserId }: ActiveUsersProps) {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const updateUsers = () => {
      const states = awareness.getStates()
      const activeUsers: User[] = []

      states.forEach((state, clientId) => {
        if (state.user && state.user.id !== currentUserId) {
          activeUsers.push(state.user)
        }
      })

      setUsers(activeUsers)
    }

    awareness.on('change', updateUsers)
    updateUsers()

    return () => {
      awareness.off('change', updateUsers)
    }
  }, [awareness, currentUserId])

  if (users.length === 0) return null

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-gray-500 mr-2">함께 편집 중:</span>
      <div className="flex -space-x-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## WebSocket 서버 상세 설계

### 서버 구조

```
server/
├── index.ts              # 진입점
├── websocket-server.ts   # WebSocket 서버 메인
├── persistence.ts        # PostgreSQL 영속성
├── auth-middleware.ts    # 인증 미들웨어
├── room-manager.ts       # 문서 룸 관리
└── utils/
    ├── encoding.ts       # Yjs 인코딩 유틸
    └── logger.ts         # 로깅
```

### 전체 서버 코드

```typescript
// server/websocket-server.ts
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
import * as Y from 'yjs'
import { setupWSConnection } from 'y-websocket/bin/utils'
import { authenticateWsConnection } from './auth-middleware'
import { getYjsDocument, saveYjsDocument } from './persistence'

const PORT = process.env.WS_PORT || 1234

// 문서별 상태 관리
const docs = new Map<string, Y.Doc>()

// 자동 저장 간격 (밀리초)
const AUTO_SAVE_INTERVAL = 30000

// HTTP 서버 생성
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('WebSocket Collaboration Server')
})

// WebSocket 서버 생성
const wss = new WebSocketServer({ server })

wss.on('connection', async (ws: WebSocket, req) => {
  // 인증 검증
  if (!authenticateWsConnection(ws, req)) {
    return
  }

  // 문서명 추출 (page-{pageId})
  const docName = req.url?.split('/')[1]?.split('?')[0] || 'default'
  const pageId = docName.replace('page-', '')

  console.log(`[WS] Client connected to document: ${docName}`)

  // 기존 문서 로드 또는 새로 생성
  let doc = docs.get(docName)
  if (!doc) {
    doc = new Y.Doc()

    // PostgreSQL에서 기존 상태 로드
    const savedState = await getYjsDocument(pageId)
    if (savedState) {
      Y.applyUpdate(doc, savedState)
      console.log(`[WS] Loaded existing document state: ${docName}`)
    }

    docs.set(docName, doc)

    // 자동 저장 설정
    const saveInterval = setInterval(async () => {
      const state = Y.encodeStateAsUpdate(doc!)
      const stateVector = Y.encodeStateVector(doc!)
      await saveYjsDocument(pageId, state, stateVector)
      console.log(`[WS] Auto-saved document: ${docName}`)
    }, AUTO_SAVE_INTERVAL)

    // 문서가 삭제될 때 인터벌 정리
    doc.on('destroy', () => {
      clearInterval(saveInterval)
    })
  }

  // y-websocket 연결 설정
  setupWSConnection(ws, req, { doc })

  // 연결 종료 시 처리
  ws.on('close', async () => {
    console.log(`[WS] Client disconnected from: ${docName}`)

    // 마지막 클라이언트가 떠날 때 저장
    const clients = wss.clients
    const hasOtherClients = Array.from(clients).some(
      client => client !== ws && client.readyState === WebSocket.OPEN
    )

    if (!hasOtherClients && doc) {
      const state = Y.encodeStateAsUpdate(doc)
      const stateVector = Y.encodeStateVector(doc)
      await saveYjsDocument(pageId, state, stateVector)
      console.log(`[WS] Saved document on last client disconnect: ${docName}`)
    }
  })
})

server.listen(PORT, () => {
  console.log(`[WS] Collaboration server running on port ${PORT}`)
})

// 그레이스풀 셧다운
process.on('SIGINT', async () => {
  console.log('[WS] Shutting down...')

  // 모든 문서 저장
  for (const [docName, doc] of docs) {
    const pageId = docName.replace('page-', '')
    const state = Y.encodeStateAsUpdate(doc)
    await saveYjsDocument(pageId, state)
  }

  wss.close()
  process.exit(0)
})
```

### 환경 변수

```env
# .env 추가 항목

# WebSocket Server
WS_PORT=1234
NEXT_PUBLIC_WS_URL="ws://localhost:1234"

# Production (HTTPS 환경에서는 wss 사용)
# NEXT_PUBLIC_WS_URL="wss://your-domain.com/ws"
```

---

## 보안 고려사항

### 1. 인증 (Authentication)

| 위협 | 대응 방안 |
|------|----------|
| 미인증 접근 | JWT 토큰 필수 검증 |
| 토큰 탈취 | 짧은 만료 시간, Refresh Token |
| 중간자 공격 | WSS (TLS) 사용 |

### 2. 권한 (Authorization)

| 위협 | 대응 방안 |
|------|----------|
| 무단 편집 | ADMIN 역할만 편집 가능 |
| 타 문서 접근 | 문서별 접근 권한 확인 |
| 권한 상승 | 서버 측 권한 재검증 |

### 3. 데이터 보호

| 위협 | 대응 방안 |
|------|----------|
| 데이터 유출 | TLS 암호화 전송 |
| 인젝션 공격 | 입력 값 검증/새니타이징 |
| DoS 공격 | Rate Limiting, 연결 수 제한 |

### 구현 예시

```typescript
// server/security.ts

// Rate Limiting
const connectionCounts = new Map<string, number>()
const MAX_CONNECTIONS_PER_IP = 10

export function checkRateLimit(ip: string): boolean {
  const count = connectionCounts.get(ip) || 0
  if (count >= MAX_CONNECTIONS_PER_IP) {
    return false
  }
  connectionCounts.set(ip, count + 1)
  return true
}

// 입력 검증
export function validateDocumentName(name: string): boolean {
  // UUID 형식만 허용
  const uuidRegex = /^page-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(name)
}
```

---

## 성능 최적화

### 1. 네트워크 최적화

- **증분 업데이트**: 전체 문서 대신 변경분만 전송
- **State Vector 활용**: 효율적인 동기화
- **압축**: 대용량 업데이트 압축

### 2. 메모리 최적화

- **문서 언로딩**: 비활성 문서 메모리에서 제거
- **GC 설정**: Yjs 가비지 컬렉션 활성화

```typescript
// 비활성 문서 언로딩
const INACTIVE_TIMEOUT = 5 * 60 * 1000 // 5분

function cleanupInactiveDocs() {
  const now = Date.now()
  for (const [docName, metadata] of docMetadata) {
    if (now - metadata.lastAccess > INACTIVE_TIMEOUT) {
      const doc = docs.get(docName)
      if (doc && doc.clientID === 0) { // 연결된 클라이언트 없음
        doc.destroy()
        docs.delete(docName)
      }
    }
  }
}

setInterval(cleanupInactiveDocs, 60000) // 1분마다 실행
```

### 3. 확장성

```
현재 (단일 서버)
┌─────────────┐
│  WS Server  │
└─────────────┘

향후 (수평 확장)
┌─────────────┐     ┌─────────────┐
│  WS Server  │────▶│    Redis    │◀────│  WS Server  │
│     #1      │     │   Pub/Sub   │     │     #2      │
└─────────────┘     └─────────────┘     └─────────────┘

Hocuspocus 마이그레이션 시:
- Redis 기반 수평 확장
- SQLite/PostgreSQL 영속성 내장
- 웹훅 지원
```

---

## 테스트 전략

### 단위 테스트

```typescript
// __tests__/collaboration/yjs.test.ts
import * as Y from 'yjs'

describe('Yjs Document', () => {
  test('문서 생성 및 업데이트', () => {
    const doc = new Y.Doc()
    const fragment = doc.getXmlFragment('test')

    // 업데이트 적용
    doc.transact(() => {
      // ... 콘텐츠 추가
    })

    expect(fragment.length).toBeGreaterThan(0)
  })

  test('문서 동기화', () => {
    const doc1 = new Y.Doc()
    const doc2 = new Y.Doc()

    // doc1 업데이트
    const update1 = Y.encodeStateAsUpdate(doc1)

    // doc2에 적용
    Y.applyUpdate(doc2, update1)

    // 상태 일치 확인
    expect(Y.encodeStateAsUpdate(doc1)).toEqual(Y.encodeStateAsUpdate(doc2))
  })
})
```

### 통합 테스트

```typescript
// __tests__/collaboration/websocket.test.ts
import WebSocket from 'ws'

describe('WebSocket Server', () => {
  test('연결 및 인증', async () => {
    const token = 'valid-jwt-token'
    const ws = new WebSocket(`ws://localhost:1234/page-test?token=${token}`)

    await new Promise((resolve, reject) => {
      ws.on('open', resolve)
      ws.on('error', reject)
    })

    expect(ws.readyState).toBe(WebSocket.OPEN)
    ws.close()
  })
})
```

### E2E 테스트

```typescript
// e2e/collaboration.spec.ts
import { test, expect } from '@playwright/test'

test.describe('실시간 협업', () => {
  test('두 사용자 동시 편집', async ({ browser }) => {
    // 두 개의 브라우저 컨텍스트 생성
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // 같은 페이지 열기
    await page1.goto('/admin/pages/test-page/edit')
    await page2.goto('/admin/pages/test-page/edit')

    // User 1이 텍스트 입력
    await page1.locator('[data-test="editor"]').type('Hello from User 1')

    // User 2에서 텍스트 확인
    await expect(page2.locator('[data-test="editor"]')).toContainText('Hello from User 1')
  })
})
```

---

## 배포 가이드

### 개발 환경

```bash
# 1. 의존성 설치
npm install yjs y-websocket y-indexeddb y-protocols

# 2. 데이터베이스 마이그레이션
npm run db:migrate

# 3. WebSocket 서버 실행 (별도 터미널)
npx ts-node server/websocket-server.ts

# 4. Next.js 개발 서버 실행
npm run dev
```

### package.json 스크립트 추가

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "ws:dev": "ts-node server/websocket-server.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run ws:dev\"",
    "ws:build": "tsc server/websocket-server.ts --outDir dist/server",
    "ws:start": "node dist/server/websocket-server.js"
  }
}
```

### 프로덕션 환경

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
      - NEXT_PUBLIC_WS_URL=wss://your-domain.com/ws
    depends_on:
      - postgres
      - websocket

  websocket:
    build:
      context: .
      dockerfile: Dockerfile.ws
    ports:
      - "1234:1234"
    environment:
      - DATABASE_URL=postgresql://...
      - NEXTAUTH_SECRET=your-secret

  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=...

volumes:
  postgres_data:
```

### Nginx 설정 (WebSocket 프록시)

```nginx
# nginx.conf
upstream websocket {
    server websocket:1234;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    # WebSocket 프록시
    location /ws/ {
        proxy_pass http://websocket/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # Next.js 앱
    location / {
        proxy_pass http://web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 파일 구조 (최종)

```
/
├── server/                           # WebSocket 서버 (NEW)
│   ├── index.ts
│   ├── websocket-server.ts
│   ├── persistence.ts
│   ├── auth-middleware.ts
│   ├── room-manager.ts
│   └── utils/
│       ├── encoding.ts
│       └── logger.ts
│
├── src/
│   ├── app/
│   │   └── api/
│   │       └── collaboration/        # 협업 API (NEW)
│   │           ├── session/route.ts
│   │           └── document/route.ts
│   │
│   ├── components/
│   │   └── editor/
│   │       ├── Editor.tsx            # 기존 에디터
│   │       ├── CollaborativeEditor.tsx  # (NEW)
│   │       ├── ActiveUsers.tsx          # (NEW)
│   │       └── ConnectionStatus.tsx     # (NEW)
│   │
│   ├── hooks/                        # 커스텀 훅 (NEW)
│   │   └── useCollaboration.ts
│   │
│   └── lib/
│       └── collaboration/            # 협업 유틸 (NEW)
│           ├── yjs-utils.ts
│           └── awareness-utils.ts
│
├── prisma/
│   └── schema.prisma                 # 스키마 업데이트
│
└── docs/
    └── planning/
        └── 06-realtime-collaboration.md  # 본 문서
```

---

## 마일스톤

| Phase | 목표 | 예상 작업량 | 상태 |
|-------|------|-------------|------|
| 3.3.1 | 기반 구축 | 패키지 설치, WS 서버 기본 | ⏳ 예정 |
| 3.3.2 | 클라이언트 통합 | BlockNote 협업, Presence UI | ⏳ 예정 |
| 3.3.3 | 서버 영속성 | PostgreSQL 저장, 자동 저장 | ⏳ 예정 |
| 3.3.4 | 인증 및 권한 | JWT 검증, 접근 제어 | ⏳ 예정 |
| 3.3.5 | UX 향상 | 참여자 목록, 오프라인 UX | ⏳ 예정 |

---

## 참고 자료

- [BlockNote Collaboration Docs](https://www.blocknotejs.org/docs/features/collaboration)
- [Yjs GitHub](https://github.com/yjs/yjs)
- [y-websocket](https://github.com/yjs/y-websocket)
- [Hocuspocus](https://tiptap.dev/docs/hocuspocus/introduction) (향후 확장 시)
- [CRDT 알고리즘 이해](https://crdt.tech/)
