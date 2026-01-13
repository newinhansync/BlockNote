import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider, ToastContainer } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'BlockNote Content Tool',
  description: 'BlockNote 기반 콘텐츠 저작 도구',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  )
}
