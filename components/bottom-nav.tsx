// components/bottom-nav.tsx
import React from 'react'
import { ListTodo, Calendar, Clock, Gift } from 'lucide-react'

interface BottomNavProps {
  activeTab: 'work' | 'events' | 'log' | 'rewards'
  onTabChange: (tab: 'work' | 'events' | 'log' | 'rewards') => void
  workCount: number
  eventsCount: number
  logCount: number
  rewardsCount?: number
}

export function BottomNav({
  activeTab,
  onTabChange,
  workCount,
  eventsCount,
  logCount,
  rewardsCount = 0,
}: BottomNavProps) {
  const tabs = [
    { id: 'work' as const, label: 'Work', icon: ListTodo, count: workCount },
    { id: 'events' as const, label: 'Events', icon: Calendar, count: eventsCount },
    { id: 'rewards' as const, label: 'Rewards', icon: Gift, count: rewardsCount },
    { id: 'log' as const, label: 'Log', icon: Clock, count: logCount },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div
        className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent pointer-events-none"
        style={{ height: '120px' }}
      />

      <div className="relative mx-4 mb-4 flex justify-center">
        <nav className="flex gap-2 bg-slate-900/50 border border-slate-800/50 rounded-full px-2 py-3 backdrop-blur-md shadow-2xl">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200
                  ${isActive
                    ? 'bg-slate-700/80 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                  }
                `}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`
                      ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                      ${isActive
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-800 text-slate-300'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
