import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Subtask } from '@/types/huisos-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars in /api/subtasks/list')
}

const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ [key: string]: Subtask[] } | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error: 'Server configuration error: Missing Supabase credentials.',
      })
    }

    // Extract household_id from request header
    const householdId = req.headers['x-household-id'] as string
    if (!householdId) {
      return res.status(401).json({ error: 'Unauthorized: missing household ID' })
    }

    const { taskIds } = req.query

    if (!taskIds) {
      return res.status(400).json({ error: 'taskIds query parameter is required' })
    }

    const ids = Array.isArray(taskIds) ? taskIds : [taskIds]

    const result: any = await (supabase as any)
      .from('subtasks')
      .select()
      .eq('household_id', householdId)
      .in('task_id', ids)

    const subtasks = result.data || []
    const subtaskError = result.error

    if (subtaskError && subtasks.length === 0) {
      console.error('❌ Subtask fetch error:', subtaskError)
      return res.status(500).json({
        error: subtaskError.message || 'Failed to fetch subtasks',
      })
    }

    // Group by task_id
    const grouped: { [key: string]: Subtask[] } = {}
    ids.forEach((id: string) => {
      grouped[id] = subtasks.filter((s: any) => s.task_id === id)
    })

    return res.status(200).json(grouped)
  } catch (err) {
    console.error('❌ API error in /api/subtasks/list:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    })
  }
}
