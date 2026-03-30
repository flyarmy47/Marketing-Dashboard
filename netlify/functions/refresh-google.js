import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function refreshAccessToken(connection) {
  if (!connection.refresh_token) return connection.access_token;

  const now = new Date();
  if (connection.token_expires_at && new Date(connection.token_expires_at) > now) {
    return connection.access_token;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const tokens = await response.json();
  if (!response.ok) throw new Error(tokens.error_description || 'Token refresh failed');

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase
    .from('connections')
    .update({ access_token: tokens.access_token, token_expires_at: expiresAt })
    .eq('id', connection.id);

  return tokens.access_token;
}

export async function refreshGoogleAds(connectionId) {
  const { data: connection } = await supabase
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (!connection) throw new Error('Connection not found');

  const accessToken = await refreshAccessToken(connection);
  const today = new Date().toISOString().split('T')[0];

  // Query Google Ads API for campaign metrics
  const query = `
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.video_views,
      campaign_budget.amount_micros
    FROM campaign
    WHERE segments.date DURING LAST_7_DAYS
  `;

  const response = await fetch(
    `https://googleads.googleapis.com/v14/customers/${connection.account_id}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Google Ads API error');
  }

  const results = await response.json();

  // Aggregate by date and upsert
  const dailyMetrics = {};

  for (const batch of results) {
    for (const row of batch.results || []) {
      const date = row.segments.date;
      if (!dailyMetrics[date]) {
        dailyMetrics[date] = { impressions: 0, clicks: 0, spend: 0, conversions: 0, video_views: 0, budget: 0 };
      }
      dailyMetrics[date].impressions += Number(row.metrics.impressions) || 0;
      dailyMetrics[date].clicks += Number(row.metrics.clicks) || 0;
      dailyMetrics[date].spend += (Number(row.metrics.costMicros) || 0) / 1_000_000;
      dailyMetrics[date].conversions += Number(row.metrics.conversions) || 0;
      dailyMetrics[date].video_views += Number(row.metrics.videoViews) || 0;
      dailyMetrics[date].budget += (Number(row.campaignBudget?.amountMicros) || 0) / 1_000_000;
    }
  }

  for (const [date, metrics] of Object.entries(dailyMetrics)) {
    await supabase.from('metrics').upsert(
      {
        tenant_id: connection.tenant_id,
        connection_id: connectionId,
        platform: 'google_ads',
        date,
        ...metrics,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'connection_id,date' }
    );
  }

  await supabase
    .from('connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', connectionId);

  return { date: today, rowsProcessed: Object.keys(dailyMetrics).length };
}
