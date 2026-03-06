'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ElMessage } from 'element-plus';
import { smsApi } from '@/lib/api';
import { Conversation } from '@/lib/types';
import ConversationList from '@/components/ConversationList';

export default function MessagesPage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  const fetchConversations = async () => {
    try {
      const response = await smsApi.getConversations(deviceId);
      setConversations(response.data.data || []);
    } catch (error: any) {
      ElMessage.error(error.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (phone: string) => {
    router.push(`/devices/${deviceId}/messages/${encodeURIComponent(phone)}`);
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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Messages</h1>
          <button
            onClick={() => router.push(`/devices/${deviceId}`)}
            className="px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          >
            Back to Device
          </button>
        </div>

        <div
          className="rounded-2xl shadow-xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            height: 'calc(100vh - 250px)',
          }}
        >
          <ConversationList
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      </div>
    </div>
  );
}
