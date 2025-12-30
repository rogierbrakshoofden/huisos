import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars in /api/tasks/delete')
}

const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean } | { error: string }>
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error: 'Server configuration error: Missing Supabase credentials.',
      })
    }

    const { taskId, actorId } = req.body

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' })
    }

    // Delete task
    const { error: taskError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (taskError) {
      console.error('❌ Task delete error:', taskError)
      return res.status(500).json({
        error: taskError.message || 'Failed to delete task',
      })
    }

    // Log activity
    if (actorId) {
      await (supabase as any).from('activity_log').insert({
        actor_id: actorId,
        action_type: 'task_deleted',
        entity_type: 'task',
        entity_id: taskId,
        metadata: {},
      } as any)
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('❌ API error in /api/tasks/delete:', err)
    return res.status(500).json({
      error:
        err instanceof Error
          ? err.message
          : 'Internal server error',
    })
  }
}
