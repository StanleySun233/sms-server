'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ElMessage } from 'element-plus';
import { smsApi } from '@/lib/api';
import { SmsMessage, Conversation } from '@/lib/types';
import MessageBubble from '@/components/MessageBubble';
import ConversationList from '@/components/ConversationList';
import ExportButton from '@/components/ExportButton';

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);
  const phone = decodeURIComponent(params.phone as string);

  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const unreadMessagesRef = useRef<Set<number>>(new Set());

  // Fetch conversations for sidebar
  useEffect(() => {
    fetchConversations();
  }, [deviceId]);

  // Fetch messages
  useEffect(() => {
    fetchMessages(true);

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(interval);
  }, [deviceId, phone]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Intersection Observer for auto-read
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
            const direction = entry.target.getAttribute('data-direction');

            if (messageId && direction === 'received') {
              unreadMessagesRef.current.add(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all message bubbles
    const messageBubbles = document.querySelectorAll('[data-message-id]');
    messageBubbles.forEach((bubble) => observer.observe(bubble));

    return () => observer.disconnect();
  }, [messages]);

  // Batch mark as read every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (unreadMessagesRef.current.size > 0) {
        const messageIds = Array.from(unreadMessagesRef.current);
        markMessagesAsRead(messageIds);
        unreadMessagesRef.current.clear();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await smsApi.getConversations(deviceId);
      setConversations(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to load conversations', error);
    }
  };

  const fetchMessages = async (resetPage: boolean = false) => {
    try {
      const currentPage = resetPage ? 1 : page;
      const response = await smsApi.getMessages(deviceId, phone, currentPage, 50);
      const data = response.data.data;

      if (data && data.records) {
        if (resetPage) {
          setMessages(data.records.reverse());
        } else {
          // Check if there are new messages
          const newMsgs = data.records.filter(
            (msg: SmsMessage) => !messages.find((m) => m.id === msg.id)
          );
          if (newMsgs.length > 0) {
            setMessages([...messages, ...newMsgs.reverse()]);
          }
        }
        setHasMore(!data.last);
      }
    } catch (error: any) {
      ElMessage.error(error.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (messageIds: number[]) => {
    try {
      await smsApi.markAsRead(messageIds);
      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id) ? { ...msg, readAt: new Date().toISOString() } : msg
        )
      );
      // Refresh conversations to update unread count
      fetchConversations();
    } catch (error: any) {
      console.error('Failed to mark messages as read', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await smsApi.sendMessage(deviceId, {
        phone,
        content: newMessage.trim(),
      });

      setNewMessage('');
      ElMessage.success('Message sent');

      // Refresh messages after a short delay
      setTimeout(() => fetchMessages(false), 1000);
    } catch (error: any) {
      ElMessage.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="container mx-auto px-4 py-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex gap-4 h-full">
          {/* Left Sidebar - Conversation List */}
          <div
            className="w-80 rounded-2xl shadow-xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <div className="p-4 border-b border-white/10">
              <button
                onClick={() => router.push(`/devices/${deviceId}`)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ← Back to Device
              </button>
            </div>
            <ConversationList
              conversations={conversations}
              selectedPhone={phone}
              onSelectConversation={(selectedPhone) =>
                router.push(`/devices/${deviceId}/messages/${encodeURIComponent(selectedPhone)}`)
              }
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Right Pane - Chat Interface */}
          <div
            className="flex-1 rounded-2xl shadow-xl flex flex-col overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Header */}
            <div
              className="p-4 flex justify-between items-center"
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h2 className="text-2xl font-semibold text-white">{phone}</h2>
              <ExportButton deviceId={deviceId} phone={phone} />
            </div>

            {/* Messages Container */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-2"
              style={{
                scrollBehavior: 'smooth',
              }}
            >
              {messages.length === 0 ? (
                <div className="text-white/50 text-center mt-8">No messages yet</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    data-message-id={message.id}
                    data-direction={message.direction}
                  >
                    <MessageBubble message={message} />
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-4"
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1 px-4 py-3 rounded-lg text-white placeholder-white/50"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  style={{
                    backgroundColor: '#c2905e',
                    color: '#fff',
                  }}
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
