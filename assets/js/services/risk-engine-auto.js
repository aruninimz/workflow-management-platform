/**
 * Automatic Risk Engine - Calculates risks from Tasks, Milestones, and Goals
 * NO separate risks table needed - everything is calculated on-the-fly
 * 
 * Version: 2.0 (Automatic Mode)
 * Date: 2026-04-05
 */

export class AutomaticRiskEngine {
    constructor(supabase) {
        this.supabase = supabase;
    }

    /**
     * Calculate all risks from existing data
     * Returns: { risks: [...], metrics: {...}, health: {...} }
     */
    async calculateAllRisks() {
        try {
            console.log('🔍 Fetching all data for risk analysis...');
            
            // Fetch all data in parallel
            const [tasksResponse, milestonesResponse, goalsResponse] = await Promise.all([
                this.supabase.select('tasks'),
                this.supabase.select('milestones'),
                this.supabase.select('goals')
            ]);

            const tasks = tasksResponse || [];
            const milestones = milestonesResponse || [];
            const goals = goalsResponse || [];

            console.log(`📊 Data loaded: ${tasks.length} tasks, ${milestones.length} milestones, ${goals.length} goals`);

            const now = new Date();
            const risks = [];

            // ==========================================
            // 1. CRITICAL RISKS - Overdue & Critical Priority
            // ==========================================

            // 1a. Overdue tasks (past due date, not completed, not blocked, not CRITICAL priority)
            const overdueTasks = tasks.filter(t => 
                t.due_date && 
                new Date(t.due_date) < now && 
                t.status !== 'COMPLETED' &&
                t.status !== 'BLOCKED' &&
                t.priority !== 'CRITICAL'  // Don't double-count critical tasks
            );

            if (overdueTasks.length > 0) {
                risks.push({
                    id: 'risk-overdue-tasks',
                    level: 'HIGH',
                    category: 'Schedule',
                    impact: 'HIGH',
                    title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
                    description: `${overdueTasks.length} task(s) past their due date and not completed`,
                    affected_count: overdueTasks.length,
                    affected_items: overdueTasks.map(t => ({ type: 'task', id: t.id, title: t.title })),
                    created_at: now.toISOString()
                });
            }

            // 1b. Critical priority tasks (not completed, not blocked)
            const criticalTasks = tasks.filter(t => 
                t.priority === 'CRITICAL' && 
                t.status !== 'COMPLETED' &&
                t.status !== 'BLOCKED'
            );

            if (criticalTasks.length > 0) {
                risks.push({
                    id: 'risk-critical-tasks',
                    level: 'CRITICAL',
                    category: 'Resource',
                    impact: 'CRITICAL',
                    title: `${criticalTasks.length} Critical Priority Task${criticalTasks.length > 1 ? 's' : ''}`,
                    description: `${criticalTasks.length} task(s) marked as CRITICAL priority require immediate attention`,
                    affected_count: criticalTasks.length,
                    affected_items: criticalTasks.map(t => ({ type: 'task', id: t.id, title: t.title })),
                    created_at: now.toISOString()
                });
            }

            // ==========================================
            // 2. HIGH RISKS - Approaching Deadlines
            // ==========================================

            // 2a. Tasks due within 3 days (approaching deadline, exclude CRITICAL priority)
            const approachingTasks = tasks.filter(t => {
                if (!t.due_date || t.status === 'COMPLETED' || t.status === 'BLOCKED') return false;
                if (t.priority === 'CRITICAL') return false; // Don't double-count critical tasks
                const daysUntil = Math.floor((new Date(t.due_date) - now) / (1000 * 60 * 60 * 24));
                return daysUntil >= 0 && daysUntil <= 3;
            });

            if (approachingTasks.length > 0) {
                risks.push({
                    id: 'risk-approaching-deadlines',
                    level: 'MEDIUM',
                    category: 'Schedule',
                    impact: 'MEDIUM',
                    title: `${approachingTasks.length} Task${approachingTasks.length > 1 ? 's' : ''} Due Within 3 Days`,
                    description: `${approachingTasks.length} task(s) approaching deadline within the next 3 days`,
                    affected_count: approachingTasks.length,
                    affected_items: approachingTasks.map(t => ({ type: 'task', id: t.id, title: t.title })),
                    created_at: now.toISOString()
                });
            }

            // 2b. Overdue milestones
            const overdueMilestones = milestones.filter(m =>
                m.due_date &&
                new Date(m.due_date) < now &&
                m.status !== 'COMPLETED'
            );

            if (overdueMilestones.length > 0) {
                risks.push({
                    id: 'risk-overdue-milestones',
                    level: 'HIGH',
                    category: 'Schedule',
                    impact: 'HIGH',
                    title: `${overdueMilestones.length} Overdue Milestone${overdueMilestones.length > 1 ? 's' : ''}`,
                    description: `${overdueMilestones.length} milestone(s) past their due date`,
                    affected_count: overdueMilestones.length,
                    affected_items: overdueMilestones.map(m => ({ type: 'milestone', id: m.id, title: m.title })),
                    created_at: now.toISOString()
                });
            }

            // ==========================================
            // 3. MEDIUM RISKS - Behind Schedule
            // ==========================================

            // 3a. Goals behind schedule (progress < expected)
            const behindGoals = goals.filter(g => {
                if (g.status !== 'ACTIVE' || !g.start_date || !g.target_date) return false;
                
                const totalDays = Math.floor((new Date(g.target_date) - new Date(g.start_date)) / (1000 * 60 * 60 * 24));
                const elapsedDays = Math.floor((now - new Date(g.start_date)) / (1000 * 60 * 60 * 24));
                
                if (totalDays <= 0) return false;
                
                const expectedProgress = (elapsedDays / totalDays) * 100;
                const actualProgress = g.progress || 0;
                
                // Behind if actual is 20% less than expected
                return actualProgress < expectedProgress - 20;
            });

            if (behindGoals.length > 0) {
                risks.push({
                    id: 'risk-behind-goals',
                    level: 'MEDIUM',
                    category: 'Schedule',
                    impact: 'MEDIUM',
                    title: `${behindGoals.length} Goal${behindGoals.length > 1 ? 's' : ''} Behind Schedule`,
                    description: `${behindGoals.length} goal(s) with progress below expected timeline`,
                    affected_count: behindGoals.length,
                    affected_items: behindGoals.map(g => ({ type: 'goal', id: g.id, title: g.title })),
                    created_at: now.toISOString()
                });
            }

            // 3b. Blocked tasks
            const blockedTasks = tasks.filter(t => 
                t.status === 'BLOCKED' || 
                (t.status && t.status.toUpperCase() === 'BLOCKED')
            );

            if (blockedTasks.length > 0) {
                risks.push({
                    id: 'risk-blocked-tasks',
                    level: 'MEDIUM',
                    category: 'Technical',
                    impact: 'MEDIUM',
                    title: `${blockedTasks.length} Blocked Task${blockedTasks.length > 1 ? 's' : ''}`,
                    description: `${blockedTasks.length} task(s) are blocked and cannot proceed`,
                    affected_count: blockedTasks.length,
                    affected_items: blockedTasks.map(t => ({ type: 'task', id: t.id, title: t.title })),
                    created_at: now.toISOString()
                });
            }

            // ==========================================
            // 4. LOW RISKS - Resource Monitoring
            // ==========================================

            // 4a. High workload detection (users with many active tasks)
            const activeTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO');
            const tasksByUser = this._groupBy(activeTasks, 'assignee_id');
            
            const overloadedUsers = Object.entries(tasksByUser)
                .filter(([userId, userTasks]) => userId && userTasks.length > 10)
                .map(([userId, userTasks]) => ({ userId, count: userTasks.length }));

            if (overloadedUsers.length > 0) {
                const totalOverload = overloadedUsers.reduce((sum, u) => sum + u.count, 0);
                risks.push({
                    id: 'risk-high-workload',
                    level: 'LOW',
                    category: 'Resource',
                    impact: 'LOW',
                    title: `${overloadedUsers.length} Team Member${overloadedUsers.length > 1 ? 's' : ''} with High Workload`,
                    description: `${overloadedUsers.length} team member(s) have more than 10 active tasks (total: ${totalOverload} tasks)`,
                    affected_count: overloadedUsers.length,
                    affected_items: overloadedUsers.map(u => ({ type: 'user', id: u.userId, count: u.count })),
                    created_at: now.toISOString()
                });
            }

            // 4b. Stale tasks (no update in 14+ days, excluding blocked tasks)
            const staleTasks = tasks.filter(t => {
                if (t.status === 'COMPLETED' || t.status === 'CANCELLED' || t.status === 'BLOCKED') return false;
                const daysSinceUpdate = Math.floor((now - new Date(t.updated_at || t.created_at)) / (1000 * 60 * 60 * 24));
                return daysSinceUpdate > 14;
            });

            if (staleTasks.length > 0) {
                risks.push({
                    id: 'risk-stale-tasks',
                    level: 'LOW',
                    category: 'Quality',
                    impact: 'LOW',
                    title: `${staleTasks.length} Stale Task${staleTasks.length > 1 ? 's' : ''}`,
                    description: `${staleTasks.length} task(s) with no updates in 14+ days`,
                    affected_count: staleTasks.length,
                    affected_items: staleTasks.map(t => ({ type: 'task', id: t.id, title: t.title })),
                    created_at: now.toISOString()
                });
            }

            // ==========================================
            // 5. Calculate Metrics & Health Score
            // ==========================================

            const metrics = this._calculateMetrics(risks);
            const health = this._calculateHealthScore(risks);

            console.log('✅ Risk analysis complete');
            console.log(`📊 Found ${risks.length} total risks`);
            console.log(`💚 Health Score: ${health.overall_health_score}/100`);

            return {
                success: true,
                data: {
                    risks,
                    metrics,
                    health
                }
            };

        } catch (error) {
            console.error('❌ Error calculating risks:', error);
            return {
                success: false,
                error: error.message,
                data: {
                    risks: [],
                    metrics: { total: 0, by_level: { critical: 0, high: 0, medium: 0, low: 0 } },
                    health: { overall_health_score: 100 }
                }
            };
        }
    }

    /**
     * Calculate risk metrics (counts by level)
     */
    _calculateMetrics(risks) {
        const metrics = {
            total: risks.length,
            by_level: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            },
            by_category: {},
            by_status: {
                open: risks.length,
                mitigated: 0,
                resolved: 0
            }
        };

        risks.forEach(risk => {
            const level = (risk.level || 'LOW').toLowerCase();
            if (metrics.by_level[level] !== undefined) {
                metrics.by_level[level]++;
            }

            const category = risk.category || 'Other';
            metrics.by_category[category] = (metrics.by_category[category] || 0) + 1;
        });

        return metrics;
    }

    /**
     * Calculate overall health score (0-100, lower = more risk)
     */
    _calculateHealthScore(risks) {
        let totalPenalty = 0;

        risks.forEach(risk => {
            const affectedCount = risk.affected_count || 1;
            const penaltyPerItem = {
                'CRITICAL': 2,     // Each CRITICAL item = -2 points
                'HIGH': 1.5,       // Each HIGH item = -1.5 points
                'MEDIUM': 0.5,     // Each MEDIUM item = -0.5 point
                'LOW': 0.2         // Each LOW item = -0.2 points
            };
            
            const penalty = penaltyPerItem[risk.level.toUpperCase()] || 0;
            totalPenalty += (penalty * affectedCount);
        });

        // Score = 100 - total penalty, with a floor of 0
        let score = Math.max(0, Math.round(100 - totalPenalty));

        let status = 'Excellent';
        if (score < 20) status = 'Critical';
        else if (score < 40) status = 'Poor';
        else if (score < 60) status = 'Fair';
        else if (score < 80) status = 'Good';

        return {
            overall_health_score: score,
            status,
            total_risks: risks.length
        };
    }

    /**
     * Calculate historical risk trends (6 weeks of data)
     */
    async calculateRiskTrends() {
        try {
            const [tasksResponse, milestonesResponse] = await Promise.all([
                this.supabase.select('tasks'),
                this.supabase.select('milestones')
            ]);

            const tasks = tasksResponse || [];
            const milestones = milestonesResponse || [];

            const weeks = [];
            const now = new Date();

            // Calculate for last 6 weeks
            for (let i = 5; i >= 0; i--) {
                const weekEnd = new Date(now);
                weekEnd.setDate(now.getDate() - (i * 7));
                weekEnd.setHours(23, 59, 59, 999);

                const weekStart = new Date(weekEnd);
                weekStart.setDate(weekEnd.getDate() - 6);
                weekStart.setHours(0, 0, 0, 0);

                // Count risks for this week
                let criticalCount = 0;
                let highCount = 0;
                let mediumCount = 0;
                let lowCount = 0;

                // Overdue tasks at that time
                const overdueAtWeekEnd = tasks.filter(t =>
                    t.due_date &&
                    new Date(t.due_date) < weekEnd &&
                    new Date(t.created_at) <= weekEnd &&
                    (!t.completed_at || new Date(t.completed_at) > weekEnd)
                );
                highCount += overdueAtWeekEnd.length;

                // Critical tasks at that time
                const criticalAtWeekEnd = tasks.filter(t =>
                    t.priority === 'CRITICAL' &&
                    new Date(t.created_at) <= weekEnd &&
                    (!t.completed_at || new Date(t.completed_at) > weekEnd)
                );
                criticalCount += criticalAtWeekEnd.length;

                // Approaching deadlines (within 3 days)
                const approachingAtWeekEnd = tasks.filter(t => {
                    if (!t.due_date) return false;
                    const daysUntil = Math.floor((new Date(t.due_date) - weekEnd) / (1000 * 60 * 60 * 24));
                    return daysUntil >= 0 && daysUntil <= 3 &&
                           new Date(t.created_at) <= weekEnd &&
                           (!t.completed_at || new Date(t.completed_at) > weekEnd);
                });
                mediumCount += approachingAtWeekEnd.length;

                weeks.push({
                    week: `Week ${6 - i}`,
                    date: weekEnd.toISOString().split('T')[0],
                    critical: criticalCount,
                    high: highCount,
                    medium: mediumCount,
                    low: lowCount,
                    total: criticalCount + highCount + mediumCount + lowCount
                });
            }

            return {
                success: true,
                data: weeks
            };

        } catch (error) {
            console.error('❌ Error calculating trends:', error);
            return {
                success: false,
                data: []
            };
        }
    }

    /**
     * Group array by property
     */
    _groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property] || 'unassigned';
            groups[key] = groups[key] || [];
            groups[key].push(item);
            return groups;
        }, {});
    }
}

// Wrapper classes for compatibility with existing code
export class RiskAnalyticsService {
    constructor(supabase) {
        this.engine = new AutomaticRiskEngine(supabase);
    }

    async getMetricsSummary() {
        const result = await this.engine.calculateAllRisks();
        return {
            success: result.success,
            data: result.data.metrics
        };
    }

    async getAllRisks() {
        const result = await this.engine.calculateAllRisks();
        return {
            success: result.success,
            data: result.data.risks
        };
    }

    async getRisksByCategory() {
        const result = await this.engine.calculateAllRisks();
        if (!result.success) return { success: false, data: [] };

        const byCategory = {};
        result.data.risks.forEach(risk => {
            const category = risk.category || 'Other';
            byCategory[category] = byCategory[category] || [];
            byCategory[category].push(risk);
        });

        return {
            success: true,
            data: Object.entries(byCategory).map(([category, risks]) => ({
                category,
                count: risks.length,
                risks
            }))
        };
    }

    async getRiskTrends() {
        return await this.engine.calculateRiskTrends();
    }
}

export class RiskScoringService {
    constructor(supabase) {
        this.engine = new AutomaticRiskEngine(supabase);
    }

    async calculateHealthScore() {
        const result = await this.engine.calculateAllRisks();
        return {
            success: result.success,
            data: result.data.health
        };
    }
}
