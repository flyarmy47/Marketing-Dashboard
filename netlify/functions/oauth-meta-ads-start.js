import { verifySession, errorResponse } from './auth-session.js';

export default async function handler(event) {
  const session = await verifySession(event);
  if (session.error) return errorResponse(session.error, session.status);

  const { tenantId } = session;

  const params = new URLSearchParams({
    client_id: process.env.META_ADS_APP_ID,
    redirect_uri: `${process.env.OAUTH_REDIRECT_BASE_URL}/.netlify/functions/oauth-meta-ads-callback`,
    scope: 'ads_read,ads_management',
    response_type: 'code',
    state: tenantId,
  });

  return new Response(null, {
    status: 302,
    headers: { Location: `https://www.facebook.com/v18.0/dialog/oauth?${params}` },
  });
}
