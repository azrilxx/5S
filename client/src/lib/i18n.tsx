import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import enTranslations from '@/locales/en.json';
import zhTranslations from '@/locales/zh.json';

export type Language = 'en' | 'zh';

export const languages: { [key: string]: string } = {
  en: 'English',
  zh: '中文'
};

const translations: { [key in Language]: any } = {
  en: enTranslations,
  zh: zhTranslations
};

// Get nested translation key
const getNestedTranslation = (obj: any, path: string): string => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] ? current[key] : null;
  }, obj);
};

// Translation function
export const translate = (key: string, language: Language = 'en'): string => {
  const translation = getNestedTranslation(translations[language], key);
  if (translation) {
    return translation;
  }
  
  // Fallback to English if translation not found
  const fallback = getNestedTranslation(translations.en, key);
  if (fallback) {
    return fallback;
  }
  
  // Return key if no translation found
  return key;
};

// Custom hook for i18n
export const useTranslation = (initialLanguage: Language = 'en') => {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  
  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && savedLanguage in translations) {
      setLanguage(savedLanguage);
    }
  }, []);
  
  // Save language to localStorage when changed
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);
  
  const t = (key: string) => translate(key, language);
  
  return {
    language,
    setLanguage,
    t
  };
};

// Context for global language state

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children, initialLanguage = 'en' }: { children: ReactNode; initialLanguage?: Language }) => {
  const { language, setLanguage, t } = useTranslation(initialLanguage);
  
  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};