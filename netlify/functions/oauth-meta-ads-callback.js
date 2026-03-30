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
    // Exchange code for short-lived token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', process.env.META_ADS_APP_ID);
    tokenUrl.searchParams.set('client_secret', process.env.META_ADS_APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri', `${process.env.OAUTH_REDIRECT_BASE_URL}/.netlify/functions/oauth-meta-ads-callback`);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl);
    const shortLivedTokens = await tokenResponse.json();

    if (shortLivedTokens.error) {
      throw new Error(shortLivedTokens.error.message || 'Token exchange failed');
    }

    // Exchange short-lived for long-lived token
    const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', process.env.META_ADS_APP_ID);
    longLivedUrl.searchParams.set('client_secret', process.env.META_ADS_APP_SECRET);
    longLivedUrl.searchParams.set('fb_exchange_token', shortLivedTokens.access_token);

    const longLivedResponse = await fetch(longLivedUrl);
    const longLivedTokens = await longLivedResponse.json();

    const accessToken = longLivedTokens.access_token || shortLivedTokens.access_token;
    const expiresIn = longLivedTokens.expires_in || 5184000; // default 60 days
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await supabase.from('connections').upsert(
      {
        tenant_id: tenantId,
        platform: 'meta_ads',
        access_token: accessToken,
        refresh_token: null,
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
