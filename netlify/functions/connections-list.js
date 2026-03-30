import { verifySession, errorResponse, jsonResponse } from './auth-session.js';

export default async function handler(event) {
  const session = await verifySession(event);
  if (session.error) return errorResponse(session.error, session.status);

  const { tenantId, supabase } = session;

  const { data, error } = await supabase
    .from('connections')
    .select('id, platform, account_id, account_name, last_synced_at, created_at')
    .eq('tenant_id', tenantId);

  if (error) return errorResponse(error.message, 500);

  return jsonResponse(data);
}
