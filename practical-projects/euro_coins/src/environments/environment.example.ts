// Template for the Supabase settings, which are not committed.
// Copy this file to environment.ts (used by `ng serve`) and environment.prod.ts (used by
// `ng build`), then fill in the values from Supabase: Project Settings → API.
// The anon key is public by design; access is enforced by row level security.
export const environment = {
  supabase: {
    url: 'https://<project-ref>.supabase.co',
    anonKey: '<anon-public-key>',
  },
};
