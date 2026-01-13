# 03. 데이터베이스 스키마

## ER 다이어그램

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

  @@map("pages")
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
