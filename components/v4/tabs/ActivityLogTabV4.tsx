import { ActivityLogEntry, Task, Event, Subtask } from '@/types/huisos-v2'
import { History } from 'lucide-react'

interface ActivityLogTabV4Props {
  activityLog: ActivityLogEntry[]
  tasks: Task[]
  events: Event[]
  subtasksMap: Map<string, Subtask[]>
  onTaskEdit: (task: Task) => void
  onEventEdit: (event: Event) => void
}

export function ActivityLogTabV4({
  activityLog,
  tasks,
  events,
  subtasksMap,
  onTaskEdit,
  onEventEdit,
}: ActivityLogTabV4Props) {
  const handleLogClick = (entry: ActivityLogEntry) => {
    if (entry.entity_type === 'task' && entry.entity_id) {
      const task = tasks.find((t) => t.id === entry.entity_id)
      if (task) {
        onTaskEdit(task)
      }
    } else if (entry.entity_type === 'event' && entry.entity_id) {
      const event = events.find((e) => e.id === entry.entity_id)
      if (event) {
        onEventEdit(event)
      }
    }
    // Subtasks: open parent task
    else if (entry.entity_type === 'subtask' && entry.entity_id) {
      for (const [taskId, subtasks] of subtasksMap) {
        const hasSubtask = subtasks.some((s) => s.id === entry.entity_id)
        if (hasSubtask) {
          const task = tasks.find((t) => t.id === taskId)
          if (task) {
            onTaskEdit(task)
            break
          }
        }
      }
    }
  }

  const getActionColor = (actionType: string) => {
    if (actionType.includes('completed')) return 'text-emerald-400'
    if (actionType.includes('created')) return 'text-blue-400'
    if (actionType.includes('deleted')) return 'text-red-400'
    return 'text-slate-400'
  }

  return (
    <div className="space-y-6">
      {activityLog.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activityLog.slice(0, 50).map((entry) => {
            const entityTitle = (entry.metadata as any)?.title as string | undefined
            const actionColor = getActionColor(entry.action_type)
            
            return (
              <button
                key={entry.id}
                onClick={() => handleLogClick(entry)}
                className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 hover:bg-slate-800/60 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                    {entry.actor?.initials || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">
                      <span className="font-medium">
                        {entry.actor?.name || 'Unknown'}
                      </span>
                      {' '}
                      <span className={actionColor}>
                        {entry.action_type.replace(/_/g, ' ')}
                      </span>
                      {entityTitle && (
                        <>
                          {' '}
                          <span className="text-slate-300">
                            "{entityTitle}"
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(entry.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
