import { verifySession, errorResponse } from './auth-session.js';

export default async function handler(event) {
  if (event.httpMethod !== 'DELETE') {
    return new Response('Method not allowed', { status: 405 });
  }

  const session = await verifySession(event);
  if (session.error) return errorResponse(session.error, session.status);

  const { tenantId, supabase } = session;
  const { id } = JSON.parse(event.body);

  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) return errorResponse(error.message, 500);

  return new Response(null, { status: 204 });
}
