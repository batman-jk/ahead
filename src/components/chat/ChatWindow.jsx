import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ friendId, friendProfile }) {
  const { messages, loading, sendMessage } = useChat(friendId);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    await sendMessage(content);
    setContent('');
    setSending(false);
  };

  if (!friendId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Select a chat to start chatting.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-card)' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
        <img 
          src={friendProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friendProfile?.full_name || friendProfile?.username || 'Friend')}&background=random`} 
          alt=""
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <div>
           <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{friendProfile?.full_name || friendProfile?.username || 'Loading...'}</h3>
           <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{friendProfile?.college}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {loading && messages.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Loader2 className="animate-spin" color="var(--primary-color)" />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px', fontSize: '0.9rem' }}>
            No messages yet. Say hi!
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Type a message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading && messages.length === 0}
            style={{ 
              flex: 1, 
              padding: '14px 20px', 
              borderRadius: '24px', 
              border: 'none', 
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '1rem'
            }}
          />
          <button 
            type="submit" 
            disabled={!content.trim() || sending || (loading && messages.length===0)}
            className="btn btn-primary"
            style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}
