import { Event } from '@/types/huisos-v2'
import { Calendar } from 'lucide-react'

interface EventsTabV4Props {
  events: Event[]
  onEdit: (event: Event) => void
  onOpenNewEvent: () => void
}

export function EventsTabV4({ events, onEdit, onOpenNewEvent }: EventsTabV4Props) {
  const upcomingEvents = events
    .filter(e => new Date(e.datetime || '') >= new Date())
    .sort((a, b) => new Date(a.datetime || '').getTime() - new Date(b.datetime || '').getTime())

  return (
    <div className="space-y-6">
      {upcomingEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No upcoming events</p>
          <button
            onClick={onOpenNewEvent}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Create your first event
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => onEdit(event)}
              className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 hover:bg-slate-800/60 transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white mb-1">
                    {event.title}
                  </div>
                  <div className="text-sm text-slate-400">
                    {event.all_day
                      ? new Date(event.datetime || '').toLocaleDateString()
                      : new Date(event.datetime || '').toLocaleString()}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
