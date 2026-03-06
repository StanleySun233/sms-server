'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { deviceApi } from '@/lib/api';
import { Device } from '@/lib/types';

export default function EditDevicePage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);

  const [device, setDevice] = useState<Device | null>(null);
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    deviceApi.get(deviceId).then((response) => {
      setDevice(response.data);
      setAlias(response.data.alias);
    }).catch((error: any) => {
      setError(error.message || 'Failed to load device');
      setTimeout(() => router.push('/devices'), 2000);
    }).finally(() => setLoading(false));
  }, [deviceId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!alias.trim()) {
      setError('Please enter a device name');
      return;
    }
    setSaving(true);
    deviceApi.update(deviceId, { alias }).then(() => {
      setSuccess('Device updated successfully!');
      setTimeout(() => router.push('/devices'), 1500);
    }).catch((err: any) => setError(err.message || 'Failed to update device')).finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div
        className="max-w-2xl mx-auto rounded-2xl p-8 shadow-xl"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <h1 className="text-3xl font-bold text-white mb-6">编辑设备</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
              <p className="text-green-200">{success}</p>
            </div>
          )}

          <div>
            <label className="block text-white/90 mb-2">设备名称</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g., My 4G Device"
              maxLength={100}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[#c2905e] transition-colors"
            />
            <p className="text-white/60 text-sm mt-2">
              Choose a name to identify your device
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: '#c2905e',
                color: '#fff',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/devices')}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
              }}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
