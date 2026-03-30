import jwt from 'jsonwebtoken';
import prisma from '../db.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const membership = await prisma.tenantUser.findFirst({
      where: { userId: payload.userId },
    });

    if (!membership) {
      return res.status(403).json({ message: 'No tenant found for user' });
    }

    req.userId = payload.userId;
    req.tenantId = membership.tenantId;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
