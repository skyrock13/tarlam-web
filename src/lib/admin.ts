// src/lib/admin.ts
import { useSupabase } from '@/providers/supabase-provider';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

/**
 * Bir kullanıcının admin olup olmadığını kontrol eder
 * 
 * @param user - Supabase kullanıcı objesi
 * @returns Kullanıcı admin ise true döner
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  
  return (
    user.app_metadata?.admin === true || 
    user.user_metadata?.is_admin === true || 
    user.user_metadata?.is_super_admin === true
  );
}

/**
 * Bir kullanıcının super admin olup olmadığını kontrol eder
 * 
 * @param user - Supabase kullanıcı objesi
 * @returns Kullanıcı super admin ise true döner
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  
  return (
    user.app_metadata?.admin === true && user.app_metadata?.super_admin === true || 
    user.user_metadata?.is_super_admin === true
  );
}

/**
 * Admin sayfalarına erişim kontrolü için React hook
 * 
 * @param options - Yapılandırma seçenekleri
 * @returns Admin erişim durumu
 */
export function useAdminAccess(options?: { 
  requireSuperAdmin?: boolean, 
  redirectOnFail?: string
}) {
  const { supabase, user } = useSupabase();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      
      const hasPermission = options?.requireSuperAdmin 
        ? isSuperAdmin(user)
        : isAdmin(user);
      
      setHasAccess(hasPermission);
      setIsLoading(false);
      
      if (!hasPermission && options?.redirectOnFail) {
        router.push(options.redirectOnFail);
      }
    };
    
    checkAccess();
  }, [user, router, options]);
  
  return { hasAccess, isLoading };
}

/**
 * Admin yetki gerektiren bir işlev çağrısını yetkilendirme ile güvenceye alan yardımcı
 * 
 * @param fn - Çağrılacak işlev
 * @param user - Supabase kullanıcı objesi
 * @param options - Yapılandırma seçenekleri
 * @returns İşlevin sonucu veya yetki hatası
 */
export async function withAdminAuth<T>(
  fn: () => Promise<T>,
  user: User | null,
  options?: {
    requireSuperAdmin?: boolean,
    errorMessage?: string
  }
): Promise<T> {
  const hasPermission = options?.requireSuperAdmin 
    ? isSuperAdmin(user)
    : isAdmin(user);
  
  if (!hasPermission) {
    throw new Error(options?.errorMessage || 'Bu işlemi yapmak için admin yetkisine sahip değilsiniz.');
  }
  
  return await fn();
}

// Admin erişim kontrolünü UI'da kullanarak bileşenleri koşullu gösterme için örnek:
export function AdminOnly({ 
  children, 
  fallback = null,
  requireSuperAdmin = false
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireSuperAdmin?: boolean;
}) {
  const { user } = useSupabase();
  
  const hasPermission = requireSuperAdmin 
    ? isSuperAdmin(user)
    : isAdmin(user);
  
  if (!hasPermission) {
    return fallback;
  }
  
  return children;
}