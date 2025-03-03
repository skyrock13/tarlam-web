// src/components/shared/header.tsx
'use client'

import { useSupabase } from '@/providers/supabase-provider'
import { Button } from '@/components/ui/button'
import { Bell, Settings, User } from 'lucide-react'
import Link from 'next/link'

export default function Header() {
  const { supabase, user } = useSupabase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="border-b">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            Tarlam Management System
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/notifications">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="text-left text-sm text-muted-foreground hover:underline"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}