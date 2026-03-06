'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [loading, user, router]);

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(45, 45, 45)' }}>
      <div className="text-white text-xl">{tCommon('loading')}</div>
    </main>
  );
}
