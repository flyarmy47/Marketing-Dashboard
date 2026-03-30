import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../db.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const connections = await prisma.connection.findMany({
    where: { tenantId: req.tenantId },
    select: {
      id: true,
      platform: true,
      accountId: true,
      accountName: true,
      lastSyncedAt: true,
      createdAt: true,
    },
  });
  res.json(connections);
});

router.delete('/:id', async (req, res) => {
  await prisma.connection.deleteMany({
    where: { id: req.params.id, tenantId: req.tenantId },
  });
  res.status(204).end();
});

export default router;
