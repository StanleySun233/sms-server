'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authApi } from '@/lib/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await authApi.getCurrentUser().then(() => setLoading(false)).catch(() => router.push('/login'));
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(45, 45, 45)' }}>
        <div className="text-white text-xl">{tCommon('loading')}</div>
      </div>
    );
  }

  return <>{children}</>;
}
