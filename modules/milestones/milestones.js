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



}