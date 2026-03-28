import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { MessageCircle } from 'lucide-react';
import { useChatHistory } from '../hooks/useChat';

export default function ChatPage({ embedded }) {
  const location = useLocation();
  const [activeFriendId, setActiveFriendId] = useState(null);
  const { history } = useChatHistory(); // Use to pull profile info for right panel

  // Handle navigation state (if redirected from FriendCard)
  useEffect(() => {
    if (location.state?.friendId) {
      setActiveFriendId(location.state.friendId);
      // Clean up state so refresh doesn't hold it manually if not desired
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Find the exact friend profile from history
  const activeFriendProfile = history.find(c => c.friend.id === activeFriendId)?.friend;

  return (
    <div className={embedded ? "" : "dashboard-redesign-container"} style={{ padding: '0', height: embedded ? '100%' : 'calc(100vh - 70px)', display: 'flex', width: '100%' }}>
      {/* Sidebar Panel */}
      <div 
        style={{ 
          width: '320px', 
          borderRight: '1px solid var(--border-color)', 
          background: 'var(--bg-panel)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)' }}>
            <MessageCircle size={22} color="var(--primary-color)" /> Messages
          </h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
           <ChatSidebar activeFriendId={activeFriendId} onSelectChat={(id) => setActiveFriendId(id)} />
        </div>
      </div>

      {/* Main Chat Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {activeFriendId ? (
          <ChatWindow friendId={activeFriendId} friendProfile={activeFriendProfile} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <MessageCircle size={64} opacity={0.2} style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-color)', marginBottom: '8px' }}>Your Messages</h3>
            <p>Select a chat or start a new conversation to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
