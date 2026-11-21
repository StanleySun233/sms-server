'use client';

import { useState, type FormEvent } from 'react';
import { authApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { getAuthErrorKey } from '@/lib/authMessages';
import { useAuth } from '@/contexts/AuthContext';

type Feedback = { message: string; error?: boolean };

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tErrors = useTranslations('errors');
  const { user, refreshUser } = useAuth();
  const [savedEmail, setSavedEmail] = useState(user?.email ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>();
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>();

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (profileSaving || !address || address === savedEmail) return;
    setProfileSaving(true);
    setProfileFeedback(undefined);
    try {
      const { data } = await authApi.updateProfile({ email: address });
      setEmail(data.email);
      setSavedEmail(data.email);
      setProfileFeedback({ message: t('profileSaved') });
      void refreshUser();
    } catch (error) {
      const key = error instanceof Error ? getAuthErrorKey(error.message) : null;
      setProfileFeedback({ message: key ? tErrors(key) : t('profileSaveFailed'), error: true });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwordSaving) return;
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ message: t('passwordMismatch'), error: true });
      return;
    }
    setPasswordSaving(true);
    setPasswordFeedback(undefined);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPasswordFeedback({ message: t('passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const key = error instanceof Error ? getAuthErrorKey(error.message) : null;
      setPasswordFeedback({ message: key ? tErrors(key) : t('passwordSaveFailed'), error: true });
    } finally {
      setPasswordSaving(false);
    }
  };

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };

  const inputStyle = 'w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[#c2905e] transition-colors';

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8" style={{ color: '#c2905e' }}>
        {t('title')}
      </h1>

      <div className="rounded-2xl p-8 shadow-xl mb-6" style={cardStyle}>
        <h2 className="text-xl font-semibold text-white mb-4">{t('profile')}</h2>
        <form className="space-y-4" onSubmit={handleSaveProfile}>
          <div>
            <label className="block text-white/70 mb-2">{t('username')}</label>
            <div className="text-white py-2">{user?.username}</div>
          </div>
          <div>
            <label htmlFor="settings-email" className="block text-white/70 mb-2">{t('email')}</label>
            <input
              id="settings-email"
              type="email"
              autoComplete="email"
              maxLength={100}
              required
              disabled={profileSaving}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setProfileFeedback(undefined); }}
              placeholder={t('placeholderEmail')}
              className={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={profileSaving || !email.trim() || email.trim() === savedEmail}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: '#c2905e', color: '#fff' }}
          >
            {profileSaving ? t('savingProfile') : t('saveProfile')}
          </button>
          <FormFeedback feedback={profileFeedback} />
        </form>
      </div>

      <div className="rounded-2xl p-8 shadow-xl" style={cardStyle}>
        <h2 className="text-xl font-semibold text-white mb-4">{t('changePassword')}</h2>
        <form className="space-y-4" onSubmit={handleChangePassword}>
          <div>
            <label htmlFor="settings-current-password" className="block text-white/70 mb-2">{t('currentPassword')}</label>
            <input
              id="settings-current-password"
              required
              disabled={passwordSaving}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t('placeholderCurrentPassword')}
              className={inputStyle}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="settings-new-password" className="block text-white/70 mb-2">{t('newPassword')}</label>
            <input
              id="settings-new-password"
              required
              minLength={6}
              disabled={passwordSaving}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('placeholderNewPassword')}
              className={inputStyle}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="settings-confirm-password" className="block text-white/70 mb-2">{t('confirmPassword')}</label>
            <input
              id="settings-confirm-password"
              required
              disabled={passwordSaving}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('placeholderConfirmPassword')}
              className={inputStyle}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={passwordSaving}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: '#c2905e', color: '#fff' }}
          >
            {passwordSaving ? t('changingPassword') : t('changePasswordBtn')}
          </button>
          <FormFeedback feedback={passwordFeedback} />
        </form>
      </div>
    </div>
  );
}

function FormFeedback({ feedback }: { feedback?: Feedback }) {
  return feedback ? <p role={feedback.error ? 'alert' : 'status'}
    className={feedback.error ? 'text-amber-200' : 'text-emerald-200'}>{feedback.message}</p> : null;
}
