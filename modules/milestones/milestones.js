/* ============================================
   MILESTONES MODULE - JavaScript Logic
   Developer: Dev 2
   ============================================ */

class MilestoneManager {
    constructor() {
        this.tableName = 'milestones';
        this.currentFilters = {};
        this.init();
    }

    init() {
        // Ensure table exists in dataManager
        if (!window.dataManager) {
            console.error('DataManager not initialized');
            return;
        }
        console.log('MilestoneManager initialized');
    }

    // ============================================
    // CRUD Operations
    // ============================================

    createMilestone(milestoneData) {
        try {
            const currentUser = window.authManager?.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            const milestone = {
                id: this.generateId(),
                title: milestoneData.title,
                description: milestoneData.description || '',
                goalId: milestoneData.goalId,
                goalTitle: this.getGoalTitle(milestoneData.goalId),
                status: milestoneData.status || 'NOT_STARTED',
                dueDate: milestoneData.dueDate,
                progress: parseInt(milestoneData.progress) || 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                createdBy: currentUser.id,
                ownerId: currentUser.id
            };

            // Validate
            this.validate(milestone);

            // Save to storage
            window.dataManager.create(this.tableName, milestone);

            // Show notification
            if (window.notificationManager) {
                window.notificationManager.show({
                    title: 'Success',
                    message: `Milestone "${milestone.title}" created successfully`,
                    type: 'success'
                });
            }

            return milestone;
        } catch (error) {
            console.error('Error creating milestone:', error);
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

    getMilestone(id) {
        return window.dataManager.read(this.tableName, id);
    }

    getMilestones(filters = {}) {
        let milestones = window.dataManager.readAll(this.tableName);

        // Apply filters
        if (filters.goalId) {
            milestones = milestones.filter(m => m.goalId === filters.goalId);
        }

        if (filters.status) {
            milestones = milestones.filter(m => m.status === filters.status);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            milestones = milestones.filter(m =>
                m.title.toLowerCase().includes(searchLower) ||
                (m.description && m.description.toLowerCase().includes(searchLower)) ||
                (m.goalTitle && m.goalTitle.toLowerCase().includes(searchLower))
            );
        }

        // Check for overdue
        const now = new Date().getTime();
        milestones.forEach(milestone => {
            const dueDate = new Date(milestone.dueDate).getTime();
            milestone.isOverdue = dueDate < now && milestone.status !== 'COMPLETED';
        });

        // Sort
        const sortBy = filters.sort || 'dueDate';
        milestones.sort((a, b) => {
            if (sortBy === 'dueDate') {
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else if (sortBy === 'progress') {
                return b.progress - a.progress;
            } else if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            } else if (sortBy === 'createdAt') {
                return b.createdAt - a.createdAt;
            }
            return 0;
        });

        return milestones;
    }

    updateMilestone(id, updates) {
        try {
            const milestone = this.getMilestone(id);
            if (!milestone) {
                throw new Error('Milestone not found');
            }

            const updatedMilestone = {
                ...milestone,
                ...updates,
                updatedAt: Date.now()
            };

            // Update goal title if goalId changed
            if (updates.goalId && updates.goalId !== milestone.goalId) {
                updatedMilestone.goalTitle = this.getGoalTitle(updates.goalId);
            }

            // Validate
            this.validate(updatedMilestone);

            // Update storage
            window.dataManager.update(this.tableName, id, updatedMilestone);

            // Show notification
            if (window.notificationManager) {
                window.notificationManager.show({
                    title: 'Success',
                    message: `Milestone "${updatedMilestone.title}" updated successfully`,
                    type: 'success'
                });
            }

            return updatedMilestone;
        } catch (error) {
            console.error('Error updating milestone:', error);
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

    deleteMilestone(id) {
        try {
            const milestone = this.getMilestone(id);
            if (!milestone) {
                throw new Error('Milestone not found');
            }

            window.dataManager.delete(this.tableName, id);

            // Show notification
            if (window.notificationManager) {
                window.notificationManager.show({
                    title: 'Success',
                    message: `Milestone "${milestone.title}" deleted successfully`,
                    type: 'success'
                });
            }

            return true;
        } catch (error) {
            console.error('Error deleting milestone:', error);
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

    getMilestoneStats() {
        const milestones = this.getMilestones();
        const now = new Date().getTime();

        const stats = {
            total: milestones.length,
            active: milestones.filter(m => m.status === 'IN_PROGRESS').length,
            completed: milestones.filter(m => m.status === 'COMPLETED').length,
            notStarted: milestones.filter(m => m.status === 'NOT_STARTED').length,
            blocked: milestones.filter(m => m.status === 'BLOCKED').length,
            overdue: milestones.filter(m => {
                const dueDate = new Date(m.dueDate).getTime();
                return dueDate < now && m.status !== 'COMPLETED';
            }).length,
            avgProgress: 0,
            completionRate: 0
        };

        if (stats.total > 0) {
            const totalProgress = milestones.reduce((sum, m) => sum + m.progress, 0);
            stats.avgProgress = Math.round(totalProgress / stats.total);
            stats.completionRate = Math.round((stats.completed / stats.total) * 100);
        }

        return stats;
    }

    getMilestonesByGoal(goalId) {
        return this.getMilestones({ goalId });
    }

    getUpcomingMilestones(days = 7) {
        const milestones = this.getMilestones();
        const now = new Date();
        const future = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

        return milestones.filter(m => {
            const dueDate = new Date(m.dueDate);
            return dueDate >= now && dueDate <= future && m.status !== 'COMPLETED';
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    getOverdueMilestones() {
        const milestones = this.getMilestones();
        const now = new Date().getTime();

        return milestones.filter(m => {
            const dueDate = new Date(m.dueDate).getTime();
            return dueDate < now && m.status !== 'COMPLETED';
        });
    }

    // ============================================
    // Export for Dashboard
    // ============================================

    exportMilestoneData() {
        const stats = this.getMilestoneStats();
        const milestones = this.getMilestones();

        return {
            stats,
            recentMilestones: milestones.slice(0, 5),
            upcomingMilestones: this.getUpcomingMilestones(7),
            overdueMilestones: this.getOverdueMilestones(),
            completionRate: stats.completionRate
        };
    }

    // ============================================
    // Validation & Helpers
    // ============================================

    validate(milestone) {
        if (!milestone.title || milestone.title.trim() === '') {
            throw new Error('Milestone title is required');
        }

        if (!milestone.goalId) {
            throw new Error('Goal selection is required');
        }

        if (!milestone.dueDate) {
            throw new Error('Due date is required');
        }

        if (!['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'].includes(milestone.status)) {
            throw new Error('Invalid status');
        }

        if (milestone.progress < 0 || milestone.progress > 100) {
            throw new Error('Progress must be between 0 and 100');
        }

        return true;
    }

    getGoalTitle(goalId) {
        if (window.goalManager) {
            const goal = window.goalManager.getGoal(goalId);
            return goal ? goal.title : 'Unknown Goal';
        }
        return 'Unknown Goal';
    }

    generateId() {
        return 'milestone_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getStatusColor(status) {
        const colors = {
            'NOT_STARTED': 'gray',
            'IN_PROGRESS': 'blue',
            'COMPLETED': 'green',
            'BLOCKED': 'red'
        };
        return colors[status] || 'gray';
    }

    getStatusLabel(status) {
        const labels = {
            'NOT_STARTED': 'Not Started',
            'IN_PROGRESS': 'In Progress',
            'COMPLETED': 'Completed',
            'BLOCKED': 'Blocked'
        };
        return labels[status] || status;
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
const milestoneManager = new MilestoneManager();
window.milestoneManager = milestoneManager;

// ============================================
// UI Functions
// ============================================

function loadMilestones() {
    const filters = {
        search: document.getElementById('searchInput')?.value || '',
        goalId: document.getElementById('goalFilter')?.value || '',
        status: document.getElementById('statusFilter')?.value || '',
        sort: document.getElementById('sortFilter')?.value || 'dueDate'
    };

    const milestones = milestoneManager.getMilestones(filters);
    const container = document.getElementById('milestonesList');
    const emptyState = document.getElementById('emptyState');

    if (!container) return;

    if (milestones.length === 0) {
        container.classList.add('hidden');
        emptyState?.classList.remove('hidden');
        return;
    }

    container.classList.remove('hidden');
    emptyState?.classList.add('hidden');

    container.innerHTML = milestones.map(milestone => `
        <div class="milestone-card ${milestone.isOverdue ? 'overdue' : ''}" data-id="${milestone.id}">
            <div class="milestone-header">
                <div class="milestone-title-section">
                    <h3 class="milestone-title">${milestone.title}</h3>
                    <div class="milestone-meta">
                        <span class="milestone-meta-item">
                            <i class="fas fa-bullseye"></i>
                            ${milestone.goalTitle}
                        </span>
                        <span class="milestone-meta-item">
                            <i class="fas fa-calendar"></i>
                            Due: ${milestoneManager.formatDate(milestone.dueDate)}
                        </span>
                        ${milestone.isOverdue ? `
                            <span class="milestone-meta-item text-red-600">
                                <i class="fas fa-exclamation-circle"></i>
                                Overdue
                            </span>
                        ` : `
                            <span class="milestone-meta-item">
                                <i class="fas fa-clock"></i>
                                ${milestoneManager.getDaysUntilDue(milestone.dueDate)} days
                            </span>
                        `}
                    </div>
                </div>
                <div class="milestone-actions">
                    <button class="milestone-btn milestone-btn-edit" onclick="editMilestone('${milestone.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="milestone-btn milestone-btn-delete" onclick="deleteMilestoneConfirm('${milestone.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            ${milestone.description ? `
                <p class="milestone-description">${milestone.description}</p>
            ` : ''}
            
            <div class="milestone-progress-section">
                <div class="progress-header">
                    <span class="progress-label">Progress</span>
                    <span class="progress-value">${milestone.progress}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${milestone.progress}%"></div>
                </div>
            </div>
            
            <div class="milestone-badges">
                <span class="badge badge-status ${milestone.status.toLowerCase().replace('_', '-')}">
                    ${milestoneManager.getStatusLabel(milestone.status)}
                </span>
            </div>
        </div>
    `).join('');
}

function loadMilestoneStats() {
    const stats = milestoneManager.getMilestoneStats();

    document.getElementById('totalMilestones').textContent = stats.total;
    document.getElementById('activeMilestones').textContent = stats.active;
    document.getElementById('completedMilestones').textContent = stats.completed;
    document.getElementById('overdueMilestones').textContent = stats.overdue;
}

function populateGoalDropdowns() {
    const goalFilter = document.getElementById('goalFilter');
    const goalSelect = document.getElementById('milestoneGoalId');

    if (!window.goalManager) return;

    const goals = window.goalManager.getGoals();

    // Populate filter dropdown
    if (goalFilter) {
        goalFilter.innerHTML = '<option value="">All Goals</option>' +
            goals.map(goal => `<option value="${goal.id}">${goal.title}</option>`).join('');
    }

    // Populate form dropdown
    if (goalSelect) {
        goalSelect.innerHTML = '<option value="">Select a goal...</option>' +
            goals.map(goal => `<option value="${goal.id}">${goal.title}</option>`).join('');
    }
}

function applyFilters() {
    loadMilestones();
}

function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Create Milestone';
    document.getElementById('milestoneForm').reset();
    document.getElementById('milestoneId').value = '';
    document.getElementById('progressValue').textContent = '0%';
    document.getElementById('milestoneModal').classList.add('active');
}

function editMilestone(id) {
    const milestone = milestoneManager.getMilestone(id);
    if (!milestone) return;

    document.getElementById('modalTitle').textContent = 'Edit Milestone';
    document.getElementById('milestoneId').value = milestone.id;
    document.getElementById('milestoneTitle').value = milestone.title;
    document.getElementById('milestoneDescription').value = milestone.description || '';
    document.getElementById('milestoneGoalId').value = milestone.goalId;
    document.getElementById('milestoneDueDate').value = milestone.dueDate;
    document.getElementById('milestoneStatus').value = milestone.status;
    document.getElementById('milestoneProgress').value = milestone.progress;
    document.getElementById('progressValue').textContent = milestone.progress + '%';
    document.getElementById('milestoneModal').classList.add('active');
}

function closeMilestoneModal() {
    document.getElementById('milestoneModal').classList.remove('active');
}

function handleMilestoneSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('milestoneId').value;
    const milestoneData = {
        title: document.getElementById('milestoneTitle').value,
        description: document.getElementById('milestoneDescription').value,
        goalId: document.getElementById('milestoneGoalId').value,
        dueDate: document.getElementById('milestoneDueDate').value,
        status: document.getElementById('milestoneStatus').value,
        progress: parseInt(document.getElementById('milestoneProgress').value)
    };

    try {
        if (id) {
            milestoneManager.updateMilestone(id, milestoneData);
        } else {
            milestoneManager.createMilestone(milestoneData);
        }

        closeMilestoneModal();
        loadMilestones();
        loadMilestoneStats();
    } catch (error) {
        console.error('Error saving milestone:', error);
    }
}

function deleteMilestoneConfirm(id) {
    const milestone = milestoneManager.getMilestone(id);
    if (!milestone) return;

    if (confirm(`Are you sure you want to delete milestone "${milestone.title}"?`)) {
        milestoneManager.deleteMilestone(id);
        loadMilestones();
        loadMilestoneStats();
    }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('milestoneModal');
    if (e.target === modal) {
        closeMilestoneModal();
    }
});

console.log('✅ Milestones module loaded');