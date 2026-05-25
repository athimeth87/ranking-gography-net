import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Cast to string to satisfy TypeScript without returning null
  return createBrowserClient(supabaseUrl as string, supabaseAnonKey as string);
}
