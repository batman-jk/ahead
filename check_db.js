import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afbygwzgotrbcciczpjc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnlnd3pnb3RyYmNjaWN6cGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjUxMjcsImV4cCI6MjA5MDEwMTEyN30.xccSIObpU742jol1uTyZVV23YeHjA8K0Z604MejE7Nw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('Checking Supabase data...');
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  if (pError) console.error('Profiles Error:', pError.message);
  else console.log('Profiles found:', profiles.length, profiles);

  const { data: activities, error: aError } = await supabase.from('activities').select('*', { count: 'exact' }).limit(5);
  if (aError) console.error('Activities Error:', aError.message);
  else console.log('Activities found:', activities.length, activities);
}

checkData();
