import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskListItem } from '@/components/v4/task-list-item'
import { Task, FamilyMember, Subtask } from '@/types/huisos-v2'

interface CompletedTasksDisclosureProps {
  completedTasks: Task[]
  familyMembers: FamilyMember[]
  subtasksMap: Record<string, Subtask[]>
  currentUserId: string
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => Promise<void>
  onToggleSubtask: (subtaskId: string) => Promise<void>
}

export function CompletedTasksDisclosure({
  completedTasks,
  familyMembers,
  subtasksMap,
  currentUserId,
  onEdit,
  onDelete,
  onToggleSubtask,
}: CompletedTasksDisclosureProps) {
  const [showCompleted, setShowCompleted] = useState(false)

  if (completedTasks.length === 0) return null

  return (
    <div className="mt-6">
      <button
        onClick={() => setShowCompleted(!showCompleted)}
        className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 text-sm hover:text-slate-300 transition-colors"
      >
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            showCompleted && 'rotate-180'
          )}
        />
        <span>
          {showCompleted
            ? 'Hide completed tasks'
            : `Show ${completedTasks.length} completed task${
                completedTasks.length === 1 ? '' : 's'
              }`}
        </span>
      </button>

      {showCompleted && (
        <div className="space-y-2 mt-3">
          {completedTasks.map((task) => (
            <div key={task.id} className="opacity-60">
              <TaskListItem
                task={task}
                familyMembers={familyMembers}
                subtasks={subtasksMap[task.id] || []}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={() => {}} // No-op for completed tasks
                onToggleSubtask={onToggleSubtask}
                currentUserId={currentUserId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
