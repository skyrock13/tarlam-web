// src/components/shared/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/helpers'
import { useSupabase } from '@/providers/supabase-provider'
import { useEffect, useState } from 'react'
import {
  Home,
  Sprout,
  Wrench,
  Bell,
  Settings,
  BarChart2,
  Users,
  Database,
  Box,
  PackagePlus
} from 'lucide-react'

const navigation = [
  { name: 'Devices', href: '/devices', icon: BarChart2 },
  { name: 'Plants', href: '/plants', icon: Sprout },
  { name: 'Notifications', href: '/notifications', icon: Bell },
]

// Admin menü öğeleri
const adminNavigation = [
  { name: 'Device Models', href: '/admin/device-models', icon: Database },
  { name: 'Inventory', href: '/admin/inventory', icon: Box },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useSupabase()
  const [isAdmin, setIsAdmin] = useState(false)

  // Admin kontrolü
  useEffect(() => {
    if (user) {
      const adminStatus = 
        user.app_metadata?.admin === true || 
        user.user_metadata?.is_admin === true || 
        user.user_metadata?.is_super_admin === true;
      
      setIsAdmin(adminStatus);
    }
  }, [user]);

  return (
    <div className="flex h-full flex-col bg-white py-4">
      <div className="px-4">
        <img src="/tarlam_logo.webp" alt="Tarlam Logo" />
      </div>
      <nav className="mt-8 flex-1 space-y-1 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}

        {/* Admin menüsü - sadece admin kullanıcılara göster */}
        {isAdmin && (
          <>
            <div className="my-6 border-t border-gray-200"></div>
            <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Admin
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>
    </div>
  )
}