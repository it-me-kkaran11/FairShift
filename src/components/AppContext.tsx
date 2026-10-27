'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_PERSONAS } from '@/lib/auth/personas';
import { translations, Language } from '@/lib/i18n/translations';

export interface AppContextType {
  currentPersona: (typeof DEMO_PERSONAS)[number];
  setPersonaId: (id: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  refreshTrigger: number;
  triggerRefresh: () => void;
  resetDemoData: () => Promise<void>;
  isResetting: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [personaId, setPersonaIdState] = useState<string>('usr-const-w1');
  const [language, setLanguageState] = useState<Language>('en');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    const savedPersona = localStorage.getItem('fairshift_persona_id');
    const savedLang = localStorage.getItem('fairshift_language') as Language;
    if (savedPersona && DEMO_PERSONAS.some(p => p.id === savedPersona)) {
      setPersonaIdState(savedPersona);
    }
    if (savedLang === 'en' || savedLang === 'ta') {
      setLanguageState(savedLang);
    }
  }, []);

  const setPersonaId = (id: string) => {
    setPersonaIdState(id);
    localStorage.setItem('fairshift_persona_id', id);
    setRefreshTrigger(prev => prev + 1);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('fairshift_language', lang);
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const resetDemoData = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/seed/reset', { method: 'POST' });
      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to reset demo data', err);
    } finally {
      setIsResetting(false);
    }
  };

  const currentPersona = DEMO_PERSONAS.find(p => p.id === personaId) || DEMO_PERSONAS[0];
  const t = translations[language];

  return (
    <AppContext.Provider
      value={{
        currentPersona,
        setPersonaId,
        language,
        setLanguage,
        t,
        refreshTrigger,
        triggerRefresh,
        resetDemoData,
        isResetting
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
