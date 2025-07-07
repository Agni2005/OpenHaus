// pages/api/webhooks/user-created.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { Webhook } from 'svix';
import { buffer } from 'micro';
import prisma from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Define the expected structure of the Clerk event
interface ClerkEvent {
  id: string;
  type: string;
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    username: string;
    first_name: string;
    last_name: string;
    image_url: string;
  };
}

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const payload = await buffer(req);
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  const wh = new Webhook(webhookSecret);

  let evt: ClerkEvent;
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return res.status(400).json({ error: 'Invalid webhook' });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;

    await prisma.user.create({
      data: {
        clerkId: id,
        email: email_addresses?.[0]?.email_address,
        username,
        name: `${first_name || ''} ${last_name || ''}`.trim(),
        avatarUrl: image_url,
      },
    });
  }

  res.status(200).json({ success: true });
}
