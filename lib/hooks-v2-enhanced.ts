// lib/hooks-v2-enhanced.ts
import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/context-v2'
import type { Subtask } from '@/types/huisos-v2'

const POLL_INTERVAL = 30000 // 30 seconds

export function useRealtimeSync() {
  const { state, dispatch } = useApp()
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionsRef = useRef<Array<() => void>>([])
  const initialLoadDone = useRef(false)

  const loadInitialData = useCallback(async () => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // Load family members
      const { data: members } = await supabase
        .from('family_members')
        .select('*')
        .order('name', { ascending: true })
      if (members) {
        dispatch({ type: 'SET_FAMILY_MEMBERS', payload: members as any })
      }

      // Load tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false })
      if (tasks) {
        dispatch({ type: 'SET_TASKS', payload: tasks as any })
      }

      // Load subtasks for all tasks
      const { data: subtasks } = await supabase
        .from('subtasks')
        .select('*')
        .order('parent_task_id')
        .order('order_index', { ascending: true })
      if (subtasks && subtasks.length > 0) {
        // Group subtasks by parent_task_id
        const subtasksByTask = new Map<string, Subtask[]>()
        ;(subtasks as Subtask[]).forEach((st) => {
          const taskId = st.parent_task_id
          if (!subtasksByTask.has(taskId)) {
            subtasksByTask.set(taskId, [])
          }
          subtasksByTask.get(taskId)!.push(st)
        })
        // Dispatch each group
        subtasksByTask.forEach((subs, taskId) => {
          dispatch({
            type: 'REORDER_SUBTASKS',
            payload: { taskId, subtasks: subs },
          })
        })
      }

      // Load events
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .order('datetime', { ascending: true })
      if (events) {
        dispatch({ type: 'SET_EVENTS', payload: events as any })
      }

      // Load activity log
      const { data: activityLog } = await supabase
        .from('activity_log')
        .select('*, actor:family_members(*)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (activityLog) {
        dispatch({ type: 'SET_ACTIVITY_LOG', payload: activityLog as any })
      }

      // Load rewards
      const { data: rewards } = await supabase
        .from('rewards')
        .select('*')
        .eq('active', true)
        .order('token_cost', { ascending: true })
      if (rewards) {
        // Dispatch to state - need to add SET_REWARDS action
        state.rewards = rewards as any
      }

      // Load reward claims
      const { data: rewardClaims } = await supabase
        .from('reward_claims')
        .select('*')
        .order('redeemed_at', { ascending: false })
      if (rewardClaims) {
        dispatch({ type: 'SET_REWARD_CLAIMS', payload: rewardClaims as any })
      }

      dispatch({ type: 'SET_LAST_SYNCED', payload: new Date() })
      dispatch({ type: 'SET_SYNC_ERROR', payload: undefined })
    } catch (err) {
      console.error('Failed to load initial data:', err)
      dispatch({
        type: 'SET_SYNC_ERROR',
        payload: `Failed to load data: ${(err as Error).message}`,
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  const setupRealtimeSubscriptions = useCallback(() => {
    // Subscribe to task changes
    const tasksSub = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        async () => {
          try {
            const { data: tasks } = await supabase
              .from('tasks')
              .select('*')
              .order('completed', { ascending: true })
              .order('created_at', { ascending: false })
            if (tasks) {
              dispatch({ type: 'SET_TASKS', payload: tasks as any })
            }
          } catch (err) {
            console.error('Failed to refetch tasks:', err)
          }
        }
      )
      .subscribe()

    // Subscribe to subtask changes
    const subtasksSub = supabase
      .channel('subtasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subtasks',
        },
        async (payload) => {
          try {
            const parentTaskId = (payload.new as Subtask)?.parent_task_id || (payload.old as Subtask)?.parent_task_id
            const { data: subtasks } = await supabase
              .from('subtasks')
              .select('*')
              .eq('parent_task_id', parentTaskId)
              .order('order_index', { ascending: true })
            if (subtasks) {
              dispatch({
                type: 'REORDER_SUBTASKS',
                payload: {
                  taskId: parentTaskId,
                  subtasks: subtasks as Subtask[],
                },
              })
            }
          } catch (err) {
            console.error('Failed to refetch subtasks:', err)
          }
        }
      )
      .subscribe()

    // Subscribe to events changes
    const eventsSub = supabase
      .channel('events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        async () => {
          try {
            const { data: events } = await supabase
              .from('events')
              .select('*')
              .order('datetime', { ascending: true })
            if (events) {
              dispatch({ type: 'SET_EVENTS', payload: events as any })
            }
          } catch (err) {
            console.error('Failed to refetch events:', err)
          }
        }
      )
      .subscribe()

    // Subscribe to activity log
    const logSub = supabase
      .channel('activity_log')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        async (payload) => {
          try {
            const { data } = await supabase
              .from('activity_log')
              .select('*, actor:family_members(*)')
              .eq('id', (payload.new as any).id)
              .single()
            if (data) {
              dispatch({ type: 'ADD_LOG_ENTRY', payload: data as any })
            }
          } catch (err) {
            console.error('Failed to fetch activity log entry:', err)
          }
        }
      )
      .subscribe()

    // Subscribe to reward claims changes
    const claimsSub = supabase
      .channel('reward_claims')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reward_claims',
        },
        async () => {
          try {
            const { data: rewardClaims } = await supabase
              .from('reward_claims')
              .select('*')
              .order('redeemed_at', { ascending: false })
            if (rewardClaims) {
              dispatch({ type: 'SET_REWARD_CLAIMS', payload: rewardClaims as any })
            }
          } catch (err) {
            console.error('Failed to refetch reward claims:', err)
          }
        }
      )
      .subscribe()

    subscriptionsRef.current = [
      () => tasksSub.unsubscribe(),
      () => subtasksSub.unsubscribe(),
      () => eventsSub.unsubscribe(),
      () => logSub.unsubscribe(),
      () => claimsSub.unsubscribe(),
    ]
  }, [dispatch])

  const setupPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    pollIntervalRef.current = setInterval(async () => {
      if (!state.isOnline) return

      try {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .order('completed', { ascending: true })
          .order('created_at', { ascending: false })
        if (tasks) {
          dispatch({ type: 'SET_TASKS', payload: tasks as any })
        }
        dispatch({ type: 'SET_LAST_SYNCED', payload: new Date() })
      } catch (err) {
        console.error('Polling failed:', err)
      }
    }, POLL_INTERVAL)
  }, [state.isOnline, dispatch])

  useEffect(() => {
    loadInitialData()
    setupRealtimeSubscriptions()
    setupPolling()

    return () => {
      subscriptionsRef.current.forEach((unsub) => {
        try {
          unsub()
        } catch (err) {
          console.error('Failed to unsubscribe:', err)
        }
      })

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  return {
    isLoading: state.isLoading,
    isOnline: state.isOnline,
    syncError: state.syncError,
    lastSyncedAt: state.lastSyncedAt,
  }
}
