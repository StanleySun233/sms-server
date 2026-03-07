'use client';

import { useEffect, useState } from 'react';
import { ElMessage } from 'element-plus';
import { authApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { getAuthErrorKey } from '@/lib/authMessages';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  const [user, setUser] = useState<{ id: number; username: string; email: string; createdAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    authApi.getCurrentUser().then((res) => {
      const u = res.data;
      setUser(u);
      setEmail(u.email || '');
    }).finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = () => {
    if (!email.trim()) {
      ElMessage.warning(t('enterEmail'));
      return;
    }
    setProfileSaving(true);
    authApi.updateProfile({ email: email.trim() }).then((res) => {
      setUser(res.data);
      ElMessage.success(t('profileSaved'));
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : '保存失败';
      const key = getAuthErrorKey(msg);
      ElMessage.error(key ? tErrors(key) : msg);
    }).finally(() => setProfileSaving(false));
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      ElMessage.warning(t('fillPassword'));
      return;
    }
    if (newPassword.length < 6) {
      ElMessage.warning(t('passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      ElMessage.warning(t('passwordMismatch'));
      return;
    }
    setPasswordSaving(true);
    authApi.changePassword({ currentPassword, newPassword }).then(() => {
      ElMessage.success(t('passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : '修改密码失败';
      const key = getAuthErrorKey(msg);
      ElMessage.error(key ? tErrors(key) : msg);
    }).finally(() => setPasswordSaving(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-white text-xl">{tCommon('loading')}</div>
      </div>
    );
  }

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
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 mb-2">{t('username')}</label>
            <div className="text-white py-2">{user?.username}</div>
          </div>
          <div>
            <label className="block text-white/70 mb-2">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('placeholderEmail')}
              className={inputStyle}
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={profileSaving}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: '#c2905e', color: '#fff' }}
          >
            {profileSaving ? t('savingProfile') : t('saveProfile')}
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-8 shadow-xl" style={cardStyle}>
        <h2 className="text-xl font-semibold text-white mb-4">{t('changePassword')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 mb-2">{t('currentPassword')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t('placeholderCurrentPassword')}
              className={inputStyle}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-white/70 mb-2">{t('newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('placeholderNewPassword')}
              className={inputStyle}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-white/70 mb-2">{t('confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('placeholderConfirmPassword')}
              className={inputStyle}
              autoComplete="new-password"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={passwordSaving}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: '#c2905e', color: '#fff' }}
          >
            {passwordSaving ? t('changingPassword') : t('changePasswordBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
