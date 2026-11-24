import { createClient } from '@supabase/supabase-js';

// Supabase publishable keys are browser-safe. A deploy can override these defaults
// with VITE_* project variables; never replace this with a secret/service-role key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pfncotwhjrtirftxbfes.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Yz1bGb6yJtKYdk2t978zQQ_VH0MyDl5';

export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;
