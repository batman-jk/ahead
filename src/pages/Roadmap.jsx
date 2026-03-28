import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { motion as Motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Map,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react';

const getRoadmapNodeLevel = (weekNumber) => {
  if (weekNumber >= 6) return 'Advanced';
  if (weekNumber >= 3) return 'Intermediate';
  return 'Beginner';
};

export default function Roadmap() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cacheKey = `ahead_roadmap_cache_${profile?.id || 'guest'}`;

  const generateRoadmap = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      setError('Profile unavailable. Please finish onboarding first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: profile.goal || 'General tech career growth',
          skills: profile.skills || [],
        }),
      });

      if (!response.ok) throw new Error('Failed to generate roadmap');

      const data = await response.json();
      setRoadmap(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error('Roadmap error:', err);
      setError('Failed to generate roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [cacheKey, profile]);

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setRoadmap(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    void generateRoadmap();
  }, [cacheKey, generateRoadmap]);

  const handleRegenerate = () => {
    localStorage.removeItem(cacheKey);
    void generateRoadmap();
  };

  const handleWeekResourceClick = (week) => {
    navigate(`/resources?skill=${encodeURIComponent(week.title)}&level=${encodeURIComponent(getRoadmapNodeLevel(week.week))}`);
  };

  if (loading) {
    return (
      <div className="container animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="glass-panel text-center" style={{ padding: '60px 24px', marginTop: 40 }}>
          <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 166px' }}></div>
          <h3>Generating your personalized roadmap...</h3>
          <p>Mistral AI is crafting a plan based on your goals and skills.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="glass-panel text-center" style={{ padding: '60px 24px', marginTop: 40 }}>
          <p style={{ color: 'var(--danger-color)' }}>{error}</p>
          <button className="btn btn-primary mt-6" onClick={handleRegenerate}>
            <RefreshCw size={18} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', paddingBottom: '80px' }}>
      <div className="glass-panel" style={{ marginTop: 40, textAlign: 'center' }}>
        <Map size={40} color="var(--text-primary)" style={{ margin: '0 auto 12px' }} />
        <h1>Your Learning Roadmap</h1>
        <p>Personalized plan to achieve: <strong style={{ color: 'var(--text-primary)' }}>{profile?.goal}</strong></p>
        <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={handleRegenerate}>
          <RefreshCw size={16} /> Regenerate
        </button>
      </div>

      {roadmap && (
        <div className="roadmap-goals-row">
          <Motion.div className="glass-panel roadmap-goal-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="roadmap-goal-icon today">
              <Target size={22} />
            </div>
            <div>
              <span className="roadmap-goal-label">Today's Goal</span>
              <p className="roadmap-goal-text">{roadmap.todayGoal}</p>
            </div>
          </Motion.div>

          <Motion.div className="glass-panel roadmap-goal-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="roadmap-goal-icon week">
              <Calendar size={22} />
            </div>
            <div>
              <span className="roadmap-goal-label">This Week's Goal</span>
              <p className="roadmap-goal-text">{roadmap.weekGoal}</p>
            </div>
          </Motion.div>
        </div>
      )}

      {roadmap?.weeks && (
        <div className="roadmap-timeline" style={{ marginTop: '40px' }}>
          {roadmap.weeks.map((week, i) => (
            <Motion.div
              key={i}
              className="timeline-item"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <div className="timeline-marker">
                <div className={`timeline-dot ${i === 0 ? 'active' : ''}`}>
                  {i === 0 ? <Sparkles size={14} /> : <Circle size={10} />}
                </div>
                {i < roadmap.weeks.length - 1 && <div className="timeline-line"></div>}
              </div>
              <div className="glass-panel timeline-card">
                <div className="timeline-card-header">
                  <span className="week-badge">Week {week.week}</span>
                  <h3>{week.title}</h3>
                </div>
                {week.focus && <p className="timeline-focus">{week.focus}</p>}
                <ul className="timeline-tasks">
                  {week.tasks?.map((task, j) => (
                    <li key={j}>
                      <CheckCircle2 size={14} color="var(--accent-color)" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
                <div className="timeline-card-actions">
                  <span className="timeline-level-pill">{getRoadmapNodeLevel(week.week)}</span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleWeekResourceClick(week)}
                  >
                    <Sparkles size={14} /> Get Resources
                  </button>
                </div>
              </div>
            </Motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
