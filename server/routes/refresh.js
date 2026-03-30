import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

async function refreshGoogleAds(connection) {
  let accessToken = connection.accessToken;

  // Refresh token if expired
  if (connection.refreshToken && connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) < new Date()) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
        refresh_token: connection.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const tokens = await response.json();
    if (!response.ok) throw new Error(tokens.error_description || 'Token refresh failed');

    accessToken = tokens.access_token;
    await prisma.connection.update({
      where: { id: connection.id },
      data: { accessToken, tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000) },
    });
  }

  const query = `
    SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros,
           metrics.conversions, metrics.video_views, campaign_budget.amount_micros
    FROM campaign WHERE segments.date DURING LAST_7_DAYS
  `;

  const response = await fetch(
    `https://googleads.googleapis.com/v14/customers/${connection.accountId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
  const dailyMetrics = {};

  for (const batch of results) {
    for (const row of batch.results || []) {
      const date = row.segments.date;
      if (!dailyMetrics[date]) {
        dailyMetrics[date] = { impressions: 0, clicks: 0, spend: 0, conversions: 0, videoViews: 0, budget: 0 };
      }
      dailyMetrics[date].impressions += Number(row.metrics.impressions) || 0;
      dailyMetrics[date].clicks += Number(row.metrics.clicks) || 0;
      dailyMetrics[date].spend += (Number(row.metrics.costMicros) || 0) / 1_000_000;
      dailyMetrics[date].conversions += Number(row.metrics.conversions) || 0;
      dailyMetrics[date].videoViews += Number(row.metrics.videoViews) || 0;
      dailyMetrics[date].budget += (Number(row.campaignBudget?.amountMicros) || 0) / 1_000_000;
    }
  }

  for (const [date, m] of Object.entries(dailyMetrics)) {
    await prisma.metric.upsert({
      where: { connectionId_date: { connectionId: connection.id, date: new Date(date) } },
      create: { tenantId: connection.tenantId, connectionId: connection.id, platform: 'google_ads', date: new Date(date), ...m },
      update: { ...m },
    });
  }

  await prisma.connection.update({ where: { id: connection.id }, data: { lastSyncedAt: new Date() } });
}

async function refreshMetaAds(connection) {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const insightsUrl = new URL(`https://graph.facebook.com/v18.0/act_${connection.accountId}/insights`);
  insightsUrl.searchParams.set('access_token', connection.accessToken);
  insightsUrl.searchParams.set('fields', 'date_start,impressions,clicks,spend,actions,reach');
  insightsUrl.searchParams.set('time_range', JSON.stringify({ since: weekAgo, until: today }));
  insightsUrl.searchParams.set('time_increment', '1');
  insightsUrl.searchParams.set('level', 'account');

  const response = await fetch(insightsUrl);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'Meta Ads API error');

  for (const row of data.data || []) {
    const conversions = (row.actions || [])
      .filter((a) => a.action_type === 'offsite_conversion' || a.action_type === 'purchase')
      .reduce((sum, a) => sum + Number(a.value), 0);
    const videoViews = (row.actions || [])
      .filter((a) => a.action_type === 'video_view')
      .reduce((sum, a) => sum + Number(a.value), 0);

    await prisma.metric.upsert({
      where: { connectionId_date: { connectionId: connection.id, date: new Date(row.date_start) } },
      create: {
        tenantId: connection.tenantId, connectionId: connection.id, platform: 'meta_ads',
        date: new Date(row.date_start), impressions: Number(row.impressions) || 0,
        clicks: Number(row.clicks) || 0, spend: Number(row.spend) || 0,
        conversions, reach: Number(row.reach) || 0, videoViews,
      },
      update: {
        impressions: Number(row.impressions) || 0, clicks: Number(row.clicks) || 0,
        spend: Number(row.spend) || 0, conversions, reach: Number(row.reach) || 0, videoViews,
      },
    });
  }

  await prisma.connection.update({ where: { id: connection.id }, data: { lastSyncedAt: new Date() } });
}

// Manual refresh trigger (can also be called by Railway cron)
router.post('/trigger', async (req, res) => {
  const connections = await prisma.connection.findMany();
  const results = [];

  for (const conn of connections) {
    try {
      if (conn.platform === 'google_ads') await refreshGoogleAds(conn);
      else if (conn.platform === 'meta_ads') await refreshMetaAds(conn);
      results.push({ id: conn.id, platform: conn.platform, status: 'success' });
    } catch (err) {
      console.error(`Refresh failed for ${conn.platform} (${conn.id}):`, err.message);
      results.push({ id: conn.id, platform: conn.platform, status: 'error', error: err.message });
    }
  }

  res.json({ results });
});

export default router;
