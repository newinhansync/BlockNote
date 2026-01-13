'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-2 px-3 py-2 w-full text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors"
    >
      <LogOut size={16} />
      로그아웃
    </button>
  )
}
