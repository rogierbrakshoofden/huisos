import { Task, FamilyMember, Token } from '@/types/huisos-v2'
import { TrendingUp, Award, CheckCircle2 } from 'lucide-react'

interface StatsTabV4Props {
  tasks: Task[]
  familyMembers: FamilyMember[]
  tokens: Token[]
}

export function StatsTabV4({ tasks, familyMembers, tokens }: StatsTabV4Props) {
  const completedTasks = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const getMemberStats = (memberId: string) => {
    const memberTasks = tasks.filter(t => {
      const assigneeIds = Array.isArray(t.assigned_to) ? t.assigned_to : [t.assigned_to]
      return assigneeIds.includes(memberId)
    })
    const completedCount = memberTasks.filter(t => t.completed).length
    const tokenBalance = tokens
      .filter(t => t.member_id === memberId)
      .reduce((sum, t) => sum + t.amount, 0)
    
    return { completedCount, tokenBalance }
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Task Completion</span>
              <span className="text-2xl font-bold text-white">{completionRate}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-2xl font-bold text-white">{completedTasks}</div>
              <div className="text-xs text-slate-400">Completed</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <Award className="w-5 h-5 text-amber-400 mb-2" />
              <div className="text-2xl font-bold text-white">{totalTasks - completedTasks}</div>
              <div className="text-xs text-slate-400">Remaining</div>
            </div>
          </div>
        </div>
      </div>

      {/* Member Stats */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 px-1">Family Members</h3>
        {familyMembers.map(member => {
          const stats = getMemberStats(member.id)
          const colorMap: Record<string, string> = {
            purple: 'bg-purple-600',
            green: 'bg-green-600',
            orange: 'bg-orange-600',
            yellow: 'bg-yellow-600',
            blue: 'bg-blue-600',
          }
          const bgColor = colorMap[member.color] || 'bg-slate-600'

          return (
            <div
              key={member.id}
              className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-sm`}>
                    {member.initials}
                  </div>
                  <div>
                    <div className="font-medium text-white">{member.name}</div>
                    <div className="text-sm text-slate-400">{stats.completedCount} tasks completed</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-400">{stats.tokenBalance}</div>
                  <div className="text-xs text-slate-400">tokens</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
