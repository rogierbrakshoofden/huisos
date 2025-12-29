import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface FamilyStats {
  totalTasksCompletedThisMonth: number
  totalTasksCompletedAllTime: number
  avgTasksPerMember: number
  mostPopularChore: string
  totalFamilyTokens: number
  familyMemberCount: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FamilyStats | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get all family members
    const membersResult: any = await (supabase as any)
      .from('family_members')
      .select()

    const members = membersResult.data || []
    const familyMemberCount = members.length

    // Get all completed tasks
    const tasksResult: any = await (supabase as any)
      .from('tasks')
      .select()
      .eq('completed', true)

    const allTasks = tasksResult.data || []
    const tasksThisMonth = allTasks.filter(
      (t: any) => new Date(t.completed_at) >= thirtyDaysAgo
    )

    // Get all tokens
    const tokensResult: any = await (supabase as any)
      .from('tokens')
      .select()

    const allTokens = tokensResult.data || []
    const totalFamilyTokens = allTokens.reduce((sum: number, t: any) => sum + t.amount, 0)

    // Find most popular chore
    const choreFrequency: Record<string, number> = {}
    allTasks.forEach((task: any) => {
      choreFrequency[task.title] = (choreFrequency[task.title] || 0) + 1
    })
    const mostPopularChore = Object.keys(choreFrequency).length
      ? Object.entries(choreFrequency).sort((a, b) => b[1] - a[1])[0][0]
      : 'None'

    const stats: FamilyStats = {
      totalTasksCompletedThisMonth: tasksThisMonth.length,
      totalTasksCompletedAllTime: allTasks.length,
      avgTasksPerMember: familyMemberCount > 0 ? allTasks.length / familyMemberCount : 0,
      mostPopularChore,
      totalFamilyTokens,
      familyMemberCount,
    }

    return res.status(200).json(stats)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
