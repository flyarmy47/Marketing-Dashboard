import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(event) {
  const params = new URL(event.rawUrl).searchParams;
  const code = params.get('code');
  const tenantId = params.get('state');
  const frontendBase = process.env.OAUTH_REDIRECT_BASE_URL;

  if (!code || !tenantId) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${frontendBase}/oauth/callback?status=error&error=Missing+code+or+state` },
    });
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.OAUTH_REDIRECT_BASE_URL}/.netlify/functions/oauth-google-ads-callback`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || 'Token exchange failed');
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase.from('connections').upsert(
      {
        tenant_id: tenantId,
        platform: 'google_ads',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
      },
      { onConflict: 'tenant_id,platform' }
    );

    return new Response(null, {
      status: 302,
      headers: { Location: `${frontendBase}/oauth/callback?status=success` },
    });
  } catch (err) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${frontendBase}/oauth/callback?status=error&error=${encodeURIComponent(err.message)}` },
    });
  }
}
