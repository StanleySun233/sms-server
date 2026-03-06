'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deviceApi } from '@/lib/api';
import CopyButton from '@/components/CopyButton';

export default function NewDevicePage() {
  const router = useRouter();
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdDevice, setCreatedDevice] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!alias.trim()) {
      setError('Please enter a device name');
      return;
    }

    setLoading(true);
    try {
      const response = await deviceApi.create({ alias });
      setCreatedDevice(response.data);
      setSuccess('Device created successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to create device');
    } finally {
      setLoading(false);
    }
  };

  const webhookUrl = createdDevice
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/webhook/${createdDevice.webhookToken}`
    : '';

  if (createdDevice) {
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
          <h1 className="text-3xl font-bold text-white mb-6">Device Created Successfully!</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-white/70 mb-2">Device Name</label>
              <div className="text-white text-lg font-medium">{createdDevice.alias}</div>
            </div>

            <div>
              <label className="block text-white/70 mb-2">Webhook Token</label>
              <div className="bg-black/30 p-4 rounded-lg mb-2">
                <code className="text-green-400 break-all">{createdDevice.webhookToken}</code>
              </div>
              <CopyButton text={createdDevice.webhookToken} label="Copy Token" />
            </div>

            <div>
              <label className="block text-white/70 mb-2">Webhook URL</label>
              <div className="bg-black/30 p-4 rounded-lg mb-2">
                <code className="text-green-400 break-all">{webhookUrl}</code>
              </div>
              <CopyButton text={webhookUrl} label="Copy URL" />
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <p className="text-yellow-200 text-sm">
                <strong>Important:</strong> Save this webhook token securely. You&apos;ll need to configure it in your 4G device app.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.push('/devices')}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                style={{
                  backgroundColor: '#c2905e',
                  color: '#fff',
                }}
              >
                Go to Devices
              </button>
              <button
                onClick={() => router.push(`/devices/${createdDevice.id}`)}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(194, 144, 94, 0.3)',
                  color: '#fff',
                }}
              >
                View Device
              </button>
            </div>
          </div>
        </div>
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
        <h1 className="text-3xl font-bold text-white mb-6">Add New Device</h1>

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
            <label className="block text-white/90 mb-2">Device Name</label>
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
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: '#c2905e',
                color: '#fff',
              }}
            >
              {loading ? 'Creating...' : 'Create Device'}
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
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
