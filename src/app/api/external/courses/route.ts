import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// External API for TouchClass integration
// Uses API key authentication instead of session

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

// GET /api/external/courses - 모든 콘텐츠 목록 조회
export async function GET(request: NextRequest) {
  if (!await validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const courses = await prisma.course.findMany({
      include: {
        curriculums: {
          orderBy: { order: 'asc' },
          include: {
            pages: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        },
        _count: {
          select: {
            curriculums: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: courses,
      meta: {
        total: courses.length,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('External API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
