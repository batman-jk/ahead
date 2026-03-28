import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/auth-context';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  ExternalLink,
  Globe,
  GraduationCap,
  Map,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Target,
  Zap,
  Info
} from 'lucide-react';
import { generateResourceSuggestions } from '../lib/ai';

const RESOURCE_TYPE_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Videos' },
  { id: 'book', label: 'Books' },
  { id: 'website', label: 'Websites' },
  { id: 'practice', label: 'Practice' },
  { id: 'course', label: 'Courses' },
  { id: 'project', label: 'Projects' },
];

const RESOURCE_META = {
  video: { label: 'Video', Icon: PlayCircle },
  book: { label: 'Book', Icon: BookOpen },
  website: { label: 'Website', Icon: Globe },
  practice: { label: 'Practice', Icon: Target },
  course: { label: 'Course', Icon: GraduationCap },
  project: { label: 'Project', Icon: Map },
};

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const normalizeLevel = (value, fallback = 'Beginner') => (LEVELS.includes(value) ? value : fallback);
const getSkillName = (s) => (typeof s === 'string' ? s : s?.name || '');
const getSkillLevel = (s, f = 'Beginner') => (typeof s === 'string' ? f : normalizeLevel(s?.level, f));

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export default function ResourcesPage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const initialSkill = searchParams.get('skill') || '';
  const initialLevel = searchParams.get('level') || 'Beginner';

  const [activeSkill, setActiveSkill] = useState(initialSkill);
  const [activeLevel, setActiveLevel] = useState(initialLevel);
  const [filterType, setFilterType] = useState('all');
  const [cooldownEnd, setCooldownEnd] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  const savedSkills = useMemo(() => {
    if (!Array.isArray(profile?.skills)) return [];
    return profile.skills.map(s => ({ name: getSkillName(s), level: getSkillLevel(s) })).filter(s => s.name);
  }, [profile?.skills]);

  // Load cooldown and initial skill
  useEffect(() => {
    const savedCooldown = localStorage.getItem('resource_refresh_cooldown');
    if (savedCooldown) setCooldownEnd(parseInt(savedCooldown, 10));

    if (!activeSkill && savedSkills.length > 0) {
      setActiveSkill(savedSkills[0].name);
      setActiveLevel(savedSkills[0].level);
    }
  }, [savedSkills, activeSkill]);

  // Timer logic
  useEffect(() => {
    if (cooldownEnd <= Date.now()) {
      setTimeLeft('');
      return;
    }

    const interval = setInterval(() => {
      const remaining = cooldownEnd - Date.now();
      if (remaining <= 0) {
        setTimeLeft('');
        clearInterval(interval);
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const fetchResources = useCallback(async (skill, level, force = false) => {
    if (!profile || !skill) return;
    
    setLoading(true);
    setError(null);

    try {
      const results = await generateResourceSuggestions({
        goal: profile.goal || '',
        skill,
        level,
        resource_types: 'all',
        completed_skills: [],
      });

      // Limit to top 3 total
      setResources(results.slice(0, 3));

      if (force) {
        const nextCooldown = Date.now() + COOLDOWN_MS;
        setCooldownEnd(nextCooldown);
        localStorage.setItem('resource_refresh_cooldown', nextCooldown.toString());
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load resources. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Initial fetch when skill changes
  useEffect(() => {
    if (activeSkill) {
      // Check cache or just fetch (we only limit REFRESH, not skill switching)
      void fetchResources(activeSkill, activeLevel, false);
    }
  }, [activeSkill, activeLevel, fetchResources]);

  const handleRefresh = () => {
    if (timeLeft) return;
    void fetchResources(activeSkill, activeLevel, true);
  };

  const filteredResources = useMemo(() => {
    if (filterType === 'all') return resources;
    return resources.filter(r => r.type === filterType);
  }, [resources, filterType]);

  const hasNoResults = filterType !== 'all' && filteredResources.length === 0;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', paddingTop: '40px' }}>
      <header className="glass-panel" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Sparkles size={40} color="var(--text-primary)" style={{ margin: '0 auto 12px' }} />
        <h1 style={{ margin: 0 }}>Resource Suggestions</h1>
        <p style={{ marginTop: '8px', opacity: 0.7 }}>Hand-picked curators from Mistral AI for your specific path.</p>
      </header>

      {/* Slim Curating Banner */}
      <div className="glass-panel" style={{ 
        height: '48px', 
        padding: '0 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '24px',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Curating for ·</span>
          <strong style={{ color: 'var(--text-primary)' }}>{activeSkill}</strong>
          <span style={{ opacity: 0.5 }}>· {activeLevel}</span>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={!!timeLeft || loading}
          className="btn btn-sm"
          style={{ 
            background: timeLeft ? 'var(--bg-secondary)' : 'var(--text-primary)',
            color: timeLeft ? 'var(--text-secondary)' : 'var(--bg-color)',
            border: timeLeft ? '1px solid var(--panel-border)' : 'none',
            opacity: timeLeft ? 0.6 : 1,
            cursor: timeLeft ? 'not-allowed' : 'pointer',
            minWidth: '140px',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: '8px'
          }}
        >
          {loading ? (
            <span className="loading-spinner" style={{ width: '12px', height: '12px' }}></span>
          ) : timeLeft ? (
            `Refresh in ${timeLeft}`
          ) : (
            'Refresh picks'
          )}
        </button>
      </div>

      {/* Skill Tabs */}
      {savedSkills.length > 0 && (
        <div className="roadmap-skill-chip-row" style={{ marginBottom: '32px' }}>
          {savedSkills.map((s) => (
            <button
              key={s.name}
              className={`roadmap-skill-chip ${activeSkill === s.name ? 'active' : ''}`}
              onClick={() => { setActiveSkill(s.name); setActiveLevel(s.level); }}
            >
              <span>{s.name}</span>
              <span className="roadmap-skill-chip-level">{s.level}</span>
            </button>
          ))}
        </div>
      )}

      {/* Type Filter Pills */}
      <div className="resource-filter-row" style={{ marginBottom: '24px', justifyContent: 'center' }}>
        {RESOURCE_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`resource-filter-pill ${filterType === opt.id ? 'active' : ''}`}
            onClick={() => setFilterType(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Resource List (Flat) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '300px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
            <p>Curating 3 top picks for you...</p>
          </div>
        ) : error ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', borderColor: 'var(--danger-color)' }}>
            <p>{error}</p>
          </div>
        ) : hasNoResults ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', opacity: 0.6 }}>
            <Info size={24} style={{ margin: '0 auto 12px' }} />
            <p>No {filterType} picks for this skill right now.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredResources.map((res, i) => {
              const CardIcon = RESOURCE_META[res.type]?.Icon || Globe;
              return (
                <Motion.article
                  key={res.title + i}
                  className="roadmap-resource-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ delay: i * 0.1 }}
                  style={{ width: '100%' }}
                >
                  <div className="roadmap-resource-card-top">
                    <div className={`resource-type-badge ${res.type}`}>
                      <CardIcon size={14} />
                      <span>{RESOURCE_META[res.type]?.label || 'Resource'}</span>
                    </div>
                    {res.provider && <span className="roadmap-resource-provider">{res.provider}</span>}
                  </div>

                  <h3>{res.title}</h3>
                  {res.description && <p className="roadmap-resource-description">{res.description}</p>}
                  
                  {res.whyItFits && (
                    <div className="roadmap-resource-why" style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Why this fits</span>
                      <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{res.whyItFits}</p>
                    </div>
                  )}

                  <div className="roadmap-resource-meta" style={{ marginTop: '12px' }}>
                    <span>{res.level}</span>
                    {res.timeEstimate && <span>{res.timeEstimate}</span>}
                    {res.cost && <span>{res.cost}</span>}
                  </div>

                  {res.tags?.length > 0 && (
                    <div className="roadmap-resource-tags" style={{ marginTop: '12px' }}>
                      {res.tags.map(tag => <span key={tag}>{tag}</span>)}
                    </div>
                  )}

                  {res.url && (
                    <a href={res.url} target="_blank" rel="noreferrer" className="roadmap-resource-link" style={{ marginTop: '16px' }}>
                      Open resource <ExternalLink size={14} />
                    </a>
                  )}
                </Motion.article>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
