import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/context-v2'
import type { Task, Event, ActivityLogEntry } from '@/types/huisos-v2'

const POLL_INTERVAL = 30000
const ACTIVITY_LOG_LIMIT = 100

export function useRealtimeSync() {
  const { state, dispatch } = useApp()
  const unsubscribesRef = useRef<Array<() => void>>([])
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadDone = useRef(false)

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      dispatch({ type: 'SET_TASKS', payload: data || [] })
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      dispatch({
        type: 'SET_SYNC_ERROR',
        payload: `Failed to sync tasks: ${(err as Error).message}`,
      })
    }
  }, [dispatch])

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('datetime', { ascending: true })
      if (error) throw error
      dispatch({ type: 'SET_EVENTS', payload: data || [] })
    } catch (err) {
      console.error('Failed to fetch events:', err)
    }
  }, [dispatch])

  const fetchActivityLog = useCallback(async (limit = ACTIVITY_LOG_LIMIT) => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, actor:family_members(*)')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      dispatch({ type: 'SET_ACTIVITY_LOG', payload: data || [] })
    } catch (err) {
      console.error('Failed to fetch activity log:', err)
    }
  }, [dispatch])

  const fetchFamilyMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      dispatch({ type: 'SET_FAMILY_MEMBERS', payload: data || [] })
    } catch (err) {
      console.error('Failed to fetch family members:', err)
    }
  }, [dispatch])

  const loadInitialData = useCallback(async () => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      await Promise.all([
        fetchFamilyMembers(),
        fetchTasks(),
        fetchEvents(),
        fetchActivityLog(),
      ])
      dispatch({ type: 'SET_LAST_SYNCED', payload: new Date() })
      dispatch({ type: 'SET_SYNC_ERROR', payload: undefined })
    } catch (err) {
      console.error('Failed to load initial data:', err)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch, fetchFamilyMembers, fetchTasks, fetchEvents, fetchActivityLog])

  const setupPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }
    pollIntervalRef.current = setInterval(async () => {
      if (!state.isOnline) return
      try {
        console.log('Polling for updates...')
        if (state.lastSyncedAt) {
          const lastSynced = new Date(state.lastSyncedAt).toISOString()
          const { data: newTasks } = await supabase
            .from('tasks')
            .select('*')
            .gt('updated_at', lastSynced)
          if (newTasks && newTasks.length > 0) {
            const taskMap = new Map(state.tasks.map(t => [t.id, t]))
            newTasks.forEach(task => taskMap.set(task.id, task))
            dispatch({ type: 'SET_TASKS', payload: Array.from(taskMap.values()) })
          }
        }
      } catch (err) {
        console.error('Polling failed:', err)
      } finally {
        dispatch({ type: 'SET_LAST_SYNCED', payload: new Date() })
      }
    }, POLL_INTERVAL)
  }, [state.isOnline, state.lastSyncedAt, state.tasks, dispatch])

  useEffect(() => {
    loadInitialData()
    setupPolling()
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const refresh = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      await Promise.all([fetchTasks(), fetchEvents(), fetchActivityLog()])
      dispatch({ type: 'SET_LAST_SYNCED', payload: new Date() })
      dispatch({ type: 'SET_SYNC_ERROR', payload: undefined })
    } catch (err) {
      console.error('Manual refresh failed:', err)
      dispatch({
        type: 'SET_SYNC_ERROR',
        payload: `Refresh failed: ${(err as Error).message}`,
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch, fetchTasks, fetchEvents, fetchActivityLog])

  return {
    isLoading: state.isLoading,
    isOnline: state.isOnline,
    syncError: state.syncError,
    lastSyncedAt: state.lastSyncedAt,
    refresh,
  }
}
