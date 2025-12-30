import { Event } from '@/types/huisos-v2'

interface EventsTabProps {
  events: Event[]
  onEdit: (event: Event) => void
  onOpenNewEvent: () => void
}

export function EventsTab({ events, onEdit, onOpenNewEvent }: EventsTabProps) {
  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No events</p>
          <button
            onClick={onOpenNewEvent}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          >
            + Add Event
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/80 transition-all duration-200 cursor-pointer"
              onClick={() => onEdit(event)}
            >
              <div className="font-medium text-white mb-1">
                {event.title}
              </div>
              <div className="text-sm text-slate-400">
                {event.all_day
                  ? new Date(event.datetime || '').toLocaleDateString()
                  : new Date(event.datetime || '').toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
