import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/auth-context';

export default function MessageBubble({ message }) {
  const { user } = useAuth();
  const isMine = message.sender_id === user?.id;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isMine ? 'flex-end' : 'flex-start',
      marginBottom: '12px'
    }}>
      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: '16px',
        backgroundColor: isMine ? 'var(--primary-color)' : 'var(--bg-panel)',
        color: isMine ? '#fff' : 'var(--text-primary)',
        borderBottomRightRadius: isMine ? '4px' : '16px',
        borderBottomLeftRadius: isMine ? '16px' : '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4', wordBreak: 'break-word', color: isMine ? '#ffffff' : 'var(--text-primary)', fontFamily: 'inherit' }}>
          {message.content}
        </p>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          gap: '4px', 
          marginTop: '4px',
          opacity: 0.8
        }}>
          <span style={{ fontSize: '0.65rem', color: isMine ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isMine && (
             message.seen ? 
             <CheckCheck size={14} color="#34B7F1" /> : 
             <Check size={14} color="rgba(255,255,255,0.8)" />
          )}
        </div>
      </div>
    </div>
  );
}
