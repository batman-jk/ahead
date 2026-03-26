import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { classifyActivityType } from '../lib/ai';
import { Target, BookOpen, Code, Terminal, Zap, CheckCircle2, Sparkles, X } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  
  // Form State
  const [description, setDescription] = useState('');
  const [type, setType] = useState('learning');
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // AI Suggestion State
  const [aiSuggestion, setAiSuggestion] = useState(null);
  
  const [stats, setStats] = useState({ totalPoints: 0, streak: 0 });

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!supabase || !user) {
      setLoadingActivities(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();
      
      const { data: acts } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (profile) setStats(prev => ({ ...prev, totalPoints: profile.total_points }));
      if (acts) setActivities(acts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleSmartClassify = async () => {
    if (!description.trim() || description.length < 5) return;
    
    setIsClassifying(true);
    try {
      const result = await classifyActivityType(description);
      if (result) {
        setAiSuggestion(result);
        // We don't auto-set the type anymore, we let the user confirm
      }
    } catch (err) {
      console.error('Classification failed:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  const applySuggestion = () => {
    if (aiSuggestion) {
      setType(aiSuggestion.type);
      setAiSuggestion(null);
    }
  };

  const getPointsForType = (t) => {
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
    const points = getPointsForType(type);

    try {
      const { error } = await supabase
        .from('activities')
        .insert([{
          user_id: user.id,
          description,
          type,
          points,
          metadata: aiSuggestion?.skills ? { skills: aiSuggestion.skills } : {}
        }]);

      if (error) throw error;
      
      await fetchUserData();
      setDescription('');
      setAiSuggestion(null);
      setType('learning');
    } catch (err) {
      console.error(err);
      alert('Failed to log activity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container animate-fade-in">
      <header className="dashboard-header mb-8">
        <div>
          <h1 className="greeting">Keep pushing, {user?.user_metadata?.username || 'Student'}!</h1>
          <p className="subtitle">Track today's effort to see your progress tomorrow.</p>
        </div>
        
        <div className="stats-cards">
          <div className="stat-card glass-panel">
            <div className="stat-icon learning-bg"><Zap size={24} color="var(--learning-color)" /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalPoints}</span>
              <span className="stat-label">Total Points</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2">
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
                      if (aiSuggestion) setAiSuggestion(null);
                    }}
                    onBlur={handleSmartClassify}
                  />
                  {isClassifying && (
                    <div className="classifying-badge">
                      <div className="loading-spinner"></div>
                      Analyzing...
                    </div>
                  )}
                </div>
              </div>

              {/* AI Suggestion Display */}
              {aiSuggestion && (
                <div className="ai-suggestion-panel">
                  <div className="ai-suggestion-header">
                    <Sparkles size={14} /> AI Analysis
                  </div>
                  <div className="ai-suggestion-content">
                    <p className="text-sm">
                      Identified as <strong className={`text-${aiSuggestion.type}`}>{aiSuggestion.type}</strong>
                    </p>
                    {aiSuggestion.skills?.length > 0 && (
                      <div className="skills-container">
                        {aiSuggestion.skills.map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ai-suggestion-actions">
                    <button type="button" className="btn btn-sm btn-confirm" onClick={applySuggestion}>
                      Apply Suggestion
                    </button>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAiSuggestion(null)}>
                      <X size={14} /> Clear
                    </button>
                  </div>
                </div>
              )}

              <div className="type-selectors mt-6">
                <label className={`type-btn ${type === 'learning' ? 'active-learning' : ''}`}>
                  <input type="radio" value="learning" checked={type === 'learning'} onChange={(e) => setType(e.target.value)} hidden />
                  <BookOpen size={18} /> Learning (10 pts)
                </label>
                <label className={`type-btn ${type === 'practice' ? 'active-practice' : ''}`}>
                  <input type="radio" value="practice" checked={type === 'practice'} onChange={(e) => setType(e.target.value)} hidden />
                  <Code size={18} /> Practice (20 pts)
                </label>
                <label className={`type-btn ${type === 'project' ? 'active-project' : ''}`}>
                  <input type="radio" value="project" checked={type === 'project'} onChange={(e) => setType(e.target.value)} hidden />
                  <Terminal size={18} /> Project (30 pts)
                </label>
              </div>

              <button type="submit" className="btn btn-primary mt-6" disabled={isSubmitting || !description}>
                {isSubmitting ? 'Logging...' : 'Log Activity'}
                {!isSubmitting && <CheckCircle2 size={18} />}
              </button>
            </form>
          </section>

          {/* Recent Activities */}
          <section className="glass-panel">
            <h2 className="section-title">Recent Logs</h2>
            {loadingActivities ? (
              <div className="skeleton" style={{ height: '80px', marginBottom: '10px' }}></div>
            ) : activities.length > 0 ? (
              <ul className="activity-list">
                {activities.map(act => (
                  <li key={act.id} className="activity-item">
                    <div className={`activity-icon bg-${act.type}`}>
                      {act.type === 'learning' && <BookOpen size={16} />}
                      {act.type === 'practice' && <Code size={16} />}
                      {act.type === 'project' && <Terminal size={16} />}
                    </div>
                    <div className="activity-details">
                      <p className="activity-desc">{act.description}</p>
                      {act.metadata?.skills && (
                        <div className="activity-skills">
                          {act.metadata.skills.map((s, i) => (
                            <span key={i} className="activity-skill-tag">{s}</span>
                          ))}
                        </div>
                      )}
                      <span className="activity-time">{new Date(act.created_at).toLocaleString()}</span>
                    </div>
                    <div className="activity-points">
                      +{act.points} pts
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No activities logged yet. Start doing things!</p>
            )}
          </section>
        </div>

        {/* Sidebar Space */}
        <div className="col-span-1">
           <div className="glass-panel info-panel">
              <h3>How it works</h3>
              <ul className="info-list">
                 <li><Target size={16}/> <span>Learn: Watching tutorials, reading docs.</span></li>
                 <li><Code size={16}/> <span>Practice: Solving problems, fixing bugs.</span></li>
                 <li><Terminal size={16}/> <span>Project: Building real applications.</span></li>
              </ul>
              <p className="mt-4 text-xs">Points are assigned automatically based on the activity type. Stand out consistency gets rewarded.</p>
           </div>
        </div>
      </div>
    </div>
  );
}

