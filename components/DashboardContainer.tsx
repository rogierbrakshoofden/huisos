import { useState } from 'react'
import { useApp, selectTasksForUser, selectEventsForUser } from '@/lib/context-v2'
import { useRealtimeSync } from '@/lib/hooks-v2-enhanced'
import { useToast } from '@/lib/toast'
import { useTaskHandlers } from '@/lib/hooks/useTaskHandlers'
import { useEventHandlers } from '@/lib/hooks/useEventHandlers'
import { useRewardHandlers } from '@/lib/hooks/useRewardHandlers'
import { usePresenceTracking } from '@/lib/hooks/usePresenceTracking'
import { useModalState } from '@/lib/hooks/useModalState'
import { DashboardView } from './DashboardView'
import { Task, Event } from '@/types/huisos-v2'

export function DashboardContainer() {
  const { state, dispatch } = useApp()
  const { isLoading, isOnline, syncError } = useRealtimeSync()
  const { toasts, toast, setToasts } = useToast()
  const tasks = selectTasksForUser(state)
  const events = selectEventsForUser(state)
  const [presence] = useState<Record<string, { is_home: boolean; note?: string }>>({})

  // Get current user ID
  const currentUserId =
    state.activeUserId === 'everybody'
      ? state.familyMembers[0]?.id || ''
      : (state.activeUserId as string)

  // Custom hooks
  const modalState = useModalState()
  const taskHandlers = useTaskHandlers(currentUserId, toast, modalState.setApiError)
  const eventHandlers = useEventHandlers(currentUserId, toast, modalState.setApiError)
  const rewardHandlers = useRewardHandlers(currentUserId, toast)
  
  // Presence tracking
  usePresenceTracking(currentUserId)

  const setActiveTab = (tab: 'work' | 'events' | 'stats' | 'log' | 'rewards') => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })
  }

  const switchUser = (userId: string | 'everybody') => {
    dispatch({ type: 'SET_ACTIVE_USER', payload: userId })
  }

  // Wrapper functions for modal handlers
  const handleSaveTask = async (taskData: Partial<Task>) => {
    await taskHandlers.handleSaveTask(taskData, modalState.editingTask)
  }

  const handleSaveEvent = async (eventData: Partial<Event>) => {
    await eventHandlers.handleSaveEvent(eventData, modalState.editingEvent)
  }

  const handleRedeemReward = async (rewardId: string) => {
    const success = await rewardHandlers.handleRedeemReward(rewardId)
    if (success) {
      modalState.setIsRewardStoreOpen(false)
    }
  }

  const getTokenBalance = (memberId: string) => {
    return state.tokens
      .filter((t) => t.member_id === memberId)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const pendingClaimsCount = state.rewardClaims.filter(
    (c) => c.status === 'pending'
  ).length

  // Pass everything to view component
  return (
    <DashboardView
      // State
      state={state}
      tasks={tasks}
      events={events}
      presence={presence}
      currentUserId={currentUserId}
      pendingClaimsCount={pendingClaimsCount}
      isLoading={isLoading}
      isOnline={isOnline}
      syncError={syncError}
      
      // Modal state
      modalState={modalState}
      
      // Navigation handlers
      setActiveTab={setActiveTab}
      switchUser={switchUser}
      
      // Task handlers
      onCompleteTask={taskHandlers.handleCompleteTask}
      onDeleteTask={taskHandlers.handleDeleteTask}
      onToggleSubtask={taskHandlers.handleToggleSubtask}
      onSaveTask={handleSaveTask}
      
      // Event handlers
      onSaveEvent={handleSaveEvent}
      onDeleteEvent={eventHandlers.handleDeleteEvent}
      
      // Reward handlers
      onRedeemReward={handleRedeemReward}
      onApproveRewardClaim={rewardHandlers.handleApproveRewardClaim}
      onClaimReward={rewardHandlers.handleClaimReward}
      
      // Utility functions
      getTokenBalance={getTokenBalance}
      
      // Toast
      toasts={toasts}
      setToasts={setToasts}
    />
  )
}
