import React from 'react';
import { useChatHistory } from '../../hooks/useChat';

export default function ChatSidebar({ activeFriendId, onSelectChat }) {
  const { history, loading } = useChatHistory();

  if (loading) {
    return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading chats...</div>;
  }

  if (history.length === 0) {
    return <div style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No conversations yet. Add friends to start chatting!</div>;
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {history.map((chat) => {
        const isActive = activeFriendId === chat.friend.id;
        const lastMsgText = chat.lastMessage?.content || 'Started a conversation';
        
        return (
          <div 
            key={chat.conversationId}
            onClick={() => onSelectChat(chat.friend.id)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '16px', 
              gap: '12px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
              transition: 'background 0.2s'
            }}
            className="hover-bg-soft"
          >
            <img 
              src={chat.friend.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.friend.full_name || chat.friend.username)}&background=random`} 
              alt=""
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {chat.friend.full_name || chat.friend.username}
                </span>
                {chat.lastMessage && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(chat.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', 
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap', 
                  textOverflow: 'ellipsis', 
                  overflow: 'hidden',
                  fontWeight: chat.unreadCount > 0 ? 600 : 400
                }}>
                  {chat.lastMessage?.sender_id !== chat.friend.id && chat.lastMessage ? 'You: ' : ''}{lastMsgText}
                </span>
                {chat.unreadCount > 0 && (
                  <span style={{ backgroundColor: 'var(--primary-color)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '12px', minWidth: '20px', textAlign: 'center' }}>
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
