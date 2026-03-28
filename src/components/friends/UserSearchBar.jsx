import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import FriendCard from './FriendCard';
import { useFriends } from '../../hooks/useFriends';

export default function UserSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const { searchUsers, sendRequest, incomingRequests, outgoingRequests, friends, refresh } = useFriends();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setSearching(true);
        const data = await searchUsers(query.trim());
        setResults(data);
        setSearching(false);
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, searchUsers]);

  const getStatus = (profileId) => {
    if (friends.some(f => f.id === profileId)) return { status: 'friend', reqId: null };
    
    const incomingReq = incomingRequests.find(r => r.sender_id === profileId);
    if (incomingReq) return { status: 'incoming', reqId: incomingReq.id };
    
    const outgoingReq = outgoingRequests.find(r => r.receiver_id === profileId);
    if (outgoingReq) return { status: 'outgoing', reqId: outgoingReq.id };
    
    return { status: 'none', reqId: null };
  };

  const handleSendRequest = async (id) => {
    await sendRequest(id);
    // Refresh local search state if needed by pulling global hook again
    refresh();
  };

  return (
    <div className="search-engine-wrapper">
      <div className="search-input-container" style={{ position: 'relative', marginBottom: '24px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder="Search by name in your college..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '16px 16px 16px 48px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
        {searching && <Loader2 className="animate-spin" size={20} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color)' }} />}
      </div>

      <div className="search-results-container">
        {results.length > 0 ? (
          results.map(profile => {
            const { status, reqId } = getStatus(profile.id);
            return (
              <FriendCard 
                key={profile.id}
                profile={profile}
                status={status === 'friend' ? 'friend' : status}
                requestId={reqId}
                onSendRequest={handleSendRequest}
              />
            );
          })
        ) : query.trim().length >= 2 && !searching ? (
           <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
             No students found matching your search.
           </div>
        ) : null}
      </div>
    </div>
  );
}
