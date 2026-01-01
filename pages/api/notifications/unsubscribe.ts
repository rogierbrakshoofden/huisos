import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const subscription = req.body

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' })
    }

    // Remove subscription (in production, delete from database)
    console.log('[API] Subscription removed:', subscription.endpoint)

    res.status(200).json({ 
      success: true,
      message: 'Subscription removed'
    })
  } catch (error) {
    console.error('[API] Unsubscribe failed:', error)
    res.status(500).json({ error: 'Unsubscribe failed' })
  }
}