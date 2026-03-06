'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

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
      // After successful registration, redirect to login
      router.push('/login');
    } catch (error: any) {
      setError(error.response?.data || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(45, 45, 45)' }}>
      <div className="glass-card p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8" style={{ color: '#c2905e' }}>
          Create Account
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white mb-2">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Choose a username (3-50 characters)"
              className="w-full px-4 py-2 rounded bg-white/10 text-white border border-white/20 focus:border-[#c2905e] focus:outline-none"
              required
              minLength={3}
              maxLength={50}
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter your email"
              className="w-full px-4 py-2 rounded bg-white/10 text-white border border-white/20 focus:border-[#c2905e] focus:outline-none"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Choose a password (min 6 characters)"
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
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="text-center mt-4 text-white/70">
          Already have an account?{' '}
          <a href="/login" className="text-[#c2905e] hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
