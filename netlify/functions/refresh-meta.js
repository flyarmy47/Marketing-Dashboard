import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function refreshMetaAds(connectionId) {
  const { data: connection } = await supabase
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (!connection) throw new Error('Connection not found');

  const today = new Date().toISOString().split('T')[0];

  // Fetch ad account insights from Meta Marketing API
  const insightsUrl = new URL(`https://graph.facebook.com/v18.0/act_${connection.account_id}/insights`);
  insightsUrl.searchParams.set('access_token', connection.access_token);
  insightsUrl.searchParams.set('fields', 'date_start,impressions,clicks,spend,actions,reach');
  insightsUrl.searchParams.set('time_range', JSON.stringify({
    since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    until: today,
  }));
  insightsUrl.searchParams.set('time_increment', '1'); // Daily breakdown
  insightsUrl.searchParams.set('level', 'account');

  const response = await fetch(insightsUrl);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Meta Ads API error');
  }

  for (const row of data.data || []) {
    const conversions = (row.actions || [])
      .filter((a) => a.action_type === 'offsite_conversion' || a.action_type === 'purchase')
      .reduce((sum, a) => sum + Number(a.value), 0);

    const videoViews = (row.actions || [])
      .filter((a) => a.action_type === 'video_view')
      .reduce((sum, a) => sum + Number(a.value), 0);

    await supabase.from('metrics').upsert(
      {
        tenant_id: connection.tenant_id,
        connection_id: connectionId,
        platform: 'meta_ads',
        date: row.date_start,
        impressions: Number(row.impressions) || 0,
        clicks: Number(row.clicks) || 0,
        spend: Number(row.spend) || 0,
        conversions,
        reach: Number(row.reach) || 0,
        video_views: videoViews,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'connection_id,date' }
    );
  }

  await supabase
    .from('connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', connectionId);

  return { date: today, rowsProcessed: (data.data || []).length };
}
