import { Task, FamilyMember, Token } from '@/types/huisos-v2'
import { TaskListItem } from '@/components/task-list-item'
import { TokenWidget } from '@/components/token-widget'

interface WorkTabProps {
  tasks: Task[]
  familyMembers: FamilyMember[]
  tokens: Token[]
  subtasksMap: Map<string, any[]>
  currentUserId: string
  onComplete: (taskId: string) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onToggleSubtask: (subtaskId: string) => void
  onOpenNewTask: () => void
  onOpenRewardStore: () => void
}

export function WorkTab({
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
}: WorkTabProps) {
  const getTaskAssignees = (task: Task) => {
    if (!task.assigned_to) return []
    return familyMembers.filter((m) => m.id === task.assigned_to)
  }

  return (
    <div className="space-y-4">
      {/* Task list appears FIRST (Bug Fix #2) */}
      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No tasks</p>
          <button
            onClick={onOpenNewTask}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            + Add Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              subtasks={subtasksMap.get(task.id) || []}
              assignees={getTaskAssignees(task)}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleSubtask={onToggleSubtask}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Token widget and reward button MOVED BELOW tasks (Bug Fix #2) */}
      <div className="mt-6 space-y-3">
        <TokenWidget familyMembers={familyMembers} tokens={tokens} />
        <button
          onClick={onOpenRewardStore}
          className="w-full px-4 py-3 rounded-lg bg-amber-600/20 border border-amber-600/50 text-amber-300 hover:bg-amber-600/30 transition-colors text-sm font-medium"
        >
          🎁 Visit Reward Store
        </button>
      </div>
    </div>
  )
}
