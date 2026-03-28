import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';

export function useFriends() {
  const { user, profile } = useAuth();
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendsData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch raw data simultaneously
      const [friendsRes, incomingRes, outgoingRes, recentRes] = await Promise.all([
        supabase.from('friends').select('id, friend_id, created_at').eq('user_id', user.id),
        supabase.from('friend_requests').select('id, sender_id, status, created_at').eq('receiver_id', user.id).eq('status', 'pending'),
        supabase.from('friend_requests').select('id, receiver_id, status, created_at').eq('sender_id', user.id).eq('status', 'pending'),
        supabase.from('friend_requests').select('id, sender_id, receiver_id, status, created_at').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(5)
      ]);

      if (friendsRes.error) console.error(friendsRes.error);
      if (incomingRes.error) console.error(incomingRes.error);
      if (outgoingRes.error) console.error(outgoingRes.error);

      const rawFriends = friendsRes.data || [];
      const rawIncoming = incomingRes.data || [];
      const rawOutgoing = outgoingRes.data || [];
      const rawRecent = recentRes.data || [];

      // Extract all unique profile IDs needed
      const uniqueIds = new Set([
        ...rawFriends.map(f => f.friend_id),
        ...rawIncoming.map(r => r.sender_id),
        ...rawOutgoing.map(r => r.receiver_id),
        ...rawRecent.map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id)
      ]);

      // 2. Fetch all required profiles in one batch
      let profileMap = {};
      if (uniqueIds.size > 0) {
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, college, total_score, total_xp')
          .in('id', Array.from(uniqueIds));
          
        if (!profErr && profiles) {
          profiles.forEach(p => { profileMap[p.id] = p; });
        }
      }

      // 3. Merge profiles natively
      setFriends(rawFriends.map(f => ({ ...f, profiles: profileMap[f.friend_id] })).filter(f => f.profiles));
      setIncomingRequests(rawIncoming.map(r => ({ ...r, profiles: profileMap[r.sender_id] })).filter(r => r.profiles));
      setOutgoingRequests(rawOutgoing.map(r => ({ ...r, profiles: profileMap[r.receiver_id] })).filter(r => r.profiles));
      setRecentRequests(rawRecent.map(r => {
        const otherId = r.sender_id === user.id ? r.receiver_id : r.sender_id;
        return { ...r, profiles: profileMap[otherId], isSender: r.sender_id === user.id };
      }).filter(r => r.profiles));

    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFriendsData();
  }, [fetchFriendsData]);

  const searchUsers = async (queryText) => {
    if (!queryText || queryText.length < 2) return [];
    if (!profile?.college) return []; // Fallback safety
    
    // Filter out ourselves, and filter by SAME college as the logged in user
    let query = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, college, total_score, total_xp')
      .neq('id', user.id)
      .eq('college', profile.college)
      .ilike('full_name', `%${queryText}%`)
      .limit(20);

    const { data, error } = await query;
    if (error) {
      console.error('Search error:', error);
      return [];
    }
    
    return data || [];
  };

  const sendRequest = async (receiverId) => {
    const { error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending'
      });
      
    if (!error) await fetchFriendsData();
    return { error };
  };

  const acceptRequest = async (requestId) => {
    const req = incomingRequests.find(r => r.id === requestId);
    if (!req) return { error: { message: "Request not found" }};

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);
      
    if (error) return { error };

    const friendId = req.sender_id;

    // Auto-create conversation if missing
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${friendId}),and(participant_1.eq.${friendId},participant_2.eq.${user.id})`)
      .limit(1);

    if (!existing || existing.length === 0) {
      await supabase.from('conversations').insert({
        participant_1: user.id,
        participant_2: friendId
      });
    }

    await fetchFriendsData();
    return { error: null };
  };

  const rejectRequest = async (requestId) => {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);
      
    if (!error) await fetchFriendsData();
    return { error };
  };

  const cancelRequest = async (requestId) => {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);
      
    if (!error) await fetchFriendsData();
    return { error };
  };

  const removeFriend = async (friendId) => {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('user_id', user.id)
      .eq('friend_id', friendId);
      
    if (!error) await fetchFriendsData();
    return { error };
  };

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    recentRequests,
    loading,
    refresh: fetchFriendsData,
    searchUsers,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend
  };
}
