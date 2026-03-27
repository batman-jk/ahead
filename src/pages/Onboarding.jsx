import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Target, Cpu, GraduationCap, ChevronRight, ChevronLeft, Sparkles, Check } from 'lucide-react';

const GOALS = [
  { id: 'faang', label: 'Get a Job at FAANG', icon: '🚀' },
  { id: 'gate', label: 'Crack GATE', icon: '🎓' },
  { id: 'startup', label: 'Build a Startup', icon: '💡' },
  { id: 'fullstack', label: 'Become a Full Stack Dev', icon: '⚡' },
  { id: 'ml', label: 'Master Machine Learning', icon: '🤖' },
  { id: 'competitive', label: 'Competitive Programming', icon: '🏆' },
  { id: 'placement', label: 'Crack Campus Placements', icon: '🎯' },
  { id: 'freelance', label: 'Start Freelancing', icon: '💻' },
];

const SKILLS = [
  'DSA', 'Python', 'JavaScript', 'Java', 'C++', 'Web Development',
  'React', 'Node.js', 'Machine Learning', 'SQL', 'System Design',
  'DevOps', 'Git', 'TypeScript', 'Flutter', 'Docker',
  'AWS', 'MongoDB', 'REST APIs', 'GraphQL',
];

const PROFICIENCY = ['Beginner', 'Intermediate', 'Advanced'];

const pageVariants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};

export default function Onboarding() {
  const { user, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [selectedSkills, setSelectedSkills] = useState({}); // { skillName: proficiency }
  const [college, setCollege] = useState('');
  const [state, setState] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => {
      if (prev[skill]) {
        const copy = { ...prev };
        delete copy[skill];
        return copy;
      }
      return { ...prev, [skill]: 'Beginner' };
    });
  };

  const setProficiency = (skill, level) => {
    setSelectedSkills(prev => ({ ...prev, [skill]: level }));
  };

  const finalGoal = goal === 'custom' ? customGoal : GOALS.find(g => g.id === goal)?.label || '';

  const canProceed = () => {
    if (step === 1) return !!finalGoal;
    if (step === 2) return Object.keys(selectedSkills).length > 0;
    if (step === 3) return college.trim() && state.trim();
    return false;
  };

  const handleSubmit = async () => {
    if (!supabase || !user) return;
    setSaving(true);

    const skillsArray = Object.entries(selectedSkills).map(([name, level]) => ({ name, level }));

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          goal: finalGoal,
          skills: skillsArray,
          college: college.trim(),
          state: state.trim(),
          onboarded: true,
          avatar_url: user.user_metadata?.avatar_url || null,
          full_name: user.user_metadata?.full_name || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;

      await refreshProfile();
      navigate('/');
    } catch (err) {
      console.error('Onboarding error:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboarding-container">
      <button 
        onClick={() => { if(window.confirm('Sign out?')) signOut(); }} 
        className="btn btn-ghost btn-sm" 
        style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100 }}
      >
        Sign Out
      </button>
      <div className="onboarding-card glass-panel">
        {/* Progress bar */}
        <div className="onboarding-progress">
          {[1, 2, 3].map(s => (
            <div key={s} className={`progress-step ${step >= s ? 'active' : ''} ${step > s ? 'done' : ''}`}>
              {step > s ? <Check size={14} /> : s}
            </div>
          ))}
          <div className="progress-line">
            <Motion.div className="progress-fill" animate={{ width: `${((step - 1) / 2) * 100}%` }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Goal */}
          {step === 1 && (
            <Motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="onboarding-step">
              <div className="step-header">
                <Target size={28} className="step-icon" />
                <h2>What's your ultimate goal?</h2>
                <p>This helps us personalize your learning roadmap.</p>
              </div>

              <div className="goal-grid">
                {GOALS.map(g => (
                  <button
                    key={g.id}
                    className={`goal-card ${goal === g.id ? 'selected' : ''}`}
                    onClick={() => { setGoal(g.id); setCustomGoal(''); }}
                  >
                    <span className="goal-emoji">{g.icon}</span>
                    <span className="goal-label">{g.label}</span>
                  </button>
                ))}
                <button
                  className={`goal-card ${goal === 'custom' ? 'selected' : ''}`}
                  onClick={() => setGoal('custom')}
                >
                  <span className="goal-emoji">✨</span>
                  <span className="goal-label">Something else</span>
                </button>
              </div>

              {goal === 'custom' && (
                <Motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="custom-goal-input">
                  <input
                    className="input-field"
                    placeholder="Describe your goal..."
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    autoFocus
                  />
                </Motion.div>
              )}
            </Motion.div>
          )}

          {/* Step 2: Skills */}
          {step === 2 && (
            <Motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="onboarding-step">
              <div className="step-header">
                <Cpu size={28} className="step-icon" />
                <h2>What do you already know?</h2>
                <p>Select your current skills and proficiency level.</p>
              </div>

              <div className="skills-grid">
                {SKILLS.map(skill => (
                  <div key={skill} className={`skill-card ${selectedSkills[skill] ? 'selected' : ''}`}>
                    <button className="skill-name-btn" onClick={() => toggleSkill(skill)}>
                      {selectedSkills[skill] && <Check size={14} />}
                      {skill}
                    </button>
                    {selectedSkills[skill] && (
                      <div className="proficiency-selector">
                        {PROFICIENCY.map(p => (
                          <button
                            key={p}
                            className={`prof-btn ${selectedSkills[skill] === p ? 'active' : ''}`}
                            onClick={() => setProficiency(skill, p)}
                          >
                            {p[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Motion.div>
          )}

          {/* Step 3: College */}
          {step === 3 && (
            <Motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="onboarding-step">
              <div className="step-header">
                <GraduationCap size={28} className="step-icon" />
                <h2>Your college details</h2>
                <p>Used for college-level leaderboards.</p>
              </div>

              <div className="college-form">
                <div className="input-group">
                  <label className="input-label">College / University Name</label>
                  <input
                    className="input-field"
                    placeholder="e.g., IIT Bombay"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">State</label>
                  <input
                    className="input-field"
                    placeholder="e.g., Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="onboarding-actions">
          {step > 1 && (
            <button className="btn btn-outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft size={18} /> Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 3 ? (
            <button className="btn btn-primary" disabled={!canProceed()} onClick={() => setStep(step + 1)}>
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn btn-primary" disabled={!canProceed() || saving} onClick={handleSubmit}>
              {saving ? (
                <><div className="loading-spinner"></div> Saving...</>
              ) : (
                <><Sparkles size={18} /> Launch Dashboard</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
