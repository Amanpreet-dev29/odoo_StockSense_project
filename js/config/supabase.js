import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const supabaseConfig = {
  url: "https://uwmeychojadjdqwxaipb.supabase.co",
  anonKey: "sb_publishable_U8KmUTV_E4IPtuOhNXwFNg_m7bX9Iy0"
};

export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
);

export function isSupabaseConfigured() {
  return Boolean(
    supabaseConfig.url &&
    supabaseConfig.anonKey
  );
}