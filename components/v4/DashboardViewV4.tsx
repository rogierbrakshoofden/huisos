import { HeaderV4 } from '@/components/v4/header-v4'
import { BottomNavV4 } from '@/components/v4/bottom-nav-v4'
import { SyncIndicatorV4 } from '@/components/v4/sync-indicator-v4'
import { TaskModalV4 } from '@/components/v4/modals/TaskModalV4'
import { EventModalV4 } from '@/components/v4/modals/EventModalV4'
import { RewardStoreModalV4 } from '@/components/v4/modals/RewardStoreModalV4'
import { WorkTabV4 } from '@/components/v4/tabs/WorkTabV4'
import { EventsTabV4 } from '@/components/v4/tabs/EventsTabV4'
import { StatsTabV4 } from '@/components/v4/tabs/StatsTabV4'
import { ActivityLogTabV4 } from '@/components/v4/tabs/ActivityLogTabV4'
import { RewardsTabV4 } from '@/components/v4/tabs/RewardsTabV4'
import { ToastContainer } from '@/lib/toast'
import { Task, Event, AppState } from '@/types/huisos-v2'

interface DashboardViewV4Props {
  // State
  state: AppState
  tasks: Task[]
  events: Event[]
  presence: Record<string, { is_home: boolean; note?: string }>
  currentUserId: string
  pendingClaimsCount: number
  isLoading: boolean
  isOnline: boolean
  syncError?: string
  lastSyncedAt?: Date

  // Modal state
  modalState: {
    isTaskModalOpen: boolean
    editingTask: Task | null
    handleOpenNewTask: () => void
    handleEditTask: (task: Task) => void
    handleCloseTaskModal: () => void
    isEventModalOpen: boolean
    editingEvent: Event | null
    handleOpenNewEvent: () => void
    handleEditEvent: (event: Event) => void
    handleCloseEventModal: () => void
    isRewardStoreOpen: boolean
    setIsRewardStoreOpen: (open: boolean) => void
    apiError: string | null
    setApiError: (error: string | null) => void
  }

  // Navigation handlers
  setActiveTab: (tab: 'work' | 'events' | 'stats' | 'log' | 'rewards') => void
  switchUser: (userId: string | 'everybody') => void

  // Task handlers
  onCompleteTask: (taskId: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  onToggleSubtask: (subtaskId: string) => Promise<void>
  onSaveTask: (taskData: Partial<Task>) => Promise<void>

  // Event handlers
  onSaveEvent: (eventData: Partial<Event>) => Promise<void>
  onDeleteEvent: (eventId: string) => Promise<void>

  // Reward handlers
  onRedeemReward: (rewardId: string) => Promise<void>
  onApproveRewardClaim: (claimId: string) => Promise<void>
  onClaimReward: (claimId: string) => Promise<void>

  // Utility functions
  getTokenBalance: (memberId: string) => number

  // Toast
  toasts: any[]
  setToasts: (toasts: any[] | ((prev: any[]) => any[])) => void
}

export function DashboardViewV4({
  state,
  tasks,
  events,
  presence,
  currentUserId,
  pendingClaimsCount,
  isLoading,
  isOnline,
  syncError,
  lastSyncedAt,
  modalState,
  setActiveTab,
  switchUser,
  onCompleteTask,
  onDeleteTask,
  onToggleSubtask,
  onSaveTask,
  onSaveEvent,
  onDeleteEvent,
  onRedeemReward,
  onApproveRewardClaim,
  onClaimReward,
  getTokenBalance,
  toasts,
  setToasts,
}: DashboardViewV4Props) {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-slate-300 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading HuisOS...</p>
        </div>
      </div>
    )
  }

  // Convert Map to Record for WorkTabV4
  const subtasksRecord: Record<string, any[]> = {}
  if (state.subtasks instanceof Map) {
    state.subtasks.forEach((value, key) => {
      subtasksRecord[key] = value
    })
  } else {
    Object.assign(subtasksRecord, state.subtasks)
  }

  // Get current member name for TokenWidget
  const currentMember = state.familyMembers.find(m => m.id === currentUserId)
  const currentMemberName = currentMember?.name || 'Unknown'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Fixed header with safe area - accounts for notch + header */}
      <HeaderV4
        activeUserId={state.activeUserId}
        familyMembers={state.familyMembers}
        onUserChange={switchUser}
        onTaskClick={modalState.handleOpenNewTask}
        onEventClick={modalState.handleOpenNewEvent}
      />

      {/* Error notifications */}
      {(syncError || modalState.apiError) && (
        <div className="fixed top-20 left-0 right-0 mx-auto max-w-sm z-40 m-4">
          <div className="bg-red-900/80 backdrop-blur-md border border-red-700 text-red-100 px-4 py-3 rounded-xl text-sm shadow-lg">
            {modalState.apiError || syncError}
          </div>
        </div>
      )}

      {/* Main content area - pt-[calc(env(safe-area-inset-top)+4rem)] accounts for safe area + 64px header */}
      <main className="max-w-2xl mx-auto px-4 pt-[calc(env(safe-area-inset-top)+4rem)] pb-28">
        {state.activeTab === 'work' && (
          <WorkTabV4
            tasks={tasks}
            familyMembers={state.familyMembers}
            tokens={state.tokens}
            subtasksMap={subtasksRecord}
            currentUserId={currentUserId}
            onComplete={onCompleteTask}
            onEdit={modalState.handleEditTask}
            onDelete={onDeleteTask}
            onToggleSubtask={onToggleSubtask}
            onOpenNewTask={modalState.handleOpenNewTask}
            onOpenRewardStore={() => modalState.setIsRewardStoreOpen(true)}
          />
        )}

        {state.activeTab === 'events' && (
          <EventsTabV4
            events={events}
            onEdit={modalState.handleEditEvent}
            onOpenNewEvent={modalState.handleOpenNewEvent}
          />
        )}

        {state.activeTab === 'stats' && (
          <StatsTabV4
            tasks={state.tasks}
            familyMembers={state.familyMembers}
            tokens={state.tokens}
          />
        )}

        {state.activeTab === 'log' && (
          <ActivityLogTabV4
            activityLog={state.activityLog}
            tasks={tasks}
            events={events}
            subtasksMap={state.subtasks}
            onTaskEdit={modalState.handleEditTask}
            onEventEdit={modalState.handleEditEvent}
          />
        )}

        {state.activeTab === 'rewards' && (
          <RewardsTabV4
            rewards={state.rewards}
            rewardClaims={state.rewardClaims}
            familyMembers={state.familyMembers}
            currentUserId={currentUserId}
            tokenBalance={getTokenBalance(currentUserId)}
            onRedeemReward={onRedeemReward}
            onApproveRewardClaim={onApproveRewardClaim}
          />
        )}
      </main>

      {/* Bottom navigation with new design */}
      <BottomNavV4
        activeTab={state.activeTab}
        onTabChange={setActiveTab}
        counts={{
          work: tasks.filter((t) => !t.completed).length,
          events: events.length,
          rewards: pendingClaimsCount,
          log: state.activityLog.length,
        }}
      />

      {/* Sync indicator at bottom */}
      <SyncIndicatorV4
        isOnline={isOnline}
        lastSyncedAt={lastSyncedAt}
        syncError={syncError}
      />

      {/* Modals with v4 styling */}
      <TaskModalV4
        task={modalState.editingTask}
        familyMembers={state.familyMembers}
        isOpen={modalState.isTaskModalOpen}
        onClose={modalState.handleCloseTaskModal}
        onSave={onSaveTask}
        onDelete={onDeleteTask}
        currentUserId={currentUserId}
      />

      <EventModalV4
        event={modalState.editingEvent}
        familyMembers={state.familyMembers}
        isOpen={modalState.isEventModalOpen}
        onClose={modalState.handleCloseEventModal}
        onSave={onSaveEvent}
        onDelete={onDeleteEvent}
      />

      <RewardStoreModalV4
        isOpen={modalState.isRewardStoreOpen}
        onClose={() => modalState.setIsRewardStoreOpen(false)}
        rewards={state.rewards}
        tokenBalance={getTokenBalance(currentUserId)}
        onRedeemReward={onRedeemReward}
      />

      {/* Toast notifications */}
      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  )
}
