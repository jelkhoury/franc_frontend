import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dtrcwhledzzuxpwcuxkc.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0cmN3aGxlZHp6dXhwd2N1eGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTI0NjQsImV4cCI6MjA2ODY2ODQ2NH0.5otxSsEU3zzE2Oci1g4yaSnRWHZgJZI2jzryTWk5QgQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
