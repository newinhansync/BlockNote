import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { LoginForm } from './LoginForm'

export default async function LoginPage() {
  const session = await auth()

  if (session) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">BlockNote Admin</h1>
            <p className="text-gray-500 mt-2">관리자 로그인</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
