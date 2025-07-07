import { PrismaClient } from '@prisma/client';
import { getAuth } from '@clerk/nextjs/server';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET /api/users/me - Get current user
  if (req.method === 'GET') {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true
        }
      });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}