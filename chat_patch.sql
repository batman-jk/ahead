-- SUPABASE SQL MIGRATION FOR FRIENDS & CHAT
-- Run this in your Supabase SQL Editor

-- 1. Create friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(sender_id, receiver_id) -- Prevent duplicate requests between same users
);

-- 2. Create friends table (materialized for easy querying)
CREATE TABLE IF NOT EXISTS public.friends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  friend_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, friend_id)
);

-- 3. Create conversations table (1:1 chat rooms)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  participant_2 uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(participant_1, participant_2)
);

-- 4. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  seen boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. Define RLS Policies for friend_requests
-- Users can see requests where they are sender or receiver
CREATE POLICY "Users can view their own friend requests" ON public.friend_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can only insert if they are the sender
CREATE POLICY "Users can send friend requests" ON public.friend_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update requests if they are the receiver (to accept/reject) or sender (to cancel)
CREATE POLICY "Users can update their own friend requests" ON public.friend_requests
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own friend requests" ON public.friend_requests
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 7. Define RLS Policies for friends
-- Users can see their own friend list
CREATE POLICY "Users can view their own friends" ON public.friends
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert friends (handled via trigger ideally, but allowing for app logic)
CREATE POLICY "Users can insert their own friends" ON public.friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own friends
CREATE POLICY "Users can delete their own friends" ON public.friends
  FOR DELETE USING (auth.uid() = user_id);


-- 8. Define RLS Policies for conversations
-- Users can only see conversations they are part of
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can insert conversations they are part of" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);


-- 9. Define RLS Policies for messages
-- Users can only see messages in conversations they are part of
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- Users can insert messages if they are the sender and part of the conversation
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- Users can update messages (to mark as seen) if they are in the conversation and NOT the sender
CREATE POLICY "Users can mark messages as seen" ON public.messages
  FOR UPDATE USING (
    auth.uid() != sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- 10. Enable Realtime triggers for messages
-- In Supabase dashboard, or natively via SQL:
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;

-- 11. Create a function to auto-materialize friends upon request acceptance
CREATE OR REPLACE FUNCTION public.handle_friend_request_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Insert symmetrically for both users
    INSERT INTO public.friends (user_id, friend_id) VALUES (NEW.sender_id, NEW.receiver_id) ON CONFLICT DO NOTHING;
    INSERT INTO public.friends (user_id, friend_id) VALUES (NEW.receiver_id, NEW.sender_id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friend_request_accepted ON public.friend_requests;
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW EXECUTE PROCEDURE public.handle_friend_request_update();

-- 12. Create a function to auto-delete symmetric friend records if one deletes the other
CREATE OR REPLACE FUNCTION public.handle_friend_removed()
RETURNS trigger AS $$
BEGIN
  -- If user A removes user B, also remove user B's link to user A
  DELETE FROM public.friends WHERE user_id = OLD.friend_id AND friend_id = OLD.user_id;
  
  -- Also remove the original friend request record so they can refriend later
  DELETE FROM public.friend_requests 
  WHERE (sender_id = OLD.user_id AND receiver_id = OLD.friend_id)
     OR (sender_id = OLD.friend_id AND receiver_id = OLD.user_id);
     
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friend_deleted ON public.friends;
CREATE TRIGGER on_friend_deleted
  AFTER DELETE ON public.friends
  FOR EACH ROW EXECUTE PROCEDURE public.handle_friend_removed();
