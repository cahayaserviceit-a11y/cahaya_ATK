import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bbqfulubxbupdzhanerv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicWZ1bHVieGJ1cGR6aGFuZXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTMyMjIsImV4cCI6MjA4NzIyOTIyMn0.uyZGPOroqpzowzXQGX7-Q9yJVX_axYGsC58Uhy267AU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
