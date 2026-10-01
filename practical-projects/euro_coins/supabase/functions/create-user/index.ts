// Supabase Edge Function: lets an Administrator create a new user without losing their own session.
// Deploy: npx supabase functions deploy create-user --project-ref <project-ref>
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;

  // 1. Check the caller is an Administrator (is_admin() runs as the caller)
  const callerClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: isAdmin, error: roleError } = await callerClient.rpc('is_admin');
  if (roleError || !isAdmin) {
    return json({ code: 'forbidden', message: 'Only administrators can create users.' }, 403);
  }

  // 2. Validate input
  const { email, password, displayName, phone } = await req.json().catch(() => ({}));
  if (!email || !password || !displayName) {
    return json(
      { code: 'validation_failed', message: 'Email, password and display name are required.' },
      400
    );
  }

  // 3. Create the user with the service role key (only available on the server)
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, phone: phone || null },
  });
  if (error) {
    return json({ code: error.code ?? 'unknown', message: error.message }, error.status ?? 400);
  }

  // The on_auth_user_created trigger creates the profile and assigns the Member role
  return json({ id: data.user.id, email: data.user.email }, 201);
});
