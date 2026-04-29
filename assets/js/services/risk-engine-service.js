/**
 * ============================================================================
 * FlowBit SEP - Frontend Risk Engine Service
 * Direct Supabase Integration
 * Version: 1.0
 * Date: 2026-04-05
 * ============================================================================
 */

/**
 * Risk Analytics Service - Queries risk data from Supabase
 */
export class RiskAnalyticsService {
    constructor(supabase) {
        this.supabase = supabase;
    }

    /**
     * Get risk metrics summary
     * @returns {Object} Metrics by level, status, category
     */
    async getMetricsSummary() {
        try {
            // Query all risks from database
            let risks;
            try {
                risks = await this.supabase.select('risks');
            } catch (dbError) {
                console.error('Database query failed:', dbError);
                return {
                    success: false,
                    data: this._getEmptyMetrics(),
                    error: 'Database connection failed: ' + dbError.message
                };
            }

            if (!risks) {
                console.error('No data returned from database');
                return {
                    success: false,
                    data: this._getEmptyMetrics(),
                    error: 'No data returned'
                };
            }

            // If no risks, return empty metrics (this is SUCCESS - empty database)
            if (risks.length === 0) {
                console.log('📊 No risks found in database (empty table)');
                return {
                    success: true,
                    data: this._getEmptyMetrics()
                };
            }

            // Calculate metrics
            const metrics = {
                total: risks.length,
                by_level: {
                    critical: risks.filter(r => r.risk_level === 'CRITICAL').length,
                    high: risks.filter(r => r.risk_level === 'HIGH').length,
                    medium: risks.filter(r => r.risk_level === 'MEDIUM').length,
                    low: risks.filter(r => r.risk_level === 'LOW').length
                },
                by_status: {
                    identified: risks.filter(r => r.status === 'IDENTIFIED').length,
                    analyzing: risks.filter(r => r.status === 'ANALYZING').length,
                    mitigating: risks.filter(r => r.status === 'MITIGATING').length,
                    monitoring: risks.filter(r => r.status === 'MONITORING').length,
                    resolved: risks.filter(r => r.status === 'RESOLVED').length,
                    accepted: risks.filter(r => r.status === 'ACCEPTED').length,
                    closed: risks.filter(r => r.status === 'CLOSED').length
                },
                average_score: risks.length > 0 
                    ? Math.round(risks.reduce((sum, r) => sum + (r.risk_score || 0), 0) / risks.length)
                    : 0
            };

            console.log('✅ Risk Metrics:', metrics);
            return {
                success: true,
                data: metrics
            };

        } catch (error) {
            console.error('Error getting metrics:', error);
            return {
                success: false,
                data: this._getEmptyMetrics(),
                error: error.message
            };
        }
    }

    /**
     * Get risks by category with counts
     */
    async getRisksByCategory() {
        try {
            const risks = await this.supabase.select('risks');
            if (!risks) throw new Error('Failed to fetch risks');

            const categories = await this.supabase.select('risk_categories');
            if (!categories) throw new Error('Failed to fetch categories');

            // Create category map
            const categoryMap = {};
            categories.forEach(cat => {
                categoryMap[cat.id] = {
                    name: cat.name,
                    icon: cat.icon,
                    color: cat.color,
                    count: 0
                };
            });

            // Count risks per category
            risks.forEach(risk => {
                if (risk.category_id && categoryMap[risk.category_id]) {
                    categoryMap[risk.category_id].count++;
                }
            });

            return {
                success: true,
                data: Object.values(categoryMap).filter(c => c.count > 0)
            };
        } catch (error) {
            console.error('Error getting risks by category:', error);
            return {
                success: false,
                data: [],
                error: error.message
            };
        }
    }

    /**
     * Get all risks with full details
     */
    async getAllRisks() {
        try {
            const risks = await this.supabase.select('risks');
            if (!risks) throw new Error('Failed to fetch risks');

            return {
                success: true,
                data: risks
            };
        } catch (error) {
            console.error('Error getting all risks:', error);
            return {
                success: false,
                data: [],
                error: error.message
            };
        }
    }

    /**
     * Get empty metrics (for when there's no data)
     */
    _getEmptyMetrics() {
        return {
            total: 0,
            by_level: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            },
            by_status: {
                identified: 0,
                analyzing: 0,
                mitigating: 0,
                monitoring: 0,
                resolved: 0,
                accepted: 0,
                closed: 0
            },
            average_score: 0
        };
    }
}

/**
 * Risk Scoring Service - Calculates health scores and trends
 */
export class RiskScoringService {
    constructor(supabase) {
        this.supabase = supabase;
    }

    /**
     * Calculate overall health score
     * Health Score = 100 - (weighted sum of risks)
     */
    async calculateHealthScore() {
        try {
            let risks;
            try {
                risks = await this.supabase.select('risks');
            } catch (dbError) {
                console.error('Database query failed:', dbError);
                return {
                    success: false,
                    data: {
                        overall_health_score: 100,
                        risk_count: 0,
                        active_risks: 0
                    },
                    error: 'Database connection failed: ' + dbError.message
                };
            }

            if (!risks) {
                return {
                    success: false,
                    data: {
                        overall_health_score: 100,
                        risk_count: 0,
                        active_risks: 0
                    },
                    error: 'No data returned'
                };
            }

            if (risks.length === 0) {
                return {
                    success: true,
                    data: {
                        overall_health_score: 100,
                        risk_count: 0,
                        active_risks: 0
                    }
                };
            }

            // Only count active risks (not resolved/closed)
            const activeRisks = risks.filter(r => 
                !['RESOLVED', 'ACCEPTED', 'CLOSED'].includes(r.status)
            );

            // Calculate penalty based on risk levels
            const penalties = {
                CRITICAL: 20,
                HIGH: 10,
                MEDIUM: 5,
                LOW: 1
            };

            let totalPenalty = 0;
            activeRisks.forEach(risk => {
                const penalty = penalties[risk.risk_level] || 0;
                totalPenalty += penalty;
            });

            // Health score = 100 - total penalty (minimum 0)
            const healthScore = Math.max(0, 100 - totalPenalty);

            return {
                success: true,
                data: {
                    overall_health_score: healthScore,
                    risk_count: risks.length,
                    active_risks: activeRisks.length,
                    total_penalty: totalPenalty
                }
            };

        } catch (error) {
            console.error('Error calculating health score:', error);
            return {
                success: false,
                data: {
                    overall_health_score: 0,
                    risk_count: 0,
                    active_risks: 0
                },
                error: error.message
            };
        }
    }
}

/**
 * Risk Data Service - CRUD operations for risks
 */
export class RiskDataService {
    constructor(supabase) {
        this.supabase = supabase;
    }

    /**
     * Get all risks with optional filters
     */
    async getRisks(filters = {}) {
        try {
            // Fetch all risks (custom client doesn't support complex filters yet)
            const data = await this.supabase.select('risks');

            if (!data) throw new Error('Failed to fetch risks');

            // Apply filters manually
            let filteredData = data;
            
            if (filters.status) {
                filteredData = filteredData.filter(r => r.status === filters.status);
            }
            if (filters.risk_level) {
                filteredData = filteredData.filter(r => r.risk_level === filters.risk_level);
            }
            if (filters.entity_type) {
                filteredData = filteredData.filter(r => r.entity_type === filters.entity_type);
            }

            // Sort by created_at descending
            filteredData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return {
                success: true,
                data: filteredData || []
            };
        } catch (error) {
            console.error('Error getting risks:', error);
            return {
                success: false,
                data: [],
                error: error.message
            };
        }
    }

    /**
     * Get risk categories
     */
    async getCategories() {
        try {
            const data = await this.supabase.select('risk_categories');

            if (!data) throw new Error('Failed to fetch categories');
            
            // Filter active and sort by display_order
            const activeCategories = data
                .filter(c => c.is_active === true)
                .sort((a, b) => a.display_order - b.display_order);

            return {
                success: true,
                data: activeCategories || []
            };
        } catch (error) {
            console.error('Error getting categories:', error);
            return {
                success: false,
                data: [],
                error: error.message
            };
        }
    }
}

// Export as default object for easier importing
export default {
    RiskAnalyticsService,
    RiskScoringService,
    RiskDataService
};
