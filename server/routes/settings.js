import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../db.js';

const router = Router();
router.use(authenticate);

router.get('/tenant', async (req, res) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.tenantId },
  });
  res.json(tenant);
});

router.put('/tenant', async (req, res) => {
  const { name } = req.body;
  const tenant = await prisma.tenant.update({
    where: { id: req.tenantId },
    data: { name },
  });
  res.json(tenant);
});

export default router;
