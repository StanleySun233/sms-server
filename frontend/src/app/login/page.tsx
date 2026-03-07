'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthErrorKey } from '@/lib/authMessages';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function LoginPage() {
  const t = useTranslations('login');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(form.username, form.password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登录失败';
      const key = getAuthErrorKey(msg);
      setError(key ? tErrors(key) : msg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(45, 45, 45)' }}>
        <div className="text-white text-xl">{tCommon('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(45, 45, 45)' }}>
      <div className="relative glass-card p-8 w-[600px] min-h-[400px]">
        <div className="absolute top-4 right-4">
          <LocaleSwitcher />
        </div>
        <h1 className="text-3xl font-bold text-center mb-8 pt-10" style={{ color: '#c2905e' }}>
          {t('title')}
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white mb-2">{t('username')}</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder={t('placeholderUsername')}
              className="w-full px-4 py-2 rounded bg-white/10 text-white border border-white/20 focus:border-[#c2905e] focus:outline-none"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">{t('password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t('placeholderPassword')}
              className="w-full px-4 py-2 rounded bg-white/10 text-white border border-white/20 focus:border-[#c2905e] focus:outline-none"
              required
            />
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-[#c2905e] text-white rounded hover:bg-[#a67b4f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('submitting') : t('submit')}
          </button>
        </form>
        <p className="text-center mt-4 text-white/70">
          {t('noAccount')}{' '}
          <a href="/register" className="text-[#c2905e] hover:underline">
            {t('registerLink')}
          </a>
        </p>
      </div>
    </div>
  );
}
