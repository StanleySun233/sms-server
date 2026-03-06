'use client';

import { useEffect, useState } from 'react';
import { ElMessage } from 'element-plus';
import { authApi } from '@/lib/api';

export default function SettingsPage() {
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
      ElMessage.warning('请输入邮箱');
      return;
    }
    setProfileSaving(true);
    authApi.updateProfile({ email: email.trim() }).then((res) => {
      setUser(res.data);
      ElMessage.success('个人信息已保存');
    }).catch((err: any) => ElMessage.error(err.message || 'Save failed')).finally(() => setProfileSaving(false));
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      ElMessage.warning('请填写当前密码和新密码');
      return;
    }
    if (newPassword.length < 6) {
      ElMessage.warning('新密码至少 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      ElMessage.warning('两次输入的新密码不一致');
      return;
    }
    setPasswordSaving(true);
    authApi.changePassword({ currentPassword, newPassword }).then(() => {
      ElMessage.success('密码已修改');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }).catch((err: any) => ElMessage.error(err.message || 'Change password failed')).finally(() => setPasswordSaving(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-white text-xl">Loading...</div>
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
        个人设置
      </h1>

      <div className="rounded-2xl p-8 shadow-xl mb-6" style={cardStyle}>
        <h2 className="text-xl font-semibold text-white mb-4">个人信息</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 mb-2">用户名</label>
            <div className="text-white py-2">{user?.username}</div>
          </div>
          <div>
            <label className="block text-white/70 mb-2">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={inputStyle}
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={profileSaving}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: '#c2905e', color: '#fff' }}
          >
            {profileSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-8 shadow-xl" style={cardStyle}>
        <h2 className="text-xl font-semibold text-white mb-4">修改密码</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 mb-2">当前密码</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="当前密码"
              className={inputStyle}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-white/70 mb-2">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="至少 6 位"
              className={inputStyle}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-white/70 mb-2">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
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
            {passwordSaving ? '修改中...' : '修改密码'}
          </button>
        </div>
      </div>
    </div>
  );
}
