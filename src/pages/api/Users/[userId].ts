import { PrismaClient } from '@prisma/client';
import { getAuth } from '@clerk/nextjs/server';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET /api/users/[userId] - Fetch user profile
  if (req.method === 'GET') {
    const { userId } = req.query;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId as string },
        select: {
          id: true,
          name: true,
          bio: true,
          avatarUrl: true,
          city: true,
          interests: true,
          hostedEvents: {
            select: {
              id: true,
              title: true,
              date: true,
              location: true
            }
          }
        }
      });

      if (!user) return res.status(404).json({ error: 'User not found' });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}