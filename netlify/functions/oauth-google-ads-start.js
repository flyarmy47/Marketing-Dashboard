import { verifySession, errorResponse } from './auth-session.js';

export default async function handler(event) {
  const session = await verifySession(event);
  if (session.error) return errorResponse(session.error, session.status);

  const { tenantId } = session;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    redirect_uri: `${process.env.OAUTH_REDIRECT_BASE_URL}/.netlify/functions/oauth-google-ads-callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/adwords',
    access_type: 'offline',
    prompt: 'consent',
    state: tenantId,
  });

  return new Response(null, {
    status: 302,
    headers: { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` },
  });
}
