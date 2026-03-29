import React, { useCallback, useEffect, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Code, Flame, LogOut, Sparkles, Terminal, Trash2, TrendingUp, Zap, Target, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useUi } from '../context/ui-context';
import { classifyActivityType, abortActiveClassification, generateChallenges } from '../lib/ai';
import { supabase } from '../lib/supabase';
import ChallengeCard from '../components/ChallengeCard';
import { getLevelProgress } from '../lib/levels';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const { confirm, showToast } = useUi();
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [stats, setStats] = useState({ totalScore: 0, totalXp: 0, streak: 0, rank: 0 });
  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [generatingChallenges, setGeneratingChallenges] = useState(false);

  const syncProfileScore = useCallback(async () => {
    // Left empty: DB triggers (levels_patch.sql) now handle scoring & XP correctly.
    // Keeping function signature to avoid refactoring all hook dependencies!
  }, []);

  const fetchChallenges = useCallback(async (currentGoal, currentSkills) => {
    if (!supabase || !user) return;
    setLoadingChallenges(true);
    
    try {
      // Fetch active tasks for this user
      const now = new Date().toISOString();
      const { data: existingChallenges, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .gt('deadline', now);
        
      if (error) throw error;
      
      const hasDaily = existingChallenges?.some(c => c.type === 'daily');
      const hasWeekly = existingChallenges?.some(c => c.type === 'weekly');
      
      if (!hasDaily || !hasWeekly) {
        // Need to generate new challenges
        setGeneratingChallenges(true);
        const goal = currentGoal || 'Become a better software engineer';
        const generated = await generateChallenges(goal, currentSkills || []);
        
        if (generated && (generated.daily?.length > 0 || generated.weekly?.length > 0)) {
          const newChallenges = [];
          
          if (!hasDaily && generated.daily) {
            const dailyDeadline = new Date();
            dailyDeadline.setHours(23, 59, 59, 999);
            generated.daily.forEach(c => {
              newChallenges.push({
                user_id: user.id,
                type: 'daily',
                title: c.title,
                description: c.description,
                xp_reward: c.xp_reward || 20,
                deadline: dailyDeadline.toISOString()
              });
            });
          }
          
          if (!hasWeekly && generated.weekly) {
            const weeklyDeadline = new Date();
            weeklyDeadline.setDate(weeklyDeadline.getDate() + (7 - weeklyDeadline.getDay())); // Next Sunday
            weeklyDeadline.setHours(23, 59, 59, 999);
            generated.weekly.forEach(c => {
              newChallenges.push({
                user_id: user.id,
                type: 'weekly',
                title: c.title,
                description: c.description,
                xp_reward: c.xp_reward || 50,
                deadline: weeklyDeadline.toISOString()
              });
            });
          }
          
          if (newChallenges.length > 0) {
            const { data: inserted, error: insertError } = await supabase
              .from('challenges')
              .insert(newChallenges)
              .select('*');
            if (insertError) throw insertError;
            
            setChallenges([...(existingChallenges || []), ...(inserted || [])].sort((a,b) => a.type.localeCompare(b.type)));
          }
        }
        setGeneratingChallenges(false);
      } else {
        setChallenges(existingChallenges.sort((a,b) => a.type.localeCompare(b.type)));
      }
    } catch (err) {
      console.error('Error fetching/generating challenges:', err);
      setGeneratingChallenges(false);
    } finally {
      setLoadingChallenges(false);
    }
  }, [user]);

  const fetchUserData = useCallback(async () => {
    if (!supabase || !user) {
      setLoadingActivities(false);
      return;
    }

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_score, total_xp')
        .eq('id', user.id)
        .single();

      const { data: acts } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      let rank = 0;
      if (profileData) {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gt('total_score', profileData.total_score);
        rank = (count || 0) + 1;
      }

      let streak = 0;
      if (acts && acts.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let checkDate = new Date(today);

        const activityDates = [...new Set(acts.map((activity) => {
          const activityDate = new Date(activity.created_at);
          activityDate.setHours(0, 0, 0, 0);
          return activityDate.getTime();
        }))].sort((left, right) => right - left);

        for (const dateTime of activityDates) {
          if (dateTime === checkDate.getTime()) {
            streak += 1;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (dateTime === checkDate.getTime() - 86400000) {
            checkDate = new Date(dateTime);
            streak += 1;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      setStats({
        totalScore: profileData?.total_score || 0,
        totalXp: profileData?.total_xp || 0,
        streak,
        rank,
      });
      setActivities(acts || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoadingActivities(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (profile) {
      void fetchChallenges(profile.goal, profile.skills);
    }
  }, [fetchChallenges, profile]);

  const getScoreForType = (type) => {
    switch (type) {
      case 'learning':
        return 10;
      case 'practice':
        return 20;
      case 'project':
        return 30;
      default:
        return 10;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!description.trim() || !supabase) return;

    setIsSubmitting(true);
    setLastResult(null);

    try {
      const aiResult = await classifyActivityType(description);
      const type = aiResult?.type || 'learning';
      const skills = aiResult?.skills || [];
      const score = getScoreForType(type);

      const { data: insertedData, error } = await supabase
        .from('activities')
        .insert([{
          user_id: user.id,
          description,
          type,
          score,
          metadata: skills.length > 0 ? { skills } : {},
        }])
        .select();

      if (error) throw error;
      if (!insertedData || insertedData.length === 0) {
        throw new Error('Activity was not saved.');
      }

      try {
        await syncProfileScore();
      } catch (syncError) {
        console.error('Score sync error after insert:', syncError);
      }

      showToast({
        title: 'Activity logged',
        description: `Added ${score} points to your score.`,
        tone: 'success',
      });
      setLastResult({ type, score, skills });
      await fetchUserData();
      setDescription('');
    } catch (err) {
      console.error('Submit error:', err);
      const errorMsg = err.message || 'Unknown network error';
      showToast({
        title: 'Failed to log activity',
        description: `Error: ${errorMsg}. Check if the AI proxy server is running at http://127.0.0.1:3001.`,
        tone: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!supabase || !user) return;
    const shouldDelete = await confirm({
      title: 'Delete this log?',
      description: 'This removes the activity from your history and updates your total score.',
      confirmLabel: 'Delete log',
      tone: 'danger',
    });
    if (!shouldDelete) return;

    setDeletingId(activityId);

    try {
      const { data, error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Permission denied. Have you run the leaderboard_logs_patch.sql in Supabase SQL Editor?');
      }

      try {
        await syncProfileScore();
      } catch (syncError) {
        console.error('Score sync error after delete:', syncError);
      }

      showToast({
        title: 'Log deleted',
        description: 'Your score has been updated.',
        tone: 'success',
      });
      await fetchUserData();
    } catch (err) {
      console.error('Delete activity error:', err);
      const errorMessage = err.message || 'Unknown error';
      const isPermissionIssue = errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('policy');
      showToast({
        title: 'Delete failed',
        description: isPermissionIssue
          ? 'Your Supabase database is still blocking deletes. Run leaderboard_logs_patch.sql in Supabase SQL Editor.'
          : `Error: ${errorMessage}`,
        tone: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleChallengeComplete = useCallback(async (completedChallenge) => {
    // Update local state
    setChallenges(prev => prev.map(c => c.id === completedChallenge.id ? { ...c, is_completed: true } : c));
    
    try {
      if (completedChallenge.type === 'daily') {
        const { data: streakData } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', user.id)
          .single();

        let currentStreak = streakData?.current_streak || 0;
        let longestStreak = streakData?.longest_streak || 0;
        let lastCompleted = streakData?.last_completed_date ? new Date(streakData.last_completed_date) : null;
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        let shouldIncrement = false;

        if (!lastCompleted) {
          currentStreak = 1;
          shouldIncrement = true;
        } else {
          lastCompleted.setHours(0,0,0,0);
          const diffDays = Math.floor((today - lastCompleted) / 86400000);
          
          if (diffDays === 1) {
            currentStreak += 1;
            shouldIncrement = true;
          } else if (diffDays > 1) {
            currentStreak = 1;
            shouldIncrement = true;
          }
        }

        if (shouldIncrement) {
          if (currentStreak > longestStreak) longestStreak = currentStreak;
          await supabase.from('user_streaks').upsert({
            user_id: user.id,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_completed_date: new Date().toISOString() // Now
          });
          
          if (currentStreak >= 3) {
            const bonusXP = Math.floor(completedChallenge.xp_reward * 0.10);
            if (bonusXP > 0) {
              await supabase.from('xp_log').insert([{
                user_id: user.id,
                challenge_id: completedChallenge.id,
                xp_earned: bonusXP
              }]);
              showToast({ title: 'Streak Bonus! 🔥', description: `+${bonusXP} XP for a ${currentStreak} day streak!`, tone: 'success' });
            }
          }
        }
      }

      await syncProfileScore();
      await fetchUserData();
    } catch (err) {
      console.error('Streak calc error:', err);
    }
  }, [user, syncProfileScore, fetchUserData, showToast]);

  const handleSkipAiLog = async () => {
    if (!supabase || !user) return;
    const shouldSkip = await confirm({
      title: 'Skip AI classification?',
      description: 'This will save the log as Learning and add 10 points.',
      confirmLabel: 'Skip AI',
      tone: 'warning',
    });
    if (!shouldSkip) return;

    abortActiveClassification();
    setIsSubmitting(true);

    try {
      const { data: insertedData, error } = await supabase
        .from('activities')
        .insert([{
          user_id: user.id,
          description,
          type: 'learning',
          score: 10,
          metadata: { skipped_ai: true },
        }])
        .select();

      if (error) throw error;
      if (!insertedData || insertedData.length === 0) {
        throw new Error('Activity was not saved.');
      }

      try {
        await syncProfileScore();
      } catch (syncError) {
        console.error('Score sync error after manual insert:', syncError);
      }

      showToast({
        title: 'Activity logged',
        description: 'Saved as Learning with +10 score.',
        tone: 'success',
      });
      await fetchUserData();
      setDescription('');
      setLastResult({ type: 'learning', score: 10, skills: [] });
    } catch (err) {
      console.error('Manual log error:', err);
      showToast({
        title: 'Manual log failed',
        description: err.message,
        tone: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    const shouldSignOut = await confirm({
      title: 'Sign out now?',
      description: 'You can log back in anytime with Google.',
      confirmLabel: 'Sign out',
      tone: 'warning',
    });

    if (!shouldSignOut) return;
    await signOut();
  };

  const displayName = profile?.full_name || user?.user_metadata?.username || 'Student';

  return (
    <div className="dashboard-redesign-container animate-fade-in" style={{ background: 'var(--bg-color)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* SECTION 1 — Top Bar & Stats */}
      <header className="dashboard-top" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '32px' }}>
        <div className="dashboard-top-left" style={{ textAlign: 'left' }}>
          <h1 className="greeting" style={{ maxWidth: '480px', marginBottom: '8px', fontSize: '2.5rem', fontWeight: 700 }}>Keep pushing, {displayName}!</h1>
          <p className="subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>Track today's effort to see your progress tomorrow.</p>
        </div>

        <div className="stats-row-container">
          {/* Stat 1: Level */}
          <div className="stat-card-unified">
            <div className="stat-module-icon primary">
              <TrendingUp size={20} />
            </div>
            <div className="stat-module-info">
              <span className="stat-module-lbl">Current Level</span>
              <span className="stat-module-val">Level {getLevelProgress(stats.totalXp).level}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                LVL {getLevelProgress(stats.totalXp).level} · {getLevelProgress(stats.totalXp).xpRemaining} XP to next
              </span>
            </div>
          </div>

          {/* Stat 2: Score */}
          <div className="stat-card-unified">
            <div className="stat-module-icon primary">
              <Zap size={20} />
            </div>
            <div className="stat-module-info">
              <span className="stat-module-lbl">Ahead Score</span>
              <span className="stat-module-val">{stats.totalScore}</span>
              {stats.rank > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '2px', fontWeight: 600 }}>
                   Ranked #{stats.rank} overall
                </span>
              )}
            </div>
          </div>

          {/* Stat 3: Streak */}
          <div className="stat-card-unified">
            <div className="stat-module-icon orange">
              <Flame size={20} />
            </div>
            <div className="stat-module-info">
              <span className="stat-module-lbl">Day Streak</span>
              <span className="stat-module-val">{stats.streak} Days</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Consistency is key!
              </span>
            </div>
          </div>

          {/* Stat 4: Goal */}
          {profile?.goal && (
            <div className="stat-card-unified" style={{ padding: '12px 24px' }}>
              <div className="stat-module-icon" style={{ background: 'rgba(6, 182, 212, 0.14)', color: 'var(--accent-color)' }}>
                <Target size={20} />
              </div>
              <div className="stat-module-info" style={{ minWidth: 0, flex: 1 }}>
                <span className="stat-module-lbl">Your Goal</span>
                <span className="stat-module-val goal-truncate" title={profile.goal}>
                  {profile.goal}
                </span>
              </div>
            </div>
          )}

          <button onClick={() => void handleSignOut()} className="btn btn-ghost" style={{ padding: '12px', marginLeft: 'auto' }} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* SECTION 2 — Log Activity */}
      <section className="dashboard-log-section" style={{ marginTop: '32px' }}>
        <div className="log-form-wrapper" style={{ maxWidth: '800px' }}>
          <form onSubmit={handleSubmit} style={{ width: '100%', position: 'relative' }}>
            <input
              type="text"
              className="log-input"
              style={{ paddingRight: '140px' }}
              placeholder="What did you do today? e.g., Completed 2 LeetCode problems..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (lastResult) setLastResult(null);
              }}
            />
            <div className="log-actions">
              {isSubmitting && (
                <button type="button" onClick={handleSkipAiLog} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
                  Skip AI
                </button>
              )}
              <button 
                type="submit" 
                disabled={isSubmitting || !description.trim()}
                className="btn btn-primary"
                style={{ padding: '12px 24px', borderRadius: '14px' }}
              >
                {isSubmitting ? <span className="loading-spinner"></span> : <><CheckCircle2 size={18} /> Log</>}
              </button>
            </div>
          </form>

          {lastResult && (
            <Motion.div className="ai-suggestion-panel" style={{ marginTop: '20px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
               <div className="ai-suggestion-header" style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
                 <Sparkles size={14} /> AI Classified
               </div>
               <div className="ai-suggestion-content">
                 <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Classified as <strong>{lastResult.type}</strong> and added <strong>+{lastResult.score} XP</strong>.</p>
                 {lastResult.skills?.length > 0 && (
                   <div className="skills-container">
                     {lastResult.skills.map(s => <span key={s} className="skill-tag" style={{ border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-secondary)' }}>{s}</span>)}
                   </div>
                 )}
               </div>
            </Motion.div>
          )}

          {/* Inline Recent Logs Chips */}
          {!loadingActivities && activities.length > 0 && (
            <div className="activity-suggestions-wrapper" style={{ marginTop: '24px', width: '100%' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', textAlign: 'center' }}>
                Recent activity
              </p>
              <div className="recent-logs-inline" style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {activities.slice(0, 3).map((act) => (
                  <div key={act.id} className="suggestion-pill" onClick={() => setDescription(act.description)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="goal-truncate" style={{ maxWidth: '240px', color: 'var(--text-primary)' }} title={act.description}>
                        {act.description}
                      </span>
                      <span style={{ color: 'var(--text-primary)', opacity: 0.8, fontWeight: 700, fontSize: '0.75rem' }}>+{act.score}</span>
                      <span onClick={(e) => { e.stopPropagation(); handleDeleteActivity(act.id); }} style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
                        {deletingId === act.id ? <span className="loading-spinner" style={{ width: '12px', height: '12px' }}></span> : <Trash2 size={12} />}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3 — Active Challenges */}
      <section className="dashboard-challenges-wrapper" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, marginTop: '48px' }}>
        <div className="challenge-column-container">
          {/* Daily Challenges */}
          <div className="challenges-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="challenges-col-header" style={{ margin: 0 }}>
                <Clock size={22} color="var(--primary-color)" /> Daily Challenges
              </h2>
            </div>
            
            {loadingChallenges || generatingChallenges ? (
               <div className="loading-block" style={{ background: 'var(--surface-soft)', borderRadius: '16px', minHeight: '140px' }}>
                 <div className="loading-spinner"></div>
                 <p className="text-sm">Synchronizing tasks...</p>
               </div>
            ) : (
               <div className="challenge-grid-row">
                 {challenges.filter(c => c.type === 'daily').length > 0 ? (
                   challenges.filter(c => c.type === 'daily').slice(0, 2).map(challenge => (
                     <ChallengeCard key={challenge.id} challenge={challenge} onComplete={handleChallengeComplete} />
                   ))
                 ) : (
                   <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px', background: 'var(--surface-soft)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
                     Daily challenges refreshed. Come back soon!
                   </div>
                 )}
               </div>
            )}
          </div>

          {/* Weekly Challenges */}
          <div className="challenges-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="challenges-col-header" style={{ margin: 0 }}>
                <Calendar size={22} color="var(--accent-color)" /> Weekly Challenges
              </h2>
            </div>

            {loadingChallenges || generatingChallenges ? (
               <div className="loading-block" style={{ background: 'var(--surface-soft)', borderRadius: '16px', minHeight: '140px' }}>
                 <div className="loading-spinner"></div>
                 <p className="text-sm">Preparing milestones...</p>
               </div>
            ) : (
               <div className="challenge-grid-weekly">
                 {challenges.filter(c => c.type === 'weekly').length > 0 ? (
                   challenges.filter(c => c.type === 'weekly').slice(0, 4).map(challenge => (
                     <ChallengeCard key={challenge.id} challenge={challenge} onComplete={handleChallengeComplete} />
                   ))
                 ) : (
                   <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px', background: 'var(--surface-soft)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
                     Weekly roadmap cleared! Great job.
                   </div>
                 )}
               </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
