'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { getAuthErrorMessage } from '@/lib/authMessages';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authApi.register(form);
      router.push('/login');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '注册失败';
      setError(getAuthErrorMessage(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(45, 45, 45)' }}>
      <div className="glass-card p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8" style={{ color: '#c2905e' }}>
          创建账号
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white mb-2">用户名</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="请输入用户名（3-50 字符）"
              className="w-full px-4 py-2 rounded bg-white/10 text-white border border-white/20 focus:border-[#c2905e] focus:outline-none"
              required
              minLength={3}
              maxLength={50}
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">邮箱</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="请输入邮箱"
              className="w-full px-4 py-2 rounded bg-white/10 text-white border border-white/20 focus:border-[#c2905e] focus:outline-none"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">密码</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="请输入密码（至少 6 位）"
              className="w-full px-4 py-2 rounded bg-white/10 text-white border border-white/20 focus:border-[#c2905e] focus:outline-none"
              required
              minLength={6}
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
            {loading ? '创建中...' : '注册'}
          </button>
        </form>
        <p className="text-center mt-4 text-white/70">
          已有账号？{' '}
          <a href="/login" className="text-[#c2905e] hover:underline">
            登录
          </a>
        </p>
      </div>
    </div>
  );
}
