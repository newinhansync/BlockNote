import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const API_KEY_HEADER = 'X-API-Key'

async function validateApiKey(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get(API_KEY_HEADER)
  const validApiKey = process.env.EXTERNAL_API_KEY

  if (!validApiKey) {
    console.warn('EXTERNAL_API_KEY not configured')
    return false
  }

  return apiKey === validApiKey
}

type RouteParams = { params: Promise<{ courseId: string }> }

// GET /api/external/courses/[courseId] - 특정 콘텐츠 상세 조회 (콘텐츠 포함)
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!await validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        curriculums: {
          orderBy: { order: 'asc' },
          include: {
            pages: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: course,
      meta: {
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('External API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
