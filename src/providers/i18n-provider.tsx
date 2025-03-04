// src/providers/i18n-provider.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { messages } from '@/i18n'; // Daha önce oluşturduğumuz dil dosyası

// Nesne yolunu (path) takip ederek değer getiren yardımcı fonksiyon
const getValueByPath = (obj: any, path: string): string => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return path; // Değer bulunamadıysa path'i döndür
    }
    result = result[key];
  }
  
  return typeof result === 'string' ? result : path;
};

// i18n Context tipi
type I18nContextType = {
  t: (key: string) => string;
  locale: string;
  setLocale: (locale: string) => void;
};

// Context oluşturma
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Provider props
interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: string;
}

export function I18nProvider({ 
  children, 
  defaultLocale = 'tr' 
}: I18nProviderProps) {
  const [locale, setLocale] = useState(defaultLocale);
  const [translations, setTranslations] = useState(messages[locale as keyof typeof messages] || messages.tr);

  // Locale değiştiğinde çevirileri güncelleme
  useEffect(() => {
    setTranslations(messages[locale as keyof typeof messages] || messages.tr);
  }, [locale]);

  // Çeviri fonksiyonu
  const t = (key: string): string => {
    return getValueByPath(translations, key) || key;
  };

  return (
    <I18nContext.Provider 
      value={{ 
        t,
        locale, 
        setLocale 
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

// Hook
export function useI18n() {
  const context = useContext(I18nContext);
  
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  
  return context;
}