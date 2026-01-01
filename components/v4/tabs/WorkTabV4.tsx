import { Task, FamilyMember, Token, Subtask } from '@/types/huisos-v2'
import { TaskListItem } from '@/components/v4/task-list-item'
import { TokenWidgetV4 } from '@/components/v4/TokenWidgetV4'
import { CompletedTasksDisclosureV4 } from '@/components/v4/CompletedTasksDisclosureV4'
import { Plus } from 'lucide-react'

interface WorkTabV4Props {
  tasks: Task[]
  familyMembers: FamilyMember[]
  tokens: Token[]
  subtasksMap: Record<string, Subtask[]>
  currentUserId: string
  onComplete: (taskId: string) => Promise<void>
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => Promise<void>
  onToggleSubtask: (subtaskId: string) => Promise<void>
  onOpenNewTask: () => void
  onOpenRewardStore: () => void
}

export function WorkTabV4({
  tasks,
  familyMembers,
  tokens,
  subtasksMap,
  currentUserId,
  onComplete,
  onEdit,
  onDelete,
  onToggleSubtask,
  onOpenNewTask,
  onOpenRewardStore,
}: WorkTabV4Props) {
  const activeTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)

  // Calculate token balance for current user
  const tokenBalance = tokens
    .filter((t) => t.member_id === currentUserId)
    .reduce((sum, t) => sum + t.amount, 0)

  const currentMember = familyMembers.find((m) => m.id === currentUserId)
  const currentMemberName = currentMember?.name || 'Unknown'

  return (
    <div className="space-y-6 pb-6">
      {/* Token Widget */}
      <TokenWidgetV4
        memberName={currentMemberName}
        tokenBalance={tokenBalance}
        onOpenRewardStore={onOpenRewardStore}
      />

      {/* Active Tasks */}
      <div className="space-y-3">
        {activeTasks.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 backdrop-blur-md flex items-center justify-center">
              <Plus className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-slate-400 text-lg mb-2">All caught up!</p>
            <p className="text-slate-500 text-sm mb-6">No active tasks right now</p>
            <button
              onClick={onOpenNewTask}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-600/20"
            >
              Create First Task
            </button>
          </div>
        ) : (
          activeTasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              familyMembers={familyMembers}
              subtasks={subtasksMap[task.id] || []}
              onComplete={() => onComplete(task.id)}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task.id)}
              onToggleSubtask={onToggleSubtask}
            />
          ))
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <CompletedTasksDisclosureV4
          completedTasks={completedTasks}
          familyMembers={familyMembers}
          subtasksMap={subtasksMap}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleSubtask={onToggleSubtask}
          onComplete={onComplete}
        />
      )}
    </div>
  )
}
