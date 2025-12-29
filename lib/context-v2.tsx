import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { AppState, Task, Event, ActivityLogEntry, FamilyMember } from '@/types/huisos-v2'

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export type AppAction =
  | { type: 'SET_ACTIVE_USER'; payload: string | 'everybody' }
  | { type: 'SET_FAMILY_MEMBERS'; payload: FamilyMember[] }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_EVENTS'; payload: Event[] }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_ACTIVITY_LOG'; payload: ActivityLogEntry[] }
  | { type: 'ADD_LOG_ENTRY'; payload: ActivityLogEntry }
  | { type: 'SET_ACTIVE_TAB'; payload: 'work' | 'events' | 'log' }
  | { type: 'OPEN_TASK_MODAL'; payload: Task | null }
  | { type: 'OPEN_EVENT_MODAL'; payload: Event | null }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_EDITING_TASK'; payload: string | undefined }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_LAST_SYNCED'; payload: Date }
  | { type: 'SET_SYNC_ERROR'; payload: string | undefined }
  | { type: 'SET_LOADING'; payload: boolean }

const initialState: AppState = {
  activeUserId: 'everybody',
  familyMembers: [],
  tasks: [],
  subtasks: new Map(),
  events: [],
  activityLog: [],
  tokens: [],
  rewards: [],
  presence: [],
  activeTab: 'work',
  modalOpen: null,
  selectedTaskForEdit: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncedAt: null,
  isLoading: true,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_USER':
      return { ...state, activeUserId: action.payload }
    case 'SET_FAMILY_MEMBERS':
      return { ...state, familyMembers: action.payload }
    case 'SET_TASKS':
      return { ...state, tasks: action.payload }
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => (t.id === action.payload.id ? action.payload : t)),
      }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
      }
    case 'SET_EVENTS':
      return { ...state, events: action.payload }
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] }
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => (e.id === action.payload.id ? action.payload : e)),
      }
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(e => e.id !== action.payload),
      }
    case 'SET_ACTIVITY_LOG':
      return { ...state, activityLog: action.payload }
    case 'ADD_LOG_ENTRY':
      return {
        ...state,
        activityLog: [action.payload, ...state.activityLog].slice(0, 1000),
      }
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }
    case 'OPEN_TASK_MODAL':
      return {
        ...state,
        modalOpen: 'task',
        selectedTaskForEdit: action.payload,
        editingTaskId: action.payload?.id,
      }
    case 'OPEN_EVENT_MODAL':
      return { ...state, modalOpen: 'event' }
    case 'CLOSE_MODAL':
      return {
        ...state,
        modalOpen: null,
        selectedTaskForEdit: null,
        editingTaskId: undefined,
      }
    case 'SET_EDITING_TASK':
      return { ...state, editingTaskId: action.payload }
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload }
    case 'SET_LAST_SYNCED':
      return { ...state, lastSyncedAt: action.payload }
    case 'SET_SYNC_ERROR':
      return { ...state, syncError: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedUserId = localStorage.getItem('huisos_v2_active_user_id')
    if (savedUserId) {
      dispatch({ type: 'SET_ACTIVE_USER', payload: savedUserId })
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('huisos_v2_active_user_id', state.activeUserId)
  }, [state.activeUserId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', payload: true })
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', payload: false })
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export function selectTasksForUser(state: AppState): Task[] {
  if (state.activeUserId === 'everybody') {
    return state.tasks
  }
  return state.tasks.filter(task =>
    task.assignee_ids.includes(state.activeUserId as string)
  )
}

export function selectEventsForUser(state: AppState): Event[] {
  if (state.activeUserId === 'everybody') {
    return state.events
  }
  return state.events.filter(event =>
    event.member_ids.includes(state.activeUserId as string)
  )
}

export function selectActiveUser(state: AppState): FamilyMember | null {
  if (state.activeUserId === 'everybody') {
    return null
  }
  return state.familyMembers.find(m => m.id === state.activeUserId) || null
}
