import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Zap } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { useUi } from '../context/ui-context';

export default function ChallengeCard({ challenge, onComplete }) {
  const { user } = useAuth();
  const { showToast } = useUi();
  const [timeLeft, setTimeLeft] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (challenge.is_completed) return;

    const interval = setInterval(() => {
      const now = new Date();
      const deadline = new Date(challenge.deadline);
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m left`);
      }
    }, 60000); // update every minute

    // Initial call
    const now = new Date();
    const deadline = new Date(challenge.deadline);
    const diff = deadline - now;
    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m left`);
    } else {
      setTimeLeft('Expired');
    }

    return () => clearInterval(interval);
  }, [challenge.deadline, challenge.is_completed]);

  const handleMarkAsDone = async () => {
    if (isCompleting) return;
    setIsCompleting(true);

    try {
      // 1. Mark challenge complete
      const { error: updateError } = await supabase
        .from('challenges')
        .update({ is_completed: true })
        .eq('id', challenge.id);

      if (updateError) throw updateError;

      // 2. Insert XP log
      const { error: xpError } = await supabase
        .from('xp_log')
        .insert([{
          user_id: user.id,
          challenge_id: challenge.id,
          xp_earned: challenge.xp_reward
        }]);

      if (xpError) throw xpError;

      showToast({
        title: 'Challenge Completed!',
        description: `You earned ${challenge.xp_reward} XP.`,
        tone: 'success'
      });

      if (onComplete) {
        onComplete(challenge);
      }

    } catch (error) {
      console.error('Error completing challenge:', error);
      showToast({
        title: 'Error',
        description: 'Failed to complete challenge.',
        tone: 'error'
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const isExpired = timeLeft === 'Expired' && !challenge.is_completed;

  return (
    <Motion.div 
      className={`challenge-card ${challenge.is_completed ? 'completed' : ''} ${isExpired ? 'expired' : ''}`}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
        borderLeft: '4px solid var(--text-primary)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'var(--transition)',
        position: 'relative',
        color: 'var(--text-primary)'
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      layout
    >
      <div className="challenge-header" style={{ marginBottom: '4px' }}>
        <span className={`challenge-type-badge ${challenge.type}`} style={{ 
          background: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.5px',
          border: '1px solid var(--panel-border)'
        }}>
          {challenge.type === 'daily' ? ' DAILY' : ' WEEKLY'}
        </span>
        <div className="challenge-xp" style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={14} />
          <span>{challenge.xp_reward} XP</span>
        </div>
      </div>

      <h3 className="challenge-title" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>{challenge.title}</h3>
      <p className="challenge-desc" style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.9rem', margin: 0, lineHeight: 1.5, opacity: 0.8 }}>{challenge.description}</p>

      <div className="challenge-footer" style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {challenge.is_completed ? (
          <div className="challenge-completed-badge" style={{ 
            background: 'rgba(34, 197, 94, 0.1)', 
            color: '#22c55e', 
            width: '100%', 
            padding: '10px', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px', 
            fontWeight: 600 
          }}>
            <CheckCircle2 size={16} /> Completed
          </div>
        ) : (
          <>
            <div className={`challenge-time ${isExpired ? 'expired' : ''}`} style={{ 
              color: isExpired ? 'var(--danger-color)' : 'var(--amber-color)',
              fontSize: '0.8rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Clock size={14} /> <span>{timeLeft}</span>
            </div>
            <button 
              className="btn btn-primary btn-sm glow-on-hover"
              onClick={handleMarkAsDone}
              disabled={isCompleting || isExpired}
              style={{ borderRadius: '12px', padding: '10px 16px', fontWeight: 600 }}
            >
              {isCompleting ? 'Completing...' : 'Mark as Done'}
            </button>
          </>
        )}
      </div>
    </Motion.div>
  );
}
