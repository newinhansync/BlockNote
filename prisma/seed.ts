import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

// Prisma 7 requires a driver adapter
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.pageVersion.deleteMany()
  await prisma.page.deleteMany()
  await prisma.curriculum.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: '관리자',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('Created admin user:', admin.email)

  // Create viewer user
  const viewerPassword = await bcrypt.hash('viewer123', 10)
  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@example.com',
      name: '뷰어',
      password: viewerPassword,
      role: 'VIEWER',
    },
  })
  console.log('Created viewer user:', viewer.email)

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
                      id: 'block-1',
                      type: 'heading',
                      props: { level: 1, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
                      content: [{ type: 'text', text: '환영합니다!', styles: {} }],
                      children: [],
                    },
                    {
                      id: 'block-2',
                      type: 'paragraph',
                      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
                      content: [{ type: 'text', text: '이것은 샘플 콘텐츠입니다. BlockNote 에디터를 사용하여 편집할 수 있습니다.', styles: {} }],
                      children: [],
                    },
                  ],
                },
                {
                  title: '설치 가이드',
                  order: 1,
                  content: [
                    {
                      id: 'block-3',
                      type: 'heading',
                      props: { level: 2, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
                      content: [{ type: 'text', text: '설치 방법', styles: {} }],
                      children: [],
                    },
                    {
                      id: 'block-4',
                      type: 'bulletListItem',
                      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
                      content: [{ type: 'text', text: 'Node.js 설치', styles: {} }],
                      children: [],
                    },
                    {
                      id: 'block-5',
                      type: 'bulletListItem',
                      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
                      content: [{ type: 'text', text: '의존성 설치: npm install', styles: {} }],
                      children: [],
                    },
                    {
                      id: 'block-6',
                      type: 'bulletListItem',
                      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
                      content: [{ type: 'text', text: '개발 서버 실행: npm run dev', styles: {} }],
                      children: [],
                    },
                  ],
                },
              ],
            },
          },
          {
            title: '2장. 기본 사용법',
            order: 1,
            pages: {
              create: [
                {
                  title: '에디터 사용법',
                  order: 0,
                  content: [
                    {
                      id: 'block-7',
                      type: 'heading',
                      props: { level: 1, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
                      content: [{ type: 'text', text: '에디터 사용 가이드', styles: {} }],
                      children: [],
                    },
                    {
                      id: 'block-8',
                      type: 'paragraph',
                      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
                      content: [{ type: 'text', text: 'BlockNote 에디터는 블록 기반의 직관적인 편집 도구입니다.', styles: {} }],
                      children: [],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      curriculums: {
        include: {
          pages: true,
        },
      },
    },
  })

  console.log('Created course:', course.title)
  console.log('Total curriculums:', course.curriculums.length)
  console.log('Total pages:', course.curriculums.reduce((acc, c) => acc + c.pages.length, 0))

  console.log('\n--- Test Accounts ---')
  console.log('Admin: admin@example.com / admin123')
  console.log('Viewer: viewer@example.com / viewer123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
