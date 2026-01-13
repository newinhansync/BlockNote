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

type RouteParams = { params: Promise<{ pageId: string }> }

// GET /api/external/pages/[pageId] - 특정 페이지 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!await validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { pageId } = await params

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        curriculum: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: page,
      meta: {
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('External API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
