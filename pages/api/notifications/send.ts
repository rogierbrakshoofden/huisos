import type { NextApiRequest, NextApiResponse } from 'next'

// NOTE: For production push notifications, install web-push:
// npm install web-push
// Then import and use: import webpush from 'web-push'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { subscription, title, body, tag } = req.body

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription required' })
    }

    const payload = JSON.stringify({
      title: title || 'HuisOS',
      body: body || 'New notification',
      tag: tag || 'default',
      data: {
        url: '/'
      }
    })

    // For production: 
    // await webpush.sendNotification(subscription, payload)
    
    console.log('[API] Push notification queued:', title)

    res.status(200).json({ 
      success: true,
      message: 'Notification sent'
    })
  } catch (error) {
    console.error('[API] Send failed:', error)
    res.status(500).json({ error: 'Push notification failed' })
  }
}