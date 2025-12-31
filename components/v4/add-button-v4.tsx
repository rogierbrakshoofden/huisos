import { useState } from 'react'
import { Plus, CheckSquare, Calendar } from 'lucide-react'

interface AddButtonV4Props {
  onTaskClick: () => void
  onEventClick: () => void
}

export function AddButtonV4({ onTaskClick, onEventClick }: AddButtonV4Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center transition-all hover:scale-105"
      >
        <Plus className={`w-5 h-5 text-white transition-transform ${isOpen ? 'rotate-45' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-12 right-0 z-50 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
            <button
              onClick={() => {
                onTaskClick()
                setIsOpen(false)
              }}
              className="w-full px-6 py-3 text-left text-white hover:bg-slate-800/60 transition-colors flex items-center gap-3"
            >
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <span>Add Task</span>
            </button>
            <button
              onClick={() => {
                onEventClick()
                setIsOpen(false)
              }}
              className="w-full px-6 py-3 text-left text-white hover:bg-slate-800/60 transition-colors flex items-center gap-3 border-t border-slate-700/50"
            >
              <Calendar className="w-5 h-5 text-blue-400" />
              <span>Add Event</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
