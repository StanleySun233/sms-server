'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { locales, localeNames, type Locale } from '@/i18n/config';

export default function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const triggerStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };

  const panelStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all duration-200 text-base"
        style={triggerStyle}
      >
        <span>{localeNames[locale]}</span>
        <svg
          className="w-4 h-4 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 min-w-[100%] rounded-lg shadow-lg py-1 z-50"
          style={panelStyle}
        >
          {locales.map((l) => {
            const isActive = l === locale;
            return (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-base transition-all duration-200 first:rounded-t-lg last:rounded-b-lg ${
                  !isActive ? 'hover:bg-[rgba(194,144,94,0.15)]' : ''
                }`}
                style={{
                  backgroundColor: isActive ? 'rgba(194, 144, 94, 0.25)' : 'transparent',
                  color: isActive ? '#c2905e' : 'rgba(255, 255, 255, 0.9)',
                }}
              >
                {localeNames[l]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
