import { verifySession, errorResponse, jsonResponse } from './auth-session.js';

export default async function handler(event) {
  const session = await verifySession(event);
  if (session.error) return errorResponse(session.error, session.status);

  const { tenantId, supabase } = session;

  if (event.httpMethod === 'GET') {
    const { data, error } = await supabase
      .from('dashboard_configs')
      .select('tile_config')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return errorResponse(error.message, 500);
    }

    return jsonResponse(data || { tile_config: ['impressions', 'clicks', 'spend', 'conversions', 'ctr', 'cpa', 'roi'] });
  }

  if (event.httpMethod === 'PUT') {
    const { tile_config } = JSON.parse(event.body);

    const { error } = await supabase
      .from('dashboard_configs')
      .upsert(
        { tenant_id: tenantId, tile_config, updated_at: new Date().toISOString() },
        { onConflict: 'tenant_id' }
      );

    if (error) return errorResponse(error.message, 500);

    return jsonResponse({ tile_config });
  }

  return new Response('Method not allowed', { status: 405 });
}
