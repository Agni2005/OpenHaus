import { PrismaClient } from '@prisma/client';
import { getAuth } from '@clerk/nextjs/server';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // PUT /api/users/update - Update user profile
  if (req.method === 'PUT') {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const updatedUser = await prisma.user.update({
        where: { clerkId: userId },
        data: {
          bio: req.body.bio,
          city: req.body.city,
          interests: req.body.interests
        }
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}