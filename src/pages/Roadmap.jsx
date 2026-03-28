import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { motion as Motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  Globe,
  GraduationCap,
  Map,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Target,
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

const normalizeLevel = (value, fallback = 'Beginner') => (
  LEVELS.includes(value) ? value : fallback
);

const getSkillName = (skillEntry) => (
  typeof skillEntry === 'string' ? skillEntry : skillEntry?.name || ''
);

const getSkillLevel = (skillEntry, fallback = 'Beginner') => (
  typeof skillEntry === 'string' ? fallback : normalizeLevel(skillEntry?.level, fallback)
);

const getRoadmapNodeLevel = (weekNumber) => {
  if (weekNumber >= 6) return 'Advanced';
  if (weekNumber >= 3) return 'Intermediate';
  return 'Beginner';
};

const getCompletedSkills = (skills, currentSkill) => (
  Array.isArray(skills)
    ? skills
      .map((skillEntry) => ({
        name: getSkillName(skillEntry),
        level: getSkillLevel(skillEntry),
      }))
      .filter((skillEntry) => skillEntry.name && skillEntry.name !== currentSkill)
      .filter((skillEntry) => skillEntry.level === 'Intermediate' || skillEntry.level === 'Advanced')
      .map((skillEntry) => skillEntry.name)
    : []
);

const groupResourcesByType = (resources) => resources.reduce((groups, resource) => {
  const nextGroups = { ...groups };
  const type = resource.type || 'website';
  nextGroups[type] = [...(nextGroups[type] || []), resource];
  return nextGroups;
}, {});

export default function Roadmap() {
  const { profile } = useAuth();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [resourceError, setResourceError] = useState(null);
  const [activeResourceSkill, setActiveResourceSkill] = useState('');
  const [activeResourceLevel, setActiveResourceLevel] = useState('Beginner');
  const [activeResourceSource, setActiveResourceSource] = useState('');

  const cacheKey = `ahead_roadmap_cache_${profile?.id || 'guest'}`;
  const savedSkills = Array.isArray(profile?.skills)
    ? profile.skills
      .map((skillEntry) => {
        const name = getSkillName(skillEntry);
        if (!name) return null;
        return { name, level: getSkillLevel(skillEntry) };
      })
      .filter(Boolean)
    : [];
  const resourceGroups = groupResourcesByType(resources);

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

  const requestResources = useCallback(async ({
    skill,
    level,
    source,
    resourceType = selectedResourceType,
  }) => {
    if (!profile || !skill?.trim()) return;

    const normalizedSkill = skill.trim();
    const normalizedLevel = normalizeLevel(level);

    setActiveResourceSkill(normalizedSkill);
    setActiveResourceLevel(normalizedLevel);
    setActiveResourceSource(source || normalizedSkill);
    setLoadingResources(true);
    setResourceError(null);

    try {
      const nextResources = await generateResourceSuggestions({
        goal: profile.goal || 'General tech career growth',
        skill: normalizedSkill,
        level: normalizedLevel,
        resource_types: resourceType === 'all' ? 'all' : [resourceType],
        completed_skills: getCompletedSkills(profile.skills, normalizedSkill),
      });

      setResources(nextResources);
      if (nextResources.length === 0) {
        setResourceError('No curated resources came back for this topic yet. Try another filter or refresh.');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Resource suggestion error:', err);
      setResources([]);
      setResourceError('Failed to load curated resources. Please try again.');
    } finally {
      setLoadingResources(false);
    }
  }, [profile, selectedResourceType]);

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

  useEffect(() => {
    if (!roadmap || activeResourceSkill) return;

    const firstSavedSkill = Array.isArray(profile?.skills)
      ? profile.skills
        .map((skillEntry) => {
          const name = getSkillName(skillEntry);
          if (!name) return null;
          return { name, level: getSkillLevel(skillEntry) };
        })
        .filter(Boolean)[0]
      : null;

    if (firstSavedSkill) {
      void requestResources({
        skill: firstSavedSkill.name,
        level: firstSavedSkill.level,
        source: `Saved skill: ${firstSavedSkill.name}`,
      });
      return;
    }

    const firstWeek = roadmap.weeks?.[0];
    if (firstWeek?.title) {
      void requestResources({
        skill: firstWeek.title,
        level: getRoadmapNodeLevel(firstWeek.week),
        source: `Roadmap node: Week ${firstWeek.week}`,
      });
    }
  }, [activeResourceSkill, profile?.skills, requestResources, roadmap]);

  const handleRegenerate = () => {
    localStorage.removeItem(cacheKey);
    void generateRoadmap();
  };

  const handleResourceTypeChange = (nextType) => {
    setSelectedResourceType(nextType);
    if (!activeResourceSkill) return;

    void requestResources({
      skill: activeResourceSkill,
      level: activeResourceLevel,
      source: activeResourceSource,
      resourceType: nextType,
    });
  };

  const handleSavedSkillClick = (skillEntry) => {
    void requestResources({
      skill: skillEntry.name,
      level: skillEntry.level,
      source: `Saved skill: ${skillEntry.name}`,
    });
  };

  const handleWeekResourceClick = (week) => {
    void requestResources({
      skill: week.title,
      level: getRoadmapNodeLevel(week.week),
      source: `Roadmap node: Week ${week.week}`,
    });
  };

  if (loading) {
    return (
      <div className="container animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="glass-panel text-center" style={{ padding: '60px 24px', marginTop: 40 }}>
          <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }}></div>
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
    <div className="container animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="glass-panel" style={{ marginTop: 40, textAlign: 'center' }}>
        <Map size={40} color="var(--primary-color)" style={{ margin: '0 auto 12px' }} />
        <h1>Your Learning Roadmap</h1>
        <p>Personalized plan to achieve: <strong style={{ color: 'var(--primary-color)' }}>{profile?.goal}</strong></p>
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

      <section className="glass-panel roadmap-resources-panel">
        <div className="roadmap-resources-header">
          <div>
            <h2 className="section-title" style={{ marginBottom: 8 }}>Resource Suggestions</h2>
            <p className="roadmap-resources-copy">
              Personalized picks from a dedicated Mistral curator for the current skill, your goal, and the skills you already know.
            </p>
          </div>

          <div className="resource-filter-row">
            {RESOURCE_TYPE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`resource-filter-pill ${selectedResourceType === option.id ? 'active' : ''}`}
                onClick={() => handleResourceTypeChange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {savedSkills.length > 0 && (
          <div className="roadmap-skill-chip-row">
            {savedSkills.map((skillEntry) => (
              <button
                key={skillEntry.name}
                type="button"
                className={`roadmap-skill-chip ${activeResourceSkill === skillEntry.name ? 'active' : ''}`}
                onClick={() => handleSavedSkillClick(skillEntry)}
              >
                <span>{skillEntry.name}</span>
                <span className="roadmap-skill-chip-level">{skillEntry.level}</span>
              </button>
            ))}
          </div>
        )}

        {activeResourceSkill && (
          <div className="roadmap-resource-context">
            <div>
              <span className="roadmap-resource-context-label">Currently Curating</span>
              <h3>{activeResourceSkill}</h3>
              <p>{activeResourceSource} · {activeResourceLevel}</p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => void requestResources({
                skill: activeResourceSkill,
                level: activeResourceLevel,
                source: activeResourceSource,
              })}
            >
              <RefreshCw size={14} /> Refresh picks
            </button>
          </div>
        )}

        {loadingResources ? (
          <div className="roadmap-resource-loading">
            <div className="loading-spinner" style={{ width: 24, height: 24 }}></div>
            <p>Mistral is curating the best next resources for you...</p>
          </div>
        ) : resourceError ? (
          <div className="roadmap-resource-feedback error">
            <p>{resourceError}</p>
          </div>
        ) : resources.length > 0 ? (
          <div className="roadmap-resource-groups">
            {RESOURCE_TYPE_OPTIONS
              .filter((option) => option.id !== 'all' && resourceGroups[option.id]?.length > 0)
              .map((option, groupIndex) => {
                const meta = RESOURCE_META[option.id];
                const GroupIcon = meta?.Icon || Globe;

                return (
                  <Motion.div
                    key={option.id}
                    className="roadmap-resource-group"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.05 }}
                  >
                    <div className="roadmap-resource-group-header">
                      <div className={`resource-type-badge-large ${option.id}`}>
                        <GroupIcon size={16} />
                        <span>{meta?.label || option.label}</span>
                      </div>
                      <span className="roadmap-resource-count">{resourceGroups[option.id].length} picks</span>
                    </div>

                    <div className="roadmap-resource-card-grid">
                      {resourceGroups[option.id].map((resource, index) => {
                        const CardIcon = RESOURCE_META[resource.type]?.Icon || Globe;

                        return (
                          <Motion.article
                            key={resource.id || `${resource.title}-${index}`}
                            className="roadmap-resource-card"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (groupIndex * 0.05) + (index * 0.03) }}
                          >
                            <div className="roadmap-resource-card-top">
                              <div className={`resource-type-badge ${resource.type}`}>
                                <CardIcon size={14} />
                                <span>{RESOURCE_META[resource.type]?.label || 'Resource'}</span>
                              </div>
                              {resource.provider && <span className="roadmap-resource-provider">{resource.provider}</span>}
                            </div>

                            <h3>{resource.title}</h3>
                            {resource.description && <p className="roadmap-resource-description">{resource.description}</p>}
                            {resource.whyItFits && (
                              <div className="roadmap-resource-why">
                                <span>Why this fits</span>
                                <p>{resource.whyItFits}</p>
                              </div>
                            )}

                            <div className="roadmap-resource-meta">
                              <span>{resource.level}</span>
                              {resource.timeEstimate && <span>{resource.timeEstimate}</span>}
                              {resource.cost && <span>{resource.cost}</span>}
                            </div>

                            {resource.tags?.length > 0 && (
                              <div className="roadmap-resource-tags">
                                {resource.tags.map((tag) => (
                                  <span key={`${resource.id}-${tag}`}>{tag}</span>
                                ))}
                              </div>
                            )}

                            {resource.url ? (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noreferrer"
                                className="roadmap-resource-link"
                              >
                                Open resource <ExternalLink size={14} />
                              </a>
                            ) : (
                              <div className="roadmap-resource-note">Project idea ready to build directly from this roadmap step.</div>
                            )}
                          </Motion.article>
                        );
                      })}
                    </div>
                  </Motion.div>
                );
              })}
          </div>
        ) : (
          <div className="roadmap-resource-feedback">
            <p>Open a skill or roadmap node to see curated videos, books, practice sets, courses, and project ideas.</p>
          </div>
        )}
      </section>

      {roadmap?.weeks && (
        <div className="roadmap-timeline">
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
