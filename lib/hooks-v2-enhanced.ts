// lib/hooks-v2-enhanced.ts
import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/context-v2'
import {
  fetchFamilyMembers,
  fetchTasks,
  fetchEvents,
  fetchActivityLog,
} from '@/lib/supabase-service'

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
      const members = await fetchFamilyMembers()
      dispatch({ type: 'SET_FAMILY_MEMBERS', payload: members })

      // Load tasks (all for now, filtering happens in selectors)
      const tasks = await fetchTasks('everybody')
      dispatch({ type: 'SET_TASKS', payload: tasks })

      // Load events
      const events = await fetchEvents('everybody')
      dispatch({ type: 'SET_EVENTS', payload: events })

      // Load activity log
      const activityLog = await fetchActivityLog(100, 0)
      dispatch({ type: 'SET_ACTIVITY_LOG', payload: activityLog })

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
        async (payload) => {
          try {
            const tasks = await fetchTasks('everybody')
            dispatch({ type: 'SET_TASKS', payload: tasks })
          } catch (err) {
            console.error('Failed to refetch tasks:', err)
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
        async (payload) => {
          try {
            const events = await fetchEvents('everybody')
            dispatch({ type: 'SET_EVENTS', payload: events })
          } catch (err) {
            console.error('Failed to refetch events:', err)
          }
        }
      )
      .subscribe()

    // Subscribe to activity log (INSERT only)
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
              .eq('id', payload.new.id)
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

    subscriptionsRef.current = [
      () => tasksSub.unsubscribe(),
      () => eventsSub.unsubscribe(),
      () => logSub.unsubscribe(),
    ]
  }, [dispatch])

  const setupPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    pollIntervalRef.current = setInterval(async () => {
      if (!state.isOnline) return

      try {
        const tasks = await fetchTasks('everybody')
        dispatch({ type: 'SET_TASKS', payload: tasks })
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
