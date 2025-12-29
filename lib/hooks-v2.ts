import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/context-v2'

const POLL_INTERVAL = 30000

export function useRealtimeSync() {
  const { state, dispatch } = useApp()
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadDone = useRef(false)

  const loadInitialData = useCallback(async () => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // Fetch family members
      const { data: members } = await supabase
        .from('family_members')
        .select('*')
        .order('name', { ascending: true })
      if (members) {
        dispatch({ type: 'SET_FAMILY_MEMBERS', payload: members as any })
      }

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      if (tasks) {
        dispatch({ type: 'SET_TASKS', payload: tasks as any })
      }

      // Fetch events
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .order('datetime', { ascending: true })
      if (events) {
        dispatch({ type: 'SET_EVENTS', payload: events as any })
      }

      // Fetch activity log
      const { data: activityLog } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (activityLog) {
        dispatch({ type: 'SET_ACTIVITY_LOG', payload: activityLog as any })
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
          .order('created_at', { ascending: false })
        if (tasks) {
          dispatch({ type: 'SET_TASKS', payload: tasks as any })
        }
      } catch (err) {
        console.error('Polling failed:', err)
      }
    }, POLL_INTERVAL)
  }, [state.isOnline, dispatch])

  useEffect(() => {
    loadInitialData()
    setupPolling()
    return () => {
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
