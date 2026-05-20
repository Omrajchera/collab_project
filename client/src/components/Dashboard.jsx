import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FolderPlus, Briefcase, CheckSquare, Clock, AlertTriangle, 
  ChevronRight, Calendar, LayoutGrid, CheckCircle2, ShieldAlert 
} from 'lucide-react';

export const Dashboard = ({ onSelectProject }) => {
  const { user, apiFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchDashboardData = async () => {
    try {
      // A. Pull user stats
      const statsRes = await apiFetch('/api/dashboard/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // B. Pull projects list
      const projRes = await apiFetch('/api/projects');
      const projData = await projRes.json();
      setProjects(projData);
    } catch (error) {
      console.error('Failed to synchronise dashboard dataset:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!newProjName.trim()) {
      setModalError('Project name cannot be left blank.');
      return;
    }

    try {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: newProjName, description: newProjDesc })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize project.');
      
      // Reset forms, close, and pull fresh stats
      setNewProjName('');
      setNewProjDesc('');
      setShowModal(false);
      fetchDashboardData();
    } catch (err) {
      setModalError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '8rem 2rem', color: 'var(--text-muted)' }}>
        <h2 style={{ fontFamily: 'var(--font-header)', fontWeight: 500 }}>Gathering work intelligence...</h2>
      </div>
    );
  }

  const tasksSummary = stats?.tasksSummary || { total: 0, todo: 0, inProgress: 0, review: 0, done: 0 };
  const overdueTasks = stats?.overdueTasks || [];
  const assignedTasks = stats?.assignedTasks || [];

  return (
    <div className="main-content">
      {/* Greetings Block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-header)', fontWeight: 800, lineHeight: 1.2 }}>
            Welcome back, <span style={{ color: 'var(--primary)' }}>{user?.name}</span>!
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>Let's review your collaborative projects and task timelines.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FolderPlus size={18} />
          <span>New Project</span>
        </button>
      </div>

      {/* Grid of Dynamic Counters */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon secondary">
            <Briefcase size={22} />
          </div>
          <div className="stat-info">
            <h4>Projects</h4>
            <p>{stats?.totalProjects || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckSquare size={22} />
          </div>
          <div className="stat-info">
            <h4>Active Tasks</h4>
            <p>{tasksSummary.total - tasksSummary.done}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <h4>Completed</h4>
            <p>{tasksSummary.done}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon danger">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <h4>Overdue</h4>
            <p style={{ color: overdueTasks.length > 0 ? 'var(--danger)' : 'inherit' }}>
              {overdueTasks.length}
            </p>
          </div>
        </div>
      </div>

      {/* Dual Panel Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left Side: Tasks Assigned to Current User & Active Project Cards */}
        <div>
          {/* Assigned Tasks panel */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <CheckSquare size={20} style={{ color: 'var(--primary)' }} />
                <span>My Assignments</span>
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest active items</span>
            </div>

            {assignedTasks.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={36} style={{ color: 'var(--success)', opacity: 0.5, marginBottom: '0.5rem' }} />
                <p>All clean! No tasks currently assigned to you.</p>
              </div>
            ) : (
              <div className="dashboard-task-list">
                {assignedTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="dashboard-task-item" 
                    onClick={() => onSelectProject(task.project_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="task-item-left">
                      <span className="task-item-title">{task.title}</span>
                      <span className="task-item-project">Project: {task.project_name}</span>
                    </div>
                    <div className="task-item-right">
                      <span className={`badge badge-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.due_date && (
                        <span 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.25rem', 
                            fontSize: '0.8rem', 
                            color: task.due_date < todayStr && task.status !== 'Done' ? 'var(--danger)' : 'var(--text-muted)' 
                          }}
                        >
                          <Calendar size={14} />
                          {task.due_date}
                        </span>
                      )}
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Projects block */}
          <div style={{ marginTop: '2.5rem' }}>
            <h2 
              style={{ 
                fontSize: '1.45rem', 
                fontFamily: 'var(--font-header)', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem', 
                marginBottom: '1.25rem' 
              }}
            >
              <LayoutGrid size={20} style={{ color: 'var(--secondary)' }} />
              <span>Active Workspace Projects</span>
            </h2>

            {projects.length === 0 ? (
              <div className="panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>You have not joined or created any projects yet.</p>
                <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
                  Create Your First Project
                </button>
              </div>
            ) : (
              <div className="projects-grid">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    className="project-card" 
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div className="project-card-header">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                        <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 650 }}>{project.name}</h3>
                        <span className={`badge badge-${project.role.toLowerCase()}`}>
                          {project.role}
                        </span>
                      </div>
                      <p>{project.description || 'No description added for this workspace.'}</p>
                    </div>
                    <div className="project-card-footer">
                      <span>Started {new Date(project.created_at).toLocaleDateString()}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--primary)', fontWeight: 600 }}>
                        <span>Open Board</span>
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Overdue Tasks Panel */}
        <div>
          <div 
            className="panel" 
            style={{ 
              border: overdueTasks.length > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-glow)',
              height: 'fit-content'
            }}
          >
            <h2 className="panel-title" style={{ color: overdueTasks.length > 0 ? 'var(--danger)' : 'inherit' }}>
              <AlertTriangle size={20} />
              <span>Overdue Alarms</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
              Items past due date needing rapid resolution.
            </p>

            {overdueTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--success)', opacity: 0.6 }} />
                <span style={{ fontSize: '0.88rem' }}>Perfect! No overdue tasks.</span>
              </div>
            ) : (
              <div className="overdue-list">
                {overdueTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="overdue-item" 
                    onClick={() => onSelectProject(task.project_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                      <div className="overdue-title" style={{ wordBreak: 'break-word' }}>{task.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Proj: {task.project_name} <br/> Owner: {task.assignee_name || 'Unassigned'}
                      </div>
                    </div>
                    <span className="overdue-date">{task.due_date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Creation Overlay Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Project Workspace</h3>
              <button type="button" className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            {modalError && (
              <div className="alert alert-danger" style={{ padding: '0.65rem 1rem', marginBottom: '1.25rem' }}>
                <ShieldAlert size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="proj-name">Project Workspace Name</label>
                <input
                  id="proj-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g., Marketing Campaign 2026"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="proj-desc">Brief Description</label>
                <textarea
                  id="proj-desc"
                  className="form-control"
                  rows={4}
                  placeholder="Enter strategic goals, deliverables, and notes..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
