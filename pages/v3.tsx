// pages/v3.tsx
'use client'
import { useState, useEffect } from 'react'
import { useApp, selectTasksForUser, selectEventsForUser } from '@/lib/context-v2'
import { useRealtimeSync } from '@/lib/hooks-v2-enhanced'
import { useToast, ToastContainer } from '@/lib/toast'
import { useTaskHandlers } from '@/lib/hooks/useTaskHandlers'
import { useEventHandlers } from '@/lib/hooks/useEventHandlers'
import { useRewardHandlers } from '@/lib/hooks/useRewardHandlers'
import { usePresenceTracking } from '@/lib/hooks/usePresenceTracking'
import { useModalState } from '@/lib/hooks/useModalState'
import { UserSwitcher } from '@/components/user-switcher'
import { BottomNav } from '@/components/bottom-nav'
import { AddButton } from '@/components/add-button'
import { TaskModal } from '@/components/task-modal'
import { EventModal } from '@/components/event-modal'
import { RewardStoreModal } from '@/components/reward-store-modal'
import { MyRewardsTab } from '@/components/my-rewards-tab'
import { StatsTab } from '@/components/stats-tab'
import { WorkTab } from '@/components/tabs/WorkTab'
import { EventsTab } from '@/components/tabs/EventsTab'
import { ActivityLogTab } from '@/components/tabs/ActivityLogTab'
import { DiagnosticsFooter } from '@/components/diagnostics-footer'
import { Task, Event } from '@/types/huisos-v2'

export default function V3Dashboard() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-300">Loading...</p>
      </div>
    )
  }

  return <V3DashboardContent />
}

function V3DashboardContent() {
  const { state, dispatch } = useApp()
  const { isLoading, isOnline, syncError } = useRealtimeSync()
  const { toasts, toast, setToasts } = useToast()
  const tasks = selectTasksForUser(state)
  const events = selectEventsForUser(state)
  const activeTab = state.activeTab
  const [presence, setPresence] = useState<Record<string, { is_home: boolean; note?: string }>>({})

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-slate-300 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading HuisOS v3...</p>
        </div>
      </div>
    )
  }

  const getTokenBalance = (memberId: string) => {
    return state.tokens
      .filter((t) => t.member_id === memberId)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const pendingClaimsCount = state.rewardClaims.filter(
    (c) => c.status === 'pending'
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-32">
      <UserSwitcher
        activeUserId={state.activeUserId}
        familyMembers={state.familyMembers}
        onUserChange={switchUser}
      />

      <AddButton
        onTaskClick={modalState.handleOpenNewTask}
        onEventClick={modalState.handleOpenNewEvent}
      />

      {(syncError || modalState.apiError) && (
        <div className="fixed top-20 left-0 right-0 mx-auto max-w-sm z-40 m-4">
          <div className="bg-red-900/80 border border-red-700 text-red-100 px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
            {modalState.apiError || syncError}
          </div>
        </div>
      )}
      {!isOnline && (
        <div className="fixed top-20 left-0 right-0 mx-auto max-w-sm z-40 m-4">
          <div className="bg-yellow-900/80 border border-yellow-700 text-yellow-100 px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
            Offline • Using cached data
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">HuisOS v3</h1>
          <p className="text-slate-400">Family coordination made simple</p>
        </div>

        {activeTab === 'work' && (
          <WorkTab
            tasks={tasks}
            familyMembers={state.familyMembers}
            tokens={state.tokens}
            subtasksMap={state.subtasks}
            currentUserId={currentUserId}
            onComplete={taskHandlers.handleCompleteTask}
            onEdit={modalState.handleEditTask}
            onDelete={taskHandlers.handleDeleteTask}
            onToggleSubtask={taskHandlers.handleToggleSubtask}
            onOpenNewTask={modalState.handleOpenNewTask}
            onOpenRewardStore={() => modalState.setIsRewardStoreOpen(true)}
          />
        )}

        {activeTab === 'events' && (
          <EventsTab
            events={events}
            onEdit={modalState.handleEditEvent}
            onOpenNewEvent={modalState.handleOpenNewEvent}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            familyMembers={state.familyMembers}
            currentUserId={currentUserId}
            presence={presence}
          />
        )}

        {activeTab === 'rewards' && (
          <MyRewardsTab
            rewardClaims={state.rewardClaims}
            rewards={state.rewards}
            familyMembers={state.familyMembers}
            currentUserId={currentUserId}
            isParent={['rogier', 'anne'].includes(state.activeUserId as string)}
            onApprove={rewardHandlers.handleApproveRewardClaim}
            onClaim={rewardHandlers.handleClaimReward}
          />
        )}

        {activeTab === 'log' && (
          <ActivityLogTab
            activityLog={state.activityLog}
            tasks={tasks}
            events={events}
            subtasksMap={state.subtasks}
            onTaskEdit={modalState.handleEditTask}
            onEventEdit={modalState.handleEditEvent}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        workCount={tasks.length}
        eventsCount={events.length}
        logCount={state.activityLog.length}
        rewardsCount={pendingClaimsCount}
      />

      <TaskModal
        task={modalState.editingTask}
        familyMembers={state.familyMembers}
        isOpen={modalState.isTaskModalOpen}
        onClose={modalState.handleCloseTaskModal}
        onSave={handleSaveTask}
        onDelete={taskHandlers.handleDeleteTask}
        currentUserId={currentUserId}
      />

      <EventModal
        event={modalState.editingEvent}
        familyMembers={state.familyMembers}
        isOpen={modalState.isEventModalOpen}
        onClose={modalState.handleCloseEventModal}
        onSave={handleSaveEvent}
        onDelete={eventHandlers.handleDeleteEvent}
      />

      <RewardStoreModal
        isOpen={modalState.isRewardStoreOpen}
        onClose={() => modalState.setIsRewardStoreOpen(false)}
        rewards={state.rewards}
        familyMembers={state.familyMembers}
        tokens={Object.fromEntries(
          state.familyMembers.map((m) => [m.id, getTokenBalance(m.id)])
        )}
        currentUserId={currentUserId}
        onRedeem={handleRedeemReward}
      />

      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      <DiagnosticsFooter isOnline={isOnline} />
    </div>
  )
}
