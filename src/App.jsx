import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { saveUserData, getUserData, updateUserData } from './firebaseService';

// Icons
const IconDashboard = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>;
const IconSkills = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const IconVerify = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>;
const IconRoadmap = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconSocial = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>;
const IconArrowRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

// --- SIMULATED AI ENGINE ---
// This acts dynamically to generate robust realistic content based on user inputs without hardcoded arrays.
const generateMockAIResponse = (goalStr, skillsStr) => {
  const goal = goalStr.toLowerCase();
  const skillsList = skillsStr.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  
  // Base deterministic hash
  const scoreBase = goal.length * 10 + skillsList.length * 50;
  
  // Generate Skill DNA dynamically based on input
  const generatedDNA = [
    {
      category: 'Core Competency',
      skills: skillsList.slice(0, 3).map((s, i) => ({ name: s.toUpperCase(), level: Math.max(2, 5 - i), verified: i === 0 }))
    },
    {
      category: goalStr.split(' ')[0] + ' Domain',
      skills: [
        { name: 'Architecture design', level: 2, verified: false },
        { name: 'Optimization & Scaling', level: 1, verified: false },
        { name: 'Best Practices', level: 3, verified: true }
      ]
    },
    {
      category: 'Foundation',
      skills: [
        { name: 'Problem Solving', level: 4, verified: true },
        { name: 'Communication', level: 3, verified: false }
      ]
    }
  ].filter(g => g.skills.length > 0);

  // Generate Roadmap dynamically
  const generatedRoadmap = [
    { title: `Foundations of ${goalStr}`, status: 'Completed', active: false, resources: [] },
    { title: `Mastering ${skillsList[0] || 'Core'} within ${goalStr}`, status: 'In Progress', active: true, 
      resources: [
        { name: `Advanced ${skillsList[0] || 'Techniques'} Guide`, type: 'Documentation' },
        { name: `Building ${goalStr} scale applications`, type: 'Interactive Course' }
      ]
    },
    { title: `Advanced Optimization & Tradeoffs`, status: 'Locked', active: false, resources: [
      { name: `System Design for ${goalStr}`, type: 'Book' }
    ]},
    { title: 'Mock Interviews & Negotiation', status: 'Locked', active: false, resources: [] }
  ];

  // Generate verifications
  const generatedVerifications = [
    { id: 1, name: skillsList[1] ? `Advanced ${skillsList[1].toUpperCase()}` : 'System Architecture', type: 'Core Skill', reward: `+${Math.floor(Math.random() * 100 + 50)} pts` },
    { id: 2, name: `${goalStr} Domain Knowledge`, type: 'Specialization', reward: `+${Math.floor(Math.random() * 200 + 100)} pts` }
  ];

  return {
    aheadScore: 1200 + scoreBase + Math.floor(Math.random() * 100),
    dna: generatedDNA,
    roadmap: generatedRoadmap,
    verifications: generatedVerifications,
    dailyGoal: `Solve 2 ${goalStr} related architecture problems`,
  };
};

const Toast = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="animate-slide-up" style={{
      position: 'fixed', bottom: '2rem', right: '2rem',
      background: 'var(--text-main)', color: 'var(--bg-dark)',
      padding: '1rem 1.5rem', borderRadius: '8px', zIndex: 100,
      fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem',
      boxShadow: '0 4px 12px rgba(255,255,255,0.1)'
    }}>
      <div style={{ background: 'var(--bg-dark)', color: 'var(--text-main)', borderRadius: '50%', padding: '0.2rem' }}>
        <IconCheck />
      </div>
      {message}
      <button onClick={onClose} style={{
        background: 'transparent', border: 'none', color: 'var(--bg-dark)', opacity: 0.7,
        marginLeft: '1rem', cursor: 'pointer', fontWeight: 'bold'
      }}>✕</button>
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab, userProfile, onSignOut }) => (
  <aside className="sidebar">
    <div className="logo">
      <span>.</span>ahead
    </div>
    
    <nav style={{ flex: 1 }}>
      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: '1rem', marginLeft: '1rem' }}>Menu</div>
      {[
        { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
        { id: 'skills', label: 'Skill DNA', icon: IconSkills },
        { id: 'verify', label: 'Verification', icon: IconVerify },
        { id: 'roadmap', label: 'AI Roadmap', icon: IconRoadmap },
        { id: 'network', label: 'Network', icon: IconSocial },
      ].map(item => (
        <div 
          key={item.id}
          className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
        >
          <item.icon /> {item.label}
        </div>
      ))}
    </nav>
    
    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginTop: 'auto', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', fontWeight: 'bold', color: '#000', fontSize: '0.8rem' }}>
          {userProfile?.name ? userProfile.name[0].toUpperCase() : 'U'}
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>{userProfile?.name || 'User'}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pro Member</div>
        </div>
      </div>
      <button 
        onClick={onSignOut} 
        className="btn-secondary" 
        style={{ width: '100%', marginTop: '1rem', fontSize: '0.75rem', padding: '0.4rem', justifyContent: 'center' }}
      >
        Sign Out
      </button>
    </div>
  </aside>
);

const Dashboard = ({ setActiveTab, showToast, userState }) => {
  const { userProfile, aiData } = userState;
  const currPhaseIndex = aiData.roadmap.findIndex(r => r.active) || 0;
  const currPhase = aiData.roadmap[currPhaseIndex];

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header className="animate-slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <div className="glass-pill" style={{ marginBottom: '1rem' }}>
            <span style={{ color: '#fff' }}>●</span> AI Analysis Complete
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Hello, {userProfile.name}.</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Your knowledge profile is compounding.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Goal Alignment</div>
          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{userProfile.goal}</div>
        </div>
      </header>

      <section className="score-hero animate-slide-up delay-1" style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ahead Score</div>
            <div className="huge-score">{aiData.aheadScore.toLocaleString()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                +{(aiData.aheadScore * 0.05).toFixed(0)} this week
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Top 4% in cohort</div>
            </div>
          </div>
          
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div className="glass-pill" style={{ background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.3)', color: '#fff' }}>
              12x Learning Velocity
            </div>
            <div className="glass-pill">
              31-Day Streak ⚪
            </div>
          </div>
        </div>
      </section>

      <section className="grid-bento animate-slide-up delay-2">
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Roadmap Phase</div>
            <span style={{ fontSize: '0.75rem', color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Phase {currPhaseIndex + 1}/{aiData.roadmap.length}</span>
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{currPhase?.title || 'Up Next'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', flex: 1 }}>
            Focus on mastering this domain to align closer with your {userProfile.goal} goal.
          </p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '30%' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            <span>30% Completed</span>
            <span>Est. 2 Weeks Left</span>
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveTab('roadmap')}>
            View Roadmap <IconArrowRight />
          </button>
        </div>

        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Action Recommended</div>
            <IconVerify />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Unverified Claims</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1rem' }}>
            {aiData.verifications.length > 0 
              ? `You claimed proficiency in ${aiData.verifications[0].name}, but it is unverified. Verify now to unlock score weight.`
              : 'All set! No pending verifications.'}
          </p>
          {aiData.verifications[0] && (
            <div style={{ background: '#050505', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#fff', fontWeight: '600' }}>{aiData.verifications[0].name}</span>
                <span style={{ fontSize: '0.7rem', color: '#ccc', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Unverified</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Potential Score</span>
                <span style={{ color: '#fff' }}>{aiData.verifications[0].reward}</span>
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => showToast('AI Quiz started in new tab!')}>Take AI Quiz (1x)</button>
            <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => showToast('Vercel link submitted successfully.')}>Submit Vercel (1.4x)</button>
          </div>
        </div>

        <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Daily Micro-Goal</div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ flex: '0 0 auto', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', placeItems: 'center', justifyContent: 'center', border: '2px solid var(--border)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{aiData.dailyGoal}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Curated by AI based on your active roadmap phase.</p>
            </div>
            <div>
              <button className="btn-primary" onClick={() => showToast('Redirecting to problems...')}>View Task</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const SkillsView = ({ showToast, userState, setUserState }) => {
  const { aiData } = userState;
  
  const addSkill = () => {
    showToast('AI extracting skills from your GitHub & Resume...');
    setTimeout(() => {
      const newAiData = {...aiData};
      newAiData.dna[1].skills.push({ name: 'Newly Extracted Skill', level: 2, verified: false });
      setUserState({...userState, aiData: newAiData});
      showToast('Skill DNA updated organically via extraction!');
    }, 1500);
  };

  return (
    <div className="animate-slide-up" style={{ padding: '2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Skill DNA</h1>
          <p style={{ color: 'var(--text-muted)' }}>A complete AI-mapped topology of your verified and unverified competencies.</p>
        </div>
        <button className="btn-primary" onClick={addSkill}><IconPlus /> Sync GitHub</button>
      </header>
      
      <div className="dna-grid">
        {aiData.dna.map((group, i) => (
          <div key={i} className="dna-category animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="dna-category-header">
              <h3 style={{ fontSize: '1.2rem', margin: 0, textTransform: 'capitalize' }}>{group.category}</h3>
            </div>
            {group.skills.map((skill, j) => (
              <div key={j} className="dna-skill-item">
                <span style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{skill.name}</span>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {skill.verified ? 
                     <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-dim)' }}>✓ Verified</span> 
                     : null}
                  <div className="dna-skill-level">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={level} className={`dna-node ${level <= skill.level ? 'filled' : ''}`} title={`Level ${skill.level}/5`}></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const VerifyView = ({ showToast, userState, setUserState }) => {
  const [items, setItems] = useState(userState.aiData.verifications || []);

  const handleVerify = (id) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    
    // update root state
    const newAiData = {...userState.aiData, verifications: updated};
    setUserState({...userState, aiData: newAiData});
    
    showToast('AI verification initiated! Validating your proof-of-work in the background.');
  };

  return (
    <div className="animate-slide-up" style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Verification Center</h1>
        <p style={{ color: 'var(--text-muted)' }}>Turn unverified declarations from your Skill DNA into validated proof-of-work to increase your score.</p>
      </header>
      
      {items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>AI says you're all caught up! No discrepancies pending.</p>
        </div>
      ) : (
        <div className="grid-bento">
          {items.map(item => (
            <div key={item.id} className="glass-panel">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{item.type}</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{item.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Reward</span>
                <span style={{ fontWeight: '600', color: '#fff' }}>{item.reward}</span>
              </div>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleVerify(item.id)}>AI Validation Flow</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RoadmapView = ({ showToast, userState, setUserState }) => {
  const [goal, setGoal] = useState(userState.userProfile.goal);
  const [isGenerating, setIsGenerating] = useState(false);
  const { aiData } = userState;

  const handleGenerate = () => {
    setIsGenerating(true);
    showToast(`AI Analyzing Skill DNA against new goal: ${goal}...`);
    
    setTimeout(() => {
      // Regenerate based on new goal and current skills
      const newResponse = generateMockAIResponse(goal, userState.userProfile.skills);
      
      setUserState(prev => ({
        ...prev,
        userProfile: { ...prev.userProfile, goal },
        aiData: { ...prev.aiData, roadmap: newResponse.roadmap }
      }));
      
      setIsGenerating(false);
      showToast('Roadmap uniquely tailored to you!');
    }, 2000);
  };

  return (
    <div className="animate-slide-up" style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Dynamic AI Roadmap</h1>
        <p style={{ color: 'var(--text-muted)' }}>Hyper-personalized curicullum generated specifically for your unique <strong>Skill DNA</strong>.</p>
      </header>

      <div className="ai-suggestion-box">
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Target Role / Goal</div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', color: '#fff', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
          />
          <button className="btn-primary" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'AI Architecting...' : 'Regenerate Path'}
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <div className="roadmap-timeline">
          {aiData.roadmap.map((phase, i) => (
            <div key={i} className={`roadmap-step ${phase.status === 'Completed' ? 'completed' : ''} ${phase.active ? 'active' : ''}`}>
              <div style={{ color: phase.active ? '#fff' : (phase.status === 'Completed' ? 'var(--text-dim)' : 'var(--text-muted)'), fontWeight: '600', fontSize: '1.2rem', marginBottom: '0.25rem' }}>Phase {i + 1}: {phase.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: phase.resources ? '1rem' : 0 }}>{phase.status}</div>
              
              {phase.resources && phase.resources.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {phase.resources.map((res, j) => (
                    <div key={j} className="resource-card" onClick={() => showToast(`AI fetching resource material: ${res.name}`)}>
                      <div className="resource-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: '#fff' }}>{res.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.type} Suggested by AI Analytics</div>
                      </div>
                    </div>
                  ))}
                  {phase.active && (
                    <button className="btn-secondary" style={{ marginTop: '1rem', width: 'max-content' }} onClick={() => showToast('Module started.')}>Start Action Items</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const NetworkView = ({ showToast, userState }) => {
  const peeps = [
    { name: 'Sarah J.', overlap: '85% Skill Overlap mapped by AI' },
    { name: 'David M.', overlap: `Pursuing ${userState.userProfile.goal}` },
  ];

  return (
    <div className="animate-slide-up" style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Topology Network</h1>
          <p style={{ color: 'var(--text-muted)' }}>AI-recommended peers algorithmically matched to your journey.</p>
        </div>
        <button className="btn-secondary" onClick={() => showToast('Invite link copied to clipboard!')}>Invite Peers</button>
      </header>

      <div className="grid-bento">
        {peeps.map((p, i) => (
          <div key={i} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--border)', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>{p.name[0]}</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>{p.name}</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.overlap}</p>
            </div>
            <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => showToast(`Encrypted message tunnel opened to ${p.name}`)}>Message</button>
          </div>
        ))}
      </div>
    </div>
  );
};


// --- ENTRY ANIMATION ---
const EntryAnimation = ({ onComplete }) => {
  const [phase, setPhase] = useState(0); // 0: "Stay ahead", 1: "[↑] ahead", 2: done
  const phaseRef = useRef(0);
  const scrollLocked = useRef(false);

  useEffect(() => {
    const handleWheel = (e) => {
      if (scrollLocked.current || phaseRef.current >= 2) return;
      
      // Only progress on scroll down
      if (e.deltaY <= 0) return;

      scrollLocked.current = true;
      const next = phaseRef.current + 1;
      phaseRef.current = next;
      setPhase(next);

      if (next >= 2) {
        setTimeout(onComplete, 800);
      }

      setTimeout(() => { scrollLocked.current = false; }, 800);
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e) => {
      if (scrollLocked.current || phaseRef.current >= 2) return;
      const deltaY = touchStartY - e.changedTouches[0].clientY;
      if (deltaY < 30) return; // needs a meaningful swipe up
      scrollLocked.current = true;
      const next = phaseRef.current + 1;
      phaseRef.current = next;
      setPhase(next);
      if (next >= 2) setTimeout(onComplete, 800);
      setTimeout(() => { scrollLocked.current = false; }, 800);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onComplete]);

  // Fully unmount after fade-out
  if (phase >= 2) {
    return (
      <div className="entry-animation-container hidden" />
    );
  }

  return (
    <div className="entry-animation-container">
      <div className={`entry-slide ${phase === 0 ? 'active' : 'exit'}`}>
        Stay ahead
      </div>
      <div className={`entry-slide ${phase === 1 ? 'active' : ''}`}>
        <div className="entry-icon">↑</div> ahead
      </div>
    </div>
  );
};

// --- ONBOARDING VIEWS ---
const Onboarding = ({ onComplete, user }) => {
  const [step, setStep] = useState(0); // 0: Start, 1: Details, 2: Goal, 3: Skills, 4: AI Analysis Loading
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    education: '',
    goal: '',
    skills: ''
  });
  const [analysisText, setAnalysisText] = useState('');

  const nextStep = () => setStep(step + 1);
  const handleInput = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  useEffect(() => {
    if (step === 4) {
      // Simulate AI loading process
      let timeouts = [];
      const texts = [
        "Connecting to AI Engine...",
        "Parsing raw skill inputs...",
        "Constructing Skill DNA Matrix based on domain knowledge...",
        "Evaluating systemic gaps in current competency profile...",
        "Aligning trajectory against target goal: " + formData.goal + "...",
        "Compiling personalized phase milestones...",
        "Finalizing Ahead Score topology...",
        "Success. Your unique dashboard is ready."
      ];
      
      texts.forEach((text, idx) => {
        timeouts.push(setTimeout(() => {
          setAnalysisText(text);
          if (idx === texts.length - 1) {
            setTimeout(() => {
              // Complete onboarding and pass generated data
              const finalAI = generateMockAIResponse(formData.goal, formData.skills);
              onComplete(formData, finalAI);
            }, 1500);
          }
        }, idx * 1200));
      });

      return () => timeouts.forEach(clearTimeout);
    }
  }, [step]);

  return (
    <div className="onboarding-container">
      <div className="logo" style={{ marginBottom: '2rem' }}><span>.</span>ahead</div>
      
      <div className="onboarding-box animate-slide-up">
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome to a new paradigm.</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
              We don't use generalized paths here. Our AI maps out your exact Skill DNA and curates a hyper-personalized roadmap.
            </p>
            <button className="btn-primary" onClick={nextStep} style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>Initiate Initialization</button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Who are you?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Establishing baseline context.</p>
            
            <input name="name" placeholder="Your Name" value={formData.name} onChange={handleInput} className="input-pure" />
            <input name="email" placeholder="Email Address" value={formData.email} onChange={handleInput} className="input-pure" />
            <input name="education" placeholder="Current Education / Job Title (e.g. BTech CS / Junior Dev)" value={formData.education} onChange={handleInput} className="input-pure" />
            
            <button className="btn-primary" onClick={nextStep} style={{ width: '100%', justifyContent: 'center' }} disabled={!formData.name}>Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Define your target vector.</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>What is the singular career or learning objective the AI should optimize for?</p>
            
            <input name="goal" placeholder="e.g. FAANG Software Engineer, Lead iOS Dev, Product Manager..." value={formData.goal} onChange={handleInput} className="input-pure" />
            
            <button className="btn-primary" onClick={nextStep} style={{ width: '100%', justifyContent: 'center' }} disabled={!formData.goal}>Lock Objective</button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Declare your competencies.</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Dump everything you know. Languages, frameworks, tools, soft skills, architectural patterns. The AI will parse, categorize, and build your initial <strong>Skill DNA</strong>.
            </p>
            
            <textarea 
              name="skills" 
              placeholder="e.g. React, Node.js, Python, System Design basics, AWS EC2, Git, communication..." 
              value={formData.skills} 
              onChange={handleInput} 
              className="textarea-pure"
            ></textarea>
            
            <button className="btn-primary" onClick={nextStep} style={{ width: '100%', justifyContent: 'center' }} disabled={!formData.skills}>Initialize AI Analysis</button>
          </div>
        )}

        {step === 4 && (
          <div className="animate-slide-up" style={{ textAlign: 'center', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" strokeWidth="2" style={{ animation: 'pulseGlow 2s infinite', margin: '0 auto 1.5rem' }}>
              <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
            </svg>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {analysisText}<span className="ai-typing-cursor"></span>
            </div>
            <div className="progress-track" style={{ marginTop: '2rem', background: 'transparent', border: '1px solid var(--border)' }}>
              <div className="progress-fill" style={{ width: '100%', transition: 'width 8s linear' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// --- AUTHENTICATION VIEW ---
const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      const msg = error.code === 'auth/email-already-in-use' ? 'This email is already registered. Try signing in.'
        : error.code === 'auth/invalid-credential' ? 'Invalid email or password.'
        : error.code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
        : error.code === 'auth/invalid-email' ? 'Please enter a valid email address.'
        : error.message;
      setMessage(msg);
    }
    setLoading(false);
  };

  return (
    <div className="onboarding-container">
      <div className="logo" style={{ marginBottom: '2rem' }}><span>.</span>ahead</div>
      
      <div className="onboarding-box animate-slide-up">
        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{isSignUp ? 'Create your account' : 'Welcome back'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              {isSignUp ? 'Sign up to start your personalized AI-powered journey.' : 'Sign in to continue your journey.'}
            </p>
            
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="input-pure" 
            />
            <input 
              type="password" 
              placeholder="Password (min 6 characters)" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="input-pure" 
            />
            
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} 
              disabled={loading}
            >
              {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
            
            {message && <p style={{ marginTop: '1.5rem', color: '#ff6b6b', fontSize: '0.9rem' }}>{message}</p>}
            
            <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <span 
                onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }} 
                style={{ color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showEntry, setShowEntry] = useState(true);

  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [firestoreLoading, setFirestoreLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toastMsg, setToastMsg] = useState(null);
  
  const [userState, setUserState] = useState({
    userProfile: null,
    aiData: null
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in — try to load their data
        setFirestoreLoading(true);
        try {
          // First check localStorage cache for instant load
          const cached = localStorage.getItem('ahead_user_state');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.userProfile && parsed.aiData) {
              setUserState(parsed);
              setHasOnboarded(true);
            }
          }

          // Then verify with Firestore (source of truth)
          const data = await getUserData(firebaseUser.uid);
          if (data && data.aiData) {
            const firestoreState = {
              userProfile: {
                name: data.name,
                email: data.email,
                education: data.education,
                goal: data.goal,
                skills: data.skills
              },
              aiData: data.aiData
            };
            setUserState(firestoreState);
            setHasOnboarded(true);
            localStorage.setItem('ahead_user_state', JSON.stringify(firestoreState));
          }
        } catch (err) {
          console.error('Error loading user data:', err);
        }
        setFirestoreLoading(false);
        setShowEntry(false); // Skip entry animation for returning users
      } else {
        // User signed out
        setHasOnboarded(false);
        setUserState({ userProfile: null, aiData: null });
      }
      
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync userState changes to both localStorage and Firestore
  useEffect(() => {
    if (userState.userProfile && userState.aiData && user) {
      localStorage.setItem('ahead_user_state', JSON.stringify(userState));
      updateUserData(user.uid, { aiData: userState.aiData }).catch(console.error);
    }
  }, [userState]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOnboardingComplete = async (profileData, generatedAI) => {
    const newState = {
      userProfile: profileData,
      aiData: generatedAI
    };
    setUserState(newState);
    setHasOnboarded(true);

    // Persist to Firestore
    if (user) {
      try {
        await saveUserData(user.uid, profileData, generatedAI);
      } catch (err) {
        console.error('Error saving to Firestore:', err);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('ahead_user_state');
      setShowEntry(true);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="onboarding-container" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="logo" style={{ animation: 'pulseGlow 2s infinite' }}><span>.</span>ahead</div>
      </div>
    );
  }

  // Entry animation for first-time / signed-out visitors
  if (showEntry && !user) {
    return <EntryAnimation onComplete={() => setShowEntry(false)} />;
  }

  // Not signed in → show Auth
  if (!user) {
    return <Auth />;
  }

  // Signed in but loading Firestore data
  if (firestoreLoading) {
    return (
      <div className="onboarding-container" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="logo" style={{ animation: 'pulseGlow 2s infinite' }}><span>.</span>ahead</div>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Loading your profile...</p>
      </div>
    );
  }

  // Signed in but hasn't onboarded yet
  if (!hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} user={user} />;
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userState.userProfile} onSignOut={handleSignOut} />
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} showToast={showToast} userState={userState} />}
        {activeTab === 'skills' && <SkillsView showToast={showToast} userState={userState} setUserState={setUserState} />}
        {activeTab === 'verify' && <VerifyView showToast={showToast} userState={userState} setUserState={setUserState} />}
        {activeTab === 'roadmap' && <RoadmapView showToast={showToast} userState={userState} setUserState={setUserState} />}
        {activeTab === 'network' && <NetworkView showToast={showToast} userState={userState} />}
      </main>
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
    </div>
  );
}
