import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit,
  Trash,
  Close,
  Lock,
  Calendar,
  User,
  Tag,
  CheckSquare,
  List,
  Columns,
  BarChart2,
  Search,
  LogOut,
  Folder,
  AlertCircle
} from './components/Icons';

const API_URL = 'http://localhost:5000/api';
const WS_URL = 'ws://localhost:5000';

function App() {
  // Auth states
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App navigation & view states
  const [currentView, setCurrentView] = useState('kanban'); // 'kanban' | 'list' | 'analytics'
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  
  // Modals & UI forms
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    assigneeName: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', description: '' });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // WebSocket sync states
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  // Premium Toast Notification state
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Check auth session on boot
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  // Load project boards once authenticated
  useEffect(() => {
    if (currentUser) {
      fetchProjects();
    }
  }, [currentUser]);

  // Load tasks once project changes
  useEffect(() => {
    if (currentUser && selectedProjectId) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [currentUser, selectedProjectId]);

  // WebSocket integration for real-time sync
  useEffect(() => {
    if (!currentUser) return;

    const connectWebSocket = () => {
      console.log('Connecting to WebSocket server...');
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket Connection Established');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error('Error handling websocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket Connection Closed. Attempting reconnect...');
        setWsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUser]);

  const handleWebSocketMessage = (message) => {
    const { type, payload } = message;
    
    switch (type) {
      case 'TASK_CREATED':
        if (payload.project === selectedProjectId) {
          setTasks(prev => {
            if (prev.some(t => t._id === payload._id)) return prev;
            addToast(`Task "${payload.title}" created by another user`, 'info');
            return [payload, ...prev];
          });
        }
        break;
      case 'TASK_UPDATED':
        if (payload.project === selectedProjectId) {
          setTasks(prev => {
            const exists = prev.some(t => t._id === payload._id);
            if (!exists) return prev;
            
            // Check if status changed
            const oldTask = prev.find(t => t._id === payload._id);
            if (oldTask && oldTask.status !== payload.status) {
              addToast(`Task "${payload.title}" moved to ${payload.status.toUpperCase()}`, 'info');
            } else {
              addToast(`Task "${payload.title}" details updated`, 'info');
            }
            return prev.map(t => t._id === payload._id ? payload : t);
          });
        }
        break;
      case 'TASK_DELETED':
        if (payload.project === selectedProjectId) {
          setTasks(prev => {
            const exists = prev.some(t => t._id === payload._id);
            if (!exists) return prev;
            addToast('A task was deleted from this board', 'info');
            return prev.filter(t => t._id !== payload._id);
          });
        }
        break;
      case 'PROJECT_CREATED':
        setProjects(prev => {
          if (prev.some(p => p._id === payload._id)) return prev;
          addToast(`New workspace "${payload.title}" added`, 'info');
          return [payload, ...prev];
        });
        break;
      case 'PROJECT_UPDATED':
        setProjects(prev => prev.map(p => p._id === payload._id ? payload : p));
        break;
      case 'PROJECT_DELETED':
        setProjects(prev => prev.filter(p => p._id !== payload._id));
        if (selectedProjectId === payload._id) {
          addToast('Active workspace was deleted', 'error');
          setSelectedProjectId('');
        }
        break;
      default:
        break;
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      } else {
        // Token expired or invalid
        handleLogOut();
      }
    } catch (err) {
      console.error('Failed to get session:', err);
      handleLogOut();
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load project boards:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks?project=${selectedProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  // Auth Operations
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authMode === 'register' ? 'register' : 'login';
    const payload = authMode === 'register' 
      ? authForm 
      : { email: authForm.email, password: authForm.password };

    try {
      const res = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        addToast(`Welcome back, ${data.user.name}!`, 'success');
        setAuthForm({ name: '', email: '', password: '' });
      } else {
        setAuthError(data.message || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setAuthError('Connection server failed. Please check backend is running.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('token');
    setToken('');
    setCurrentUser(null);
    setProjects([]);
    setSelectedProjectId('');
    setTasks([]);
    addToast('Logged out successfully', 'info');
  };

  // Project board creation
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!projectForm.title) return;

    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectForm)
      });
      if (res.ok) {
        const newProj = await res.json();
        setProjects(prev => [newProj, ...prev]);
        setSelectedProjectId(newProj._id);
        setShowProjectModal(false);
        setProjectForm({ title: '', description: '' });
        addToast(`Workspace "${newProj.title}" created successfully!`, 'success');
      }
    } catch (err) {
      console.error('Failed to create workspace board:', err);
    }
  };

  // Project Board Delete
  const handleProjectDelete = async (projId) => {
    if (!window.confirm("Are you sure you want to delete this workspace board and all its tasks?")) return;

    try {
      const res = await fetch(`${API_URL}/projects/${projId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p._id !== projId));
        if (selectedProjectId === projId) {
          setSelectedProjectId(projects.length > 1 ? projects.find(p => p._id !== projId)._id : '');
        }
        addToast('Board deleted', 'success');
      }
    } catch (err) {
      console.error('Failed to delete workspace board:', err);
    }
  };

  // Task Operations
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title) return;

    const payload = {
      ...taskForm,
      project: selectedProjectId
    };

    try {
      let res;
      if (editingTask) {
        res = await fetch(`${API_URL}/tasks/${editingTask._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const savedTask = await res.json();
        if (editingTask) {
          setTasks(prev => prev.map(t => t._id === editingTask._id ? savedTask : t));
          addToast('Task updated', 'success');
        } else {
          setTasks(prev => [savedTask, ...prev]);
          addToast('Task created successfully!', 'success');
        }
        setShowTaskModal(false);
        resetTaskForm();
      }
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
        addToast('Task deleted successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(prev => prev.map(t => t._id === taskId ? updated : t));
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      assigneeName: '',
      tags: []
    });
    setEditingTask(null);
  };

  const openCreateTaskModal = (initialStatus = 'todo') => {
    resetTaskForm();
    setTaskForm(prev => ({ ...prev, status: initialStatus }));
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 10) : '',
      assigneeName: task.assigneeName || '',
      tags: task.tags || []
    });
    setShowTaskModal(true);
  };

  // Tags operations in Form
  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !taskForm.tags.includes(tagInput.trim())) {
      setTaskForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setTaskForm(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== indexToRemove)
    }));
  };

  // Draggable functions
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      handleStatusChange(taskId, status);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Calculate Analytics Stats
  const analyticsStats = () => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inprogress = tasks.filter(t => t.status === 'in-progress').length;
    const review = tasks.filter(t => t.status === 'review').length;
    const done = tasks.filter(t => t.status === 'done').length;

    const low = tasks.filter(t => t.priority === 'low').length;
    const medium = tasks.filter(t => t.priority === 'medium').length;
    const high = tasks.filter(t => t.priority === 'high').length;

    // Check overdue
    const now = new Date();
    const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now).length;

    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, todo, inprogress, review, done, low, medium, high, overdue, completionRate };
  };

  const stats = analyticsStats();

  // Authentication View
  if (!currentUser) {
    return (
      <div className="background-grid">
        <div className="auth-wrapper">
          {/* Custom Notification Toasts inside Auth view too */}
          <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {toasts.map(t => (
              <div key={t.id} className="glass" style={{
                padding: '12px 20px', 
                borderRadius: '8px', 
                borderLeft: `4px solid ${t.type === 'success' ? 'var(--status-done)' : t.type === 'error' ? 'var(--priority-high)' : 'var(--accent-blue)'}`,
                background: 'rgba(13, 18, 34, 0.95)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span>{t.message}</span>
              </div>
            ))}
          </div>

          <div className="glass auth-card">
            <div className="auth-header">
              <div className="auth-logo">Antigravity</div>
              <h2 className="auth-subtitle">Task Manager Workspace</h2>
            </div>
            
            {authError && (
              <div className="glass" style={{ padding: '0.8rem', borderRadius: '8px', borderLeft: '4px solid var(--priority-high)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Enter your name" 
                    value={authForm.name}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-control"
                  placeholder="name@example.com" 
                  value={authForm.email}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  className="form-control"
                  placeholder="••••••••" 
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }} disabled={authLoading}>
                {authLoading ? 'Connecting...' : authMode === 'register' ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="auth-toggle">
              {authMode === 'register' ? (
                <>Already have an account? <span onClick={() => setAuthMode('login')}>Sign In</span></>
              ) : (
                <>New to Antigravity? <span onClick={() => setAuthMode('register')}>Create account</span></>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Application View
  return (
    <div className="background-grid">
      <div className="app-container">
        
        {/* Custom Notification Toasts */}
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {toasts.map(t => (
            <div key={t.id} className="glass" style={{
              padding: '12px 20px', 
              borderRadius: '8px', 
              borderLeft: `4px solid ${t.type === 'success' ? 'var(--status-done)' : t.type === 'error' ? 'var(--priority-high)' : 'var(--accent-blue)'}`,
              background: 'rgba(13, 18, 34, 0.95)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>{t.message}</span>
            </div>
          ))}
        </div>

        {/* Sidebar Panel */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <CheckSquare className="text-cyan-400" />
            <span>Antigravity</span>
          </div>

          <nav className="sidebar-menu">
            <div 
              className={`sidebar-item ${currentView === 'kanban' ? 'active' : ''}`}
              onClick={() => setCurrentView('kanban')}
            >
              <Columns size={18} />
              <span>Kanban Board</span>
            </div>
            <div 
              className={`sidebar-item ${currentView === 'list' ? 'active' : ''}`}
              onClick={() => setCurrentView('list')}
            >
              <List size={18} />
              <span>List Grid</span>
            </div>
            <div 
              className={`sidebar-item ${currentView === 'analytics' ? 'active' : ''}`}
              onClick={() => setCurrentView('analytics')}
            >
              <BarChart2 size={18} />
              <span>Analytics Dashboard</span>
            </div>

            <div className="projects-section-title">Workspace Boards</div>
            <div className="sidebar-project-list">
              {projects.map(proj => (
                <div 
                  key={proj._id} 
                  className={`sidebar-project-item ${selectedProjectId === proj._id ? 'active' : ''}`}
                  onClick={() => setSelectedProjectId(proj._id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <Folder size={16} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.title}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleProjectDelete(proj._id); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.6 }}
                    onMouseOver={(e) => e.target.style.color = 'var(--priority-high)'}
                    onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {projects.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No boards. Create one below!</div>
              )}
            </div>

            <button 
              className="btn btn-secondary btn-quick-add" 
              style={{ marginTop: '0.5rem', width: '100%' }}
              onClick={() => setShowProjectModal(true)}
            >
              <Plus size={16} />
              <span>New Board</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="user-profile-widget">
              <div className="avatar-circle" style={{ backgroundColor: currentUser.avatar || '#4facfe' }}>
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="user-profile-details">
                <span className="user-profile-name">{currentUser.name}</span>
                <span className="user-profile-email">{currentUser.email}</span>
              </div>
            </div>
            <div className="sidebar-item" onClick={handleLogOut} style={{ color: '#fca5a5' }}>
              <LogOut size={18} />
              <span>Log Out</span>
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="main-workspace">
          
          {/* Header */}
          <header className="workspace-header">
            <div className="header-title-section">
              <h1>
                {projects.find(p => p._id === selectedProjectId)?.title || 'No Workspace Selected'}
              </h1>
              <p>
                {projects.find(p => p._id === selectedProjectId)?.description || 'Create a workspace board to start organizing tasks.'}
              </p>
            </div>

            <div className="workspace-controls">
              <div className="sync-status">
                <span className={`sync-dot ${wsConnected ? 'connected' : 'disconnected'}`}></span>
                <span>{wsConnected ? 'Live Synced' : 'Connecting Sync...'}</span>
              </div>
              {selectedProjectId && (
                <button className="btn btn-primary" onClick={() => openCreateTaskModal('todo')}>
                  <Plus size={18} />
                  <span>Create Task</span>
                </button>
              )}
            </div>
          </header>

          {selectedProjectId ? (
            <>
              {/* Toolbar */}
              <div className="workspace-toolbar">
                <div className="search-filter-box">
                  <div className="search-input-wrapper">
                    <Search size={16} />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Search title, description, or tags..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select 
                    className="filter-select"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>

                  <select 
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Completed</option>
                  </select>
                </div>

                <div className="view-toggle-group">
                  <button 
                    className={`view-toggle-btn ${currentView === 'kanban' ? 'active' : ''}`}
                    onClick={() => setCurrentView('kanban')}
                  >
                    <Columns size={14} />
                    <span>Kanban</span>
                  </button>
                  <button 
                    className={`view-toggle-btn ${currentView === 'list' ? 'active' : ''}`}
                    onClick={() => setCurrentView('list')}
                  >
                    <List size={14} />
                    <span>List</span>
                  </button>
                  <button 
                    className={`view-toggle-btn ${currentView === 'analytics' ? 'active' : ''}`}
                    onClick={() => setCurrentView('analytics')}
                  >
                    <BarChart2 size={14} />
                    <span>Analytics</span>
                  </button>
                </div>
              </div>

              {/* View Rendering */}
              {currentView === 'kanban' && (
                <div className="kanban-board">
                  {/* Swimlane Column: Todo */}
                  <div 
                    className="kanban-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'todo')}
                  >
                    <div className="kanban-column-header">
                      <div className="column-title-wrapper">
                        <span className="column-indicator todo"></span>
                        <h3>To Do</h3>
                      </div>
                      <span className="column-count">
                        {filteredTasks.filter(t => t.status === 'todo').length}
                      </span>
                    </div>

                    <div className="kanban-task-list">
                      {filteredTasks.filter(t => t.status === 'todo').map(task => (
                        <TaskCard key={task._id} task={task} onEdit={openEditTaskModal} onDelete={handleTaskDelete} onDragStart={handleDragStart} />
                      ))}
                      <button className="btn-quick-add" onClick={() => openCreateTaskModal('todo')}>
                        <Plus size={14} />
                        <span>Quick Add Task</span>
                      </button>
                    </div>
                  </div>

                  {/* Swimlane Column: In Progress */}
                  <div 
                    className="kanban-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'in-progress')}
                  >
                    <div className="kanban-column-header">
                      <div className="column-title-wrapper">
                        <span className="column-indicator inprogress"></span>
                        <h3>In Progress</h3>
                      </div>
                      <span className="column-count">
                        {filteredTasks.filter(t => t.status === 'in-progress').length}
                      </span>
                    </div>

                    <div className="kanban-task-list">
                      {filteredTasks.filter(t => t.status === 'in-progress').map(task => (
                        <TaskCard key={task._id} task={task} onEdit={openEditTaskModal} onDelete={handleTaskDelete} onDragStart={handleDragStart} />
                      ))}
                      <button className="btn-quick-add" onClick={() => openCreateTaskModal('in-progress')}>
                        <Plus size={14} />
                        <span>Quick Add Task</span>
                      </button>
                    </div>
                  </div>

                  {/* Swimlane Column: Review */}
                  <div 
                    className="kanban-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'review')}
                  >
                    <div className="kanban-column-header">
                      <div className="column-title-wrapper">
                        <span className="column-indicator review"></span>
                        <h3>Under Review</h3>
                      </div>
                      <span className="column-count">
                        {filteredTasks.filter(t => t.status === 'review').length}
                      </span>
                    </div>

                    <div className="kanban-task-list">
                      {filteredTasks.filter(t => t.status === 'review').map(task => (
                        <TaskCard key={task._id} task={task} onEdit={openEditTaskModal} onDelete={handleTaskDelete} onDragStart={handleDragStart} />
                      ))}
                      <button className="btn-quick-add" onClick={() => openCreateTaskModal('review')}>
                        <Plus size={14} />
                        <span>Quick Add Task</span>
                      </button>
                    </div>
                  </div>

                  {/* Swimlane Column: Completed */}
                  <div 
                    className="kanban-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'done')}
                  >
                    <div className="kanban-column-header">
                      <div className="column-title-wrapper">
                        <span className="column-indicator done"></span>
                        <h3>Completed</h3>
                      </div>
                      <span className="column-count">
                        {filteredTasks.filter(t => t.status === 'done').length}
                      </span>
                    </div>

                    <div className="kanban-task-list">
                      {filteredTasks.filter(t => t.status === 'done').map(task => (
                        <TaskCard key={task._id} task={task} onEdit={openEditTaskModal} onDelete={handleTaskDelete} onDragStart={handleDragStart} />
                      ))}
                      <button className="btn-quick-add" onClick={() => openCreateTaskModal('done')}>
                        <Plus size={14} />
                        <span>Quick Add Task</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'list' && (
                <div className="list-view-container">
                  {filteredTasks.length > 0 ? (
                    <div className="glass" style={{ overflow: 'hidden' }}>
                      <table className="list-table">
                        <thead>
                          <tr>
                            <th>Task Title</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Assignee</th>
                            <th>Due Date</th>
                            <th>Tags</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.map(task => (
                            <tr key={task._id} className="list-row" onClick={() => openEditTaskModal(task)}>
                              <td style={{ fontWeight: 600 }}>{task.title}</td>
                              <td>
                                <span className={`status-indicator-badge ${task.status}`}>
                                  {task.status === 'done' ? 'Completed' : task.status === 'in-progress' ? 'In Progress' : task.status === 'review' ? 'Review' : 'To Do'}
                                </span>
                              </td>
                              <td>
                                <span className={`task-priority-badge ${task.priority}`}>
                                  {task.priority}
                                </span>
                              </td>
                              <td>
                                {task.assigneeName ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div className="task-assignee-avatar">
                                      {task.assigneeName.substring(0,2).toUpperCase()}
                                    </div>
                                    <span>{task.assigneeName}</span>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                                )}
                              </td>
                              <td>
                                {task.dueDate ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'var(--priority-high)' : 'var(--text-secondary)' }}>
                                    <Calendar size={14} />
                                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>-</span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  {task.tags.slice(0, 2).map((tag, i) => (
                                    <span key={i} className="task-tag">{tag}</span>
                                  ))}
                                  {task.tags.length > 2 && <span className="task-tag">+{task.tags.length - 2}</span>}
                                  {task.tags.length === 0 && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                                </div>
                              </td>
                              <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                <button className="btn-icon" onClick={() => openEditTaskModal(task)} style={{ marginRight: '0.5rem', display: 'inline-flex' }}>
                                  <Edit size={14} />
                                </button>
                                <button className="btn-icon" onClick={() => handleTaskDelete(task._id)} style={{ display: 'inline-flex' }}>
                                  <Trash size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="glass empty-state">
                      <CheckSquare size={48} />
                      <h3>No tasks match your filters</h3>
                      <p>Try clearing search or filters to see all tasks on this board.</p>
                    </div>
                  )}
                </div>
              )}

              {currentView === 'analytics' && (
                <div className="analytics-container">
                  <div className="stats-grid">
                    <div className="glass stat-card">
                      <div className="stat-info">
                        <h4>Total Tasks</h4>
                        <div className="stat-value">{stats.total}</div>
                      </div>
                      <div className="stat-icon-box blue">
                        <CheckSquare size={24} />
                      </div>
                    </div>
                    
                    <div className="glass stat-card">
                      <div className="stat-info">
                        <h4>Active Work</h4>
                        <div className="stat-value">{stats.inprogress}</div>
                      </div>
                      <div className="stat-icon-box orange">
                        <Folder size={24} />
                      </div>
                    </div>

                    <div className="glass stat-card">
                      <div className="stat-info">
                        <h4>Done</h4>
                        <div className="stat-value">{stats.done}</div>
                      </div>
                      <div className="stat-icon-box green">
                        <CheckSquare size={24} />
                      </div>
                    </div>

                    <div className="glass stat-card">
                      <div className="stat-info">
                        <h4>Overdue Alert</h4>
                        <div className="stat-value" style={{ color: stats.overdue > 0 ? 'var(--priority-high)' : 'var(--text-primary)' }}>{stats.overdue}</div>
                      </div>
                      <div className="stat-icon-box purple" style={{ color: 'var(--priority-high)' }}>
                        <AlertCircle size={24} />
                      </div>
                    </div>
                  </div>

                  <div className="charts-grid">
                    <div className="glass chart-card">
                      <h3>Status Distribution</h3>
                      <div className="bar-chart-visual">
                        <div className="bar-column">
                          <div className="bar-pillar" data-value={stats.todo} style={{ height: `${stats.total > 0 ? (stats.todo / stats.total) * 160 : 0}px`, backgroundColor: 'var(--status-todo)' }}></div>
                          <span>To Do</span>
                        </div>
                        <div className="bar-column">
                          <div className="bar-pillar" data-value={stats.inprogress} style={{ height: `${stats.total > 0 ? (stats.inprogress / stats.total) * 160 : 0}px`, backgroundColor: 'var(--status-inprogress)' }}></div>
                          <span>In Progress</span>
                        </div>
                        <div className="bar-column">
                          <div className="bar-pillar" data-value={stats.review} style={{ height: `${stats.total > 0 ? (stats.review / stats.total) * 160 : 0}px`, backgroundColor: 'var(--status-review)' }}></div>
                          <span>In Review</span>
                        </div>
                        <div className="bar-column">
                          <div className="bar-pillar" data-value={stats.done} style={{ height: `${stats.total > 0 ? (stats.done / stats.total) * 160 : 0}px`, backgroundColor: 'var(--status-done)' }}></div>
                          <span>Completed</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <h3>Task Completion</h3>
                      <div className="circle-chart-visual">
                        <div className="radial-progress">
                          <svg className="radial-svg" viewBox="0 0 130 130">
                            <defs>
                              <linearGradient id="cyan-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#00f2fe" />
                                <stop offset="100%" stopColor="#4facfe" />
                              </linearGradient>
                            </defs>
                            <circle className="radial-bg" cx="65" cy="65" r="60" />
                            <circle 
                              className="radial-fill" 
                              cx="65" 
                              cy="65" 
                              r="60" 
                              style={{ strokeDashoffset: 377 - (377 * stats.completionRate) / 100 }}
                            />
                          </svg>
                          <div className="radial-text">
                            <span className="radial-value">{stats.completionRate}%</span>
                            <span className="radial-label">Done</span>
                          </div>
                        </div>

                        <div className="priority-distribution-list">
                          <div className="priority-row">
                            <div className="priority-name">
                              <span className="priority-dot low"></span>
                              <span>Low Priority</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div className="priority-bar-container">
                                <div className="priority-bar-fill" style={{ width: `${stats.total > 0 ? (stats.low / stats.total) * 100 : 0}%`, backgroundColor: 'var(--priority-low)' }}></div>
                              </div>
                              <span style={{ fontWeight: 600 }}>{stats.low}</span>
                            </div>
                          </div>

                          <div className="priority-row">
                            <div className="priority-name">
                              <span className="priority-dot medium"></span>
                              <span>Medium Priority</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div className="priority-bar-container">
                                <div className="priority-bar-fill" style={{ width: `${stats.total > 0 ? (stats.medium / stats.total) * 100 : 0}%`, backgroundColor: 'var(--priority-medium)' }}></div>
                              </div>
                              <span style={{ fontWeight: 600 }}>{stats.medium}</span>
                            </div>
                          </div>

                          <div className="priority-row">
                            <div className="priority-name">
                              <span className="priority-dot high"></span>
                              <span>High Priority</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div className="priority-bar-container">
                                <div className="priority-bar-fill" style={{ width: `${stats.total > 0 ? (stats.high / stats.total) * 100 : 0}%`, backgroundColor: 'var(--priority-high)' }}></div>
                              </div>
                              <span style={{ fontWeight: 600 }}>{stats.high}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass empty-state" style={{ margin: 'auto' }}>
              <Folder size={64} />
              <h3>Select or Create a Workspace Board</h3>
              <p>You don't have any active workspace select. Use the "New Board" button in the sidebar to create one!</p>
              <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setShowProjectModal(true)}>
                <Plus size={16} />
                <span>Create Workspace Board</span>
              </button>
            </div>
          )}
        </main>

        {/* Task Creation & Edit Modal */}
        {showTaskModal && (
          <div className="modal-overlay">
            <div className="glass modal-content glass-panel">
              <div className="modal-header">
                <h2>{editingTask ? 'Edit Task Specifications' : 'Create Task Specification'}</h2>
                <button className="btn-close" onClick={() => setShowTaskModal(false)}>
                  <Close size={20} />
                </button>
              </div>

              <form onSubmit={handleTaskSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Task Title *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="E.g., Design database schema" 
                      value={taskForm.title}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description Details</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      placeholder="Provide background, checklists, or spec notes..."
                      value={taskForm.description}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    ></textarea>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Swimlane Status</label>
                      <select 
                        className="form-control"
                        value={taskForm.status}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Completed</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Priority level</label>
                      <select 
                        className="form-control"
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Due Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Assignee Name</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="E.g., Alex Johnson"
                        value={taskForm.assigneeName}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, assigneeName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Tags & Categories</label>
                    <div className="tags-input-container">
                      {taskForm.tags.map((tag, idx) => (
                        <span key={idx} className="tag-badge">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(idx)}>×</button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        placeholder="Type tag & press enter"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddTag(e);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingTask ? 'Save Changes' : 'Add Task'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Project Board creation Modal */}
        {showProjectModal && (
          <div className="modal-overlay">
            <div className="glass modal-content glass-panel" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h2>New Workspace Board</h2>
                <button className="btn-close" onClick={() => setShowProjectModal(false)}>
                  <Close size={20} />
                </button>
              </div>

              <form onSubmit={handleProjectSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Board Title *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="E.g., Engineering Sprint 1" 
                      value={projectForm.title}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="Sprint details or board scope..."
                      value={projectForm.description}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Board</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Inner Component: Task Card
function TaskCard({ task, onEdit, onDelete, onDragStart }) {
  // Check if overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  
  return (
    <div 
      className="glass task-card"
      draggable
      onDragStart={(e) => onDragStart(e, task._id)}
      onClick={() => onEdit(task)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
        <span className={`task-priority-badge ${task.priority}`}>
          {task.priority}
        </span>
        
        <div className="card-actions" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '0.2rem' }}>
          <button 
            className="btn-icon" 
            style={{ width: '22px', height: '22px', border: 'none' }}
            onClick={() => onEdit(task)}
          >
            <Edit size={10} />
          </button>
          <button 
            className="btn-icon" 
            style={{ width: '22px', height: '22px', border: 'none' }}
            onClick={() => onDelete(task._id)}
          >
            <Trash size={10} />
          </button>
        </div>
      </div>

      <h4>{task.title}</h4>
      {task.description && <p>{task.description}</p>}

      {task.tags && task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map((tag, idx) => (
            <span key={idx} className="task-tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="task-card-footer">
        <div className={`task-due-date ${isOverdue ? 'overdue' : ''}`}>
          <Calendar size={12} />
          <span>
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date'}
          </span>
        </div>

        {task.assigneeName && (
          <div className="task-assignee" title={`Assigned to ${task.assigneeName}`}>
            <div className="task-assignee-avatar">
              {task.assigneeName.substring(0, 2).toUpperCase()}
            </div>
            <span className="task-assignee-name">{task.assigneeName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
