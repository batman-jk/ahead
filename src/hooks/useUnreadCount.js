import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';

export function useUnreadCount() {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!user) return;

    // 1. Fetch pending requests where the user is the receiver
    const { count: requestsCount } = await supabase
      .from('friend_requests')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (requestsCount !== null) {
      setPendingRequests(requestsCount);
    }

    // 2. Fetch unread messages
    // We need messages sent to conversation_ids the user is part of, where sender_id != user.id and seen = false
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

    if (convs && convs.length > 0) {
      const cids = convs.map(c => c.id);
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', cids)
        .neq('sender_id', user.id)
        .eq('seen', false);

      if (msgCount !== null) {
        setUnreadMessages(msgCount);
      }
    } else {
      setUnreadMessages(0);
    }
  }, [user]);

  useEffect(() => {
    fetchCounts();

    if (!user) return;

    // Subscribe to incoming friend requests
    const requestSub = supabase.channel('global_requests')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${user.id}`
      }, () => {
        fetchCounts();
      })
      .subscribe();

    // Subscribe to incoming messages globally
    const msgSub = supabase.channel('global_unread')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'messages'
      }, (payload) => {
        // Since we can't filter postgres_changes by "IN array" natively for an unknown conversation array,
        // we just refetch counts when ANY message changes if it's sent to us or seen changes.
        // It's a bit heavy but works for a prototype.
        fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(requestSub);
      supabase.removeChannel(msgSub);
    };
  }, [fetchCounts, user]);

  return {
    unreadMessages,
    pendingRequests,
    refreshCounts: fetchCounts
  };
}
