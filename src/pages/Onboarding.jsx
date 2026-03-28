import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Cpu, GraduationCap, Search, Sparkles, Target } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useUi } from '../context/ui-context';
import { supabase } from '../lib/supabase';
import { TELANGANA_COLLEGES, TELANGANA_STATE } from '../lib/telanganaColleges';

const GOALS = [
  { id: 'faang', label: 'Get a Job at FAANG', icon: 'Rocket' },
  { id: 'gate', label: 'Crack GATE', icon: 'Cap' },
  { id: 'startup', label: 'Build a Startup', icon: 'Idea' },
  { id: 'fullstack', label: 'Become a Full Stack Dev', icon: 'Bolt' },
  { id: 'ml', label: 'Master Machine Learning', icon: 'Bot' },
  { id: 'competitive', label: 'Competitive Programming', icon: 'Cup' },
  { id: 'placement', label: 'Crack Campus Placements', icon: 'Target' },
  { id: 'freelance', label: 'Start Freelancing', icon: 'Laptop' },
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
  const { confirm, showToast } = useUi();
  const navigate = useNavigate();
  const collegeDropdownRef = useRef(null);

  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [selectedSkills, setSelectedSkills] = useState({});
  const [college, setCollege] = useState('');
  const [collegeSearch, setCollegeSearch] = useState('');
  const [collegeDropdownOpen, setCollegeDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(event.target)) {
        setCollegeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) => {
      if (prev[skill]) {
        const next = { ...prev };
        delete next[skill];
        return next;
      }

      return { ...prev, [skill]: 'Beginner' };
    });
  };

  const setProficiency = (skill, level) => {
    setSelectedSkills((prev) => ({ ...prev, [skill]: level }));
  };

  const handleCollegeInput = (value) => {
    setCollegeSearch(value);
    setCollegeDropdownOpen(true);

    const exactCollege = TELANGANA_COLLEGES.find(
      (collegeName) => collegeName.toLowerCase() === value.trim().toLowerCase()
    );

    setCollege(exactCollege || '');
  };

  const handleCollegeSelect = (selectedCollege) => {
    setCollege(selectedCollege);
    setCollegeSearch(selectedCollege);
    setCollegeDropdownOpen(false);
  };

  const filteredColleges = TELANGANA_COLLEGES.filter((collegeName) =>
    collegeName.toLowerCase().includes(collegeSearch.trim().toLowerCase())
  );

  const finalGoal = goal === 'custom'
    ? customGoal.trim()
    : GOALS.find((goalOption) => goalOption.id === goal)?.label || '';

  const canProceed = () => {
    if (step === 1) return Boolean(finalGoal);
    if (step === 2) return Object.keys(selectedSkills).length > 0;
    if (step === 3) return Boolean(college);
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
          college,
          state: TELANGANA_STATE,
          onboarded: true,
          avatar_url: user.user_metadata?.avatar_url || null,
          full_name: user.user_metadata?.full_name || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (error) throw error;

      await refreshProfile();
      navigate('/');
    } catch (err) {
      console.error('Onboarding error:', err);
      showToast({
        title: 'Profile save failed',
        description: 'Please try again.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const shouldSignOut = await confirm({
      title: 'Sign out before finishing onboarding?',
      description: 'Your progress on this screen will not be saved.',
      confirmLabel: 'Sign out',
      tone: 'warning',
    });

    if (!shouldSignOut) return;
    await signOut();
  };

  return (
    <div className="onboarding-container">
      <button
        onClick={() => void handleSignOut()}
        className="btn btn-ghost btn-sm"
        style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100 }}
      >
        Sign Out
      </button>

      <div className="onboarding-card glass-panel">
        <div className="onboarding-progress">
          {[1, 2, 3].map((progressStep) => (
            <div
              key={progressStep}
              className={`progress-step ${step >= progressStep ? 'active' : ''} ${step > progressStep ? 'done' : ''}`}
            >
              {step > progressStep ? <Check size={14} /> : progressStep}
            </div>
          ))}
          <div className="progress-line">
            <Motion.div className="progress-fill" animate={{ width: `${((step - 1) / 2) * 100}%` }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <Motion.div
              key="step1"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="onboarding-step"
            >
              <div className="step-header">
                <Target size={28} className="step-icon" />
                <h2>What is your ultimate goal?</h2>
                <p>This helps us personalize your learning roadmap.</p>
              </div>

              <div className="goal-grid">
                {GOALS.map((goalOption) => (
                  <button
                    key={goalOption.id}
                    className={`goal-card ${goal === goalOption.id ? 'selected' : ''}`}
                    onClick={() => { setGoal(goalOption.id); setCustomGoal(''); }}
                  >
                    <span className="goal-emoji">{goalOption.icon}</span>
                    <span className="goal-label">{goalOption.label}</span>
                  </button>
                ))}
                <button
                  className={`goal-card ${goal === 'custom' ? 'selected' : ''}`}
                  onClick={() => setGoal('custom')}
                >
                  <span className="goal-emoji">Spark</span>
                  <span className="goal-label">Something else</span>
                </button>
              </div>

              {goal === 'custom' && (
                <Motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="custom-goal-input">
                  <input
                    className="input-field"
                    placeholder="Describe your goal..."
                    value={customGoal}
                    onChange={(event) => setCustomGoal(event.target.value)}
                    autoFocus
                  />
                </Motion.div>
              )}
            </Motion.div>
          )}

          {step === 2 && (
            <Motion.div
              key="step2"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="onboarding-step"
            >
              <div className="step-header">
                <Cpu size={28} className="step-icon" />
                <h2>What do you already know?</h2>
                <p>Select your current skills and proficiency level.</p>
              </div>

              <div className="skills-grid">
                {SKILLS.map((skill) => (
                  <div key={skill} className={`skill-card ${selectedSkills[skill] ? 'selected' : ''}`}>
                    <button className="skill-name-btn" onClick={() => toggleSkill(skill)}>
                      {selectedSkills[skill] && <Check size={14} />}
                      {skill}
                    </button>
                    {selectedSkills[skill] && (
                      <div className="proficiency-selector">
                        {PROFICIENCY.map((proficiency) => (
                          <button
                            key={proficiency}
                            className={`prof-btn ${selectedSkills[skill] === proficiency ? 'active' : ''}`}
                            onClick={() => setProficiency(skill, proficiency)}
                          >
                            {proficiency[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Motion.div>
          )}

          {step === 3 && (
            <Motion.div
              key="step3"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="onboarding-step"
            >
              <div className="step-header">
                <GraduationCap size={28} className="step-icon" />
                <h2>Your college details</h2>
                <p>College rankings are limited to Telangana campuses for now.</p>
              </div>

              <div className="college-form">
                <div className="input-group">
                  <label className="input-label">State</label>
                  <div className="state-pill">{TELANGANA_STATE}</div>
                </div>

                <div className="input-group" ref={collegeDropdownRef}>
                  <label className="input-label">College</label>
                  <div className="searchable-select">
                    <div className="searchable-select-input">
                      <Search size={16} className="searchable-select-icon" />
                      <input
                        className="input-field searchable-input"
                        placeholder="Search your college..."
                        value={collegeSearch}
                        onChange={(event) => handleCollegeInput(event.target.value)}
                        onFocus={() => setCollegeDropdownOpen(true)}
                      />
                    </div>

                    {collegeDropdownOpen && (
                      <div className="searchable-select-menu">
                        {filteredColleges.length > 0 ? (
                          filteredColleges.map((collegeName) => (
                            <button
                              key={collegeName}
                              type="button"
                              className={`searchable-select-option ${college === collegeName ? 'selected' : ''}`}
                              onMouseDown={() => handleCollegeSelect(collegeName)}
                            >
                              <span>{collegeName}</span>
                              {college === collegeName && <Check size={14} />}
                            </button>
                          ))
                        ) : (
                          <div className="searchable-select-empty">No matching Telangana college found.</div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="college-helper-text">Choose one college from the Telangana list to unlock college rankings.</p>
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

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
