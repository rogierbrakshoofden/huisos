# Phase 8: Quick Integration Reference

**Last Updated:** January 3, 2026  
**Status:** Components Ready → Integration Needed

---

## 🚀 Quick Start (Copy-Paste Ready)

### Step 1: Add to TaskModalV4.tsx

```typescript
// At top with other imports:
import { RotationConfigSection } from './RotationConfigSection'
import { RotationPreview } from './RotationPreview'
import type { RotationConfig } from '@/types/huisos-v2'

// In component state:
const [rotationConfig, setRotationConfig] = useState<RotationConfig | null>(
  editingTask?.rotation_config || null
)

// Add handler:
const handleRotationConfigChange = (config: RotationConfig) => {
  setRotationConfig(config)
  setEditingTask({ ...editingTask, rotation_config: config })
}

// In Tabs (add new tab):
<TabsContent value="rotation">
  <RotationConfigSection
    rotationConfig={rotationConfig}
    familyMembers={familyMembers}
    taskTitle={editingTask?.title || ''}
    onConfigChange={handleRotationConfigChange}
    disabled={isLoading}
  />
  {rotationConfig?.enabled && (
    <RotationPreview
      rotationConfig={rotationConfig}
      familyMembers={familyMembers}
    />
  )}
</TabsContent>

// In save handler - update taskData:
const taskData = {
  title: editingTask.title,
  // ... other fields
  rotation_config: rotationConfig, // ← ADD THIS
}
```

### Step 2: Add to task-list-item.tsx

```typescript
// Import:
import { RotationDisplay } from '../RotationDisplay'

// State for advance rotation:
const [advancingRotationId, setAdvancingRotationId] = useState<string | null>(null)

// Handler:
const handleAdvanceRotation = async (taskId: string) => {
  try {
    setAdvancingRotationId(taskId)
    const task = tasks.find(t => t.id === taskId)
    if (!task?.rotation_config) return

    const nextIndex = (task.rotation_config.current_index + 1) % 
                     task.rotation_config.rotation_order.length
    
    const { error } = await supabase
      .from('tasks')
      .update({
        rotation_config: {
          ...task.rotation_config,
          current_index: nextIndex,
        },
      })
      .eq('id', taskId)

    if (error) throw error
    
    // Re-fetch or update state
    await refetchTasks()
  } catch (error) {
    console.error('Failed to advance rotation:', error)
  } finally {
    setAdvancingRotationId(null)
  }
}

// In JSX - after task details:
{task.rotation_config?.enabled && (
  <RotationDisplay
    task={task}
    rotationConfig={task.rotation_config}
    familyMembers={familyMembers}
    onAdvanceRotation={handleAdvanceRotation}
    loading={advancingRotationId === task.id}
  />
)}
```

### Step 3: Update Task Save Handler

```typescript
const handleSaveTask = async () => {
  try {
    const taskData = {
      title: editingTask.title,
      description: editingTask.description,
      assignee_ids: editingTask.assignee_ids,
      rotation_config: rotationConfig, // ← CRITICAL
      due_date: editingTask.due_date,
      category: editingTask.category,
      // ... other fields
    }

    if (editingTask.id) {
      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingTask.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert([taskData])
      if (error) throw error
    }

    toast.success('Task saved!')
    onClose()
  } catch (error) {
    console.error('Error saving task:', error)
    toast.error('Failed to save task')
  }
}
```

### Step 4: Update Task Load Handler

```typescript
const handleLoadTask = async (taskId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (data) {
    setEditingTask(data)
    setRotationConfig(data.rotation_config || null) // ← ADD THIS
  }
}
```

---

## ✅ Integration Checklist

### TaskModalV4

- [ ] Import RotationConfigSection
- [ ] Import RotationPreview
- [ ] Import RotationConfig type
- [ ] Add state: `rotationConfig`
- [ ] Add handler: `handleRotationConfigChange`
- [ ] Add Tabs option: rotation
- [ ] Add TabsContent: rotation
- [ ] Update save handler to include rotation_config
- [ ] Update load handler to include rotation_config
- [ ] Test create new task
- [ ] Test edit existing task
- [ ] Test save/load cycle

### task-list-item.tsx

- [ ] Import RotationDisplay
- [ ] Add state: `advancingRotationId`
- [ ] Add handler: `handleAdvanceRotation`
- [ ] Add RotationDisplay to JSX
- [ ] Pass required props
- [ ] Test rotation displays
- [ ] Test advance button
- [ ] Test confirmation dialog
- [ ] Test on iOS/Android

### Database

- [ ] Verify rotation_config JSONB column exists
- [ ] No migrations needed (already in schema)

---

## 🧪 Testing Commands

```bash
# Start dev server
npm run dev

# Create a new task with rotation:
# 1. Click Add button
# 2. Enter title
# 3. Select 2+ assignees
# 4. Click Rotation tab
# 5. Toggle Rotation On
# 6. Select pattern
# 7. Reorder members (drag-drop)
# 8. Save

# Edit the task:
# 1. Click existing task
# 2. Check rotation config loads
# 3. Modify pattern/order
# 4. Save again
# 5. Check persisted correctly

# Test advance rotation:
# 1. View task in list
# 2. Click "Advance" button
# 3. Confirm dialog
# 4. Check next assignee updated
# 5. Refresh - verify persisted
```

---

## 🐛 Common Issues & Fixes

### Rotation config not saving
```
Check: Is rotation_config included in taskData?
Check: Is Supabase column present?
Check: Any errors in browser console?
```

### Drag-drop not working
```
Check: is react-beautiful-dnd installed?
npm install react-beautiful-dnd
Check: Component wrapped in DragDropContext? YES ✓
```

### Types failing
```
Check: RotationConfig exported from types/huisos-v2.ts
Check: FamilyMember type exists
Check: Task type has rotation_config field
Run: npm run type-check
```

### Mobile layout broken
```
Check: Responsive classes applied
Check: No fixed widths
Check: Test on actual device
Check: Check safe areas (notch)
```

---

## 📊 File Locations

```
components/v4/modals/RotationConfigSection.tsx     ← Import here
components/v4/modals/RotationPreview.tsx           ← Import here
components/v4/RotationDisplay.tsx                  ← Import here
components/v4/RotationAnalyticsPanel.tsx           ← Optional
lib/rotation-utils.ts                               ← Use functions
types/huisos-v2.ts                                 ← Verify types
```

---

## 🎯 Integration Timeline

| Task | Time | Priority |
|------|------|----------|
| Add imports | 2 min | High |
| Add state | 3 min | High |
| Add handlers | 5 min | High |
| Update save/load | 5 min | High |
| Update TaskModalV4 | 10 min | High |
| Update task-list-item | 10 min | High |
| Local testing | 15 min | High |
| Device testing | 30 min | High |
| Fix issues | 15-30 min | Medium |
| **Total** | **~90 min** | - |

---

## 📞 Emergency Fallbacks

If Rotation UI breaks:

```typescript
// Minimal fallback - just show assignees:
{task.assignee_ids.length > 0 && (
  <div>Assigned to: {task.assignee_ids.map(id => 
    familyMembers.find(m => m.id === id)?.name
  ).join(', ')}</div>
)}

// If rotation_config not working:
// Just ignore it - tasks still work without rotation
// Rotation is optional feature
```

---

## ✨ Success Indicators

After integration, you'll see:

✅ Rotation tab in task modal  
✅ Can enable/disable rotation  
✅ Can reorder family members  
✅ Can set pattern & date  
✅ Preview shows rotation schedule  
✅ Save works with rotation_config  
✅ Load displays saved config  
✅ Task card shows rotation status  
✅ Advance button works  
✅ No console errors  

---

## 🚀 Ready to Integrate

All components are production-ready. This reference has everything you need to integrate in ~2 hours.

**Start with Step 1 → Step 4 → Test → Done**

Good luck! 🎉
