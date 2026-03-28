import React from 'react';
import FriendCard from './FriendCard';
import { useFriends } from '../../hooks/useFriends';

export default function FriendRequests() {
  const { incomingRequests, outgoingRequests, acceptRequest, rejectRequest, cancelRequest } = useFriends();

  return (
    <div className="friend-requests-wrapper">
      <div className="requests-section" style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Incoming Requests 
          {incomingRequests.length > 0 && <span className="badge" style={{ background: 'var(--primary-color)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{incomingRequests.length}</span>}
        </h3>
        
        {incomingRequests.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No new friend requests.</p>
        ) : (
          incomingRequests.map(req => (
            <FriendCard 
              key={req.id}
              profile={req.profiles}
              status="incoming"
              requestId={req.id}
              onAccept={acceptRequest}
              onReject={rejectRequest}
            />
          ))
        )}
      </div>

      <div className="requests-section">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
          Sent Requests
        </h3>
        
        {outgoingRequests.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>You haven't sent any requests.</p>
        ) : (
          outgoingRequests.map(req => (
            <FriendCard 
              key={req.id}
              profile={req.profiles}
              status="outgoing"
              requestId={req.id}
              onCancel={cancelRequest}
            />
          ))
        )}
      </div>
    </div>
  );
}
