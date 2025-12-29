// pages/v2.tsx - Lines with TaskListItem render (around line 469)
// This is the updated section with subtasks support

// Inside the tasks.map() in activeTab === 'work':
{tasks.map((task) => (
  <TaskListItem
    key={task.id}
    task={task}
    subtasks={state.subtasks.get(task.id) || []}
    assignees={getTaskAssignees(task)}
    onComplete={handleCompleteTask}
    onEdit={handleEditTask}
    onDelete={handleDeleteTask}
    onToggleSubtask={handleToggleSubtask}
    currentUserId={currentUserId}
  />
))}
