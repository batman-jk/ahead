import React from 'react';
import { UserPlus, Clock, Check, X, MessageCircle, UserMinus } from 'lucide-react';
import { getLevelProgress } from '../../lib/levels';
import { useNavigate } from 'react-router-dom';

export default function FriendCard({ 
  profile, 
  status, 
  requestId, 
  onSendRequest, 
  onAccept, 
  onReject, 
  onCancel, 
  onRemove 
}) {
  const navigate = useNavigate();
  const avatarUrl = profile.avatar_url;
  const displayName = profile.full_name || profile.username || 'Student';
  const college = profile.college || 'No college listed';
  
  const prog = getLevelProgress(profile.total_xp);

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
        <img 
          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`} 
          alt={displayName}
          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {displayName}
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {college}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
             <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-color)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
               Lv. {prog.level}
             </span>
             <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
               {profile.total_score} Score
             </span>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {status === 'none' && (
          <button onClick={() => onSendRequest(profile.id)} className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
            <UserPlus size={16} /> Add
          </button>
        )}
        
        {status === 'outgoing' && (
          <button onClick={() => onCancel(requestId)} className="btn btn-ghost btn-sm" style={{ padding: '6px 12px' }}>
            <Clock size={16} /> Pending...
          </button>
        )}
        
        {status === 'incoming' && (
          <>
            <button onClick={() => onAccept(requestId)} className="btn btn-primary btn-sm" style={{ padding: '6px 10px', background: 'var(--success-color)', borderColor: 'var(--success-color)' }}>
              <Check size={16} />
            </button>
            <button onClick={() => onReject(requestId)} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }}>
              <X size={16} />
            </button>
          </>
        )}
        
        {status === 'friend' && (
          <>
            <button onClick={() => onRemove(profile.id)} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px', color: 'var(--text-secondary)' }} title="Remove Friend">
              <UserMinus size={16} />
            </button>
            <button onClick={() => navigate('/chat', { state: { friendId: profile.id }})} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', gap: '6px' }}>
              <MessageCircle size={16} /> Message
            </button>
          </>
        )}
      </div>
    </div>
  );
}
