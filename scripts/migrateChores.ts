import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function migrateChores() {
  console.log('Starting chores migration...')

  try {
    const { data: chores, error: fetchError } = await supabase
      .from('chores')
      .select('*')

    if (fetchError) {
      console.error('Error fetching chores:', fetchError)
      return
    }

    if (!chores || chores.length === 0) {
      console.log('No chores found to migrate.')
      return
    }

    console.log(`Found ${chores.length} chores to migrate.`)

    const tasksToInsert = chores.map((chore: any) => ({
      title: chore.name,
      recurrence_type: 'repeating',
      frequency: chore.frequency,
      assignee_ids: chore.eligible_member_ids,
      rotation_enabled: true,
      rotation_index: chore.current_member_idx,
      token_value: chore.token_value,
      created_by: null,
      created_at: chore.created_at,
    }))

    console.log(`Inserting ${tasksToInsert.length} tasks...`)
    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting tasks:', insertError)
      return
    }

    console.log(`Successfully migrated ${insertedTasks?.length || 0} chores to tasks!`)

    console.log('\nMigration Summary:')
    console.log(`- Chores migrated: ${tasksToInsert.length}`)
    console.log(`- All chores set as repeating tasks`)
    console.log(`- Rotation enabled for all`)
    console.log(`- Token values preserved`)
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

migrateChores().catch(console.error)
