const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Helper function to query a user's role inside a project
async function getUserProjectRole(projectId, userId) {
  const membership = await db.get(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  return membership ? membership.role : null;
}

// 1. POST / - Create a new task (Requires project member/admin access)
router.post('/', authenticateToken, async (req, res) => {
  const { project_id, title, description, priority, assignee_id, due_date } = req.body;

  if (!project_id || !title) {
    return res.status(400).json({ error: 'Project ID and task title are required.' });
  }

  try {
    const userId = req.user.id;

    // A. Check if the active user belongs to the project
    const userRole = await getUserProjectRole(project_id, userId);
    if (!userRole) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    // B. Check if the specified assignee belongs to the project
    if (assignee_id) {
      const assigneeRole = await getUserProjectRole(project_id, assignee_id);
      if (!assigneeRole) {
        return res.status(400).json({ error: 'The chosen assignee must be a member of the project team.' });
      }
    }

    const taskPriority = priority || 'Medium';
    const status = 'Todo'; // Fresh tasks start in 'Todo'

    const result = await db.run(
      `INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        project_id, 
        title.trim(), 
        description ? description.trim() : '', 
        status, 
        taskPriority, 
        assignee_id || null, 
        due_date || null
      ]
    );

    res.status(201).json({
      id: result.id,
      project_id,
      title: title.trim(),
      description: description ? description.trim() : '',
      status,
      priority: taskPriority,
      assignee_id: assignee_id || null,
      due_date: due_date || null,
      message: 'Task created successfully!'
    });
  } catch (error) {
    console.error('Create Task Route Error:', error);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// 2. PUT /:id - Update task details (RBAC enforced internally)
router.put('/:id', authenticateToken, async (req, res) => {
  const taskId = req.params.id;
  const { title, description, status, priority, assignee_id, due_date } = req.body;

  try {
    const userId = req.user.id;

    // A. Load current task data
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // B. Fetch the user's role in the task's project
    const userRole = await getUserProjectRole(task.project_id, userId);
    if (!userRole) {
      return res.status(403).json({ error: 'Access denied. You do not belong to this project.' });
    }

    // C. Evaluate RBAC rules
    if (userRole === 'Admin') {
      // Admins are all-powerful: can edit all metadata properties
      const finalTitle = title !== undefined ? title.trim() : task.title;
      const finalDesc = description !== undefined ? description.trim() : task.description;
      const finalStatus = status || task.status;
      const finalPriority = priority || task.priority;
      const finalAssignee = assignee_id !== undefined ? (assignee_id || null) : task.assignee_id;
      const finalDueDate = due_date !== undefined ? (due_date || null) : task.due_date;

      // Verify new assignee eligibility
      if (finalAssignee) {
        const assigneeRole = await getUserProjectRole(task.project_id, finalAssignee);
        if (!assigneeRole) {
          return res.status(400).json({ error: 'The assignee must be a member of the project team.' });
        }
      }

      await db.run(
        `UPDATE tasks 
         SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?, due_date = ?
         WHERE id = ?`,
        [finalTitle, finalDesc, finalStatus, finalPriority, finalAssignee, finalDueDate, taskId]
      );

      res.json({ message: 'Task updated successfully by Admin!' });
    } else {
      // Members are restricted:
      // - Cannot edit core text attributes (title, description), assignee, or due dates.
      if (title !== undefined || description !== undefined || assignee_id !== undefined || due_date !== undefined) {
        return res.status(403).json({ 
          error: 'Only project Admins can edit task name, description, assignees, or due dates.' 
        });
      }

      // - Can only change the status and priority of tasks *assigned specifically to them*
      if (task.assignee_id !== userId) {
        return res.status(403).json({ 
          error: 'Members can only update status/priority of tasks specifically assigned to them.' 
        });
      }

      const finalStatus = status || task.status;
      const finalPriority = priority || task.priority;

      await db.run(
        `UPDATE tasks SET status = ?, priority = ? WHERE id = ?`,
        [finalStatus, finalPriority, taskId]
      );

      res.json({ message: 'Task status/priority updated by assignee!' });
    }
  } catch (error) {
    console.error('Update Task Route Error:', error);
    res.status(500).json({ error: 'Failed to update task details.' });
  }
});

// 3. DELETE /:id - Delete a task (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  const taskId = req.params.id;

  try {
    const userId = req.user.id;

    // A. Check task existence
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // B. Check project role
    const userRole = await getUserProjectRole(task.project_id, userId);
    if (userRole !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Only project Admins can delete tasks.' });
    }

    // C. Perform delete
    await db.run('DELETE FROM tasks WHERE id = ?', [taskId]);
    res.json({ message: 'Task deleted successfully!' });
  } catch (error) {
    console.error('Delete Task Route Error:', error);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
