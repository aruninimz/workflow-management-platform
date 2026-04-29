// FlowBit Tasks Module - Supabase Version
// Beautiful UI with real database connection

import supabase from '../../src/js/supabase-client.js';

// State management
let currentTasks = [];
let currentView = 'list'; // 'list' or 'kanban'
let editingTaskId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Tasks module initializing...');
    
    // Check authentication
    try {
        const user = await supabase.getCurrentUser();
        if (!user) {
            console.log('❌ Not authenticated, redirecting...');
            window.location.href = '../../src/login.html';
            return;
        }
        console.log('✅ User authenticated:', user.email);
    } catch (error) {
        console.error('❌ Auth error:', error);
        window.location.href = '../../src/login.html';
        return;
    }

    // Initialize UI
    initializeUI();
    
    // Load data
    await loadTasks();
    await populateDropdowns();
    
    console.log('✅ Tasks module ready');
});

// Initialize UI components
function initializeUI() {
    // Profile dropdown
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    profileBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown?.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        profileDropdown?.classList.add('hidden');
    });

    logoutBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.signOut();
        window.location.href = '../../src/login.html';
    });

    // Button events
    document.getElementById('createTaskBtn')?.addEventListener('click', openCreateModal);
    document.getElementById('toggleViewBtn')?.addEventListener('click', toggleView);
    document.getElementById('taskForm')?.addEventListener('submit', handleTaskSubmit);
    
    // Filter events
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('goalFilter')?.addEventListener('change', applyFilters);
    document.getElementById('milestoneFilter')?.addEventListener('change', applyFilters);
    document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
    document.getElementById('priorityFilter')?.addEventListener('change', applyFilters);
}

// Load tasks from Supabase
async function loadTasks() {
    try {
        console.log('📥 Loading tasks from Supabase...');
        const tasks = await supabase.getTasks();
        console.log('✅ Tasks loaded:', tasks.length);
        
        currentTasks = tasks || [];
        updateTaskStats();
        renderTasks();
    } catch (error) {
        console.error('❌ Error loading tasks:', error);
        showNotification('Failed to load tasks', 'error');
        currentTasks = [];
    }
}

// Update statistics
function updateTaskStats() {
    const total = currentTasks.length;
    const pending = currentTasks.filter(t => t.status === 'TODO').length;
    const inProgress = currentTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completed = currentTasks.filter(t => t.status === 'COMPLETED').length;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('activeTasks').textContent = inProgress;
    document.getElementById('completedTasks').textContent = completed;
}

// Render tasks in current view
function renderTasks() {
    if (currentView === 'list') {
        renderListView();
    } else {
        renderKanbanView();
    }
}

// Render list view
function renderListView() {
    const container = document.getElementById('listView');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) return;

    container.innerHTML = '';

    if (currentTasks.length === 0) {
        container.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    container.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    currentTasks.forEach(task => {
        const taskCard = createTaskCard(task);
        container.appendChild(taskCard);
    });
}

// Create task card element
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `
        <div class="task-header">
            <div class="task-title-row">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <span class="badge badge-${getStatusColor(task.status)}">
                    ${task.status.replace('_', ' ')}
                </span>
            </div>
            <div class="task-actions">
                <button onclick="editTask('${task.id}')" class="btn-icon" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" class="btn-icon text-red-600" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="task-body">
            <p class="task-description">${escapeHtml(task.description || 'No description')}</p>
            <div class="task-meta">
                ${task.goal_title ? `<span class="task-meta-item"><i class="fas fa-bullseye"></i> ${escapeHtml(task.goal_title)}</span>` : ''}
                ${task.milestone_title ? `<span class="task-meta-item"><i class="fas fa-flag"></i> ${escapeHtml(task.milestone_title)}</span>` : ''}
                ${task.assignee_name ? `<span class="task-meta-item"><i class="fas fa-user"></i> ${escapeHtml(task.assignee_name)}</span>` : ''}
                ${task.due_date ? `<span class="task-meta-item"><i class="fas fa-calendar"></i> ${formatDate(task.due_date)}</span>` : ''}
                <span class="badge badge-${getPriorityColor(task.priority)}">${task.priority}</span>
            </div>
        </div>
    `;
    return card;
}

// Toggle view (list/kanban)
function toggleView() {
    currentView = currentView === 'list' ? 'kanban' : 'list';
    const btn = document.getElementById('toggleViewBtn');
    const listView = document.getElementById('listView');
    const kanbanView = document.getElementById('kanbanView');
    
    if (btn) {
        btn.innerHTML = currentView === 'list' 
            ? '<i class="fas fa-th"></i> Kanban View'
            : '<i class="fas fa-list"></i> List View';
    }
    
    if (currentView === 'list') {
        listView?.classList.remove('hidden');
        kanbanView?.classList.add('hidden');
        renderListView();
    } else {
        listView?.classList.add('hidden');
        kanbanView?.classList.remove('hidden');
        renderKanbanView();
    }
}

// Render kanban view
function renderKanbanView() {
    const statusColumns = {
        'TODO': document.getElementById('kanbanPending'),
        'IN_PROGRESS': document.getElementById('kanbanProgress'),
        'COMPLETED': document.getElementById('kanbanCompleted'),
        'BLOCKED': document.getElementById('kanbanBlocked')
    };
    
    const statusCounts = {
        'TODO': document.getElementById('kanbanPendingCount'),
        'IN_PROGRESS': document.getElementById('kanbanProgressCount'),
        'COMPLETED': document.getElementById('kanbanCompletedCount'),
        'BLOCKED': document.getElementById('kanbanBlockedCount')
    };
    
    // Clear all columns
    Object.values(statusColumns).forEach(col => {
        if (col) col.innerHTML = '';
    });
    
    // Group tasks by status
    const tasksByStatus = {
        'TODO': [],
        'IN_PROGRESS': [],
        'COMPLETED': [],
        'BLOCKED': []
    };
    
    currentTasks.forEach(task => {
        if (tasksByStatus[task.status]) {
            tasksByStatus[task.status].push(task);
        }
    });
    
    // Render tasks in each column
    Object.entries(tasksByStatus).forEach(([status, tasks]) => {
        const column = statusColumns[status];
        const countEl = statusCounts[status];
        
        if (countEl) {
            countEl.textContent = tasks.length;
        }
        
        if (column) {
            tasks.forEach(task => {
                const card = createKanbanCard(task);
                column.appendChild(card);
            });
        }
    });
}

// Create kanban card element
function createKanbanCard(task) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.innerHTML = `
        <div class="kanban-card-header">
            <h4 class="kanban-card-title">${escapeHtml(task.title)}</h4>
            <span class="badge badge-${getPriorityColor(task.priority)}">${task.priority}</span>
        </div>
        <p class="kanban-card-desc">${escapeHtml(task.description || 'No description')}</p>
        <div class="kanban-card-footer">
            ${task.assignee_name ? `<span class="kanban-card-meta"><i class="fas fa-user"></i> ${escapeHtml(task.assignee_name)}</span>` : ''}
            ${task.due_date ? `<span class="kanban-card-meta"><i class="fas fa-calendar"></i> ${formatDate(task.due_date)}</span>` : ''}
        </div>
        <div class="kanban-card-actions">
            <button onclick="editTask('${task.id}')" class="btn-icon" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteTask('${task.id}')" class="btn-icon text-red-600" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return card;
}

// Open create modal
function openCreateModal() {
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = 'Create New Task';
    document.getElementById('taskForm').reset();
    document.getElementById('taskModal').classList.remove('hidden');
}

// Edit task
window.editTask = async function(taskId) {
    try {
        const task = currentTasks.find(t => t.id === taskId);
        if (!task) return;

        editingTaskId = taskId;
        document.getElementById('modalTitle').textContent = 'Edit Task';
        
        // Populate form (match actual HTML IDs)
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskGoalId').value = task.goal_id || '';
        document.getElementById('taskMilestoneId').value = task.milestone_id || '';
        document.getElementById('taskAssignee').value = task.assignee_id || '';
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskDueDate').value = task.due_date || '';
        document.getElementById('taskEstimatedHours').value = task.estimated_hours || '';
        
        document.getElementById('taskModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error editing task:', error);
        showNotification('Failed to load task', 'error');
    }
};

// Delete task
window.deleteTask = async function(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        await supabase.deleteTask(taskId);
        showNotification('Task deleted successfully', 'success');
        await loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Failed to delete task', 'error');
    }
};

// Handle form submit
async function handleTaskSubmit(e) {
    e.preventDefault();

    const formData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        goal_id: document.getElementById('taskGoalId').value || null,
        milestone_id: document.getElementById('taskMilestoneId').value || null,
        assignee_id: document.getElementById('taskAssignee').value || null,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        due_date: document.getElementById('taskDueDate').value || null,
        estimated_hours: parseInt(document.getElementById('taskEstimatedHours').value) || null
    };

    try {
        if (editingTaskId) {
            await supabase.updateTask(editingTaskId, formData);
            showNotification('Task updated successfully', 'success');
        } else {
            await supabase.createTask(formData);
            showNotification('Task created successfully', 'success');
        }

        closeTaskModal();
        await loadTasks();
    } catch (error) {
        console.error('Error saving task:', error);
        showNotification(error.message || 'Failed to save task', 'error');
    }
}

// Close modal
window.closeTaskModal = function() {
    document.getElementById('taskModal').classList.add('hidden');
    document.getElementById('taskForm').reset();
    editingTaskId = null;
};

// Populate dropdowns
async function populateDropdowns() {
    try {
        // Load goals
        const goals = await supabase.getGoals();
        const goalSelect = document.getElementById('taskGoalId');
        const goalFilter = document.getElementById('goalFilter');
        
        if (goalSelect) {
            goalSelect.innerHTML = '<option value="">Select a goal...</option>';
            goals.forEach(goal => {
                goalSelect.innerHTML += `<option value="${goal.id}">${escapeHtml(goal.title)}</option>`;
            });
        }
        
        if (goalFilter) {
            goalFilter.innerHTML = '<option value="">All Goals</option>';
            goals.forEach(goal => {
                goalFilter.innerHTML += `<option value="${goal.id}">${escapeHtml(goal.title)}</option>`;
            });
        }

        // Load milestones
        const milestones = await supabase.getMilestones();
        const milestoneSelect = document.getElementById('taskMilestoneId');
        const milestoneFilter = document.getElementById('milestoneFilter');
        
        if (milestoneSelect) {
            milestoneSelect.innerHTML = '<option value="">Select a milestone...</option>';
            milestones.forEach(ms => {
                milestoneSelect.innerHTML += `<option value="${ms.id}">${escapeHtml(ms.title)}</option>`;
            });
        }
        
        if (milestoneFilter) {
            milestoneFilter.innerHTML = '<option value="">All Milestones</option>';
            milestones.forEach(ms => {
                milestoneFilter.innerHTML += `<option value="${ms.id}">${escapeHtml(ms.title)}</option>`;
            });
        }

        // Load team members
        const members = await supabase.getAllTeamMembers();
        const assigneeSelect = document.getElementById('taskAssignee');
        
        if (assigneeSelect) {
            assigneeSelect.innerHTML = '<option value="">Unassigned</option>';
            members.forEach(member => {
                assigneeSelect.innerHTML += `<option value="${member.id}">${escapeHtml(member.full_name)}</option>`;
            });
        }
    } catch (error) {
        console.error('Error populating dropdowns:', error);
    }
}

// Apply filters
function applyFilters() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const goalFilter = document.getElementById('goalFilter')?.value || '';
    const milestoneFilter = document.getElementById('milestoneFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const priorityFilter = document.getElementById('priorityFilter')?.value || '';

    const filtered = currentTasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(search) || 
                            (task.description || '').toLowerCase().includes(search);
        const matchesGoal = !goalFilter || task.goal_id === goalFilter;
        const matchesMilestone = !milestoneFilter || task.milestone_id === milestoneFilter;
        const matchesStatus = !statusFilter || task.status === statusFilter;
        const matchesPriority = !priorityFilter || task.priority === priorityFilter;

        return matchesSearch && matchesGoal && matchesMilestone && matchesStatus && matchesPriority;
    });

    // Re-render with filtered tasks
    const temp = currentTasks;
    currentTasks = filtered;
    renderTasks();
    currentTasks = temp; // Restore original
}

// Utility functions
function getStatusColor(status) {
    const colors = {
        'TODO': 'gray',
        'IN_PROGRESS': 'blue',
        'COMPLETED': 'green',
        'BLOCKED': 'red'
    };
    return colors[status] || 'gray';
}

function getPriorityColor(priority) {
    const colors = {
        'LOW': 'gray',
        'MEDIUM': 'yellow',
        'HIGH': 'orange',
        'CRITICAL': 'red'
    };
    return colors[priority] || 'gray';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Simple notification (you can enhance this)
    const color = type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue';
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 bg-${color}-500 text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
