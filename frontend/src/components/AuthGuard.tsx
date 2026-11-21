'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user, loading, sessionError, refreshUser } = useAuth();

  useEffect(() => {
    if (!loading && !user && !sessionError) router.replace('/login');
  }, [router, loading, user, sessionError]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(45, 45, 45)' }}>
        {sessionError ? <div role="alert" className="text-center text-white">
          <p>{tCommon('sessionUnavailable')}</p>
          <button type="button" className="mt-3 rounded-lg border px-4 py-2" onClick={refreshUser}>{tCommon('tryAgain')}</button>
        </div> : <div role="status" className="text-white text-xl">{tCommon('loading')}</div>}
      </div>
    );
  }

  return <>{children}</>;
}
