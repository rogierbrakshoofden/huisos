import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Reward {
  id: string
  title: string
  description?: string
  icon_emoji: string
  token_cost: number
  active: boolean
  created_at: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ rewards?: Reward[]; error?: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data: rewards, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('active', true)
      .order('token_cost', { ascending: true })

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch rewards' })
    }

    return res.status(200).json({ rewards: rewards as Reward[] })
  } catch (error) {
    console.error('Rewards list error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
