import React, { useCallback, useEffect, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Code, Flame, LogOut, Sparkles, Terminal, Trash2, TrendingUp, Zap, Target, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useUi } from '../context/ui-context';
import { classifyActivityType, abortActiveClassification, generateChallenges } from '../lib/ai';
import { supabase } from '../lib/supabase';
import ChallengeCard from '../components/ChallengeCard';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const { confirm, showToast } = useUi();
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [stats, setStats] = useState({ totalScore: 0, streak: 0, rank: 0 });
  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [generatingChallenges, setGeneratingChallenges] = useState(false);

  const syncProfileScore = useCallback(async () => {
    if (!supabase || !user) return;

    const { data: scoreRows, error: scoreError } = await supabase
      .from('activities')
      .select('score')
      .eq('user_id', user.id);

    if (scoreError) throw scoreError;

    const totalScore = (scoreRows || []).reduce((sum, activity) => sum + (activity.score || 0), 0);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        total_score: totalScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;
  }, [user]);

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
        .select('total_score')
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
    <div className="dashboard-redesign-container animate-fade-in">
      {/* SECTION 1 — Top Bar */}
      <header className="dashboard-top">
        <div className="dashboard-top-left">
          <h1 className="greeting">Keep pushing, {displayName}!</h1>
          <p className="subtitle">Track today's effort to see your progress tomorrow.</p>
        </div>

        <div className="dashboard-top-right">
          <Motion.div className="stat-module" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="stat-module-icon primary">
              <Zap size={20} />
            </div>
            <div className="stat-module-info">
              <span className="stat-module-val">{stats.totalScore}</span>
              <span className="stat-module-lbl">Ahead Score</span>
            </div>
            {stats.rank > 0 && (
              <div className="rank-badge-hero" style={{ position: 'relative', top: 0, right: 0, marginLeft: '8px' }}>
                <TrendingUp size={12} /> #{stats.rank}
              </div>
            )}
          </Motion.div>

          <Motion.div className="stat-module" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <div className="stat-module-icon orange">
              <Flame size={20} />
            </div>
            <div className="stat-module-info">
              <span className="stat-module-val">{stats.streak}</span>
              <span className="stat-module-lbl">Day Streak</span>
            </div>
          </Motion.div>

          {profile?.goal && (
            <Motion.div className="stat-module" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
               <Sparkles size={20} color="var(--primary-color)" />
               <div className="stat-module-info">
                 <span className="stat-module-lbl" style={{ marginTop: 0 }}>Your Goal</span>
                 <span className="stat-module-goal" title={profile.goal}>{profile.goal}</span>
               </div>
            </Motion.div>
          )}

          <button onClick={() => void handleSignOut()} className="btn btn-ghost" style={{ padding: '12px' }} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* SECTION 2 — Log Activity */}
      <section className="dashboard-log-section">
        <div className="log-form-wrapper">
          <form onSubmit={handleSubmit} style={{ width: '100%', position: 'relative' }}>
            <input
              type="text"
              className="log-input"
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
                style={{ padding: '10px 16px' }}
              >
                {isSubmitting ? <span className="loading-spinner"></span> : <><CheckCircle2 size={16} /> Log</>}
              </button>
            </div>
          </form>

          {lastResult && (
            <Motion.div className="ai-suggestion-panel" style={{ marginTop: '16px', maxWidth: '500px', width: '100%' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
               <div className="ai-suggestion-header" style={{ marginBottom: '8px' }}>
                 <Sparkles size={14} /> AI Classified
               </div>
               <div className="ai-suggestion-content">
                 <p className="text-sm">Classified as <strong>{lastResult.type}</strong> and added <strong>+{lastResult.score} XP</strong>.</p>
                 {lastResult.skills?.length > 0 && (
                   <div className="skills-container">
                     {lastResult.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                   </div>
                 )}
               </div>
            </Motion.div>
          )}

          {/* Inline Recent Logs Chips */}
          {!loadingActivities && activities.length > 0 && (
            <div className="recent-logs-inline">
              {activities.slice(0, 3).map((act) => (
                <div key={act.id} className="inline-log-chip">
                  <span style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={act.description}>
                    {act.description}
                  </span>
                  <span className="activity-score" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>+{act.score}</span>
                  <span onClick={() => handleDeleteActivity(act.id)} className="trash-icon">
                    {deletingId === act.id ? <span className="loading-spinner" style={{ width: '12px', height: '12px' }}></span> : <Trash2 size={12} />}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3 — Active Challenges */}
      <section className="dashboard-challenges-wrapper">
        <div className="hsw-container">
           {/* Section 4 — How It Works (Collapsible) */}
           <button className="btn-icon" aria-label="How scoring works">
             ?
           </button>
           <div className="how-scoring-works-tooltip">
             <div className="hsw-header">
               <Sparkles size={14} color="var(--primary-color)" /> How Scoring Works
             </div>
             <ul className="hsw-list">
               <li className="hsw-item">
                 <div className="hsw-item-left"><BookOpen size={12} color="var(--learning-color)"/> Learning</div>
                 <span className="activity-score" style={{ color: 'var(--learning-color)' }}>10 XP</span>
               </li>
               <li className="hsw-item">
                 <div className="hsw-item-left"><Code size={12} color="var(--practice-color)"/> Practice</div>
                 <span className="activity-score" style={{ color: 'var(--practice-color)' }}>20 XP</span>
               </li>
               <li className="hsw-item">
                 <div className="hsw-item-left"><Terminal size={12} color="var(--project-color)"/> Project</div>
                 <span className="activity-score" style={{ color: 'var(--project-color)' }}>30 XP</span>
               </li>
             </ul>
           </div>
        </div>

        <div className="dashboard-challenges-grid">
          {/* Daily Column */}
          <div className="challenges-col">
            <h2 className="challenges-col-header">
              <Clock size={20} color="var(--primary-color)" /> Daily Challenges
            </h2>
            {loadingChallenges || generatingChallenges ? (
               <div className="loading-block glass-panel" style={{ minHeight: '160px' }}>
                 <div className="loading-spinner mb-2"></div>
                 <p className="text-sm">Generating daily tasks...</p>
               </div>
            ) : challenges.filter(c => c.type === 'daily').length > 0 ? (
               challenges.filter(c => c.type === 'daily').slice(0, 3).map(challenge => (
                 <ChallengeCard key={challenge.id} challenge={challenge} onComplete={handleChallengeComplete} />
               ))
            ) : (
               <div className="empty-state glass-panel" style={{ minHeight: '160px', display: 'flex', alignItems: 'center' }}>
                 No daily challenges active right now.
               </div>
            )}
          </div>

          {/* Weekly Column */}
          <div className="challenges-col">
            <h2 className="challenges-col-header">
              <Calendar size={20} color="var(--accent-color)" /> Weekly Challenges
            </h2>
            {loadingChallenges || generatingChallenges ? (
               <div className="loading-block glass-panel" style={{ minHeight: '160px' }}>
                 <div className="loading-spinner mb-2"></div>
                 <p className="text-sm">Generating weekly tasks...</p>
               </div>
            ) : challenges.filter(c => c.type === 'weekly').length > 0 ? (
               challenges.filter(c => c.type === 'weekly').slice(0, 3).map(challenge => (
                 <ChallengeCard key={challenge.id} challenge={challenge} onComplete={handleChallengeComplete} />
               ))
            ) : (
               <div className="empty-state glass-panel" style={{ minHeight: '160px', display: 'flex', alignItems: 'center' }}>
                 No weekly challenges active right now.
               </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
