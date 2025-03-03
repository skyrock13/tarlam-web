// src/providers/supabase-provider.tsx
'use client'

import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs' // CORRECT IMPORT
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'
import { Database } from '@/lib/types/supabase' // Import Database type

type SupabaseContextType = {
  supabase: SupabaseClient<Database> // Use Database type here
  user: User | null // Use User from Supabase
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined) // Correct context

interface SupabaseProviderProps {
    children: ReactNode;
}

export default function SupabaseProvider({
  children,
}: SupabaseProviderProps) {

  const [supabaseClient] = useState(() => createClientComponentClient<Database>()); // Create client *once*

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Get initial session state
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session); // Update session state
    });

    return () => {
      subscription.unsubscribe()
    }
  }, [supabaseClient]);

  return (
    <SupabaseContext.Provider value={{ supabase: supabaseClient, user: session?.user ?? null }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}