import Link from 'next/link'
import { BookOpen, Home } from 'lucide-react'

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/viewer" className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="text-green-600" size={24} />
            콘텐츠 뷰어
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home size={18} />
              홈
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
