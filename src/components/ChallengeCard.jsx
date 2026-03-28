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
      className={`glass-panel challenge-card ${challenge.is_completed ? 'completed' : ''} ${isExpired ? 'expired' : ''}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      layout
    >
      <div className="challenge-header">
        <span className={`challenge-type-badge ${challenge.type}`}>
          {challenge.type === 'daily' ? 'Daily' : 'Weekly'}
        </span>
        <div className="challenge-xp">
          <Zap size={14} color="var(--primary-color)" />
          <span>{challenge.xp_reward} XP</span>
        </div>
      </div>

      <h3 className="challenge-title">{challenge.title}</h3>
      <p className="challenge-desc">{challenge.description}</p>

      <div className="challenge-footer mt-4">
        {challenge.is_completed ? (
          <div className="challenge-completed-badge">
            <CheckCircle2 size={16} /> Completed
          </div>
        ) : (
          <>
            <div className={`challenge-time ${isExpired ? 'text-red-400' : ''}`}>
              <Clock size={14} /> <span>{timeLeft}</span>
            </div>
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleMarkAsDone}
              disabled={isCompleting || isExpired}
            >
              {isCompleting ? 'Completing...' : 'Mark as Done'}
            </button>
          </>
        )}
      </div>
    </Motion.div>
  );
}
