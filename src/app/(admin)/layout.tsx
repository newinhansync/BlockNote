import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, PenTool, User } from 'lucide-react'
import { auth } from '@/lib/auth'
import { LogoutButton } from '@/components/auth/LogoutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Only allow ADMIN role
  if (session.user.role !== 'ADMIN') {
    redirect('/viewer')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <Link href="/admin" className="text-xl font-bold">
            Admin Panel
          </Link>
        </div>
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800 transition-colors"
              >
                <Home size={18} />
                대시보드
              </Link>
            </li>
            <li>
              <Link
                href="/admin/contents"
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800 transition-colors"
              >
                <PenTool size={18} />
                콘텐츠 저작
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300">
            <User size={16} />
            <span className="truncate">{session.user.email}</span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  )
}
