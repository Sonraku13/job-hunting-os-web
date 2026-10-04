'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';
import { translations, type Language, type TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'id',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: TranslationKey) => translations.id[key] || key,
});

function subscribeLanguage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('app-language-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('app-language-change', callback);
  };
}

function getLanguageSnapshot(): Language {
  if (typeof window === 'undefined') return 'id';
  const saved = localStorage.getItem('app_language');
  return saved === 'en' || saved === 'id' ? saved : 'id';
}

function getServerLanguageSnapshot(): Language {
  return 'id';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(
    subscribeLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot
  );

  const setLanguage = (lang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', lang);
      window.dispatchEvent(new Event('app-language-change'));
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.id[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
