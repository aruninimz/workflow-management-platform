/**
 * MODULE 1: GOAL MANAGEMENT
 * Developer: Dev 1
 * 
 * This module handles all goal-related operations:
 * - Create, Read, Update, Delete goals
 * - Filter and search goals
 * - Progress tracking
 * - Statistics and analytics
 * 
 * INTEGRATION NOTES:
 * - Uses dataManager for storage (can be replaced with API calls)
 * - Triggers notifications on key actions
 * - Exports data for dashboard and other modules
 */

class GoalManager {
  constructor() {
    this.currentFilters = {};
    this.currentSort = { field: 'createdAt', order: 'desc' };
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new goal
   * @param {Object} goalData - Goal data
   * @returns {Object} Created goal
   */
  createGoal(goalData) {
    // Validate required fields
    if (!goalData.title || !goalData.startDate || !goalData.targetDate) {
      throw new Error('Title, start date, and target date are required');
    }

    // Get current user
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Create goal with defaults
    const goal = {
      title: goalData.title,
      description: goalData.description || '',
      status: goalData.status || 'NOT_STARTED',
      priority: goalData.priority || 'MEDIUM',
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      startDate: goalData.startDate,
      targetDate: goalData.targetDate,
      category: goalData.category || '',
      progress: goalData.progress || 0
    };

    // Save to storage
    const createdGoal = dataManager.create('goals', goal);

    // Create notification
    notificationManager.create({
      type: 'success',
      title: 'Goal Created',
      message: `Goal "${createdGoal.title}" has been created successfully.`,
      data: { goalId: createdGoal.id }
    });

    return createdGoal;
  }

  /**
   * Get all goals with filters
   * @param {Object} filters - Filter criteria
   * @returns {Array} Array of goals
   */
  getGoals(filters = {}) {
    this.currentFilters = filters;
    let goals = dataManager.getData('goals') || [];

    // Get current user
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) return [];

    // Filter by owner (unless admin)
    if (currentUser.role !== 'ADMIN') {
      goals = goals.filter(goal => goal.ownerId === currentUser.id);
    }

    // Apply filters
    if (filters.status) {
      goals = goals.filter(goal => goal.status === filters.status);
    }

    if (filters.priority) {
      goals = goals.filter(goal => goal.priority === filters.priority);
    }

    if (filters.category) {
      goals = goals.filter(goal => goal.category && goal.category.toLowerCase().includes(filters.category.toLowerCase()));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      goals = goals.filter(goal =>
        goal.title.toLowerCase().includes(searchLower) ||
        (goal.description && goal.description.toLowerCase().includes(searchLower)) ||
        (goal.category && goal.category.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    goals = this.sortGoals(goals, this.currentSort);

    return goals;
  }

  /**
   * Get a single goal by ID
   * @param {string} goalId - Goal ID
   * @returns {Object|null} Goal object or null
   */
  getGoalById(goalId) {
    return dataManager.read('goals', goalId);
  }

  /**
   * Update a goal
   * @param {string} goalId - Goal ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated goal or null
   */
  updateGoal(goalId, updates) {
    const goal = this.getGoalById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    // Check permission
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    if (currentUser.role !== 'ADMIN' && goal.ownerId !== currentUser.id) {
      throw new Error('You do not have permission to update this goal');
    }

    // Update goal
    const updatedGoal = dataManager.update('goals', goalId, updates);

    // Create notification
    notificationManager.create({
      type: 'info',
      title: 'Goal Updated',
      message: `Goal "${updatedGoal.title}" has been updated.`,
      data: { goalId: updatedGoal.id }
    });

    return updatedGoal;
  }

  /**
   * Delete a goal
   * @param {string} goalId - Goal ID
   * @returns {boolean} Success status
   */
  deleteGoal(goalId) {
    const goal = this.getGoalById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    // Check permission
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    if (currentUser.role !== 'ADMIN' && goal.ownerId !== currentUser.id) {
      throw new Error('You do not have permission to delete this goal');
    }

    // Delete associated milestones and tasks
    const milestones = dataManager.query('milestones', { goalId });
    milestones.forEach(milestone => {
      // Delete tasks for this milestone
      const tasks = dataManager.query('tasks', { milestoneId: milestone.id });
      tasks.forEach(task => dataManager.delete('tasks', task.id));
      
      // Delete milestone
      dataManager.delete('milestones', milestone.id);
    });

    // Delete goal
    const success = dataManager.delete('goals', goalId);

    if (success) {
      // Create notification
      notificationManager.create({
        type: 'warning',
        title: 'Goal Deleted',
        message: `Goal "${goal.title}" has been deleted.`
      });
    }

    return success;
  }

  // ============================================
  // PROGRESS TRACKING
  // ============================================

  /**
   * Update goal progress
   * @param {string} goalId - Goal ID
   * @param {number} progress - Progress percentage (0-100)
   * @returns {Object|null} Updated goal
   */
  updateProgress(goalId, progress) {
    // Validate progress
    progress = Math.max(0, Math.min(100, progress));

    // Auto-update status based on progress
    let status = 'NOT_STARTED';
    if (progress > 0 && progress < 100) {
      status = 'IN_PROGRESS';
    } else if (progress === 100) {
      status = 'COMPLETED';
    }

    return this.updateGoal(goalId, { progress, status });
  }

  /**
   * Calculate goal progress based on milestones
   * @param {string} goalId - Goal ID
   * @returns {number} Progress percentage
   */
  calculateProgressFromMilestones(goalId) {
    const milestones = dataManager.query('milestones', { goalId });
    
    if (milestones.length === 0) return 0;

    const totalProgress = milestones.reduce((sum, milestone) => sum + (milestone.progress || 0), 0);
    return Math.round(totalProgress / milestones.length);
  }

  /**
   * Auto-sync progress from milestones
   * @param {string} goalId - Goal ID
   */
  syncProgressFromMilestones(goalId) {
    const progress = this.calculateProgressFromMilestones(goalId);
    this.updateProgress(goalId, progress);
  }

  // ============================================
  // STATISTICS & ANALYTICS
  // ============================================

  /**
   * Get goal statistics
   * @returns {Object} Statistics object
   */
  getGoalStats() {
    const goals = this.getGoals();

    const stats = {
      total: goals.length,
      byStatus: {
        notStarted: goals.filter(g => g.status === 'NOT_STARTED').length,
        inProgress: goals.filter(g => g.status === 'IN_PROGRESS').length,
        completed: goals.filter(g => g.status === 'COMPLETED').length,
        onHold: goals.filter(g => g.status === 'ON_HOLD').length
      },
      byPriority: {
        low: goals.filter(g => g.priority === 'LOW').length,
        medium: goals.filter(g => g.priority === 'MEDIUM').length,
        high: goals.filter(g => g.priority === 'HIGH').length,
        critical: goals.filter(g => g.priority === 'CRITICAL').length,
        urgent: goals.filter(g => g.priority === 'URGENT').length
      },
      avgProgress: goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0
    };

    return stats;
  }

  /**
   * Get overdue goals
   * @returns {Array} Overdue goals
   */
  getOverdueGoals() {
    const goals = this.getGoals();
    const now = new Date();

    return goals.filter(goal => {
      return new Date(goal.targetDate) < now && goal.status !== 'COMPLETED';
    });
  }

  /**
   * Get upcoming goals (due within next 7 days)
   * @param {number} days - Number of days to look ahead
   * @returns {Array} Upcoming goals
   */
  getUpcomingGoals(days = 7) {
    const goals = this.getGoals();
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return goals.filter(goal => {
      const targetDate = new Date(goal.targetDate);
      return targetDate >= now && targetDate <= futureDate && goal.status !== 'COMPLETED';
    });
  }

  // ============================================
  // SORTING & FILTERING
  // ============================================

  /**
   * Sort goals
   * @param {Array} goals - Goals array
   * @param {Object} sortConfig - Sort configuration
   * @returns {Array} Sorted goals
   */
  sortGoals(goals, sortConfig) {
    this.currentSort = sortConfig;

    return goals.sort((a, b) => {
      let aVal = a[sortConfig.field];
      let bVal = b[sortConfig.field];

      // Handle dates
      if (sortConfig.field.includes('Date')) {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortConfig.order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  // ============================================
  // EXPORT FOR DASHBOARD & OTHER MODULES
  // ============================================

  /**
   * Export goal data for dashboard
   * @returns {Object} Exported data
   */
  exportGoalData() {
    const stats = this.getGoalStats();
    const overdue = this.getOverdueGoals();
    const upcoming = this.getUpcomingGoals();

    return {
      stats,
      overdue,
      upcoming,
      recentGoals: this.getGoals().slice(0, 5)
    };
  }
}

// Global instance
window.goalManager = new GoalManager();
