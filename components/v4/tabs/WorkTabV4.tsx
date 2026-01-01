import { Task, FamilyMember, Token, Subtask } from '@/types/huisos-v2'
import { TaskListItem } from '@/components/v4/task-list-item'
import { TokenWidgetV4 } from '@/components/v4/token-widget-v4'
import { CompletedTasksDisclosureV4 } from '@/components/v4/completed-tasks-disclosure-v4'
import { Plus } from 'lucide-react'

interface WorkTabV4Props {
  tasks: Task[]
  familyMembers: FamilyMember[]
  tokens: Token[]
  subtasksMap: Record<string, Subtask[]>
  currentUserId: string
  onComplete: (taskId: string) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onToggleSubtask?: (subtaskId: string) => void
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
  const activeTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  const currentMember = familyMembers.find(m => m.id === currentUserId)
  const currentMemberName = currentMember?.name || 'Unknown'

  return (
    <div className="space-y-6">
      {/* Token Widget */}
      <TokenWidgetV4
        tokens={tokens}
        memberId={currentUserId}
        memberName={currentMemberName}
        onOpenRewardStore={onOpenRewardStore}
      />

      {/* Active Tasks */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3 px-1">To Do</h2>
        {activeTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-slate-800/50 backdrop-blur-md border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-slate-500 mb-4">No tasks yet</p>
            <button
              onClick={onOpenNewTask}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold shadow-lg shadow-blue-600/20"
            >
              Create Your First Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.map(task => (
              <TaskListItem
                key={task.id}
                task={task}
                subtasks={subtasksMap[task.id] || []}
                familyMembers={familyMembers}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleSubtask={onToggleSubtask}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      <CompletedTasksDisclosureV4
        tasks={completedTasks}
        familyMembers={familyMembers}
        subtasksMap={subtasksMap}
        onEdit={onEdit}
        onDelete={onDelete}
        onComplete={onComplete}
        onToggleSubtask={onToggleSubtask}
        currentUserId={currentUserId}
      />
    </div>
  )
}
