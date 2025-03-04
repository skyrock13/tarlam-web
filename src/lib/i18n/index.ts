// src/lib/i18n/index.ts
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import enTranslations from './locales/en';
import trTranslations from './locales/tr';

// Define the translations object type
type Translations = {
  [key: string]: string | Translations;
};

// Define supported languages
export const LANGUAGES = {
  EN: 'en',
  TR: 'tr',
};

// Define default language
export const DEFAULT_LANGUAGE = LANGUAGES.EN;

// Define translations for each language
const translations: Record<string, Translations> = {
  [LANGUAGES.EN]: enTranslations,
  [LANGUAGES.TR]: trTranslations,
};

// Helper function to get nested translation keys
function getNestedTranslation(obj: Translations, path: string): string {
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current[key] === undefined) {
      console.warn(`Translation key not found: ${path}`);
      return path;
    }
    current = current[key];
  }
  
  if (typeof current !== 'string') {
    console.warn(`Translation value is not a string: ${path}`);
    return path;
  }
  
  return current;
}

// Custom hook to use translations
export function useTranslation() {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  
  // You can use router to get the language from URL or query params if needed
  // const router = useRouter();
  
  // Example: Load language from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') || DEFAULT_LANGUAGE;
      if (Object.values(LANGUAGES).includes(savedLanguage as any)) {
        setLanguage(savedLanguage);
      }
    }
  }, []);
  
  // Function to change language
  const changeLanguage = (lang: string) => {
    if (Object.values(LANGUAGES).includes(lang as any)) {
      setLanguage(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', lang);
      }
    }
  };
  
  // Translation function
  const t = (key: string, variables?: Record<string, string>): string => {
    let translation = '';
    
    // Get translation from current language
    if (translations[language] && key) {
      translation = getNestedTranslation(translations[language], key);
    }
    
    // Fall back to default language if translation is missing
    if (!translation && language !== DEFAULT_LANGUAGE) {
      translation = getNestedTranslation(translations[DEFAULT_LANGUAGE], key);
    }
    
    // If still no translation, return the key itself
    if (!translation) {
      return key;
    }
    
    // Replace variables in the translation if provided
    if (variables) {
      Object.keys(variables).forEach((variable) => {
        translation = translation.replace(
          new RegExp(`{{${variable}}}`, 'g'), 
          variables[variable]
        );
      });
    }
    
    return translation;
  };
  
  return {
    t,
    language,
    changeLanguage,
    languages: LANGUAGES,
  };
}

// Export translations for direct access if needed
export { translations };