import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface LeaderboardEntry {
  rank: number
  memberId: string
  memberName: string
  memberColor: string
  memberInitials: string
  tokenCount: number
  tasksCompleted: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LeaderboardEntry[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { timeframe } = req.query // 'week', 'month', or 'all'
    const tf = (timeframe as string) || 'all'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    if (tf === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (tf === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(0) // All time
    }

    // Get all family members
    const membersResult: any = await (supabase as any)
      .from('family_members')
      .select()
      .order('name', { ascending: true })

    const members = membersResult.data
    const membersError = membersResult.error

    if (membersError || !members) {
      console.error('Members fetch error:', membersError)
      return res.status(500).json({ error: 'Failed to fetch members' })
    }

    // Get tokens for each member
    const tokensResult: any = await (supabase as any)
      .from('tokens')
      .select()
      .gte('created_at', startDate.toISOString())

    const allTokens = tokensResult.data || []

    // Get tasks completed for each member
    const tasksResult: any = await (supabase as any)
      .from('tasks')
      .select()
      .eq('completed', true)
      .gte('completed_at', startDate.toISOString())

    const allTasks = tasksResult.data || []

    // Build leaderboard
    const leaderboard: LeaderboardEntry[] = members
      .map((member: any) => {
        const memberTokens = allTokens.filter((t: any) => t.member_id === member.id)
        const memberTasks = allTasks.filter((t: any) => t.completed_by === member.id)
        const totalTokens = memberTokens.reduce((sum: number, t: any) => sum + t.amount, 0)

        return {
          memberId: member.id,
          memberName: member.name,
          memberColor: member.color,
          memberInitials: member.initials,
          tokenCount: totalTokens,
          tasksCompleted: memberTasks.length,
        }
      })
      .sort((a, b) => b.tokenCount - a.tokenCount)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))

    return res.status(200).json(leaderboard)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
