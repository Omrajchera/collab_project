import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Users, Plus, Trash2, ShieldAlert, CheckCircle2, 
  Calendar, UserPlus, Shield
} from 'lucide-react';

export const ProjectBoard = ({ projectId, onBack }) => {
  const { user, apiFetch } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal toggle states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // Active task for popup details

  // Form states for creating a task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Form states for inviting a member
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('Member');

  // Success and failure banner trackers
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProjectDetails = async () => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to retrieve project details.');
      const data = await res.json();
      setProject(data);
    } catch (err) {
      console.error(err);
      onBack(); // Return to dashboard on failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  // --- TASK HANDLERS ---
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!taskTitle.trim()) {
      setError('Task title cannot be empty.');
      return;
    }

    try {
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          assignee_id: taskAssignee || null,
          due_date: taskDueDate || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task.');

      // Reset forms and fetch details
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('Medium');
      setTaskAssignee('');
      setTaskDueDate('');
      setShowTaskModal(false);
      fetchProjectDetails();
      setSuccess('Task added to Kanban board successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: selectedTask.title,
          description: selectedTask.description,
          status: selectedTask.status,
          priority: selectedTask.priority,
          assignee_id: selectedTask.assignee_id || null,
          due_date: selectedTask.due_date || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task.');

      setSelectedTask(null);
      fetchProjectDetails();
      setSuccess('Task details updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete task.');

      setSelectedTask(null);
      fetchProjectDetails();
      setSuccess('Task deleted successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to transfer task.');

      fetchProjectDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- HTML5 DRAG & DROP HANDLERS ---
  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const onDragOver = (e) => {
    e.preventDefault(); // Required to allow dropping!
  };

  const onDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    handleStatusChange(taskId, targetStatus);
  };

  // --- TEAM MEMBER HANDLERS ---
  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!memberEmail.trim()) {
      setError('Member email address is required.');
      return;
    }

    try {
      const res = await apiFetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: memberEmail, role: memberRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member.');

      setMemberEmail('');
      setMemberRole('Member');
      setShowMemberModal(false);
      fetchProjectDetails();
      setSuccess('Team member added to project workspace!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateMemberRole = async (memberUserId, currentRole) => {
    setError('');
    setSuccess('');
    const newRole = currentRole === 'Admin' ? 'Member' : 'Admin';

    try {
      const res = await apiFetch(`/api/projects/${projectId}/members/${memberUserId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to modify role.');

      fetchProjectDetails();
      setSuccess('Member project authority updated!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!window.confirm('Are you sure you want to remove this member from the project?')) return;
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch(`/api/projects/${projectId}/members/${memberUserId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete member.');

      fetchProjectDetails();
      setSuccess('Member removed from project team.');
    } catch (err) {
      setError(err.message);
    }
  };

  // --- DELETE PROJECT HANDLER ---
  const handleDeleteProject = async () => {
    if (!window.confirm('⚠️ WARNING: Deleting this project will erase ALL tasks, columns, and team memberships. This action CANNOT be undone. Proceed?')) return;
    try {
      const res = await apiFetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete project.');
      onBack();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '8rem 2rem', color: 'var(--text-muted)' }}>
        <h2 style={{ fontFamily: 'var(--font-header)', fontWeight: 500 }}>Syncing Kanban board...</h2>
      </div>
    );
  }

  const isAdmin = project?.role === 'Admin';
  const tasks = project?.tasks || [];
  const members = project?.members || [];

  const columns = [
    { title: 'To Do', status: 'Todo', color: '#9ca3af' },
    { title: 'In Progress', status: 'In_Progress', color: 'var(--secondary)' },
    { title: 'In Review', status: 'Review', color: 'var(--primary)' },
    { title: 'Completed', status: 'Done', color: 'var(--success)' }
  ];

  return (
    <div className="main-content">
      {/* Board Header Section */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          marginBottom: '2rem', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          borderBottom: '1px solid var(--border-glow)', 
          paddingBottom: '1.5rem' 
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={onBack} 
            style={{ padding: '0.6rem 0.75rem' }} 
            title="Return to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.85rem', fontFamily: 'var(--font-header)', fontWeight: 800 }}>{project?.name}</h1>
              <span className={`badge badge-${project?.role.toLowerCase()}`}>{project?.role}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
              {project?.description || 'No description added for this board.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(true)}>
            <Plus size={16} />
            <span>Add Task</span>
          </button>
          {isAdmin && (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>
                <UserPlus size={16} />
                <span>Manage Team</span>
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteProject}>
                <Trash2 size={16} />
                <span>Delete Project</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Main Grid: Board columns and Side Panel */}
      <div className="detail-grid">
        {/* Kanban Board Columns (Left 3/4) */}
        <div>
          <div className="board-container">
            {columns.map((col) => {
              const colTasks = tasks.filter(t => t.status === col.status);
              return (
                <div 
                  key={col.status} 
                  className="board-column"
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, col.status)}
                >
                  <div className="board-column-header">
                    <h3 style={{ color: col.color, fontSize: '0.95rem', fontWeight: 700 }}>
                      <span 
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: col.color, 
                          display: 'inline-block',
                          marginRight: '0.45rem' 
                        }}
                      ></span>
                      {col.title}
                    </h3>
                    <span className="board-column-count">{colTasks.length}</span>
                  </div>

                  <div className="column-tasks" style={{ minHeight: '400px' }}>
                    {colTasks.length === 0 ? (
                      <div 
                        style={{ 
                          textAlign: 'center', 
                          padding: '3rem 1rem', 
                          color: 'var(--text-muted)', 
                          fontSize: '0.75rem', 
                          border: '1px dashed rgba(255,255,255,0.05)', 
                          borderRadius: '8px' 
                        }}
                      >
                        Drop tasks here
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div 
                          key={task.id} 
                          className={`task-card priority-${task.priority}`}
                          draggable
                          onDragStart={(e) => onDragStart(e, task.id)}
                          onClick={() => setSelectedTask({ ...task })}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span 
                              className={`badge badge-${task.priority.toLowerCase()}`} 
                              style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}
                            >
                              {task.priority}
                            </span>
                            {task.due_date && (
                              <span 
                                style={{ 
                                  fontSize: '0.7rem', 
                                  color: 'var(--text-muted)', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.15rem' 
                                }}
                              >
                                <Calendar size={11} />
                                <span>{task.due_date}</span>
                              </span>
                            )}
                          </div>
                          
                          <span className="task-card-title">{task.title}</span>
                          
                          {task.description && (
                            <p className="task-card-desc" style={{ fontSize: '0.8rem' }}>
                              {task.description}
                            </p>
                          )}
                          
                          <div className="task-card-meta">
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.25)' }}>
                              #{task.id}
                            </span>
                            {task.assignee_name ? (
                              <div 
                                className="assignee-avatar" 
                                title={`Assigned to ${task.assignee_name}`}
                              >
                                {task.assignee_name[0].toUpperCase()}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)' }}>
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Member Directory Panel (Right 1/4) */}
        <div>
          <div className="panel" style={{ height: 'fit-content' }}>
            <h2 className="panel-title" style={{ marginBottom: '1.25rem' }}>
              <Users size={18} style={{ color: 'var(--secondary)' }} />
              <span>Workspace Team</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {members.map((m) => (
                <div key={m.id} className="member-row">
                  <div className="member-info">
                    <div className="member-avatar">
                      {m.name[0].toUpperCase()}
                    </div>
                    <div className="member-details">
                      <h4>{m.name}</h4>
                      <p>{m.email}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    <span className={`badge badge-${m.role.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                      {m.role}
                    </span>
                    {isAdmin && m.id !== user.id && (
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <button 
                          type="button"
                          className="btn-text" 
                          style={{ padding: 0, cursor: 'pointer', color: 'var(--primary)' }} 
                          title={`Switch role to ${m.role === 'Admin' ? 'Member' : 'Admin'}`}
                          onClick={() => handleUpdateMemberRole(m.id, m.role)}
                        >
                          <Shield size={13} />
                        </button>
                        <button 
                          type="button"
                          className="btn-text" 
                          style={{ padding: 0, cursor: 'pointer', color: 'var(--danger)' }} 
                          title="Remove user from project"
                          onClick={() => handleRemoveMember(m.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Project Task</h3>
              <button type="button" className="close-btn" onClick={() => setShowTaskModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label htmlFor="task-title">Task Title</label>
                <input
                  id="task-title"
                  type="text"
                  className="form-control"
                  placeholder="e.g., Build Auth Middleware"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-desc">Task Description</label>
                <textarea
                  id="task-desc"
                  className="form-control"
                  rows={3}
                  placeholder="Enter concrete instructions or context notes..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    className="form-control"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🔴 High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="task-due">Due Date</label>
                  <input
                    id="task-due"
                    type="date"
                    className="form-control"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="task-assignee">Assignee</label>
                <select
                  id="task-assignee"
                  className="form-control"
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Popup Modal (RBAC enforced) */}
      {selectedTask && (() => {
        const canEditFull = isAdmin;
        const canEditStatusOnly = !isAdmin && selectedTask.assignee_id === user.id;
        const isReadOnly = !canEditFull && !canEditStatusOnly;

        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '560px' }}>
              <div className="modal-header">
                <h3>Task Settings</h3>
                <button type="button" className="close-btn" onClick={() => setSelectedTask(null)}>&times;</button>
              </div>

              <form onSubmit={handleUpdateTask}>
                {isReadOnly && (
                  <div className="alert alert-danger" style={{ padding: '0.5rem 0.8rem', fontSize: '0.78rem', marginBottom: '1.25rem' }}>
                    <ShieldAlert size={14} />
                    <span>Read-Only. Only Admins or the assignee can modify this task.</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="edit-title">Task Title</label>
                  <input
                    id="edit-title"
                    type="text"
                    className="form-control"
                    value={selectedTask.title}
                    onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                    disabled={!canEditFull}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-desc">Description</label>
                  <textarea
                    id="edit-desc"
                    className="form-control"
                    rows={3}
                    value={selectedTask.description || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                    disabled={!canEditFull}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-priority">Priority</label>
                    <select
                      id="edit-priority"
                      className="form-control"
                      value={selectedTask.priority}
                      onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })}
                      disabled={isReadOnly}
                    >
                      <option value="Low">🟢 Low</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="High">🔴 High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-due">Due Date</label>
                    <input
                      id="edit-due"
                      type="date"
                      className="form-control"
                      value={selectedTask.due_date || ''}
                      onChange={(e) => setSelectedTask({ ...selectedTask, due_date: e.target.value })}
                      disabled={!canEditFull}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-status">Status</label>
                    <select
                      id="edit-status"
                      className="form-control"
                      value={selectedTask.status}
                      onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value })}
                      disabled={isReadOnly}
                    >
                      <option value="Todo">📋 To Do</option>
                      <option value="In_Progress">⚡ In Progress</option>
                      <option value="Review">👁️ In Review</option>
                      <option value="Done">✅ Completed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-assignee">Assignee</label>
                    <select
                      id="edit-assignee"
                      className="form-control"
                      value={selectedTask.assignee_id || ''}
                      onChange={(e) => setSelectedTask({ ...selectedTask, assignee_id: parseInt(e.target.value, 10) || null })}
                      disabled={!canEditFull}
                    >
                      <option value="">Unassigned</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {isAdmin ? (
                    <button 
                      type="button" 
                      className="btn btn-danger"
                      onClick={() => handleDeleteTask(selectedTask.id)}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      <Trash2 size={15} />
                      <span>Delete Task</span>
                    </button>
                  ) : (
                    <div></div>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setSelectedTask(null)}>
                      Close
                    </button>
                    {!isReadOnly && (
                      <button type="submit" className="btn btn-primary">
                        Save Changes
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Invite/Add Member Modal */}
      {showMemberModal && isAdmin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Workspace Member</h3>
              <button type="button" className="close-btn" onClick={() => setShowMemberModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label htmlFor="mem-email">Member's Email Address</label>
                <input
                  id="mem-email"
                  type="email"
                  className="form-control"
                  placeholder="Enter email of a registered user"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mem-role">Workspace Role</label>
                <select
                  id="mem-role"
                  className="form-control"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                >
                  <option value="Member">Member (Add tasks, update assigned items)</option>
                  <option value="Admin">Admin (Full project configuration authority)</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Invite Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
