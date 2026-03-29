import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Bell, Loader2, MessageCircle, X, Check, Clock, UserPlus, ArrowUpRight } from 'lucide-react';
import { useFriends } from '../hooks/useFriends';
import FriendCard from '../components/friends/FriendCard';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useChatHistory } from '../hooks/useChat';
import ChatWindow from '../components/chat/ChatWindow';

export default function FriendsPage() {
  const { incomingRequests, outgoingRequests, recentRequests, loading, searchUsers, getSuggestions, sendRequest, acceptRequest, rejectRequest, cancelRequest, friends } = useFriends();
  const { pendingRequests } = useUnreadCount();
  const { history: chatHistory } = useChatHistory();
  
  const [activeTab, setActiveTab] = useState('chat'); // 'search' or 'chat'
  const [activeChatFriendId, setActiveChatFriendId] = useState(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  
  // Bell Dropdown State
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  const fetchSuggestions = useCallback(async () => {
    setFetchingSuggestions(true);
    try {
      const data = await getSuggestions();
      setSuggestions(data);
    } finally {
      setFetchingSuggestions(false);
    }
  }, [getSuggestions]);

  // Handle outside click for both bell and search suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true);
        const data = await searchUsers(searchQuery.trim());
        setSearchResults(data);
        setSearching(false);
        setActiveTab('search');
      } else {
        setSearchResults([]);
        if (activeTab === 'search' && searchQuery.trim().length === 0) {
          setActiveTab('chat');
        }
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, searchQuery, searchUsers]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim().length > 0) {
      setShowSuggestions(false);
    }
  };

  const getStatus = (profileId) => {
    if (friends.some(f => f.profiles?.id === profileId)) return { status: 'friend', reqId: null };
    
    const incomingReq = incomingRequests.find(r => r.sender_id === profileId);
    if (incomingReq) return { status: 'incoming', reqId: incomingReq.id };
    
    const outgoingReq = outgoingRequests.find(r => r.receiver_id === profileId);
    if (outgoingReq) return { status: 'outgoing', reqId: outgoingReq.id };
    
    return { status: 'none', reqId: null };
  };

  // Get active friend profile for chat window
  const activeFriendProfile = chatHistory.find(c => c.friend.id === activeChatFriendId)?.friend;

  // Status label & color helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'accepted': return { label: 'Accepted', color: '#22c55e' };
      case 'rejected': return { label: 'Rejected', color: '#ef4444' };
      case 'pending': return { label: 'Pending', color: 'var(--primary-color)' };
      default: return { label: status, color: 'var(--text-secondary)' };
    }
  };

  if (loading && activeTab !== 'chat') {
    return (
      <div className="page-loader">
        <Loader2 className="animate-spin" color="var(--primary-color)" size={32} />
      </div>
    );
  }

  return (
    <div className="dashboard-redesign-container animate-fade-in" style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header Row */}
      <header className="dashboard-top" style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        <div className="dashboard-top-left" style={{ margin: 0, flexShrink: 0 }}>
          <h1 className="greeting" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, marginBottom: '4px' }}>
            <Users size={28} color="var(--primary-color)" /> Friends
          </h1>
          <p className="subtitle" style={{ margin: 0 }}>Connect with peers, chat in real-time, and grow together.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px', justifyContent: 'flex-end' }}>
          {/* Search Bar Container */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }} ref={searchContainerRef}>
            <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by name or college..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchQuery.trim().length === 0) {
                  setShowSuggestions(true);
                  void fetchSuggestions();
                }
              }}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
            {searching && <Loader2 className="animate-spin" size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color)' }} />}

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && searchQuery.trim().length === 0 && (
                <Motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '120%',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    zIndex: 110,
                    padding: '8px',
                    backdropFilter: 'blur(12px)'
                  }}
                >
                  <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Same College Suggestions
                    </span>
                  </div>
                  {fetchingSuggestions ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '18px 12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <Loader2 className="animate-spin" size={16} />
                      Loading suggestions...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map(peer => (
                      <div 
                        key={peer.id} 
                        className="suggestion-item"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          padding: '10px 12px', 
                          borderRadius: '10px',
                          cursor: 'default',
                          transition: 'background 0.2s'
                        }}
                      >
                        <img 
                          src={peer.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(peer.full_name || peer.username)}&background=random`} 
                          alt=""
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {peer.full_name || peer.username}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {peer.college}
                          </p>
                        </div>
                        <button 
                           onClick={() => {
                             void sendRequest(peer.id);
                             setSuggestions(prev => prev.filter(p => p.id !== peer.id));
                           }}
                           className="btn btn-primary"
                           style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem' }}
                        >
                           Add
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '16px 12px', color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'center' }}>
                      No same-college suggestions available right now.
                    </div>
                  )}
                </Motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bell Icon */}
          <div style={{ position: 'relative' }} ref={bellRef}>
            <button 
              onClick={() => setBellOpen(!bellOpen)}
              className="btn btn-ghost"
              style={{ padding: '10px', borderRadius: '12px', background: bellOpen ? 'var(--bg-card)' : 'transparent', position: 'relative' }}
            >
              <Bell size={22} color={pendingRequests > 0 ? "var(--text-primary)" : "var(--text-secondary)"} />
              {pendingRequests > 0 && (
                <span style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--text-primary)', color: 'var(--bg-color)', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '10px', fontWeight: 'bold', lineHeight: 1 }}>
                  {pendingRequests}
                </span>
              )}
            </button>

            {/* Bell Dropdown */}
            <AnimatePresence>
              {bellOpen && (
                <Motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15 }}
                  style={{ 
                    position: 'absolute', 
                    top: '110%', 
                    right: 0, 
                    width: '340px', 
                    background: 'var(--bg-panel)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '16px', 
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                    zIndex: 100,
                    padding: '16px',
                    maxHeight: '480px',
                    overflowY: 'auto'
                  }}
                >
                  {/* Pending Section */}
                  {incomingRequests.length > 0 && (
                    <>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Pending ({incomingRequests.length})
                      </h3>
                      {incomingRequests.map(req => (
                        <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          <img 
                            src={req.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.profiles.full_name || req.profiles.username)}&background=random`}
                            alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ margin: 0, fontSize: '0.85rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{req.profiles.full_name}</h4>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{req.profiles.college}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => acceptRequest(req.id).then(() => setBellOpen(false))} style={{ padding: '5px 8px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Check size={14} />
                            </button>
                            <button onClick={() => rejectRequest(req.id)} style={{ padding: '5px 8px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div style={{ borderBottom: '1px solid var(--border-color)', margin: '12px 0' }} />
                    </>
                  )}

                  {/* Recent Activity Section */}
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> Recent Activity
                  </h3>
                  {recentRequests.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>No request activity yet.</p>
                  ) : (
                    recentRequests.map(req => {
                      const st = getStatusStyle(req.status);
                      return (
                        <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', opacity: req.status === 'pending' ? 1 : 0.7 }}>
                          <img 
                            src={req.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.profiles.full_name || req.profiles.username)}&background=random`}
                            alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{req.profiles.full_name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                              {req.isSender ? 'Sent' : 'Received'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: st.color, padding: '2px 8px', background: `${st.color}15`, borderRadius: '6px' }}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })
                  )}
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Tabs — only Chats (search auto-activates when typing) */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => { setActiveTab('chat'); setSearchQuery(''); }}
        >
          <MessageCircle size={16} style={{ marginRight: '6px' }} /> Chats
        </button>
        {activeTab === 'search' && (
          <button className="btn btn-primary" style={{ pointerEvents: 'none' }}>
            <Search size={16} style={{ marginRight: '6px' }} /> Search Results
          </button>
        )}
      </div>

      {/* Content */}
      <Motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Search Results */}
        {activeTab === 'search' && (
          <div style={{ background: 'var(--bg-panel)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Search Results</h2>
            {searchResults.length > 0 ? (
              searchResults.map(profile => {
                const { status, reqId } = getStatus(profile.id);
                return (
                  <FriendCard 
                    key={profile.id}
                    profile={profile}
                    status={status === 'friend' ? 'friend' : status}
                    requestId={reqId}
                    onSendRequest={sendRequest}
                    onAccept={acceptRequest}
                    onReject={rejectRequest}
                    onCancel={cancelRequest}
                  />
                )
              })
            ) : searchQuery.trim().length >= 2 && !searching ? (
               <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                 No users found. Try adjusting your search query.
               </div>
            ) : (
               <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                 Type a name or college in the search bar to find peers!
               </div>
            )}
          </div>
        )}

        {/* Chat Split View */}
        {activeTab === 'chat' && (
          <div style={{ 
            display: 'flex', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            border: '1px solid var(--border-color)', 
            height: 'calc(100vh - 240px)',
            minHeight: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            {/* Left — Conversation List */}
            <div style={{ 
              width: '320px', 
              minWidth: '280px',
              borderRight: '1px solid var(--border-color)', 
              background: 'var(--bg-panel)', 
              display: 'flex', 
              flexDirection: 'column',
              flexShrink: 0
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)' }}>
                  <MessageCircle size={18} color="var(--text-primary)" /> Messages
                </h3>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {chatHistory.length === 0 ? (
                  <div style={{ padding: '24px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
                    <UserPlus size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>No conversations yet.</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Search for friends and send a request to start chatting!</p>
                  </div>
                ) : (
                  chatHistory.map(chat => {
                    const isActive = activeChatFriendId === chat.friend.id;
                    const lastMsgText = chat.lastMessage?.content || 'Say hi!';
                    return (
                      <div 
                        key={chat.conversationId}
                        onClick={() => setActiveChatFriendId(chat.friend.id)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '14px 20px', 
                          gap: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                          borderLeft: isActive ? '3px solid var(--text-primary)' : '3px solid transparent',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img 
                          src={chat.friend.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.friend.full_name || chat.friend.username)}&background=random`} 
                          alt=""
                          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {chat.friend.full_name || chat.friend.username}
                            </span>
                            {chat.lastMessage && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: '8px' }}>
                                {new Date(chat.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ 
                              color: chat.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', 
                              fontSize: '0.8rem',
                              whiteSpace: 'nowrap', 
                              textOverflow: 'ellipsis', 
                              overflow: 'hidden',
                              fontWeight: chat.unreadCount > 0 ? 600 : 400
                            }}>
                              {chat.lastMessage?.sender_id !== chat.friend.id && chat.lastMessage ? 'You: ' : ''}{lastMsgText}
                            </span>
                            {chat.unreadCount > 0 && (
                              <span style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-color)', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '12px', minWidth: '18px', textAlign: 'center', flexShrink: 0, marginLeft: '8px' }}>
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right — Chat Window */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
              {activeChatFriendId ? (
                <ChatWindow friendId={activeChatFriendId} friendProfile={activeFriendProfile} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', padding: '24px' }}>
                  <MessageCircle size={56} opacity={0.15} style={{ marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 600 }}>Your Messages</h3>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>Select a conversation to start chatting.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Motion.div>
    </div>
  );
}
