import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // Replace with Anon key in .env

export const createClient = () => {
  return createSupabaseClient(
    supabaseUrl!,
    supabaseKey!
  );
};

export const createAdminClient = () => {
  return createSupabaseClient(
    supabaseUrl!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};
