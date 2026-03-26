import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Award } from 'lucide-react';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, total_points')
        .order('total_points', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      if (data) setLeaders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in max-w-4xl">
      <div className="glass-panel header-banner text-center mb-8">
        <Trophy size={48} color="var(--primary-color)" className="mx-auto mb-4" />
        <h1>Leaderboard</h1>
        <p>See where you stand among the top learners.</p>
      </div>

      <div className="glass-panel no-padding">
        {loading ? (
           <div className="p-6">
              <div className="skeleton" style={{ height: '40px', marginBottom: '10px' }}></div>
              <div className="skeleton" style={{ height: '40px', marginBottom: '10px' }}></div>
              <div className="skeleton" style={{ height: '40px', marginBottom: '10px' }}></div>
           </div>
        ) : leaders.length > 0 ? (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th className="text-right">Total Points</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((leader, index) => (
                <tr key={leader.id} className={index < 3 ? 'top-rank' : ''}>
                  <td className="rank-col">
                    {index === 0 && <span className="rank-badge gold"><Trophy size={16}/> 1</span>}
                    {index === 1 && <span className="rank-badge silver"><Medal size={16}/> 2</span>}
                    {index === 2 && <span className="rank-badge bronze"><Award size={16}/> 3</span>}
                    {index > 2 && <span className="rank-text">{index + 1}</span>}
                  </td>
                  <td className="user-col">
                    <div className="avatar">{leader.username?.[0]?.toUpperCase() || 'S'}</div>
                    <span className="username">{leader.username || 'Anonymous Student'}</span>
                  </td>
                  <td className="points-col text-right">
                    <strong>{leader.total_points}</strong> <span className="text-xs">pts</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-secondary">
            <p>No students on the leaderboard yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
}
