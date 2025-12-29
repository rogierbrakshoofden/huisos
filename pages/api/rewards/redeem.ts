import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RedeemRequestBody {
  rewardId: string
  memberId: string
}

interface RedeemResponse {
  success?: boolean
  error?: string
  claim?: {
    id: string
    member_id: string
    reward_id: string
    status: string
    redeemed_at: string
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RedeemResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { rewardId, memberId } = req.body as RedeemRequestBody

    if (!rewardId || !memberId) {
      return res
        .status(400)
        .json({ error: 'rewardId and memberId are required' })
    }

    // Get reward
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single()

    if (rewardError || !reward) {
      return res.status(404).json({ error: 'Reward not found' })
    }

    // Calculate member's token balance
    const { data: tokens, error: tokenError } = await supabase
      .from('tokens')
      .select('amount')
      .eq('member_id', memberId)

    if (tokenError) {
      return res.status(500).json({ error: 'Failed to fetch tokens' })
    }

    const balance = (tokens || []).reduce((sum, t) => sum + t.amount, 0)

    if (balance < reward.token_cost) {
      return res.status(400).json({
        error: `Insufficient tokens. Need ${reward.token_cost - balance} more`,
      })
    }

    // Create reward claim
    const { data: claim, error: claimError } = await supabase
      .from('reward_claims')
      .insert([
        {
          member_id: memberId,
          reward_id: rewardId,
          status: 'pending',
          redeemed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (claimError) {
      return res.status(500).json({ error: 'Failed to create reward claim' })
    }

    // Deduct tokens
    const { error: deductError } = await supabase
      .from('tokens')
      .insert([
        {
          member_id: memberId,
          amount: -reward.token_cost,
          reason: `Redeemed: ${reward.title}`,
          reward_claim_id: claim.id,
        },
      ])

    if (deductError) {
      // Rollback: delete the claim
      await supabase.from('reward_claims').delete().eq('id', claim.id)
      return res
        .status(500)
        .json({ error: 'Failed to deduct tokens. Redemption cancelled.' })
    }

    // Log activity
    await supabase.from('activity_log').insert([
      {
        actor_id: memberId,
        action_type: 'reward_redeemed',
        entity_type: 'reward',
        entity_id: rewardId,
        metadata: { reward_title: reward.title, tokens_cost: reward.token_cost },
      },
    ])

    return res.status(201).json({
      success: true,
      claim: {
        id: claim.id,
        member_id: claim.member_id,
        reward_id: claim.reward_id,
        status: claim.status,
        redeemed_at: claim.redeemed_at,
      },
    })
  } catch (error) {
    console.error('Reward redeem error:', error)
    return res
      .status(500)
      .json({ error: 'Internal server error' })
  }
}
