import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { classifyActivityType, abortActiveClassification } from '../lib/ai';
import { motion as Motion } from 'framer-motion';
import { BookOpen, Code, Terminal, Zap, CheckCircle2, Sparkles, Flame, TrendingUp, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  
  const [stats, setStats] = useState({ totalScore: 0, streak: 0, rank: 0 });

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
        .limit(10);

      // Calculate rank
      let rank = 0;
      if (profileData) {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gt('total_score', profileData.total_score);
        rank = (count || 0) + 1;
      }

      // Calculate streak (consecutive days with activity)
      let streak = 0;
      if (acts && acts.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let checkDate = new Date(today);
        
        const actDates = [...new Set(acts.map(a => {
          const d = new Date(a.created_at);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }))].sort((a, b) => b - a);

        for (const dateTime of actDates) {
          if (dateTime === checkDate.getTime()) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (dateTime === checkDate.getTime() - 86400000) {
            // Allow checking yesterday if today has no activity
            checkDate = new Date(dateTime);
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      if (profileData) {
        setStats({ totalScore: profileData.total_score, streak, rank });
      } else {
        console.warn('No profile found for this user. Score triggers may not work.');
        setStats({ totalScore: 0, streak: 0, rank: 0 });
      }
      if (acts) setActivities(acts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivities(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchUserData();
  }, [fetchUserData]);

  const getScoreForType = (t) => {
    switch(t) {
      case 'learning': return 10;
      case 'practice': return 20;
      case 'project': return 30;
      default: return 10;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !supabase) return;
    
    setIsSubmitting(true);
    setLastResult(null);
    console.log('Starting activity logging for:', description);

    try {
      // 1. AI classifies the activity
      const aiResult = await classifyActivityType(description);
      console.log('AI Result in Dashboard:', aiResult);
      
      const type = aiResult?.type || 'learning';
      const skills = aiResult?.skills || [];
      const score = getScoreForType(type);

      // 2. Insert into database
      const { data: insertedData, error } = await supabase
        .from('activities')
        .insert([{
          user_id: user.id,
          description,
          type,
          score,
          metadata: skills.length > 0 ? { skills } : {}
        }])
        .select(); // Select to confirm it actually exists in the DB

      if (error) {
        console.error('Supabase Insert Error:', error);
        alert(`❌ Database Error: ${error.message}\nCode: ${error.code}`);
        throw error;
      }
      
      if (!insertedData || insertedData.length === 0) {
        console.error('Insert returned no data - RLS or Trigger might be blocking it.');
        alert('⚠️ Activity was sent but not saved. Please check your Supabase RLS policies.');
        return;
      }

      console.log('Log successful, inserted:', insertedData[0]);
      
      console.log('Log successful, refreshing UI...');
      setLastResult({ type, score, skills });
      await fetchUserData();
      setDescription('');
    } catch (err) {
      console.error('Submit Error Details:', err);
      // Construct a more detailed error message
      const errorMsg = err.message || 'Unknown network error';
      alert(`⚠️ Failed to log activity.\n\nError: ${errorMsg}\n\nCheck if the AI Proxy Server is running at http://127.0.0.1:3001`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.username || 'Student';

  return (
    <div className="container animate-fade-in">
      <header className="dashboard-header mb-8">
        <div>
          <h1 className="greeting">Keep pushing, {displayName}!</h1>
          <p className="subtitle">Track today's effort to see your progress tomorrow.</p>
        </div>
        <button onClick={() => { if(window.confirm('Sign out?')) signOut(); }} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
          <LogOut size={14} /> Sign Out
        </button>
      </header>

      {/* Score Hero Section */}
      <div className="score-hero-row">
        <Motion.div className="glass-panel score-hero-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <div className="score-ring">
            <Zap size={32} />
          </div>
          <div className="score-info">
            <span className="score-big">{stats.totalScore}</span>
            <span className="score-label">Ahead Score</span>
          </div>
          {stats.rank > 0 && (
            <div className="rank-badge-hero">
              <TrendingUp size={14} /> #{stats.rank}
            </div>
          )}
        </Motion.div>

        <Motion.div className="glass-panel streak-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div className="streak-icon">
            <Flame size={28} />
          </div>
          <div className="streak-info">
            <span className="streak-big">{stats.streak}</span>
            <span className="streak-label">Day Streak</span>
          </div>
        </Motion.div>

        {profile?.goal && (
          <Motion.div className="glass-panel goal-card-mini" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <Sparkles size={20} color="var(--primary-color)" />
            <div>
              <span className="goal-mini-label">Your Goal</span>
              <span className="goal-mini-text">{profile.goal}</span>
            </div>
          </Motion.div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          {/* Tracker Form */}
          <section className="glass-panel mb-8">
            <h2 className="section-title">Log Activity</h2>
            <form onSubmit={handleSubmit} className="tracker-form">
              <div className="input-group">
                <label className="input-label">What did you do today?</label>
                <div className="smart-input-wrapper">
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="e.g., Completed 2 LeetCode problems on Dynamic Programming"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (lastResult) setLastResult(null);
                    }}
                  />
                </div>
              </div>

              {lastResult && (
                <Motion.div className="ai-suggestion-panel" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="ai-suggestion-header">
                    <Sparkles size={14} /> AI Classified
                  </div>
                  <div className="ai-suggestion-content">
                    <p className="text-sm">
                      Classified as <strong className={`text-${lastResult.type}`}>{lastResult.type}</strong>
                      {' — '}<strong>+{lastResult.score} score</strong>
                    </p>
                    {lastResult.skills?.length > 0 && (
                      <div className="skills-container">
                        {lastResult.skills.map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Motion.div>
              )}

              <div className="button-group-row mt-6">
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !description}>
                  {isSubmitting ? (
                    <><div className="loading-spinner"></div> Classifying...</>
                  ) : (
                    <>Log Activity <CheckCircle2 size={18} /></>
                  )}
                </button>

                {isSubmitting && (
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={async () => {
                      if (!window.confirm('Skip AI classification and log as "Learning" (+10)?')) return;
                      
                      console.log('User skipped AI, logging manually');
                      abortActiveClassification();
                      setIsSubmitting(true);
                      
                      try {
                        const { data: inserted, error } = await supabase
                          .from('activities')
                          .insert([{
                            user_id: user.id,
                            description,
                            type: 'learning',
                            score: 10,
                            metadata: { skipped_ai: true }
                          }])
                          .select();
                          
                        if (error) throw error;
                        if (!inserted || inserted.length === 0) throw new Error('Insert failed - no data returned');

                        console.log('Manual log successful');
                        await fetchUserData();
                        setDescription('');
                        setLastResult({ type: 'learning', score: 10, skills: [] });
                      } catch (err) {
                        console.error('Manual log error:', err);
                        alert('❌ Manual log failed: ' + err.message);
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    Skip AI & Log Now
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Recent Activities */}
          <section className="glass-panel">
            <h2 className="section-title">Recent Logs</h2>
            {loadingActivities ? (
              <div className="skeleton" style={{ height: '80px', marginBottom: '10px' }}></div>
            ) : activities.length > 0 ? (
              <ul className="activity-list">
                {activities.map((act, i) => (
                  <Motion.li
                    key={act.id}
                    className="activity-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className={`activity-icon bg-${act.type}`}>
                      {act.type === 'learning' && <BookOpen size={16} />}
                      {act.type === 'practice' && <Code size={16} />}
                      {act.type === 'project' && <Terminal size={16} />}
                    </div>
                    <div className="activity-details">
                      <p className="activity-desc">{act.description}</p>
                      {act.metadata?.skills && (
                        <div className="activity-skills">
                          {act.metadata.skills.map((s, j) => (
                            <span key={j} className="activity-skill-tag">{s}</span>
                          ))}
                        </div>
                      )}
                      <span className="activity-time">{new Date(act.created_at).toLocaleString()}</span>
                    </div>
                    <div className="activity-score">
                      +{act.score} score
                    </div>
                  </Motion.li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No activities logged yet. Start doing things!</p>
            )}
          </section>
        </div>

        <div className="dashboard-sidebar">
          <div className="glass-panel info-panel">
            <h3>How it works</h3>
            <ul className="info-list">
              <li><Sparkles size={16}/> <span>Just describe what you did — AI handles the rest.</span></li>
              <li><BookOpen size={16}/> <span>Learning: 10 score</span></li>
              <li><Code size={16}/> <span>Practice: 20 score</span></li>
              <li><Terminal size={16}/> <span>Project: 30 score</span></li>
            </ul>
            <p className="mt-4 text-xs">Score is assigned automatically by Mistral AI. Consistency gets rewarded.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
