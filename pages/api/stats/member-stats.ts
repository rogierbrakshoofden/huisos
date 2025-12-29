import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface MemberStats {
  memberId: string
  memberName: string
  tasksCompletedThisMonth: number
  tasksCompletedAllTime: number
  avgTokensPerTask: number
  currentStreak: number
  longestStreak: number
  mostFrequentChore: string
  totalTokens: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MemberStats | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { memberId } = req.query

    if (!memberId) {
      return res.status(400).json({ error: 'memberId is required' })
    }

    // Get member info
    const memberResult: any = await (supabase as any)
      .from('family_members')
      .select()
      .eq('id', memberId)
      .single()

    const member = memberResult.data
    const memberError = memberResult.error

    if (memberError || !member) {
      return res.status(404).json({ error: 'Member not found' })
    }

    // Calculate date ranges
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get all completed tasks for this member
    const tasksResult: any = await (supabase as any)
      .from('tasks')
      .select()
      .eq('completed_by', memberId)
      .eq('completed', true)
      .order('completed_at', { ascending: false })

    const allTasks = tasksResult.data || []
    const tasksThisMonth = allTasks.filter(
      (t: any) => new Date(t.completed_at) >= thirtyDaysAgo
    )

    // Get all tokens for this member
    const tokensResult: any = await (supabase as any)
      .from('tokens')
      .select()
      .eq('member_id', memberId)

    const allTokens = tokensResult.data || []
    const totalTokens = allTokens.reduce((sum: number, t: any) => sum + t.amount, 0)

    // Calculate average tokens per task
    const avgTokensPerTask = allTasks.length > 0 ? totalTokens / allTasks.length : 0

    // Calculate streaks (consecutive days with completed tasks)
    const calculateStreaks = (tasks: any[]) => {
      if (tasks.length === 0) return { current: 0, longest: 0 }

      const sortedTasks = [...tasks].sort(
        (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      )

      const dates = new Set(
        sortedTasks.map((t: any) => t.completed_date || t.completed_at.split('T')[0])
      )

      const sortedDates = Array.from(dates)
        .map((d) => new Date(d as string))
        .sort((a, b) => b.getTime() - a.getTime())

      let currentStreak = 0
      let longestStreak = 0
      let lastDate: Date | null = null

      for (const date of sortedDates) {
        if (lastDate === null) {
          currentStreak = 1
        } else {
          const daysDiff =
            (lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
          if (daysDiff === 1) {
            currentStreak++
          } else {
            longestStreak = Math.max(longestStreak, currentStreak)
            currentStreak = 1
          }
        }
        lastDate = date
      }

      longestStreak = Math.max(longestStreak, currentStreak)
      return { current: currentStreak, longest: longestStreak }
    }

    const { current: currentStreak, longest: longestStreak } = calculateStreaks(allTasks)

    // Find most frequent chore
    const choreFrequency: Record<string, number> = {}
    allTasks.forEach((task: any) => {
      choreFrequency[task.title] = (choreFrequency[task.title] || 0) + 1
    })
    const mostFrequentChore = Object.keys(choreFrequency).length
      ? Object.entries(choreFrequency).sort((a, b) => b[1] - a[1])[0][0]
      : 'None'

    const stats: MemberStats = {
      memberId: member.id,
      memberName: member.name,
      tasksCompletedThisMonth: tasksThisMonth.length,
      tasksCompletedAllTime: allTasks.length,
      avgTokensPerTask: Math.round(avgTokensPerTask * 100) / 100,
      currentStreak,
      longestStreak,
      mostFrequentChore,
      totalTokens,
    }

    return res.status(200).json(stats)
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
