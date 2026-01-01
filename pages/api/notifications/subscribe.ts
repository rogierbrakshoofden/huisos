import type { NextApiRequest, NextApiResponse } from 'next'

// In production, store subscriptions in a database
// For now, we'll log them and respond with success
const subscriptions: Set<string> = new Set()

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

    // Store subscription (in production, save to database with user ID)
    subscriptions.add(JSON.stringify(subscription))
    
    console.log('[API] Subscription stored:', subscription.endpoint)

    res.status(200).json({ 
      success: true,
      message: 'Subscription saved'
    })
  } catch (error) {
    console.error('[API] Subscribe failed:', error)
    res.status(500).json({ error: 'Subscription failed' })
  }
}