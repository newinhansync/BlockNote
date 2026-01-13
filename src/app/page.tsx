export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">BlockNote Content Tool</h1>
        <p className="text-gray-600 mb-8">
          BlockNote 기반 콘텐츠 저작 도구입니다.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <a
            href="/admin"
            className="block p-6 border rounded-lg hover:border-blue-500 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">관리자 →</h2>
            <p className="text-gray-500">콘텐츠 생성 및 편집</p>
          </a>

          <a
            href="/viewer"
            className="block p-6 border rounded-lg hover:border-green-500 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">뷰어 →</h2>
            <p className="text-gray-500">콘텐츠 조회</p>
          </a>
        </div>
      </div>
    </main>
  )
}
