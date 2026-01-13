import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CourseForm } from '../../CourseForm'

type PageProps = { params: Promise<{ courseId: string }> }

async function getCourse(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId }
  })
}

export default async function EditCoursePage({ params }: PageProps) {
  const { courseId } = await params
  const course = await getCourse(courseId)

  if (!course) {
    notFound()
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">콘텐츠 수정</h1>
      <CourseForm course={course} />
    </div>
  )
}
