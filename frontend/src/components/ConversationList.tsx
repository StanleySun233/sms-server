'use client';

import { useTranslations } from 'next-intl';
import { Conversation } from '@/lib/types';
import { formatDateTime } from '@/lib/dateUtils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedPhone?: string;
  onSelectConversation: (phone: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  prependEmptyRow?: boolean;
  onSelectEmptyRow?: () => void;
}

export default function ConversationList({
  conversations,
  selectedPhone,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  prependEmptyRow,
  onSelectEmptyRow,
}: ConversationListProps) {
  const t = useTranslations('messages');
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
        {prependEmptyRow && onSelectEmptyRow && (
          <div
            onClick={onSelectEmptyRow}
            className="p-4 cursor-pointer transition-all duration-200 hover:bg-white/5"
            style={{
              backgroundColor: selectedPhone === '__new__' ? 'rgba(194, 144, 94, 0.2)' : 'transparent',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-white/50">&nbsp;</span>
            </div>
            <div className="text-sm text-white/70 truncate">&nbsp;</div>
            <div className="text-xs text-white/50 mt-1">&nbsp;</div>
          </div>
        )}
        {filteredConversations.length === 0 && !prependEmptyRow ? (
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
              <div className="text-xs text-white/50 mb-0.5 flex items-center gap-1">
                {conversation.lastMessageDirection === 'received' ? (
                  <>
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    收到
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    发出
                  </>
                )}
              </div>
              <div className="text-sm text-white/70 truncate">{conversation.lastMessage}</div>
              <div className="text-xs text-white/50 mt-1">
                {formatDateTime(conversation.lastMessageTime)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
