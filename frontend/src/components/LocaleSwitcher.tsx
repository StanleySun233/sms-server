'use client';

import { useLocale } from '@/contexts/LocaleContext';
import { localeNames, type Locale } from '@/i18n/config';

export default function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  const nextLocale: Locale = locale === 'zh' ? 'en' : 'zh';

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      className="text-base px-4 py-2.5 rounded-lg transition-all duration-200"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      {localeNames[nextLocale]}
    </button>
  );
}
