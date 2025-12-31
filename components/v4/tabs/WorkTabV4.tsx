import { Task, FamilyMember, Subtask, Token } from '@/types/huisos-v2'
import { TaskListItem } from '@/components/task-list-item'
import { CompletedTasksDisclosure } from '@/components/v4/completed-tasks-disclosure'
import { TokenWidget } from '@/components/token-widget'

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
  const incompleteTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)

  const currentMember = familyMembers.find((m) => m.id === currentUserId)
  const memberTokens = tokens
    .filter((t) => t.member_id === currentUserId)
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {currentMember && (
        <TokenWidget
          tokens={memberTokens}
          memberName={currentMember.name}
          onOpenRewardStore={onOpenRewardStore}
        />
      )}

      {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No tasks yet</p>
          <button
            onClick={onOpenNewTask}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Create your first task
          </button>
        </div>
      ) : (
        <>
          {/* Incomplete tasks */}
          <div className="space-y-3">
            {incompleteTasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                assignees={task.assignee_ids?.map((id) =>
                  familyMembers.find((m) => m.id === id)
                ) || []}
                subtasks={subtasksMap[task.id] || []}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
                onToggleSubtask={onToggleSubtask}
              />
            ))}
          </div>

          {/* Completed tasks disclosure */}
          <CompletedTasksDisclosure
            completedTasks={completedTasks}
            familyMembers={familyMembers}
            subtasksMap={subtasksMap}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleSubtask={onToggleSubtask}
          />
        </>
      )}
    </div>
  )
}
