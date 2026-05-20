const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// 1. GET /stats - Consolidate status metrics, overdue items, and self-assignments for dashboard
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // A. Query total projects user is linked to
    const projectCountData = await db.get(
      'SELECT COUNT(*) as count FROM project_members WHERE user_id = ?',
      [userId]
    );
    const totalProjects = projectCountData ? projectCountData.count : 0;

    // B. Query all tasks in all projects the user is currently a member of
    const tasks = await db.query(
      `SELECT t.*, p.name as project_name, u.name as assignee_name
       FROM tasks t
       JOIN project_members pm ON t.project_id = pm.project_id
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE pm.user_id = ?`,
      [userId]
    );

    // C. Process metrics and aggregates inside Javascript for maximum speed and simplicity
    let todoCount = 0;
    let inProgressCount = 0;
    let reviewCount = 0;
    let doneCount = 0;
    const overdueTasks = [];
    const assignedTasks = [];

    // Get today's local date in YYYY-MM-DD format
    const todayStr = new Date().toISOString().split('T')[0];

    tasks.forEach((task) => {
      // Categorize task by state
      if (task.status === 'Todo') todoCount++;
      else if (task.status === 'In_Progress') inProgressCount++;
      else if (task.status === 'Review') reviewCount++;
      else if (task.status === 'Done') doneCount++;

      // Check if assigned to the active user
      if (task.assignee_id === userId) {
        assignedTasks.push(task);
      }

      // Check if overdue: task is not finished and due_date < today
      if (task.due_date && task.status !== 'Done') {
        if (task.due_date < todayStr) {
          overdueTasks.push(task);
        }
      }
    });

    res.json({
      totalProjects,
      tasksSummary: {
        total: tasks.length,
        todo: todoCount,
        inProgress: inProgressCount,
        review: reviewCount,
        done: doneCount
      },
      overdueTasks,
      assignedTasks: assignedTasks.slice(0, 10), // Limit list to 10 most recent items
    });
  } catch (error) {
    console.error('Dashboard Stats Route Error:', error);
    res.status(500).json({ error: 'Failed to compile dashboard statistics.' });
  }
});

module.exports = router;
