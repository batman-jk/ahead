import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afbygwzgotrbcciczpjc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnlnd3pnb3RyYmNjaWN6cGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjUxMjcsImV4cCI6MjA5MDEwMTEyN30.xccSIObpU742jol1uTyZVV23YeHjA8K0Z604MejE7Nw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase client ready:', Boolean(supabase));

async function checkTrigger() {
  // We can't directly check triggers via anon key usually unless we use an RPC
  // But we can try to call a dummy insert and see if score increase? 
  // No, we don't have a user session for insert.
  
  // Let's try to read common postgres schema info if possible via RPC (unlikely)
  // Instead, let's look at the setup.sql again.
  console.log('Verifying setup.sql logic...');
}

checkTrigger();
