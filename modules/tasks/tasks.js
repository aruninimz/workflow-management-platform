/* ============================================
   TASKS MODULE - JavaScript Logic
   Developer: Dev 3
   ============================================ */

class TaskManager {
    constructor() {
        this.tableName = 'tasks';
        this.currentView = 'list'; // 'list' or 'kanban'
        this.init();
    }

    init() {
        if (!window.dataManager) {
            console.error('DataManager not initialized');
            return;
        }
        console.log('TaskManager initialized');
    }

    // ============================================
    // CRUD Operations
    // ============================================

    createTask(taskData) {
        try {
            const currentUser = window.authManager?.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            const task = {
                id: this.generateId(),
                title: taskData.title,
                description: taskData.description || '',
                goalId: taskData.goalId || null,
                goalTitle: taskData.goalId ? this.getGoalTitle(taskData.goalId) : null,
                milestoneId: taskData.milestoneId || null,
                milestoneTitle: taskData.milestoneId ? this.getMilestoneTitle(taskData.milestoneId) : null,
                status: taskData.status || 'PENDING',
                priority: taskData.priority || 'MEDIUM',
                dueDate: taskData.dueDate,
                tags: taskData.tags || [],
                assignedTo: currentUser.id,
                assignedToName: currentUser.name || currentUser.email,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                createdBy: currentUser.id
            };

            // Validate
            this.validate(task);

            // Save to storage
            window.dataManager.create(this.tableName, task);

            // Show notification
            if (window.notificationManager) {
                window.notificationManager.show({
                    title: 'Success',
                    message: `Task "${task.title}" created successfully`,
                    type: 'success'
                });
            }

            return task;
        } catch (error) {
            console.error('Error creating task:', error);
            if (window.notificationManager) {
                window.notificationManager.show({
                    title: 'Error',
                    message: error.message,
                    type: 'error'
                });
            }
            throw error;
        }
    }

    getTask(id) {
        return window.dataManager.read(this.tableName, id);
    }

    getTasks(filters = {}) {
        let tasks = window.dataManager.readAll(this.tableName);

        // Apply filters
        if (filters.goalId) {
            tasks = tasks.filter(t => t.goalId === filters.goalId);
        }

        if (filters.milestoneId) {
            tasks = tasks.filter(t => t.milestoneId === filters.milestoneId);
        }

        if (filters.status) {
            tasks = tasks.filter(t => t.status === filters.status);
        }

        if (filters.priority) {
            tasks = tasks.filter(t => t.priority === filters.priority);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            tasks = tasks.filter(t => 
                t.title.toLowerCase().includes(searchLower) ||
                (t.description && t.description.toLowerCase().includes(searchLower)) ||
                (t.goalTitle && t.goalTitle.toLowerCase().includes(searchLower)) ||
                (t.milestoneTitle && t.milestoneTitle.toLowerCase().includes(searchLower)) ||
                (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchLower)))
            );
        }

        // Check for overdue
        const now = new Date().getTime();
        tasks.forEach(task => {
            const dueDate = new Date(task.dueDate).getTime();
            task.isOverdue = dueDate < now && task.status !== 'COMPLETED';
        });

        // Sort by priority then due date
        tasks.sort((a, b) => {
            const priorityOrder = { CRITICAL: 5, URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
            const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        return tasks;
    }

    updateTask(id, updates) {
        try {
            const task = this.getTask(id);
            if (!task) {
                throw new Error('Task not found');
            }

            const updatedTask = {
                ...task,
                ...updates,
                updatedAt: Date.now()
            };

            // Update goal title if goalId changed
            if (updates.goalId !== undefined && updates.goalId !== task.goalId) {
                updatedTask.goalTitle = updates.goalId ? this.getGoalTitle(updates.goalId) : null;
            }

            // Update milestone title if milestoneId changed
            if (updates.milestoneId !== undefined && updates.milestoneId !== task.milestoneId) {
                updatedTask.milestoneTitle = updates.milestoneId ? this.getMilestoneTitle(updates.milestoneId) : null;
            }

            // Validate
            this.validate(updatedTask);

            // Update storage
            window.dataManager.update(this.tableName, id, updatedTask);

            // Show notification
            if (window.notificationManager) {
                window.notificationManager.show({
                    title: 'Success',
                    message: `Task "${updatedTask.title}" updated successfully`,
                    type: 'success'
                });
            }

            return updatedTask;
        } catch (error) {
            console.error('Error updating task:', error);
            if (window.notificationManager) {
                window.notificationManager.show({
                    title: 'Error',
                    message: error.message,
                    type: 'error'
                });
            }
            throw error;
        }
    }

    deleteTask(id) {
        try {
            const task = this.getTask(id);
            if (!task) {
                throw new Error('Task not found');
            }

            window.dataManager.delete(this.tableName, id);

            // Show notification
            if (window.notificationManager) {
                window.notificationManager.show({
                    title: 'Success',
                    message: `Task "${task.title}" deleted successfully`,
                    type: 'success'
                });
            }

            return true;
        } catch (error) {
            console.error('Error deleting task:', error);
            if (window.notificationManager) {
                window.notificationManager.show({
                    title: 'Error',
                    message: error.message,
                    type: 'error'
                });
            }
            throw error;
        }
    }

    // ============================================
    // Statistics & Analytics
    // ============================================

    getTaskStats() {
        const tasks = this.getTasks();
        const now = new Date().getTime();

        const stats = {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'PENDING').length,
            inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
            completed: tasks.filter(t => t.status === 'COMPLETED').length,
            blocked: tasks.filter(t => t.status === 'BLOCKED').length,
            overdue: tasks.filter(t => {
                const dueDate = new Date(t.dueDate).getTime();
                return dueDate < now && t.status !== 'COMPLETED';
            }).length,
            byPriority: {
                critical: tasks.filter(t => t.priority === 'CRITICAL').length,
                urgent: tasks.filter(t => t.priority === 'URGENT').length,
                high: tasks.filter(t => t.priority === 'HIGH').length,
                medium: tasks.filter(t => t.priority === 'MEDIUM').length,
                low: tasks.filter(t => t.priority === 'LOW').length
            },
            completionRate: 0
        };

        if (stats.total > 0) {
            stats.completionRate = Math.round((stats.completed / stats.total) * 100);
        }

        return stats;
    }

    getTasksByGoal(goalId) {
        return this.getTasks({ goalId });
    }

    getTasksByMilestone(milestoneId) {
        return this.getTasks({ milestoneId });
    }

    getUpcomingTasks(days = 7) {
        const tasks = this.getTasks();
        const now = new Date();
        const future = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

        return tasks.filter(t => {
            const dueDate = new Date(t.dueDate);
            return dueDate >= now && dueDate <= future && t.status !== 'COMPLETED';
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    getOverdueTasks() {
        const tasks = this.getTasks();
        const now = new Date().getTime();

        return tasks.filter(t => {
            const dueDate = new Date(t.dueDate).getTime();
            return dueDate < now && t.status !== 'COMPLETED';
        });
    }

    getCriticalTasks() {
        return this.getTasks().filter(t => 
            (t.priority === 'CRITICAL' || t.priority === 'URGENT') && 
            t.status !== 'COMPLETED'
        );
    }

    // ============================================
    // Export for Dashboard
    // ============================================

    exportTaskData() {
        const stats = this.getTaskStats();
        const tasks = this.getTasks();

        return {
            stats,
            recentTasks: tasks.slice(0, 5),
            upcomingTasks: this.getUpcomingTasks(7),
            overdueTasks: this.getOverdueTasks(),
            criticalTasks: this.getCriticalTasks(),
            completionRate: stats.completionRate
        };
    }

    // ============================================
    // Validation & Helpers
    // ============================================

    validate(task) {
        if (!task.title || task.title.trim() === '') {
            throw new Error('Task title is required');
        }

        if (!task.dueDate) {
            throw new Error('Due date is required');
        }

        if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'].includes(task.status)) {
            throw new Error('Invalid status');
        }

        if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'].includes(task.priority)) {
            throw new Error('Invalid priority');
        }

        return true;
    }

    getGoalTitle(goalId) {
        if (window.goalManager) {
            const goal = window.goalManager.getGoal(goalId);
            return goal ? goal.title : null;
        }
        return null;
    }

    getMilestoneTitle(milestoneId) {
        if (window.milestoneManager) {
            const milestone = window.milestoneManager.getMilestone(milestoneId);
            return milestone ? milestone.title : null;
        }
        return null;
    }

    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getPriorityColor(priority) {
        const colors = {
            'CRITICAL': 'red',
            'URGENT': 'orange',
            'HIGH': 'amber',
            'MEDIUM': 'blue',
            'LOW': 'gray'
        };
        return colors[priority] || 'gray';
    }

    getStatusColor(status) {
        const colors = {
            'PENDING': 'gray',
            'IN_PROGRESS': 'blue',
            'COMPLETED': 'green',
            'BLOCKED': 'red'
        };
        return colors[status] || 'gray';
    }

    getStatusLabel(status) {
        const labels = {
            'PENDING': 'Pending',
            'IN_PROGRESS': 'In Progress',
            'COMPLETED': 'Completed',
            'BLOCKED': 'Blocked'
        };
        return labels[status] || status;
    }

    getPriorityLabel(priority) {
        return priority.charAt(0) + priority.slice(1).toLowerCase();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    getDaysUntilDue(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
}

// Initialize global instance
const taskManager = new TaskManager();
window.taskManager = taskManager;

// ============================================
// UI Functions
// ============================================

function loadTasks() {
    const filters = {
        search: document.getElementById('searchInput')?.value || '',
        goalId: document.getElementById('goalFilter')?.value || '',
        milestoneId: document.getElementById('milestoneFilter')?.value || '',
        status: document.getElementById('statusFilter')?.value || '',
        priority: document.getElementById('priorityFilter')?.value || ''
    };

    const tasks = taskManager.getTasks(filters);
    
    if (taskManager.currentView === 'list') {
        renderListView(tasks);
    } else {
        renderKanbanView(tasks);
    }
}

function renderListView(tasks) {
    const container = document.getElementById('listView');
    const emptyState = document.getElementById('emptyState');

    if (!container) return;

    if (tasks.length === 0) {
        container.classList.add('hidden');
        emptyState?.classList.remove('hidden');
        return;
    }

    container.classList.remove('hidden');
    emptyState?.classList.add('hidden');

    container.innerHTML = tasks.map(task => {
        const priorityColor = taskManager.getPriorityColor(task.priority);
        return `
        <div class="task-card priority-${priorityColor} ${task.isOverdue ? 'overdue' : ''}" data-id="${task.id}">
            <div class="task-header">
                <div class="task-title-section">
                    <h3 class="task-title">${task.title}</h3>
                    <div class="task-meta">
                        ${task.goalTitle ? `
                            <span class="task-meta-item">
                                <i class="fas fa-bullseye"></i>
                                ${task.goalTitle}
                            </span>
                        ` : ''}
                        ${task.milestoneTitle ? `
                            <span class="task-meta-item">
                                <i class="fas fa-flag-checkered"></i>
                                ${task.milestoneTitle}
                            </span>
                        ` : ''}
                        <span class="task-meta-item">
                            <i class="fas fa-calendar"></i>
                            Due: ${taskManager.formatDate(task.dueDate)}
                        </span>
                        ${task.isOverdue ? `
                            <span class="task-meta-item text-red-600">
                                <i class="fas fa-exclamation-circle"></i>
                                Overdue
                            </span>
                        ` : `
                            <span class="task-meta-item">
                                <i class="fas fa-clock"></i>
                                ${taskManager.getDaysUntilDue(task.dueDate)} days
                            </span>
                        `}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn task-btn-edit" onclick="editTask('${task.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn task-btn-delete" onclick="deleteTaskConfirm('${task.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            ${task.description ? `
                <p class="task-description">${task.description}</p>
            ` : ''}
            
            <div class="task-badges">
                <span class="badge badge-status ${task.status.toLowerCase().replace('_', '-')}">
                    ${taskManager.getStatusLabel(task.status)}
                </span>
                <span class="badge badge-priority priority-${priorityColor}">
                    <i class="fas fa-flag"></i>
                    ${taskManager.getPriorityLabel(task.priority)}
                </span>
                ${task.tags && task.tags.length > 0 ? task.tags.map(tag => `
                    <span class="badge badge-tag">${tag}</span>
                `).join('') : ''}
            </div>
        </div>
    `;
    }).join('');
}

function renderKanbanView(tasks) {
    const columns = {
        PENDING: document.getElementById('kanbanPending'),
        IN_PROGRESS: document.getElementById('kanbanProgress'),
        COMPLETED: document.getElementById('kanbanCompleted'),
        BLOCKED: document.getElementById('kanbanBlocked')
    };

    // Clear columns
    Object.values(columns).forEach(col => {
        if (col) col.innerHTML = '';
    });

    // Group tasks by status
    const grouped = {
        PENDING: tasks.filter(t => t.status === 'PENDING'),
        IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
        COMPLETED: tasks.filter(t => t.status === 'COMPLETED'),
        BLOCKED: tasks.filter(t => t.status === 'BLOCKED')
    };

    // Update counts
    document.getElementById('kanbanPendingCount').textContent = grouped.PENDING.length;
    document.getElementById('kanbanProgressCount').textContent = grouped.IN_PROGRESS.length;
    document.getElementById('kanbanCompletedCount').textContent = grouped.COMPLETED.length;
    document.getElementById('kanbanBlockedCount').textContent = grouped.BLOCKED.length;

    // Render cards
    Object.keys(grouped).forEach(status => {
        if (!columns[status]) return;

        columns[status].innerHTML = grouped[status].map(task => {
            const priorityColor = taskManager.getPriorityColor(task.priority);
            return `
            <div class="kanban-card priority-${priorityColor}" data-id="${task.id}">
                <div class="kanban-card-header">
                    <h4 class="kanban-card-title">${task.title}</h4>
                    <div class="kanban-card-actions">
                        <button class="kanban-btn" onclick="editTask('${task.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
                ${task.description ? `<p class="kanban-card-description">${task.description}</p>` : ''}
                <div class="kanban-card-footer">
                    <span class="badge badge-priority priority-${priorityColor}">
                        ${taskManager.getPriorityLabel(task.priority)}
                    </span>
                    <span class="kanban-card-date">
                        <i class="fas fa-calendar"></i>
                        ${taskManager.formatDate(task.dueDate)}
                    </span>
                </div>
            </div>
        `;
        }).join('');

        if (grouped[status].length === 0) {
            columns[status].innerHTML = '<div class="kanban-empty">No tasks</div>';
        }
    });
}

function loadTaskStats() {
    const stats = taskManager.getTaskStats();
    
    document.getElementById('totalTasks').textContent = stats.total;
    document.getElementById('pendingTasks').textContent = stats.pending;
    document.getElementById('activeTasks').textContent = stats.inProgress;
    document.getElementById('completedTasks').textContent = stats.completed;
}

function populateDropdowns() {
    const goalFilter = document.getElementById('goalFilter');
    const goalSelect = document.getElementById('taskGoalId');
    const milestoneFilter = document.getElementById('milestoneFilter');
    const milestoneSelect = document.getElementById('taskMilestoneId');

    // Populate goals
    if (window.goalManager) {
        const goals = window.goalManager.getGoals();
        if (goalFilter) {
            goalFilter.innerHTML = '<option value="">All Goals</option>' +
                goals.map(g => `<option value="${g.id}">${g.title}</option>`).join('');
        }
        if (goalSelect) {
            goalSelect.innerHTML = '<option value="">Select a goal...</option>' +
                goals.map(g => `<option value="${g.id}">${g.title}</option>`).join('');
        }
    }

    // Populate milestones
    if (window.milestoneManager) {
        const milestones = window.milestoneManager.getMilestones();
        if (milestoneFilter) {
            milestoneFilter.innerHTML = '<option value="">All Milestones</option>' +
                milestones.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
        }
        if (milestoneSelect) {
            milestoneSelect.innerHTML = '<option value="">Select a milestone...</option>' +
                milestones.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
        }
    }
}

function applyFilters() {
    loadTasks();
}

function toggleView() {
    const listView = document.getElementById('listView');
    const kanbanView = document.getElementById('kanbanView');
    const toggleBtn = document.getElementById('toggleViewBtn');

    if (taskManager.currentView === 'list') {
        taskManager.currentView = 'kanban';
        listView.classList.add('hidden');
        kanbanView.classList.remove('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> List View';
    } else {
        taskManager.currentView = 'list';
        listView.classList.remove('hidden');
        kanbanView.classList.add('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-th"></i> Kanban View';
    }

    loadTasks();
}

function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Create Task';
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskModal').classList.add('active');
}

function editTask(id) {
    const task = taskManager.getTask(id);
    if (!task) return;

    document.getElementById('modalTitle').textContent = 'Edit Task';
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskGoalId').value = task.goalId || '';
    document.getElementById('taskMilestoneId').value = task.milestoneId || '';
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskDueDate').value = task.dueDate;
    document.getElementById('taskTags').value = task.tags ? task.tags.join(', ') : '';
    document.getElementById('taskModal').classList.add('active');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
}

function handleTaskSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('taskId').value;
    const tagsInput = document.getElementById('taskTags').value;
    
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        goalId: document.getElementById('taskGoalId').value || null,
        milestoneId: document.getElementById('taskMilestoneId').value || null,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        dueDate: document.getElementById('taskDueDate').value,
        tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : []
    };

    try {
        if (id) {
            taskManager.updateTask(id, taskData);
        } else {
            taskManager.createTask(taskData);
        }

        closeTaskModal();
        loadTasks();
        loadTaskStats();
    } catch (error) {
        console.error('Error saving task:', error);
    }
}

function deleteTaskConfirm(id) {
    const task = taskManager.getTask(id);
    if (!task) return;

    if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
        taskManager.deleteTask(id);
        loadTasks();
        loadTaskStats();
    }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('taskModal');
    if (e.target === modal) {
        closeTaskModal();
    }
});

console.log('✅ Tasks module loaded');
