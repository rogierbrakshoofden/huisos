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
import { ToastContainer } from '@/lib/toast'
import { Task, Event, AppState } from '@/types/huisos-v2'

interface DashboardViewProps {
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
  onCompleteTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onToggleSubtask: (subtaskId: string) => void
  onSaveTask: (taskData: Partial<Task>) => Promise<void>
  
  // Event handlers
  onSaveEvent: (eventData: Partial<Event>) => Promise<void>
  onDeleteEvent: (eventId: string) => void
  
  // Reward handlers
  onRedeemReward: (rewardId: string) => Promise<void>
  onApproveRewardClaim: (claimId: string) => void
  onClaimReward: (claimId: string) => void
  
  // Utility functions
  getTokenBalance: (memberId: string) => number
  
  // Toast
  toasts: any[]
  setToasts: (toasts: any[] | ((prev: any[]) => any[])) => void
}

export function DashboardView({
  state,
  tasks,
  events,
  presence,
  currentUserId,
  pendingClaimsCount,
  isLoading,
  isOnline,
  syncError,
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
}: DashboardViewProps) {
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

        {state.activeTab === 'work' && (
          <WorkTab
            tasks={tasks}
            familyMembers={state.familyMembers}
            tokens={state.tokens}
            subtasksMap={state.subtasks}
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
          <EventsTab
            events={events}
            onEdit={modalState.handleEditEvent}
            onOpenNewEvent={modalState.handleOpenNewEvent}
          />
        )}

        {state.activeTab === 'stats' && (
          <StatsTab
            familyMembers={state.familyMembers}
            currentUserId={currentUserId}
            presence={presence}
          />
        )}

        {state.activeTab === 'rewards' && (
          <MyRewardsTab
            rewardClaims={state.rewardClaims}
            rewards={state.rewards}
            familyMembers={state.familyMembers}
            currentUserId={currentUserId}
            isParent={['rogier', 'anne'].includes(state.activeUserId as string)}
            onApprove={onApproveRewardClaim}
            onClaim={onClaimReward}
          />
        )}

        {state.activeTab === 'log' && (
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
        activeTab={state.activeTab}
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
        onSave={onSaveTask}
        onDelete={onDeleteTask}
        currentUserId={currentUserId}
      />

      <EventModal
        event={modalState.editingEvent}
        familyMembers={state.familyMembers}
        isOpen={modalState.isEventModalOpen}
        onClose={modalState.handleCloseEventModal}
        onSave={onSaveEvent}
        onDelete={onDeleteEvent}
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
        onRedeem={onRedeemReward}
      />

      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      <DiagnosticsFooter isOnline={isOnline} />
    </div>
  )
}
