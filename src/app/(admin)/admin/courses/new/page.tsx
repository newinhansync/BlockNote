import { CourseForm } from '../CourseForm'

export default function NewCoursePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">새 콘텐츠 만들기</h1>
      <CourseForm />
    </div>
  )
}
