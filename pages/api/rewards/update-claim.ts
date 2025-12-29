import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface UpdateClaimBody {
  claimId: string
  status: 'approved' | 'claimed'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success?: boolean; error?: string }>
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { claimId, status } = req.body as UpdateClaimBody

    if (!claimId || !status) {
      return res
        .status(400)
        .json({ error: 'claimId and status are required' })
    }

    if (!['approved', 'claimed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const updateData: Record<string, string> = { status }
    if (status === 'claimed') {
      updateData.claimed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('reward_claims')
      .update(updateData)
      .eq('id', claimId)

    if (error) {
      return res.status(500).json({ error: 'Failed to update reward claim' })
    }

    // Log activity
    await supabase.from('activity_log').insert([
      {
        actor_id: 'system', // In real app, use actual parent ID
        action_type: 'reward_claim_updated',
        entity_type: 'reward',
        entity_id: claimId,
        metadata: { new_status: status },
      },
    ])

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Update claim error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
