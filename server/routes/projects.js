const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkProjectRole } = require('../middleware/auth');

// 1. GET / - List all projects the current user belongs to
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Query projects where the user is listed in project_members
    const projects = await db.query(
      `SELECT p.*, pm.role 
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );
    res.json(projects);
  } catch (error) {
    console.error('Get Projects Route Error:', error);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// 2. POST / - Create a new project (Creator is assigned Admin role)
router.post('/', authenticateToken, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required.' });
  }

  try {
    const userId = req.user.id;

    // A. Insert project metadata
    const result = await db.run(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      [name.trim(), description ? description.trim() : '', userId]
    );
    const projectId = result.id;

    // B. Add the owner to project_members as an Admin
    await db.run(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, userId, 'Admin']
    );

    res.status(201).json({
      id: projectId,
      name: name.trim(),
      description: description ? description.trim() : '',
      owner_id: userId,
      role: 'Admin',
      message: 'Project created successfully!'
    });
  } catch (error) {
    console.error('Create Project Route Error:', error);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

// 3. GET /:id - Retrieve complete project detail (metadata, members list, and task Kanban list)
router.get('/:id', authenticateToken, checkProjectRole(['Admin', 'Member']), async (req, res) => {
  const projectId = req.params.id;
  try {
    // A. Fetch project metadata
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // B. Fetch members
    const members = await db.query(
      `SELECT u.id, u.name, u.email, pm.role
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?`,
      [projectId]
    );

    // C. Fetch tasks
    const tasks = await db.query(
      `SELECT t.*, u.name as assignee_name, u.email as assignee_email
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [projectId]
    );

    // Include the user's role on the project detail response (provided by checkProjectRole)
    res.json({
      ...project,
      role: req.projectRole,
      members,
      tasks
    });
  } catch (error) {
    console.error('Get Project Route Error:', error);
    res.status(500).json({ error: 'Failed to retrieve project details.' });
  }
});

// 4. DELETE /:id - Delete a project (Admin only)
router.delete('/:id', authenticateToken, checkProjectRole(['Admin']), async (req, res) => {
  const projectId = req.params.id;
  try {
    // SQLite ON DELETE CASCADE handles deleting records in tasks and project_members
    await db.run('DELETE FROM projects WHERE id = ?', [projectId]);
    res.json({ message: 'Project and all related tasks/team mappings deleted.' });
  } catch (error) {
    console.error('Delete Project Route Error:', error);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

// 5. POST /:id/members - Add/Invite team member by email (Admin only)
router.post('/:id/members', authenticateToken, checkProjectRole(['Admin']), async (req, res) => {
  const projectId = req.params.id;
  const { email, role } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'User email is required.' });
  }

  const projectRole = role || 'Member';
  if (!['Admin', 'Member'].includes(projectRole)) {
    return res.status(400).json({ error: 'Invalid role selection. Must be Admin or Member.' });
  }

  try {
    const targetEmail = email.toLowerCase().trim();

    // A. Verify if the target user actually exists in the app
    const targetUser = await db.get('SELECT id, name, email FROM users WHERE email = ?', [targetEmail]);
    if (!targetUser) {
      return res.status(404).json({ error: 'No user registered with this email. Have them sign up first!' });
    }

    // B. Verify if they are already in the project
    const isMember = await db.get(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, targetUser.id]
    );
    if (isMember) {
      return res.status(400).json({ error: 'This user is already a member of this project.' });
    }

    // C. Add the member
    await db.run(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, targetUser.id, projectRole]
    );

    res.status(201).json({
      message: 'Team member added successfully!',
      member: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: projectRole
      }
    });
  } catch (error) {
    console.error('Add Member Route Error:', error);
    res.status(500).json({ error: 'Failed to add user to project.' });
  }
});

// 6. PUT /:id/members/:userId - Promote or demote a member's role (Admin only)
router.put('/:id/members/:userId', authenticateToken, checkProjectRole(['Admin']), async (req, res) => {
  const projectId = req.params.id;
  const targetUserId = req.params.userId;
  const { role } = req.body;

  if (!['Admin', 'Member'].includes(role)) {
    return res.status(400).json({ error: 'Role must be Admin or Member.' });
  }

  try {
    // Prevent project owners from being demoted from Admin
    const project = await db.get('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    if (project.owner_id == targetUserId && role === 'Member') {
      return res.status(400).json({ error: 'Cannot demote the original project owner.' });
    }

    const membership = await db.get(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, targetUserId]
    );
    if (!membership) {
      return res.status(404).json({ error: 'User is not a member of this project.' });
    }

    await db.run(
      'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
      [role, projectId, targetUserId]
    );

    res.json({ message: 'Member role updated successfully!' });
  } catch (error) {
    console.error('Update Member Role Route Error:', error);
    res.status(500).json({ error: 'Failed to update member role.' });
  }
});

// 7. DELETE /:id/members/:userId - Remove a member from the project (Admin only)
router.delete('/:id/members/:userId', authenticateToken, checkProjectRole(['Admin']), async (req, res) => {
  const projectId = req.params.id;
  const targetUserId = req.params.userId;

  try {
    // Prevent removing the project owner
    const project = await db.get('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    if (project.owner_id == targetUserId) {
      return res.status(400).json({ error: 'Cannot remove the project owner from their project.' });
    }

    const membership = await db.get(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, targetUserId]
    );
    if (!membership) {
      return res.status(404).json({ error: 'User is not a member of this project.' });
    }

    // Remove member
    await db.run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, targetUserId]);

    // Unassign tasks formerly assigned to this user in this project
    await db.run(
      'UPDATE tasks SET assignee_id = NULL WHERE project_id = ? AND assignee_id = ?',
      [projectId, targetUserId]
    );

    res.json({ message: 'Member removed from project successfully.' });
  } catch (error) {
    console.error('Remove Member Route Error:', error);
    res.status(500).json({ error: 'Failed to remove member from project.' });
  }
});

module.exports = router;
