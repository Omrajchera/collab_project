const express = require('express');
const cors = require('cors');
const path = require('path');

// Import DB so that SQLite is initialized on server startup
const db = require('./db');

// Route modules
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) for local frontend-backend development
app.use(cors());

// Parse incoming requests with JSON payloads
app.use(express.json());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Simple healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', database: 'connected', time: new Date() });
});

// --- PRODUCTION HOSTING FLOW ---
// Serve the compiled production files from the client dist folder
const clientBuildPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Fallback all non-API paths to React's index.html (client-side routing)
app.get('*', (req, res) => {
  // If a request for a non-existent API route is made, return standard API 404
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found.' });
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).send('Production build not found. Run "npm run build" in the client folder.');
    }
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open API health check at http://localhost:${PORT}/api/health`);
});
