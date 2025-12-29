// components/task-list-item.tsx
import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Task, Subtask, FamilyMember } from '@/types/huisos-v2'
import { FamilyMemberCircle } from '@/components/family-member-circle'

interface TaskListItemProps {
  task: Task
  subtasks?: Subtask[]
  assignees: FamilyMember[]
  onComplete: (taskId: string) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onToggleSubtask?: (subtaskId: string) => void
  currentUserId?: string
}

export function TaskListItem({
  task,
  subtasks = [],
  assignees,
  onComplete,
  onEdit,
  onDelete,
  onToggleSubtask,
  currentUserId,
}: TaskListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const subtaskProgress =
    subtasks.length > 0
      ? Math.round((subtasks.filter((s) => s.completed).length / subtasks.length) * 100)
      : 0

  const daysUntilDue = task.due_date
    ? Math.ceil(
        (new Date(task.due_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  const isOverdue = daysUntilDue !== null && daysUntilDue < 0

  return (
    <div
      className={`
        rounded-lg border transition-all duration-200
        ${task.completed
          ? 'bg-slate-800/30 border-slate-800/30'
          : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800/80'
        }
      `}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => onComplete(task.id)}
          className={`
            w-6 h-6 rounded border-2 flex items-center justify-center
            transition-all duration-200 flex-shrink-0
            ${task.completed
              ? 'bg-emerald-600 border-emerald-500'
              : 'border-slate-600 hover:border-slate-500'
            }
          `}
        >
          {task.completed && <span className="text-white text-sm">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div
            className={`
              font-medium transition-all
              ${task.completed ? 'text-slate-500 line-through' : 'text-white'}
            `}
          >
            {task.title}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
            {task.recurrence_type === 'repeating' && (
              <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300">
                {task.frequency || 'Repeating'}
              </span>
            )}

            {task.due_date && (
              <span
                className={`
                  px-2 py-0.5 rounded-full
                  ${isOverdue
                    ? 'bg-red-900/50 text-red-200'
                    : daysUntilDue === 0
                      ? 'bg-amber-900/50 text-amber-200'
                      : 'bg-slate-700/50 text-slate-300'
                    }
                `}
              >
                {daysUntilDue === 0 ? 'Due today' : `Due in ${daysUntilDue} days`}
              </span>
            )}

            {task.token_value > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-200">
                +{task.token_value} 🎫
              </span>
            )}
          </div>
        </div>

        {subtasks.length > 0 && (
          <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
            <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-700"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(subtaskProgress / 100) * 283}`}
                strokeDashoffset="0"
                className="text-emerald-500 transition-all duration-300"
              />
            </svg>
            <span className="absolute text-xs font-bold text-slate-300">
              {subtasks.filter((s) => s.completed).length}/{subtasks.length}
            </span>
          </div>
        )}

        <div className="flex gap-1 flex-shrink-0">
          {assignees.slice(0, 2).map((member) => (
            <FamilyMemberCircle
              key={member.id}
              member={member}
              size="sm"
              showInitials
            />
          ))}
          {assignees.length > 2 && (
            <div
              className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300"
              title={`${assignees.length - 2} more`}
            >
              +{assignees.length - 2}
            </div>
          )}
        </div>

        {subtasks.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-700/50 rounded transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </button>
        )}

        <button
          onClick={() => onEdit(task)}
          className="p-1 hover:bg-slate-700/50 rounded transition-colors flex-shrink-0"
        >
          <svg
            className="w-4 h-4 text-slate-400 hover:text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {isExpanded && subtasks.length > 0 && (
        <div className="border-t border-slate-700/50 px-4 py-3 space-y-2 bg-slate-900/20">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors"
            >
              <button
                onClick={() => onToggleSubtask?.(subtask.id)}
                className={`
                  w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                  transition-all duration-200
                  ${subtask.completed
                    ? 'bg-emerald-600 border-emerald-500'
                    : 'border-slate-500 hover:border-slate-400'
                    }
                `}
              >
                {subtask.completed && (
                  <span className="text-white text-xs">✓</span>
                )}
              </button>
              <span
                className={`
                  text-sm flex-1
                  ${subtask.completed
                    ? 'text-slate-500 line-through'
                    : 'text-slate-300'
                    }
                `}
              >
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
