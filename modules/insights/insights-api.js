/**
 * Insights API - Business Logic & Analytics Engine
 * FlowBit SEP - Workflow Management Platform
 * 
 * Purpose: Calculate KPIs, trends, and automated insights from tasks, milestones, and goals
 * Architecture: Clean, modular, scalable backend-style logic for frontend
 * 
 * NO HARDCODED VALUES - All calculations are dynamic based on real database data
 */

import supabase from '../../assets/js/config/supabase-client.js';

class InsightsAPI {
    constructor() {
        this.cache = {
            tasks: null,
            milestones: null,
            goals: null,
            users: null,
            lastFetch: null,
            ttl: 60000 // 1 minute cache
        };
    }

    // ========================================================================
    // DATA FETCHING & CACHING
    // ========================================================================

    async fetchAllData(forceRefresh = false) {
        const now = Date.now();
        
        // Use cache if valid
        if (!forceRefresh && this.cache.lastFetch && (now - this.cache.lastFetch < this.cache.ttl)) {
            console.log('📦 Using cached data');
            return {
                tasks: this.cache.tasks,
                milestones: this.cache.milestones,
                goals: this.cache.goals,
                users: this.cache.users
            };
        }

        try {
            console.log('🔄 Fetching fresh data from Supabase...');
            
            // Fetch all data in parallel
            const [tasks, milestones, goals, users] = await Promise.all([
                supabase.select('tasks'),
                supabase.select('milestones'),
                supabase.select('goals'),
                supabase.getAllTeamMembers()
            ]);

            // Update cache
            this.cache = {
                tasks: tasks || [],
                milestones: milestones || [],
                goals: goals || [],
                users: users || [],
                lastFetch: now,
                ttl: 60000
            };

            console.log(`✅ Data fetched: ${tasks?.length || 0} tasks, ${milestones?.length || 0} milestones, ${goals?.length || 0} goals, ${users?.length || 0} users`);

            return {
                tasks: this.cache.tasks,
                milestones: this.cache.milestones,
                goals: this.cache.goals,
                users: this.cache.users
            };
        } catch (error) {
            console.error('❌ Failed to fetch data:', error);
            
            // Return cached data if available, otherwise empty arrays
            return {
                tasks: this.cache.tasks || [],
                milestones: this.cache.milestones || [],
                goals: this.cache.goals || [],
                users: this.cache.users || []
            };
        }
    }

    // ========================================================================
    // KPI CALCULATIONS
    // ========================================================================

    /**
     * Calculate On-Time Completion Rate
     * Formula: (Completed tasks on/before due date) / (Total completed tasks with due dates) * 100
     */
    calculateOnTimeCompletion(tasks) {
        const completedWithDueDate = tasks.filter(t => 
            t.status === 'COMPLETED' && 
            t.due_date && 
            t.completed_at
        );

        if (completedWithDueDate.length === 0) {
            return { rate: 0, total: 0, onTime: 0 };
        }

        const onTimeCompletions = completedWithDueDate.filter(t => {
            const dueDate = new Date(t.due_date);
            const completedDate = new Date(t.completed_at);
            return completedDate <= dueDate;
        });

        const rate = (onTimeCompletions.length / completedWithDueDate.length) * 100;

        return {
            rate: Math.round(rate),
            total: completedWithDueDate.length,
            onTime: onTimeCompletions.length,
            late: completedWithDueDate.length - onTimeCompletions.length
        };
    }

    /**
     * Calculate Average Completion Time
     * Formula: Average of (completed_at - created_at) for completed tasks
     * Returns: Days
     */
    calculateAvgCompletionTime(tasks) {
        const completedTasks = tasks.filter(t => 
            t.status === 'COMPLETED' && 
            t.completed_at && 
            t.created_at
        );

        if (completedTasks.length === 0) {
            return { avgDays: 0, count: 0, totalHours: 0 };
        }

        let totalMs = 0;
        completedTasks.forEach(t => {
            const completed = new Date(t.completed_at);
            const created = new Date(t.created_at);
            totalMs += (completed - created);
        });

        const avgMs = totalMs / completedTasks.length;
        const avgDays = avgMs / (1000 * 60 * 60 * 24);
        const avgHours = avgMs / (1000 * 60 * 60);

        return {
            avgDays: parseFloat(avgDays.toFixed(1)),
            avgHours: Math.round(avgHours),
            count: completedTasks.length,
            totalDays: Math.round(totalMs / (1000 * 60 * 60 * 24))
        };
    }

    /**
     * Calculate Tasks Per Member
     * Formula: Total active tasks / Number of unique assignees
     */
    calculateTasksPerMember(tasks, users) {
        // Get active tasks (not completed or cancelled)
        const activeTasks = tasks.filter(t => 
            t.status !== 'COMPLETED' && 
            t.status !== 'CANCELLED'
        );

        // Count unique assignees from active tasks
        const uniqueAssignees = new Set(
            activeTasks
                .map(t => t.assignee_id || t.user_id)
                .filter(id => id) // Remove null/undefined
        );

        const activeMembers = uniqueAssignees.size;
        
        if (activeMembers === 0) {
            return { avgTasks: 0, totalTasks: activeTasks.length, activeUsers: 0 };
        }

        const avgTasks = activeTasks.length / activeMembers;

        return {
            avgTasks: parseFloat(avgTasks.toFixed(1)),
            totalTasks: activeTasks.length,
            activeUsers: activeMembers
        };
    }

    /**
     * Calculate Overall Health Score
     * Formula: Weighted composite of multiple metrics
     * - On-time completion: 40%
     * - Task velocity: 30%
     * - Workload balance: 20%
     * - Risk level: 10%
     */
    calculateHealthScore(tasks, milestones, goals) {
        let score = 100;

        // 1. On-Time Completion (40 points max)
        const onTimeData = this.calculateOnTimeCompletion(tasks);
        const onTimeScore = (onTimeData.rate / 100) * 40;
        
        // 2. Task Velocity (30 points max)
        // Based on completion rate in last 30 days vs created rate
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        
        const recentCreated = tasks.filter(t => new Date(t.created_at) >= last30Days).length;
        const recentCompleted = tasks.filter(t => 
            t.completed_at && new Date(t.completed_at) >= last30Days
        ).length;
        
        const velocityRate = recentCreated > 0 ? (recentCompleted / recentCreated) : 1;
        const velocityScore = Math.min(velocityRate, 1) * 30;

        // 3. Workload Balance (20 points max)
        // Lower standard deviation = better balance
        const workloadByUser = this._calculateWorkloadByUser(tasks);
        const workloadStdDev = this._calculateStdDev(Object.values(workloadByUser));
        const balanceScore = Math.max(0, 20 - (workloadStdDev * 2));

        // 4. Risk Level (10 points max)
        // Based on overdue tasks and critical priority
        const overdueTasks = tasks.filter(t => 
            t.due_date && 
            new Date(t.due_date) < new Date() && 
            t.status !== 'COMPLETED'
        ).length;
        const criticalTasks = tasks.filter(t => 
            t.priority === 'CRITICAL' && 
            t.status !== 'COMPLETED'
        ).length;
        
        const riskPenalty = (overdueTasks * 0.5) + (criticalTasks * 0.3);
        const riskScore = Math.max(0, 10 - riskPenalty);

        // Calculate final score
        score = Math.round(onTimeScore + velocityScore + balanceScore + riskScore);
        score = Math.max(0, Math.min(100, score)); // Clamp 0-100

        // Debug logging
        console.log('🏥 Health Score Calculation Breakdown:');
        console.log(`  📊 On-Time: ${Math.round(onTimeScore)} (${onTimeData.rate}% completion rate)`);
        console.log(`  ⚡ Velocity: ${Math.round(velocityScore)} (${recentCompleted}/${recentCreated} in 30d = ${(velocityRate * 100).toFixed(1)}%)`);
        console.log(`  ⚖️  Balance: ${Math.round(balanceScore)} (stdDev: ${workloadStdDev.toFixed(1)})`);
        console.log(`  ⚠️  Risk: ${Math.round(riskScore)} (${overdueTasks} overdue, ${criticalTasks} critical, penalty: ${riskPenalty.toFixed(1)})`);
        console.log(`  🎯 TOTAL: ${score}`);
        console.log(`  Workload distribution:`, workloadByUser);

        return {
            score,
            breakdown: {
                onTimeScore: Math.round(onTimeScore),
                velocityScore: Math.round(velocityScore),
                balanceScore: Math.round(balanceScore),
                riskScore: Math.round(riskScore)
            },
            status: this._getHealthStatus(score)
        };
    }

    _getHealthStatus(score) {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        if (score >= 20) return 'Poor';
        return 'Critical';
    }

    _calculateWorkloadByUser(tasks) {
        const workload = {};
        tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
            .forEach(t => {
                const userId = t.assignee_id || t.user_id || 'unassigned';
                workload[userId] = (workload[userId] || 0) + 1;
            });
        return workload;
    }

    _calculateStdDev(values) {
        if (values.length === 0) return 0;
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    // ========================================================================
    // TREND ANALYSIS
    // ========================================================================

    /**
     * Calculate Task Completion Trends
     * Returns weekly completion data for the last N days
     */
    calculateCompletionTrends(tasks, days = 30) {
        const now = new Date();
        const trends = [];

        // Create weekly buckets using UTC dates to match database
        const weeksCount = Math.ceil(days / 7);
        for (let i = weeksCount - 1; i >= 0; i--) {
            const weekEnd = new Date(now);
            weekEnd.setUTCHours(0, 0, 0, 0);
            weekEnd.setUTCDate(now.getUTCDate() - (i * 7));
            
            const weekStart = new Date(weekEnd);
            weekStart.setUTCDate(weekEnd.getUTCDate() - 7);

            const weekLabel = `${weekStart.getUTCMonth() + 1}/${weekStart.getUTCDate()}`;
            
            const completedInWeek = tasks.filter(t => {
                if (!t.completed_at) return false;
                const completedDate = new Date(t.completed_at);
                // Compare using UTC timestamps to match database
                return completedDate >= weekStart && completedDate < weekEnd;
            }).length;

            trends.push({
                label: weekLabel,
                date: weekStart.toISOString(),
                completed: completedInWeek
            });
        }

        console.log('📊 Task Completion Trends:', trends);
        return trends;
    }

    // ========================================================================
    // WORKLOAD DISTRIBUTION
    // ========================================================================

    /**
     * Calculate Workload Distribution by Status
     * Returns count of tasks by status for donut chart
     */
    calculateWorkloadDistribution(tasks) {
        const distribution = {
            completed: 0,
            in_progress: 0,
            todo: 0,
            blocked: 0
        };

        tasks.forEach(t => {
            const status = (t.status || 'TODO').toLowerCase();
            if (status === 'completed') distribution.completed++;
            else if (status === 'in_progress') distribution.in_progress++;
            else if (status === 'blocked') distribution.blocked++;
            else distribution.todo++;
        });

        return {
            labels: ['Completed', 'In Progress', 'To Do', 'Blocked'],
            data: [
                distribution.completed,
                distribution.in_progress,
                distribution.todo,
                distribution.blocked
            ],
            total: tasks.length
        };
    }

    // ========================================================================
    // TEAM PERFORMANCE
    // ========================================================================

    /**
     * Calculate Team Performance Metrics
     * Returns per-user completion stats
     */
    async calculateTeamPerformance(tasks, users) {
        const performance = [];

        for (const user of users) {
            const userId = user.id;
            
            // Get user's tasks
            const userTasks = tasks.filter(t => 
                t.assignee_id === userId || 
                (!t.assignee_id && t.user_id === userId)
            );

            const completedTasks = userTasks.filter(t => t.status === 'COMPLETED').length;
            const totalTasks = userTasks.length;
            const activeTasks = userTasks.filter(t => 
                t.status !== 'COMPLETED' && 
                t.status !== 'CANCELLED'
            ).length;

            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            // Get initials
            const fullName = user.full_name || user.email || 'Unknown';
            const nameParts = fullName.split(' ');
            const initials = nameParts.length >= 2 
                ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
                : fullName.substring(0, 2).toUpperCase();

            performance.push({
                userId,
                name: fullName,
                email: user.email,
                role: user.role || 'Member',
                initials,
                completedTasks,
                totalTasks,
                activeTasks,
                completionRate: Math.round(completionRate)
            });
        }

        // Sort by completion rate descending
        performance.sort((a, b) => b.completionRate - a.completionRate);

        return performance;
    }

    // ========================================================================
    // GOALS BY CATEGORY
    // ========================================================================

    /**
     * Calculate Goals Distribution by Category
     * Extracts categories from goal metadata or tags
     */
    calculateGoalsByCategory(goals) {
        const categories = {
            Development: 0,
            Design: 0,
            Marketing: 0,
            Operations: 0,
            Strategy: 0,
            Other: 0
        };

        goals.forEach(g => {
            // Check metadata for category
            let category = 'Other';
            
            if (g.metadata && g.metadata.category) {
                category = g.metadata.category;
            } else if (g.tags && g.tags.length > 0) {
                // Use first tag as category
                const tag = g.tags[0].toLowerCase();
                if (tag.includes('dev') || tag.includes('tech')) category = 'Development';
                else if (tag.includes('design') || tag.includes('ui') || tag.includes('ux')) category = 'Design';
                else if (tag.includes('market') || tag.includes('sales')) category = 'Marketing';
                else if (tag.includes('ops') || tag.includes('operation')) category = 'Operations';
                else if (tag.includes('strateg') || tag.includes('plan')) category = 'Strategy';
            } else {
                // Infer from title
                const title = (g.title || '').toLowerCase();
                if (title.includes('develop') || title.includes('code') || title.includes('build')) category = 'Development';
                else if (title.includes('design') || title.includes('ui') || title.includes('ux')) category = 'Design';
                else if (title.includes('market') || title.includes('sales') || title.includes('customer')) category = 'Marketing';
                else if (title.includes('operation') || title.includes('process')) category = 'Operations';
                else if (title.includes('strategy') || title.includes('plan') || title.includes('goal')) category = 'Strategy';
            }

            if (categories[category] !== undefined) {
                categories[category]++;
            } else {
                categories.Other++;
            }
        });

        return {
            labels: Object.keys(categories),
            data: Object.values(categories),
            total: goals.length
        };
    }

    // ========================================================================
    // KEY INSIGHTS (Automated Analysis)
    // ========================================================================

    /**
     * Generate Automated Insights
     * Analyzes trends and patterns to provide actionable insights
     */
    async generateKeyInsights(tasks, milestones, goals, users) {
        const insights = [];

        // 1. Velocity Improvement/Decline
        const velocityInsight = this._analyzeVelocity(tasks);
        if (velocityInsight) insights.push(velocityInsight);

        // 2. Resource Constraints
        const resourceInsight = this._analyzeResourceConstraints(tasks, users);
        if (resourceInsight) insights.push(resourceInsight);

        // 3. Milestone Achievement
        const milestoneInsight = this._analyzeMilestoneProgress(milestones);
        if (milestoneInsight) insights.push(milestoneInsight);

        // 4. Budget/Time Status
        const budgetInsight = this._analyzeBudgetStatus(tasks, goals);
        if (budgetInsight) insights.push(budgetInsight);

        // 5. Risk Alerts
        const riskInsight = this._analyzeRisks(tasks, milestones);
        if (riskInsight) insights.push(riskInsight);

        return insights.slice(0, 5); // Return top 5 insights
    }

    _analyzeVelocity(tasks) {
        const now = new Date();
        
        // Last 7 days
        const last7Days = new Date(now);
        last7Days.setDate(now.getDate() - 7);
        const recentCompleted = tasks.filter(t => 
            t.completed_at && new Date(t.completed_at) >= last7Days
        ).length;

        // Previous 7 days
        const prev7Start = new Date(now);
        prev7Start.setDate(now.getDate() - 14);
        const prev7End = new Date(now);
        prev7End.setDate(now.getDate() - 7);
        const prevCompleted = tasks.filter(t => 
            t.completed_at && 
            new Date(t.completed_at) >= prev7Start && 
            new Date(t.completed_at) < prev7End
        ).length;

        if (prevCompleted === 0) return null;

        const change = ((recentCompleted - prevCompleted) / prevCompleted) * 100;
        
        if (Math.abs(change) < 5) return null; // Not significant

        return {
            type: change > 0 ? 'positive' : 'negative',
            icon: change > 0 ? '↑' : '↓',
            title: change > 0 ? 'Velocity Improvement' : 'Velocity Decline',
            message: `Team velocity ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(change))}% this week compared to last week (${recentCompleted} vs ${prevCompleted} tasks)`
        };
    }

    _analyzeResourceConstraints(tasks, users) {
        const workloadByUser = this._calculateWorkloadByUser(tasks);
        const activeUserIds = users.filter(u => u.status === 'ACTIVE' || !u.status).map(u => u.id);
        
        // Find overloaded users (>10 active tasks)
        const overloaded = Object.entries(workloadByUser)
            .filter(([userId, count]) => count >= 10 && activeUserIds.includes(userId))
            .map(([userId, count]) => ({ userId, count }));

        if (overloaded.length === 0) return null;

        const user = users.find(u => u.id === overloaded[0].userId);
        const userName = user ? (user.full_name || user.email) : 'A team member';
        const capacity = Math.round((overloaded[0].count / 10) * 100);

        return {
            type: 'warning',
            icon: '△',
            title: 'Resource Constraint',
            message: `${userName} is at ${capacity}% capacity with ${overloaded[0].count} active tasks - consider redistributing workload`
        };
    }

    _analyzeMilestoneProgress(milestones) {
        const activeMilestones = milestones.filter(m => m.status !== 'COMPLETED' && m.status !== 'CANCELLED');
        const completedMilestones = milestones.filter(m => m.status === 'COMPLETED');
        
        if (completedMilestones.length === 0) return null;

        const total = activeMilestones.length + completedMilestones.length;
        const completionRate = (completedMilestones.length / total) * 100;

        if (completionRate < 50) return null; // Not worth highlighting

        return {
            type: 'positive',
            icon: '✓',
            title: 'Milestone Achievement',
            message: `${completedMilestones.length} of ${total} milestones completed (${Math.round(completionRate)}%) - great progress toward goals!`
        };
    }

    _analyzeBudgetStatus(tasks, goals) {
        // Calculate time spent vs estimated
        const tasksWithEstimates = tasks.filter(t => t.estimated_hours && t.actual_hours);
        
        if (tasksWithEstimates.length < 5) return null; // Not enough data

        const totalEstimated = tasksWithEstimates.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
        const totalActual = tasksWithEstimates.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

        if (totalEstimated === 0) return null;

        const utilization = (totalActual / totalEstimated) * 100;

        return {
            type: utilization > 90 ? 'warning' : 'info',
            icon: utilization > 90 ? '⚠' : 'ℹ',
            title: 'Time Budget Status',
            message: `${Math.round(utilization)}% time utilization - ${totalActual}h used of ${totalEstimated}h estimated across ${tasksWithEstimates.length} tasks`
        };
    }

    _analyzeRisks(tasks, milestones) {
        const now = new Date();
        
        // Count overdue items
        const overdueTasks = tasks.filter(t => 
            t.due_date && 
            new Date(t.due_date) < now && 
            t.status !== 'COMPLETED'
        ).length;

        const overdueMilestones = milestones.filter(m => 
            m.due_date && 
            new Date(m.due_date) < now && 
            m.status !== 'COMPLETED'
        ).length;

        const totalOverdue = overdueTasks + overdueMilestones;

        if (totalOverdue === 0) {
            return {
                type: 'positive',
                icon: '✓',
                title: 'No Overdue Items',
                message: `All tasks and milestones are on track - excellent execution!`
            };
        }

        return {
            type: 'critical',
            icon: '⚠',
            title: 'Overdue Items Detected',
            message: `${totalOverdue} items are overdue (${overdueTasks} tasks, ${overdueMilestones} milestones) - immediate attention required`
        };
    }

    // ========================================================================
    // MAIN API ENDPOINT
    // ========================================================================

    /**
     * Get Complete Insights Dashboard Data
     * Single endpoint that returns all KPIs, charts, and insights
     */
    async getInsightsDashboard(forceRefresh = false) {
        try {
            console.log('📊 Calculating insights dashboard...');
            const startTime = Date.now();

            // Fetch all data
            const { tasks, milestones, goals, users } = await this.fetchAllData(forceRefresh);

            // Calculate KPIs
            const onTimeCompletion = this.calculateOnTimeCompletion(tasks);
            const avgCompletionTime = this.calculateAvgCompletionTime(tasks);
            const tasksPerMember = this.calculateTasksPerMember(tasks, users);
            const healthScore = this.calculateHealthScore(tasks, milestones, goals);

            // Calculate trends
            const completionTrends = this.calculateCompletionTrends(tasks, 30);

            // Calculate distributions
            const workloadDistribution = this.calculateWorkloadDistribution(tasks);
            const goalsByCategory = this.calculateGoalsByCategory(goals);

            // Calculate team performance
            const teamPerformance = await this.calculateTeamPerformance(tasks, users);

            // Generate insights
            const keyInsights = await this.generateKeyInsights(tasks, milestones, goals, users);

            const result = {
                kpis: {
                    onTimeCompletion: onTimeCompletion.rate,
                    onTimeCompletionDetails: onTimeCompletion,
                    avgCompletionTime: avgCompletionTime.avgDays,
                    avgCompletionTimeDetails: avgCompletionTime,
                    tasksPerMember: tasksPerMember.avgTasks,
                    tasksPerMemberDetails: tasksPerMember,
                    healthScore: healthScore.score,
                    healthScoreDetails: healthScore
                },
                charts: {
                    completionTrends,
                    workloadDistribution,
                    goalsByCategory
                },
                teamPerformance,
                keyInsights,
                metadata: {
                    totalTasks: tasks.length,
                    totalMilestones: milestones.length,
                    totalGoals: goals.length,
                    totalUsers: users.length,
                    calculationTime: Date.now() - startTime,
                    timestamp: new Date().toISOString()
                }
            };

            console.log(`✅ Insights calculated in ${result.metadata.calculationTime}ms`);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to calculate insights:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const insightsAPI = new InsightsAPI();
export default insightsAPI;
