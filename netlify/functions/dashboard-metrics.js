import { verifySession, errorResponse, jsonResponse } from './auth-session.js';
import { differenceInDays, subDays, format } from 'date-fns';

function computeDerived(raw) {
  const impressions = Number(raw.impressions) || 0;
  const clicks = Number(raw.clicks) || 0;
  const spend = Number(raw.spend) || 0;
  const conversions = Number(raw.conversions) || 0;
  const reach = Number(raw.reach) || 0;

  return {
    impressions,
    clicks,
    spend,
    conversions,
    reach,
    video_views: Number(raw.video_views) || 0,
    budget: Number(raw.budget) || 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpa: conversions > 0 ? spend / conversions : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    roi: spend > 0 ? ((conversions * 50 - spend) / spend) * 100 : 0, // Assumes $50 avg conversion value
    frequency: reach > 0 ? impressions / reach : 0,
  };
}

export default async function handler(event) {
  const session = await verifySession(event);
  if (session.error) return errorResponse(session.error, session.status);

  const { tenantId, supabase } = session;
  const params = new URL(event.rawUrl).searchParams;
  const startDate = params.get('start');
  const endDate = params.get('end');

  if (!startDate || !endDate) {
    return errorResponse('start and end date parameters are required');
  }

  // Calculate previous period for comparison
  const daysDiff = differenceInDays(new Date(endDate), new Date(startDate));
  const prevEnd = format(subDays(new Date(startDate), 1), 'yyyy-MM-dd');
  const prevStart = format(subDays(new Date(startDate), daysDiff + 1), 'yyyy-MM-dd');

  // Fetch current period
  const { data: currentData, error: currentError } = await supabase
    .from('metrics')
    .select('impressions, clicks, spend, conversions, reach, video_views, budget')
    .eq('tenant_id', tenantId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (currentError) return errorResponse(currentError.message, 500);

  // Fetch previous period
  const { data: previousData, error: prevError } = await supabase
    .from('metrics')
    .select('impressions, clicks, spend, conversions, reach, video_views, budget')
    .eq('tenant_id', tenantId)
    .gte('date', prevStart)
    .lte('date', prevEnd);

  if (prevError) return errorResponse(prevError.message, 500);

  // Aggregate rows
  const aggregate = (rows) =>
    rows.reduce(
      (acc, row) => ({
        impressions: acc.impressions + (Number(row.impressions) || 0),
        clicks: acc.clicks + (Number(row.clicks) || 0),
        spend: acc.spend + (Number(row.spend) || 0),
        conversions: acc.conversions + (Number(row.conversions) || 0),
        reach: acc.reach + (Number(row.reach) || 0),
        video_views: acc.video_views + (Number(row.video_views) || 0),
        budget: acc.budget + (Number(row.budget) || 0),
      }),
      { impressions: 0, clicks: 0, spend: 0, conversions: 0, reach: 0, video_views: 0, budget: 0 }
    );

  const currentAgg = aggregate(currentData || []);
  const previousAgg = aggregate(previousData || []);

  return jsonResponse({
    current: computeDerived(currentAgg),
    previous: computeDerived(previousAgg),
  });
}
