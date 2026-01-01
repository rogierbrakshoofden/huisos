import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Task, FamilyMember, Subtask } from '@/types/huisos-v2'
import { TaskListItem } from '@/components/v4/task-list-item'

interface CompletedTasksDisclosureV4Props {
  tasks: Task[]
  familyMembers: FamilyMember[]
  subtasksMap: Record<string, Subtask[]>
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onComplete: (taskId: string) => void
  onToggleSubtask?: (subtaskId: string) => void
  currentUserId?: string
}

export function CompletedTasksDisclosureV4({
  tasks,
  familyMembers,
  subtasksMap,
  onEdit,
  onDelete,
  onComplete,
  onToggleSubtask,
  currentUserId,
}: CompletedTasksDisclosureV4Props) {
  const [isOpen, setIsOpen] = useState(false)

  if (tasks.length === 0) return null

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl hover:bg-slate-800/60 transition-all"
      >
        <span className="text-sm font-medium text-slate-400">
          Completed ({tasks.length})
        </span>
        {isOpen ? (
          <ChevronUp size={18} className="text-slate-400" />
        ) : (
          <ChevronDown size={18} className="text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {tasks.map(task => (
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
  )
}
