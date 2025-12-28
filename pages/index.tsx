import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FamilyMemberCircle } from '@/components/family-member-circle'
import type { Database } from '@/types/database'
import confetti from 'canvas-confetti'

type FamilyMember = Database['public']['Tables']['family_members']['Row']
type Chore = Database['public']['Tables']['chores']['Row']

interface ChoreWithAssignee extends Chore {
  assignee: FamilyMember | null
}

export default function Dashboard() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [chores, setChores] = useState<ChoreWithAssignee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Load family members
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at')

      if (membersError) throw membersError

      // Load chores
      const { data: choresData, error: choresError } = await supabase
        .from('chores')
        .select('*')
        .order('created_at')

      if (choresError) throw choresError

      // Explicitly type the data
      const typedChoresData = (choresData || []) as Chore[]
      const typedMembersData = (membersData || []) as FamilyMember[]

      // Match assignees to chores
      const choresWithAssignees: ChoreWithAssignee[] = typedChoresData.map((chore) => {
        const assigneeId = chore.eligible_member_ids[chore.current_member_idx]
        const assignee = typedMembersData.find((m) => m.id === assigneeId) || null
        return { ...chore, assignee }
      })

      setMembers(typedMembersData)
      setChores(choresWithAssignees)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function completeChore(chore: ChoreWithAssignee) {
    if (!chore.assignee) return

    try {
      // Create completion record
      const { error: completionError } = await supabase
        .from('chore_completions')
        .insert({
          chore_id: chore.id,
          member_id: chore.assignee.id,
          date: new Date().toISOString().split('T')[0],
        })

      if (completionError) throw completionError

      // Award tokens if Quinten
      if (chore.assignee.initials === 'Q') {
        await supabase.from('tokens').insert({
          member_id: chore.assignee.id,
          amount: chore.token_value,
          reason: `Completed: ${chore.name}`,
        })
      }

      // Rotate to next person
      const nextIdx = (chore.current_member_idx + 1) % chore.eligible_member_ids.length
      const { error: updateError } = await supabase
        .from('chores')
        .update({
          current_member_idx: nextIdx,
          last_completed_at: new Date().toISOString(),
          delegated_to: null,
          delegation_note: null,
        })
        .eq('id', chore.id)

      if (updateError) throw updateError

      // Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      // Reload data
      await loadData()
    } catch (error) {
      console.error('Error completing chore:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">HuisOS</h1>
          <p className="text-muted-foreground">Family Dashboard</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's Chores */}
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Chores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chores.map((chore) => (
                  <div
                    key={chore.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <Checkbox
                      id={chore.id}
                      onCheckedChange={() => completeChore(chore)}
                    />
                    <label
                      htmlFor={chore.id}
                      className="flex-1 cursor-pointer select-none"
                    >
                      <p className="font-medium">{chore.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {chore.frequency.replace('_', ' ')}
                      </p>
                    </label>
                    {chore.assignee && (
                      <FamilyMemberCircle
                        initials={chore.assignee.initials}
                        color={chore.assignee.color}
                        size="sm"
                      />
                    )}
                  </div>
                ))}
                {chores.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No chores for today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Family Members */}
          <Card>
            <CardHeader>
              <CardTitle>Family</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <FamilyMemberCircle
                      initials={member.initials}
                      color={member.color}
                      size="md"
                    />
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.initials}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
