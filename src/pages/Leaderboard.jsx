import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { motion as Motion } from 'framer-motion';
import { Trophy, Medal, Award, Search } from 'lucide-react';

const FILTERS = [
  { id: 'college', label: 'My College' },
  { id: 'state', label: 'My State' },
  { id: 'india', label: 'India' },
  { id: 'worldwide', label: 'Worldwide' },
];

export default function Leaderboard() {
  const { user, profile } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('worldwide');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaders = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, total_score, college, state')
        .order('total_score', { ascending: false })
        .limit(50);

      // Apply filters
      if (activeFilter === 'college' && profile?.college) {
        query = query.eq('college', profile.college);
      } else if (activeFilter === 'state' && profile?.state) {
        query = query.eq('state', profile.state);
      }
      // 'india' and 'worldwide' show all (no country field yet, so same for now)

      const { data, error } = await query;
      if (error) throw error;
      if (data) setLeaders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, profile?.college, profile?.state]);

  useEffect(() => {
    void fetchLeaders();
  }, [fetchLeaders]);

  const filteredLeaders = searchQuery
    ? leaders.filter(l =>
        (l.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leaders;

  const getInitials = (leader) => {
    if (leader.full_name) return leader.full_name[0]?.toUpperCase();
    if (leader.username) return leader.username[0]?.toUpperCase();
    return 'S';
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="glass-panel" style={{ textAlign: 'center', marginTop: 40 }}>
        <Trophy size={48} color="var(--primary-color)" style={{ margin: '0 auto 12px' }} />
        <h1>Leaderboard</h1>
        <p>See where you stand among the top learners.</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`filter-tab ${activeFilter === f.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="search-bar glass-panel">
        <Search size={18} color="var(--text-secondary)" />
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            <div className="skeleton" style={{ height: 48, marginBottom: 10 }}></div>
            <div className="skeleton" style={{ height: 48, marginBottom: 10 }}></div>
            <div className="skeleton" style={{ height: 48 }}></div>
          </div>
        ) : filteredLeaders.length > 0 ? (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th className="text-right">Total Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaders.map((leader, index) => (
                <Motion.tr
                  key={leader.id}
                  className={`${index < 3 ? 'top-rank' : ''} ${leader.id === user?.id ? 'current-user-row' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <td className="rank-col">
                    {index === 0 && <span className="rank-badge gold"><Trophy size={16}/> 1</span>}
                    {index === 1 && <span className="rank-badge silver"><Medal size={16}/> 2</span>}
                    {index === 2 && <span className="rank-badge bronze"><Award size={16}/> 3</span>}
                    {index > 2 && <span className="rank-text">{index + 1}</span>}
                  </td>
                  <td className="user-col">
                    {leader.avatar_url ? (
                      <img src={leader.avatar_url} alt="" className="avatar-img" />
                    ) : (
                      <div className="avatar">{getInitials(leader)}</div>
                    )}
                    <div className="user-info">
                      <span className="username">
                        {leader.full_name || leader.username || 'Anonymous Student'}
                        {leader.id === user?.id && <span className="you-badge">You</span>}
                      </span>
                      {leader.college && <span className="user-college">{leader.college}</span>}
                    </div>
                  </td>
                  <td className="score-col text-right">
                    <strong>{leader.total_score}</strong> <span className="text-xs">score</span>
                  </td>
                </Motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>{searchQuery ? 'No students match your search.' : 'No students on the leaderboard yet. Be the first!'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
