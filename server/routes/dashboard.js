import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { differenceInDays, subDays, format } from 'date-fns';
import prisma from '../db.js';

const router = Router();
router.use(authenticate);

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
    roi: spend > 0 ? ((conversions * 50 - spend) / spend) * 100 : 0,
    frequency: reach > 0 ? impressions / reach : 0,
  };
}

function aggregateMetrics(rows) {
  return rows.reduce(
    (acc, row) => ({
      impressions: acc.impressions + Number(row.impressions),
      clicks: acc.clicks + Number(row.clicks),
      spend: acc.spend + Number(row.spend),
      conversions: acc.conversions + Number(row.conversions),
      reach: acc.reach + Number(row.reach),
      video_views: acc.video_views + Number(row.videoViews),
      budget: acc.budget + Number(row.budget),
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0, reach: 0, video_views: 0, budget: 0 }
  );
}

router.get('/metrics', async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ message: 'start and end date parameters are required' });
  }

  const daysDiff = differenceInDays(new Date(end), new Date(start));
  const prevEnd = format(subDays(new Date(start), 1), 'yyyy-MM-dd');
  const prevStart = format(subDays(new Date(start), daysDiff + 1), 'yyyy-MM-dd');

  const [currentData, previousData] = await Promise.all([
    prisma.metric.findMany({
      where: {
        tenantId: req.tenantId,
        date: { gte: new Date(start), lte: new Date(end) },
      },
    }),
    prisma.metric.findMany({
      where: {
        tenantId: req.tenantId,
        date: { gte: new Date(prevStart), lte: new Date(prevEnd) },
      },
    }),
  ]);

  res.json({
    current: computeDerived(aggregateMetrics(currentData)),
    previous: computeDerived(aggregateMetrics(previousData)),
  });
});

router.get('/config', async (req, res) => {
  const config = await prisma.dashboardConfig.findUnique({
    where: { tenantId: req.tenantId },
  });
  res.json(config || { tileConfig: ['impressions', 'clicks', 'spend', 'conversions', 'ctr', 'cpa', 'roi'] });
});

router.put('/config', async (req, res) => {
  const { tileConfig } = req.body;
  const config = await prisma.dashboardConfig.upsert({
    where: { tenantId: req.tenantId },
    create: { tenantId: req.tenantId, tileConfig },
    update: { tileConfig },
  });
  res.json(config);
});

export default router;
