import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://msjzqyhdfohxrhdovjxq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zanpxeWhkZm9oeHJoZG92anhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0ODA2MDcsImV4cCI6MjA4ODA1NjYwN30.kYkX1eze6dDy2qkmog-S6UvM83wbY5kmp9fbyf7W7iE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
