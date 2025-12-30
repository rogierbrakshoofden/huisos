import { ActivityLogEntry, Task, Event } from '@/types/huisos-v2'

interface ActivityLogTabProps {
  activityLog: ActivityLogEntry[]
  tasks: Task[]
  events: Event[]
  subtasksMap: Map<string, any[]>
  onTaskEdit: (task: Task) => void
  onEventEdit: (event: Event) => void
}

export function ActivityLogTab({
  activityLog,
  tasks,
  events,
  subtasksMap,
  onTaskEdit,
  onEventEdit,
}: ActivityLogTabProps) {
  // Bug Fix #4: Make log entries clickable
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

  return (
    <div className="space-y-4">
      {activityLog.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activityLog.slice(0, 50).map((entry) => {
            const entityTitle = (entry.metadata as any)?.title as string | undefined
            
            return (
              <div
                key={entry.id}
                onClick={() => handleLogClick(entry)}
                className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 cursor-pointer hover:bg-slate-800/80 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                    {entry.actor?.initials || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">
                      <span className="font-medium">
                        {entry.actor?.name || 'Unknown'}
                      </span>
                      {' '}
                      <span className="text-slate-400">
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
