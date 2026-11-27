// Template for the Supabase settings, which are not committed.
// Copy this file to environment.ts (used by `ng serve`) and environment.prod.ts (used by
// `ng build`), then fill in the values from Supabase: Project Settings → API Keys.
// anonKey takes the publishable key (sb_publishable_...) or the legacy anon key. Both are public
// by design; access is enforced by row level security. Never put a secret key here.
export const environment = {
  supabase: {
    url: 'https://<project-ref>.supabase.co',
    anonKey: '<anon-public-key>',
  },
};
