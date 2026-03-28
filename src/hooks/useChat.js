import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';

export function useChat(friendId) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Resolve or Create Conversation
  const initConversation = useCallback(async () => {
    if (!user || !friendId) {
      setConversationId(null);
      setMessages([]);
      return null;
    }
    setLoading(true);

    try {
      // Find existing conversation
      const { data: convs, error: fetchErr } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${friendId}),and(participant_1.eq.${friendId},participant_2.eq.${user.id})`)
        .limit(1);

      if (fetchErr) throw fetchErr;

      let cid = null;

      if (convs && convs.length > 0) {
        cid = convs[0].id;
      } else {
        // Create new conversation
        const { data: newConv, error: createErr } = await supabase
          .from('conversations')
          .insert({
            participant_1: user.id,
            participant_2: friendId
          })
          .select()
          .single();

        if (createErr) throw createErr;
        cid = newConv.id;
      }

      setConversationId(cid);

      // Fetch messages
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', cid)
        .order('created_at', { ascending: true });

      if (!msgErr && msgs) {
        setMessages(msgs);
        
        // Mark fetched unseen messages as seen
        const unseenMsgs = msgs.filter(m => !m.seen && m.sender_id !== user.id);
        if (unseenMsgs.length > 0) {
          await supabase
            .from('messages')
            .update({ seen: true })
            .in('id', unseenMsgs.map(m => m.id));
        }
      }

      return cid;
    } catch (err) {
      console.error('Error initializing conversation:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, friendId]);

  // 2. Setup Realtime Subscription
  useEffect(() => {
    let channel;
    
    const setupRealtime = async () => {
      const cid = await initConversation();
      if (!cid) return;

      channel = supabase
        .channel(`chat_${cid}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${cid}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => {
              // Avoid duplicates if we just sent it
              if (prev.find(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            
            // If we receive a message and we are looking at the chat, mark it seen immediately
             if (payload.new.sender_id !== user.id && !payload.new.seen) {
               supabase
                 .from('messages')
                 .update({ seen: true })
                 .eq('id', payload.new.id)
                 .then();
             }
             
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        })
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [initConversation, user]);

  const sendMessage = async (content) => {
    if (!content.trim() || !conversationId || !user) return;
    
    // Optimistic UI insert could go here, but depending on realtime is safer for strict sequences
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim()
      });
      
    if (error) {
      console.error('Error sending message:', error);
    }
  };

  return {
    conversationId,
    messages,
    loading,
    sendMessage
  };
}

/**
 * Hook to fetch top-level history of all active conversations for the Sidebar
 */
export function useChatHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Get all conversations the user is part of
      const { data: convs, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_1,
          participant_2,
          created_at,
          messages (
            id,
            sender_id,
            content,
            seen,
            created_at
          )
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

      if (error) throw error;

      // Manually map to 'friend' details since supabase nested relations with 'or' are tricky
      // We will bulk fetch friend profiles
      if (!convs || convs.length === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      const friendIds = convs.map(c => c.participant_1 === user.id ? c.participant_2 : c.participant_1);
      
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, college')
        .in('id', friendIds);

      if (profErr) throw profErr;

      const profileMap = {};
      profiles.forEach(p => profileMap[p.id] = p);

      const builtHistory = convs.map(c => {
        const friendId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
        const friendProfile = profileMap[friendId];
        
        // Sort messages to find latest
        const sortedMsgs = c.messages.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        const lastMsg = sortedMsgs.length > 0 ? sortedMsgs[0] : null;

        // Unread count
        const unreadCount = sortedMsgs.filter(m => !m.seen && m.sender_id !== user.id).length;

        return {
          conversationId: c.id,
          friend: friendProfile,
          lastMessage: lastMsg,
          unreadCount
        };
      }).filter(c => c.friend); // Only include if friend exists

      // Sort by latest message date
      builtHistory.sort((a,b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : new Date(0).getTime();
        const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : new Date(0).getTime();
        return timeB - timeA;
      });

      setHistory(builtHistory);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
    
    // We can subscribe to all messages where receiver is us to trigger re-fetch
    const channel = supabase.channel('global_messages')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages'
      }, () => {
        fetchHistory(); // naive refetch on any message insert
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchHistory]);

  return { history, loading, fetchHistory };
}
