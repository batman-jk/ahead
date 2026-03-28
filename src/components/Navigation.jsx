import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Trophy, Map, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useUi } from '../context/ui-context';

export default function Navigation() {
  const { user, profile, signOut } = useAuth();
  const { confirm } = useUi();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const avatarUrl = user?.user_metadata?.avatar_url || profile?.avatar_url;
  const displayName = profile?.full_name || user?.user_metadata?.full_name || profile?.username || 'User';

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    const shouldSignOut = await confirm({
      title: 'Sign out now?',
      description: 'You can return by logging in with Google again.',
      confirmLabel: 'Sign out',
      tone: 'warning',
    });

    if (!shouldSignOut) return;
    await signOut();
  };

  return (
    <nav className="navbar glass-panel">
      <div className="container nav-content">
        <div className="nav-brand">
          <span className="brand-dot"></span>
          <span className="brand-text">ahead</span>
        </div>
        
        <div className="nav-links">
          <NavLink to="/" end className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink to="/roadmap" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Map size={18} />
            <span>Roadmap</span>
          </NavLink>

          <NavLink to="/leaderboard" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Trophy size={18} />
            <span>Leaderboard</span>
          </NavLink>
        </div>

        {/* User Avatar + Dropdown */}
        <div className="nav-user" ref={dropdownRef}>
          <button className="nav-avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="nav-avatar-img" />
            ) : (
              <div className="nav-avatar-fallback">
                <User size={16} />
              </div>
            )}
            <ChevronDown size={14} className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="nav-dropdown glass-panel">
              <div className="dropdown-header">
                <span className="dropdown-name">{displayName}</span>
                {profile?.college && <span className="dropdown-college">{profile.college}</span>}
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item danger" onClick={() => void handleLogout()}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
