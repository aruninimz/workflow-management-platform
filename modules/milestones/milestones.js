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