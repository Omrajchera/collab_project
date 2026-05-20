const jwt = require('jsonwebtoken');
const db = require('../db');

// In a real-world production app, always read secrets from an environment variable!
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_project_collaboration_hub_2026';

// Middleware to authenticate the JWT token in request headers
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // The header value is typically "Bearer <TOKEN>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please log in first.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid. Please log in again.' });
    }
    // Attach decoded user info (id, name, email) to the request object
    req.user = decodedUser;
    next();
  });
};

// Middleware to enforce Role-Based Access Control (RBAC) inside a project
// It checks if the user is a member of the project, and has one of the allowedRoles (Admin or Member)
const checkProjectRole = (allowedRoles = ['Admin', 'Member']) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Determine the project ID from the request URL parameters, body, or query params
      const projectId = req.params.projectId || req.params.id || req.body.projectId || req.query.projectId;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required.' });
      }

      // Check membership and role of user in project_members
      const membership = await db.get(
        'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, userId]
      );

      if (!membership) {
        return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
      }

      // Validate role
      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({ 
          error: `Forbidden. This action requires one of the following project roles: ${allowedRoles.join(', ')}` 
        });
      }

      // Attach membership role to request for potential downstream use
      req.projectRole = membership.role;
      req.resolvedProjectId = projectId;
      next();
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      res.status(500).json({ error: 'Internal server error during authorization check.' });
    }
  };
};

module.exports = {
  authenticateToken,
  checkProjectRole,
  JWT_SECRET
};
