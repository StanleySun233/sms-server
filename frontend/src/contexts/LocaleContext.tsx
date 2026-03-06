'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { defaultLocale, type Locale } from '@/i18n/config';
import zh from '@/messages/zh.json';
import en from '@/messages/en.json';

const LOCALE_STORAGE_KEY = 'locale';

const messages: Record<Locale, Record<string, unknown>> = { zh, en };

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'zh' || stored === 'en') return stored;
  return defaultLocale;
}

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

function getBrowserTimeZone(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setMounted(true);
    setTimeZone(getBrowserTimeZone());
  }, []);

  useEffect(() => {
    if (!mounted || !user?.preferences?.locale) return;
    const pref = user.preferences.locale as Locale;
    if (pref === 'zh' || pref === 'en') {
      setLocaleState(pref);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCALE_STORAGE_KEY, pref);
      }
    }
  }, [mounted, user?.preferences?.locale]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      }
      if (user) {
        authApi.updatePreferences({ locale: newLocale }).then(() => refreshUser());
      }
    },
    [user, refreshUser]
  );

  const value: LocaleContextType = { locale, setLocale };

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone={timeZone}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}
