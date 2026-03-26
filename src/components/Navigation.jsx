import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Trophy, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Navigation() {
  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <nav className="navbar glass-panel">
      <div className="container nav-content">
        <div className="nav-brand">
          <span className="brand-dot"></span>
          <span className="brand-text">ahead</span>
        </div>
        
        <div className="nav-links">
          <NavLink to="/" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink to="/leaderboard" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Trophy size={20} />
            <span>Leaderboard</span>
          </NavLink>
        </div>

        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}
