import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // Replace with Anon key in .env

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables are missing!");
    return null as any;
  }
  return createSupabaseClient(supabaseUrl, supabaseKey);
};

export const createAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Supabase Admin environment variables are missing!");
    return null as any;
  }
  return createSupabaseClient(supabaseUrl, serviceKey);
};
