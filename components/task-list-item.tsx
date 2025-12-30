// components/task-list-item.tsx
'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Repeat } from 'lucide-react'
import { Task, Subtask, FamilyMember } from '@/types/huisos-v2'
import { AssigneeCircles } from '@/components/assignee-circles'
import { SubtaskProgressPie } from '@/components/subtask-progress-pie'
import { getNextAssignee } from '@/lib/rotation-utils'

interface TaskListItemProps {
  task: Task
  subtasks?: Subtask[]
  familyMembers: FamilyMember[]
  onComplete: (taskId: string) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onToggleSubtask?: (subtaskId: string) => void
  currentUserId?: string
}

export function TaskListItem({
  task,
  subtasks = [],
  familyMembers,
  onComplete,
  onEdit,
  onDelete,
  onToggleSubtask,
  currentUserId,
}: TaskListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [completingSubtaskId, setCompletingSubtaskId] = useState<string | null>(null)

  const completedCount = subtasks.filter((s) => s.completed).length
  
  // Get assignee IDs (handle both array and legacy string format)
  const assigneeIds = Array.isArray(task.assigned_to) 
    ? task.assigned_to 
    : task.assigned_to 
      ? [task.assigned_to] 
      : []
  
  // Get the primary assignee color for progress pie
  const primaryAssignee = familyMembers.find(m => m.id === assigneeIds[0])
  const assigneeColor = primaryAssignee?.color || '#8B5CF6'

  const daysUntilDue = task.due_date
    ? Math.ceil(
        (new Date(task.due_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  const isOverdue = daysUntilDue !== null && daysUntilDue < 0
  
  // Check if task has rotation enabled
  const isRotating = task.rotation_enabled && task.recurrence_type === 'repeating'
  const nextAssignee = isRotating ? getNextAssignee(task, familyMembers) : null

  const handleCompleteSubtask = async (subtaskId: string) => {
    setCompletingSubtaskId(subtaskId)
    try {
      const response = await fetch('/api/subtasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtask_id: subtaskId,
          completed_by: currentUserId,
        }),
      })

      if (response.ok) {
        onToggleSubtask?.(subtaskId)
      }
    } catch (err) {
      console.error('Failed to complete subtask:', err)
    } finally {
      setCompletingSubtaskId(null)
    }
  }

  return (
    <div
      className={`
        rounded-lg border transition-all duration-200
        ${
          task.completed
            ? 'bg-slate-800/30 border-slate-800/30'
            : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800/80'
        }
      `}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Main task checkbox - always visible */}
        <button
          onClick={() => onComplete(task.id)}
          className={`
            w-6 h-6 rounded border-2 flex items-center justify-center
            transition-all duration-200 flex-shrink-0
            ${
              task.completed
                ? 'bg-emerald-600 border-emerald-500'
                : 'border-slate-600 hover:border-slate-500'
            }
          `}
        >
          {task.completed && <span className="text-white text-sm">✓</span>}
        </button>

        {/* Assignee circles - moved to left */}
        <div className="flex-shrink-0">
          <AssigneeCircles
            assigneeIds={assigneeIds}
            familyMembers={familyMembers}
            size="sm"
            max={3}
          />
        </div>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div
            className={`
              font-medium transition-all
              ${task.completed ? 'text-slate-500 line-through' : 'text-white'}
            `}
          >
            {task.title}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
            {/* Rotation badge */}
            {isRotating && nextAssignee && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-200"
                title={`Next up: ${nextAssignee.name}`}
              >
                <Repeat size={12} />
                Next: {nextAssignee.name}
              </span>
            )}
            
            {/* Due date */}
            {task.due_date && (
              <span
                className={`
                  px-2 py-0.5 rounded-full
                  ${
                    isOverdue
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
          </div>
        </div>

        {/* Progress pie - on the right if has subtasks */}
        {subtasks.length > 0 && (
          <div className="flex-shrink-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <SubtaskProgressPie
              completed={completedCount}
              total={subtasks.length}
              color={assigneeColor}
              size="md"
            />
          </div>
        )}

        {/* Expand button (if has subtasks) */}
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

        {/* Edit button */}
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

      {/* Subtasks expanded view */}
      {isExpanded && subtasks.length > 0 && (
        <div className="border-t border-slate-700/50 px-4 py-3 space-y-2 bg-slate-900/20">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors"
            >
              <button
                onClick={() => handleCompleteSubtask(subtask.id)}
                disabled={completingSubtaskId === subtask.id}
                className={`
                  w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                  transition-all duration-200 disabled:opacity-50
                  ${
                    subtask.completed
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
                  ${
                    subtask.completed
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
