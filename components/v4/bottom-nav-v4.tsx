import { CheckSquare, Calendar, BarChart3, Gift, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavV4Props {
  activeTab: 'work' | 'events' | 'stats' | 'rewards' | 'log'
  onTabChange: (tab: 'work' | 'events' | 'stats' | 'rewards' | 'log') => void
  counts: {
    work: number
    events: number
    rewards: number
    log: number
  }
}

export function BottomNavV4({ activeTab, onTabChange, counts }: BottomNavV4Props) {
  const tabs = [
    { id: 'work' as const, icon: CheckSquare, label: 'Work', count: counts.work },
    { id: 'events' as const, icon: Calendar, label: 'Events', count: counts.events },
    { id: 'stats' as const, icon: BarChart3, label: 'Stats' },
    { id: 'rewards' as const, icon: Gift, label: 'Rewards', count: counts.rewards },
    { id: 'log' as const, icon: ScrollText, label: 'Log', count: counts.log },
  ]

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-40">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-xl shadow-black/20 h-20">
          <div className="flex items-center justify-around h-full px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 rounded-2xl h-16 flex-1 transition-all',
                  activeTab === tab.id
                    ? 'bg-slate-800/60 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-300'
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[11px] font-medium">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {tab.count > 99 ? '99+' : tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
