/* ============================================
   RISK ENGINE MODULE - JavaScript Logic
   Developer: Jayaminis
   ============================================ */

class RiskEngine {
    constructor() {
        this.riskItems = [];
        this.riskHistory = [];
        this.charts = {};
    }

    initialize() {
        console.log('RiskEngine initialized');
        this.analyzeAllRisks();
    }

    // ============================================
    // RISK ANALYSIS
    // ============================================

    analyzeAllRisks() {
        this.riskItems = [];

        // Analyze goals
        this.analyzeGoalRisks();

        // Analyze milestones
        this.analyzeMilestoneRisks();

        // Analyze tasks
        this.analyzeTaskRisks();

        // Analyze dependencies
        this.analyzeDependencyRisks();

        // Store in history for trending
        this.saveToHistory();

        return this.riskItems;
    }

    analyzeGoalRisks() {
        if (!window.goalManager) return;

        const goals = window.goalManager.getGoals();
        const now = new Date();

        goals.forEach(goal => {
            // Check overdue goals
            const targetDate = new Date(goal.targetDate);
            const daysUntilTarget = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));

            if (goal.status !== 'COMPLETED') {
                // Overdue goal
                if (daysUntilTarget < 0) {
                    this.addRiskItem({
                        type: 'GOAL',
                        level: 'CRITICAL',
                        category: 'TIMELINE',
                        title: `Goal "${goal.title}" is overdue`,
                        description: `This goal passed its target date ${Math.abs(daysUntilTarget)} days ago`,
                        impact: 'High',
                        probability: 'High',
                        entity: goal,
                        entityId: goal.id,
                        entityType: 'goal',
                        recommendation: 'Reassess goal timeline or break into smaller milestones'
                    });
                }
                // Goal at risk (less than 7 days and low progress)
                else if (daysUntilTarget <= 7 && goal.progress < 70) {
                    this.addRiskItem({
                        type: 'GOAL',
                        level: 'HIGH',
                        category: 'TIMELINE',
                        title: `Goal "${goal.title}" may miss deadline`,
                        description: `Only ${daysUntilTarget} days remaining with ${goal.progress}% progress`,
                        impact: 'Medium',
                        probability: 'High',
                        entity: goal,
                        entityId: goal.id,
                        entityType: 'goal',
                        recommendation: 'Increase resources or adjust timeline'
                    });
                }
                // Stalled goal (no progress for a while)
                else if (goal.progress === 0 && daysUntilTarget <= 30) {
                    this.addRiskItem({
                        type: 'GOAL',
                        level: 'MEDIUM',
                        category: 'RESOURCE',
                        title: `Goal "${goal.title}" not started`,
                        description: `Goal has 0% progress with ${daysUntilTarget} days remaining`,
                        impact: 'Medium',
                        probability: 'Medium',
                        entity: goal,
                        entityId: goal.id,
                        entityType: 'goal',
                        recommendation: 'Assign resources and create action plan'
                    });
                }
            }
        });
    }

    analyzeMilestoneRisks() {
        if (!window.milestoneManager) return;

        const milestones = window.milestoneManager.getMilestones();
        const overdueMilestones = window.milestoneManager.getOverdueMilestones();

        // Overdue milestones
        overdueMilestones.forEach(milestone => {
            this.addRiskItem({
                type: 'MILESTONE',
                level: 'HIGH',
                category: 'TIMELINE',
                title: `Milestone "${milestone.title}" is overdue`,
                description: `This milestone is past its due date`,
                impact: 'High',
                probability: 'High',
                entity: milestone,
                entityId: milestone.id,
                entityType: 'milestone',
                recommendation: 'Complete milestone or revise timeline'
            });
        });

        // Blocked milestones
        const blockedMilestones = milestones.filter(m => m.status === 'BLOCKED');
        blockedMilestones.forEach(milestone => {
            this.addRiskItem({
                type: 'MILESTONE',
                level: 'CRITICAL',
                category: 'DEPENDENCY',
                title: `Milestone "${milestone.title}" is blocked`,
                description: `This milestone cannot proceed due to blockers`,
                impact: 'High',
                probability: 'High',
                entity: milestone,
                entityId: milestone.id,
                entityType: 'milestone',
                recommendation: 'Identify and remove blockers immediately'
            });
        });
    }

    analyzeTaskRisks() {
        if (!window.taskManager) return;

        const tasks = window.taskManager.getTasks();
        const overdueTasks = window.taskManager.getOverdueTasks();
        const criticalTasks = window.taskManager.getCriticalTasks();
        const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');

        // Critical overdue tasks
        const criticalOverdue = overdueTasks.filter(t => 
            t.priority === 'CRITICAL' || t.priority === 'URGENT'
        );

        if (criticalOverdue.length > 0) {
            this.addRiskItem({
                type: 'TASK',
                level: 'CRITICAL',
                category: 'TIMELINE',
                title: `${criticalOverdue.length} critical tasks are overdue`,
                description: `High-priority tasks are past their due dates`,
                impact: 'High',
                probability: 'High',
                entity: null,
                entityId: null,
                entityType: 'task',
                recommendation: 'Prioritize and complete critical tasks immediately'
            });
        }

        // Blocked tasks
        if (blockedTasks.length > 0) {
            this.addRiskItem({
                type: 'TASK',
                level: 'HIGH',
                category: 'DEPENDENCY',
                title: `${blockedTasks.length} tasks are blocked`,
                description: `Multiple tasks cannot proceed due to dependencies`,
                impact: 'Medium',
                probability: 'High',
                entity: null,
                entityId: null,
                entityType: 'task',
                recommendation: 'Unblock tasks by resolving dependencies'
            });
        }

        // High task load
        const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
        if (inProgressTasks.length > 15) {
            this.addRiskItem({
                type: 'TASK',
                level: 'MEDIUM',
                category: 'RESOURCE',
                title: `High number of concurrent tasks (${inProgressTasks.length})`,
                description: `Too many tasks in progress may indicate resource spread`,
                impact: 'Medium',
                probability: 'Medium',
                entity: null,
                entityId: null,
                entityType: 'task',
                recommendation: 'Focus on completing existing tasks before starting new ones'
            });
        }
    }

    analyzeDependencyRisks() {
        // Check for goals without milestones or tasks
        if (window.goalManager && window.milestoneManager && window.taskManager) {
            const goals = window.goalManager.getGoals();
            
            goals.forEach(goal => {
                const milestones = window.milestoneManager.getMilestonesByGoal(goal.id);
                const tasks = window.taskManager.getTasksByGoal(goal.id);

                if (milestones.length === 0 && tasks.length === 0) {
                    this.addRiskItem({
                        type: 'GOAL',
                        level: 'MEDIUM',
                        category: 'SCOPE',
                        title: `Goal "${goal.title}" has no milestones or tasks`,
                        description: `This goal lacks actionable breakdown`,
                        impact: 'Medium',
                        probability: 'Medium',
                        entity: goal,
                        entityId: goal.id,
                        entityType: 'goal',
                        recommendation: 'Create milestones and tasks to track progress'
                    });
                }
            });
        }
    }

    addRiskItem(risk) {
        risk.id = this.generateRiskId();
        risk.detectedAt = Date.now();
        risk.score = this.calculateRiskScore(risk.level, risk.impact, risk.probability);
        this.riskItems.push(risk);
    }

    calculateRiskScore(level, impact, probability) {
        const levelScore = {
            'CRITICAL': 10,
            'HIGH': 7,
            'MEDIUM': 4,
            'LOW': 2
        }[level] || 1;

        const impactScore = {
            'High': 3,
            'Medium': 2,
            'Low': 1
        }[impact] || 1;

        const probabilityScore = {
            'High': 3,
            'Medium': 2,
            'Low': 1
        }[probability] || 1;

        return levelScore * impactScore * probabilityScore;
    }

    // ============================================
    // RISK SCORING
    // ============================================

    getOverallRiskScore() {
        if (this.riskItems.length === 0) return 0;

        const totalScore = this.riskItems.reduce((sum, item) => sum + item.score, 0);
        const avgScore = totalScore / this.riskItems.length;

        // Normalize to 0-100
        return Math.min(100, Math.round(avgScore * 5));
    }

    getRiskLevel(score) {
        if (score >= 80) return { level: 'CRITICAL', label: 'Critical Risk', color: '#dc2626' };
        if (score >= 60) return { level: 'HIGH', label: 'High Risk', color: '#ea580c' };
        if (score >= 40) return { level: 'MEDIUM', label: 'Medium Risk', color: '#f59e0b' };
        if (score >= 20) return { level: 'LOW', label: 'Low Risk', color: '#10b981' };
        return { level: 'MINIMAL', label: 'Minimal Risk', color: '#059669' };
    }

    getRiskDescription(score) {
        if (score >= 80) return 'Critical risks detected. Immediate action required to prevent project failure.';
        if (score >= 60) return 'Significant risks present. Close monitoring and mitigation needed.';
        if (score >= 40) return 'Moderate risks identified. Take preventive actions to avoid escalation.';
        if (score >= 20) return 'Minor risks detected. Continue monitoring and maintain current pace.';
        return 'Project is on track with minimal risk factors detected.';
    }

    // ============================================
    // STATISTICS & ANALYTICS
    // ============================================

    getRiskStatistics() {
        const stats = {
            total: this.riskItems.length,
            critical: this.riskItems.filter(r => r.level === 'CRITICAL').length,
            high: this.riskItems.filter(r => r.level === 'HIGH').length,
            medium: this.riskItems.filter(r => r.level === 'MEDIUM').length,
            low: this.riskItems.filter(r => r.level === 'LOW').length,
            byCategory: {},
            overallScore: this.getOverallRiskScore()
        };

        // Count by category
        const categories = ['TIMELINE', 'RESOURCE', 'DEPENDENCY', 'QUALITY', 'SCOPE'];
        categories.forEach(cat => {
            stats.byCategory[cat] = this.riskItems.filter(r => r.category === cat).length;
        });

        return stats;
    }

    getRiskItems(filters = {}) {
        let items = [...this.riskItems];

        if (filters.level) {
            items = items.filter(r => r.level === filters.level);
        }

        if (filters.category) {
            items = items.filter(r => r.category === filters.category);
        }

        // Sort by score descending
        items.sort((a, b) => b.score - a.score);

        return items;
    }

    getRecommendations() {
        const recommendations = [];

        // Group by category
        const categories = {};
        this.riskItems.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });

        // Generate category specific recommendations
        Object.keys(categories).forEach(category => {
            const items = categories[category];
            const criticalCount = items.filter(i => i.level === 'CRITICAL').length;

            if (criticalCount > 0) {
                recommendations.push({
                    priority: 'HIGH',
                    category: category,
                    title: `Address ${criticalCount} critical ${category.toLowerCase()} risks`,
                    actions: items
                        .filter(i => i.level === 'CRITICAL')
                        .map(i => i.recommendation)
                        .slice(0, 3)
                });
            }
        });

        return recommendations;
    }

    // ============================================
    // EXPORT & HISTORY
    // ============================================

    exportRiskData() {
        const stats = this.getRiskStatistics();
        const riskLevel = this.getRiskLevel(stats.overallScore);

        return {
            overallScore: stats.overallScore,
            riskLevel: riskLevel.level,
            riskLevelLabel: riskLevel.label,
            stats,
            riskItems: this.riskItems,
            recommendations: this.getRecommendations(),
            analyzedAt: Date.now()
        };
    }

    saveToHistory() {
        const data = this.exportRiskData();
        this.riskHistory.push(data);

        // Keep only last 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.riskHistory = this.riskHistory.filter(h => h.analyzedAt >= sevenDaysAgo);
    }

    getRiskTrend() {
        return this.riskHistory.map(h => ({
            date: new Date(h.analyzedAt).toLocaleDateString(),
            score: h.overallScore,
            critical: h.stats.critical,
            high: h.stats.high
        }));
    }

    // ============================================
    // HELPERS
    // ============================================

    generateRiskId() {
        return 'risk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getLevelColor(level) {
        const colors = {
            'CRITICAL': '#dc2626',
            'HIGH': '#ea580c',
            'MEDIUM': '#f59e0b',
            'LOW': '#10b981'
        };
        return colors[level] || '#6b7280';
    }

    getCategoryIcon(category) {
        const icons = {
            'TIMELINE': 'fa-clock',
            'RESOURCE': 'fa-users',
            'DEPENDENCY': 'fa-link',
            'QUALITY': 'fa-star',
            'SCOPE': 'fa-project-diagram'
        };
        return icons[category] || 'fa-circle';
    }
}

// Initialize global instance
const riskEngine = new RiskEngine();
window.riskEngine = riskEngine;

// ============================================
// UI FUNCTIONS
// ============================================

function loadRiskAnalysis() {
    const data = riskEngine.exportRiskData();
    const stats = data.stats;

    // Update overall score
    document.getElementById('overallRiskScore').textContent = data.overallScore;
    document.getElementById('overallRiskLevel').textContent = data.riskLevelLabel;
    document.getElementById('riskScoreDescription').textContent = 
        riskEngine.getRiskDescription(data.overallScore);

    // Update metrics
    document.getElementById('criticalRisks').textContent = stats.critical;
    document.getElementById('highRisks').textContent = stats.high;
    document.getElementById('mediumRisks').textContent = stats.medium;
    document.getElementById('lowRisks').textContent = stats.low;

    // Load charts
    loadRiskGauge(data.overallScore);
    loadCategoryChart(stats.byCategory);
    loadTrendChart();

    // Load risk items
    loadRiskItems();

    // Load recommendations
    loadRecommendations();
}

function loadRiskGauge(score) {
    const ctx = document.getElementById('riskGaugeChart');
    if (!ctx) return;

    const riskLevel = riskEngine.getRiskLevel(score);

    if (riskEngine.charts.gauge) {
        riskEngine.charts.gauge.destroy();
    }

    riskEngine.charts.gauge = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [riskLevel.color, '#e5e7eb'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}

function loadCategoryChart(byCategory) {
    const ctx = document.getElementById('riskCategoryChart');
    if (!ctx) return;

    if (riskEngine.charts.category) {
        riskEngine.charts.category.destroy();
    }

    riskEngine.charts.category = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(byCategory),
            datasets: [{
                label: 'Risk Count',
                data: Object.values(byCategory),
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function loadTrendChart() {
    const ctx = document.getElementById('riskTrendChart');
    if (!ctx) return;

    const trend = riskEngine.getRiskTrend();

    if (riskEngine.charts.trend) {
        riskEngine.charts.trend.destroy();
    }

    riskEngine.charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trend.map(t => t.date),
            datasets: [{
                label: 'Risk Score',
                data: trend.map(t => t.score),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
}

function loadRiskItems() {
    const filters = {
        level: document.getElementById('riskLevelFilter')?.value || '',
        category: document.getElementById('riskCategoryFilter')?.value || ''
    };

    const items = riskEngine.getRiskItems(filters);
    const container = document.getElementById('riskItemsList');
    const emptyState = document.getElementById('emptyRisks');

    if (!container) return;

    if (items.length === 0) {
        container.classList.add('hidden');
        emptyState?.classList.remove('hidden');
        return;
    }

    container.classList.remove('hidden');
    emptyState?.classList.add('hidden');

    container.innerHTML = items.map(item => `
        <div class="risk-item risk-level-${item.level.toLowerCase()}">
            <div class="risk-item-header">
                <div class="risk-item-level ${item.level.toLowerCase()}">
                    ${item.level}
                </div>
                <div class="risk-item-category">
                    <i class="fas ${riskEngine.getCategoryIcon(item.category)}"></i>
                    ${item.category}
                </div>
            </div>
            <h3 class="risk-item-title">${item.title}</h3>
            <p class="risk-item-description">${item.description}</p>
            <div class="risk-item-meta">
                <span><strong>Impact:</strong> ${item.impact}</span>
                <span><strong>Probability:</strong> ${item.probability}</span>
                <span><strong>Risk Score:</strong> ${item.score}</span>
            </div>
            <div class="risk-item-recommendation">
                <i class="fas fa-lightbulb"></i>
                <strong>Recommendation:</strong> ${item.recommendation}
            </div>
        </div>
    `).join('');
}

function loadRecommendations() {
    const recommendations = riskEngine.getRecommendations();
    const container = document.getElementById('recommendationsList');

    if (!container) return;

    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="recommendation-card">
                <div class="recommendation-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="recommendation-content">
                    <h3 class="recommendation-title">No Critical Actions Needed</h3>
                    <p class="recommendation-text">Your project is in good shape. Continue monitoring progress.</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-card">
            <div class="recommendation-icon ${rec.priority.toLowerCase()}">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="recommendation-content">
                <div class="recommendation-priority">${rec.priority} PRIORITY</div>
                <h3 class="recommendation-title">${rec.title}</h3>
                <ul class="recommendation-actions">
                    ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');
}

function exportRiskReport() {
    const data = riskEngine.exportRiskData();
    const report = {
        generatedAt: new Date().toISOString(),
        project: 'FlowBit Project',
        ...data
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-report-${Date.now()}.json`;
    a.click();

    if (window.notificationManager) {
        window.notificationManager.show({
            title: 'Report Exported',
            message: 'Risk assessment report downloaded successfully',
            type: 'success'
        });
    }
}

console.log('âœ… Risk Engine module loaded');
