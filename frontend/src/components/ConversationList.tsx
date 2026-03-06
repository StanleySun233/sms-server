'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from '@/contexts/LocaleContext';
import { Conversation } from '@/lib/types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedPhone?: string;
  onSelectConversation: (phone: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function ConversationList({
  conversations,
  selectedPhone,
  onSelectConversation,
  searchQuery,
  onSearchChange,
}: ConversationListProps) {
  const t = useTranslations('messages');
  const { locale } = useLocale();
  const loc = locale === 'zh' ? 'zh-CN' : 'en-US';
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* 搜索 */}
      <div className="p-4">
        <input
          type="text"
          placeholder={t('searchConversations')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 rounded-lg text-white placeholder-white/50"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        />
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-white/50 text-center">{t('noConversations')}</div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.phone}
              onClick={() => onSelectConversation(conversation.phone)}
              className="p-4 cursor-pointer transition-all duration-200 hover:bg-white/5"
              style={{
                backgroundColor:
                  selectedPhone === conversation.phone ? 'rgba(194, 144, 94, 0.2)' : 'transparent',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-white">{conversation.phone}</span>
                {conversation.unreadCount > 0 && (
                  <span
                    className="px-2 py-1 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: '#c2905e' }}
                  >
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
              <div className="text-sm text-white/70 truncate">{conversation.lastMessage}</div>
              <div className="text-xs text-white/50 mt-1">
                {new Date(conversation.lastMessageTime).toLocaleString(loc, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
