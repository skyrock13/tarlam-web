// src/hooks/useUser.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/providers/supabase-provider';
import { Database } from '@/lib/types/supabase';

type User = Database['public']['Tables']['users']['Row'];

export function useUser(userId: string | null | undefined) {
  const { supabase } = useSupabase();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
    
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const cacheExpiryTimeMs = 60000; // 1 minute cache
  const lastUserIdRef = useRef<string | null | undefined>(null);

  const fetchUser = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      setUserData(null);
      setLoading(false);
      return;
    }
    
    if (isFetchingRef.current && lastUserIdRef.current === userId) {
      console.log(`Skipping duplicate fetchUser call for userId ${userId} - already in progress`);
      return;
    }

    const now = Date.now();
    if (!forceRefresh && 
        userData && 
        lastUserIdRef.current === userId &&
        now - lastFetchTimeRef.current < cacheExpiryTimeMs) {
      console.log(`Using cached user data for userId ${userId}`);
      return;
    }
    
    console.log(`Fetching user data from Supabase for userId ${userId}`);
    isFetchingRef.current = true;
    lastUserIdRef.current = userId;
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (fetchError) throw fetchError;
      
      setUserData(data);
      lastFetchTimeRef.current = now;
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err?.message || 'Kullanıcı verisi getirilirken bir hata oluştu');
      setUserData(null);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (lastUserIdRef.current !== userId) {
      fetchUser();
    }
  }, [userId, fetchUser]);

  return { 
    user: userData, 
    loading, 
    error, 
    refreshUser: (force = true) => fetchUser(force) 
  };
}