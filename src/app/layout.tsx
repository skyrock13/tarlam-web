// src/app/layout.tsx
import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import SupabaseProvider from '@/providers/supabase-provider'
import { I18nProvider } from '@/providers/i18n-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Tarlam Management System',
  description: 'A comprehensive management system for tarlam devices and plants',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <I18nProvider defaultLocale="tr">
            {children}
          </I18nProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}