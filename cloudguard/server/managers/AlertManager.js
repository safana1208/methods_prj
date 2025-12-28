/**
 * AlertManager - Core Alert Management Logic
 * 
 * CloudGuard Alert Management System
 * Group 12 - Software Engineering Methods Course
 * 
 * Responsibilities (from LLD):
 * - Receives security findings from RuleEngine, AnomalyEngine, CVEIntegration
 * - Converts findings into system alerts
 * - Classifies alerts by severity and category
 * - Manages alert lifecycle with valid state transitions
 * - Uses AlertRepository for storage
 * - Records actions in AuditLogManager for traceability
 */

class AlertManager {
    /**
     * Constructor
     * @param {AlertRepository} alertRepository - Repository for alert persistence
     * @param {AuditLogManager} auditLogManager - Manager for audit logging
     */
    constructor(alertRepository, auditLogManager) {
        if (!alertRepository) {
            throw new Error('AlertRepository is required');
        }
        if (!auditLogManager) {
            throw new Error('AuditLogManager is required');
        }

        this.alertRepository = alertRepository;
        this.auditLogManager = auditLogManager;

        // Valid state transitions (from LLD)
        this.validTransitions = {
            'New': ['Acknowledged'],
            'Acknowledged': ['In-Progress'],
            'In-Progress': ['Resolved'],
            'Resolved': []
        };

        // Severity levels
        this.severityLevels = ['High', 'Medium', 'Low'];

        // Alert categories
        this.categories = ['CVE', 'S3', 'IAM', 'Network', 'Activity'];
    }

    /**
     * Create a new alert from a security finding
     * Implements: AlertManager.createAlert(finding)
     * 
     * @param {Object} finding - Security finding from detection engines
     * @param {string} finding.category - Alert category (CVE, S3, IAM, Network, Activity)
     * @param {string} finding.severity - Severity level (High, Medium, Low)
     * @param {string} finding.description - Description of the security issue
     * @returns {Promise<Object>} Created alert object
     */
    async createAlert(finding) {
        try {
            // Validate input
            this._validateFinding(finding);

            // Classify severity (if not provided or invalid)
            const severity = this._classifySeverity(finding);

            // Create alert object
            const alert = {
                id: this._generateAlertId(),
                severity: severity,
                category: finding.category,
                status: 'New',
                description: finding.description,
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Validate alert structure
            this._validateAlert(alert);

            // Save to repository
            const savedAlert = await this.alertRepository.save(alert);

            // Log the action in audit trail
            await this.auditLogManager.log({
                action: 'ALERT_CREATED',
                alertId: alert.id,
                severity: alert.severity,
                category: alert.category,
                timestamp: new Date().toISOString(),
                details: `Alert created from ${finding.category} finding`
            });

            console.log(`✅ AlertManager: Alert ${alert.id} created successfully`);
            return savedAlert;

        } catch (error) {
            console.error('❌ AlertManager: Error creating alert:', error);
            
            // Log error
            await this.auditLogManager.log({
                action: 'ALERT_CREATION_FAILED',
                error: error.message,
                timestamp: new Date().toISOString()
            });

            throw error;
        }
    }

    /**
     * Update the status of an existing alert
     * Implements: AlertManager.updateAlertStatus(alertID, newStatus)
     * 
     * @param {string} alertId - ID of the alert to update
     * @param {string} newStatus - New status to set
     * @returns {Promise<Object>} Updated alert object
     */
    async updateAlertStatus(alertId, newStatus) {
        try {
            // Validate inputs
            if (!alertId) {
                throw new Error('Alert ID is required');
            }
            if (!newStatus) {
                throw new Error('New status is required');
            }

            // Retrieve current alert
            const currentAlert = await this.alertRepository.findById(alertId);
            if (!currentAlert) {
                throw new Error(`Alert with ID ${alertId} not found`);
            }

            // Validate state transition
            if (!this._isValidTransition(currentAlert.status, newStatus)) {
                throw new Error(
                    `Invalid state transition: ${currentAlert.status} → ${newStatus}. ` +
                    `Valid transitions from ${currentAlert.status}: ${this.validTransitions[currentAlert.status].join(', ')}`
                );
            }

            // Update alert status
            const updatedAlert = await this.alertRepository.updateStatus(alertId, newStatus);

            // Log the action
            await this.auditLogManager.log({
                action: 'STATUS_UPDATED',
                alertId: alertId,
                oldStatus: currentAlert.status,
                newStatus: newStatus,
                timestamp: new Date().toISOString()
            });

            console.log(`✅ AlertManager: Alert ${alertId} status updated: ${currentAlert.status} → ${newStatus}`);
            return updatedAlert;

        } catch (error) {
            console.error('❌ AlertManager: Error updating alert status:', error);
            
            // Log error
            await this.auditLogManager.log({
                action: 'STATUS_UPDATE_FAILED',
                alertId: alertId,
                newStatus: newStatus,
                error: error.message,
                timestamp: new Date().toISOString()
            });

            throw error;
        }
    }

    /**
     * Get alerts with optional filtering
     * Implements: AlertManager.getAlerts(filter)
     * 
     * @param {Object} filter - Optional filter criteria
     * @param {string} filter.severity - Filter by severity
     * @param {string} filter.status - Filter by status
     * @param {string} filter.category - Filter by category
     * @returns {Promise<Array>} Array of alerts matching filter
     */
    async getAlerts(filter = {}) {
        try {
            const alerts = await this.alertRepository.findAll(filter);

            console.log(`✅ AlertManager: Retrieved ${alerts.length} alerts`);
            return alerts;

        } catch (error) {
            console.error('❌ AlertManager: Error retrieving alerts:', error);
            throw error;
        }
    }

    /**
     * Get a specific alert by ID
     * 
     * @param {string} alertId - Alert ID
     * @returns {Promise<Object>} Alert object
     */
    async getAlertById(alertId) {
        try {
            if (!alertId) {
                throw new Error('Alert ID is required');
            }

            const alert = await this.alertRepository.findById(alertId);
            
            if (!alert) {
                throw new Error(`Alert with ID ${alertId} not found`);
            }

            return alert;

        } catch (error) {
            console.error('❌ AlertManager: Error retrieving alert:', error);
            throw error;
        }
    }

    /**
     * Delete an alert
     * 
     * @param {string} alertId - Alert ID to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteAlert(alertId) {
        try {
            if (!alertId) {
                throw new Error('Alert ID is required');
            }

            // Check if alert exists
            const alert = await this.alertRepository.findById(alertId);
            if (!alert) {
                throw new Error(`Alert with ID ${alertId} not found`);
            }

            // Delete from repository
            await this.alertRepository.delete(alertId);

            // Log the action
            await this.auditLogManager.log({
                action: 'ALERT_DELETED',
                alertId: alertId,
                timestamp: new Date().toISOString()
            });

            console.log(`✅ AlertManager: Alert ${alertId} deleted successfully`);
            return true;

        } catch (error) {
            console.error('❌ AlertManager: Error deleting alert:', error);
            
            await this.auditLogManager.log({
                action: 'ALERT_DELETION_FAILED',
                alertId: alertId,
                error: error.message,
                timestamp: new Date().toISOString()
            });

            throw error;
        }
    }

    /**
     * Get alert statistics
     * 
     * @returns {Promise<Object>} Statistics object
     */
    async getStatistics() {
        try {
            const alerts = await this.alertRepository.findAll();

            const stats = {
                total: alerts.length,
                new: alerts.filter(a => a.status === 'New').length,
                acknowledged: alerts.filter(a => a.status === 'Acknowledged').length,
                inProgress: alerts.filter(a => a.status === 'In-Progress').length,
                resolved: alerts.filter(a => a.status === 'Resolved').length,
                bySeverity: {
                    high: alerts.filter(a => a.severity === 'High').length,
                    medium: alerts.filter(a => a.severity === 'Medium').length,
                    low: alerts.filter(a => a.severity === 'Low').length
                },
                byCategory: {
                    cve: alerts.filter(a => a.category === 'CVE').length,
                    s3: alerts.filter(a => a.category === 'S3').length,
                    iam: alerts.filter(a => a.category === 'IAM').length,
                    network: alerts.filter(a => a.category === 'Network').length,
                    activity: alerts.filter(a => a.category === 'Activity').length
                }
            };

            return stats;

        } catch (error) {
            console.error('❌ AlertManager: Error calculating statistics:', error);
            throw error;
        }
    }

    // ====================================
    // Private Helper Methods
    // ====================================

    /**
     * Validate finding input
     * 
     * @private
     * @param {Object} finding - Finding object to validate
     * @throws {Error} If finding is invalid
     */
    _validateFinding(finding) {
        if (!finding) {
            throw new Error('Finding object is required');
        }

        if (!finding.category) {
            throw new Error('Finding category is required');
        }

        if (!this.categories.includes(finding.category)) {
            throw new Error(
                `Invalid category: ${finding.category}. ` +
                `Must be one of: ${this.categories.join(', ')}`
            );
        }

        if (!finding.description || finding.description.trim() === '') {
            throw new Error('Finding description is required');
        }
    }

    /**
     * Validate alert structure
     * 
     * @private
     * @param {Object} alert - Alert object to validate
     * @throws {Error} If alert is invalid
     */
    _validateAlert(alert) {
        if (!alert.id) {
            throw new Error('Alert ID is required');
        }

        if (!this.severityLevels.includes(alert.severity)) {
            throw new Error(
                `Invalid severity: ${alert.severity}. ` +
                `Must be one of: ${this.severityLevels.join(', ')}`
            );
        }

        if (!this.categories.includes(alert.category)) {
            throw new Error(
                `Invalid category: ${alert.category}. ` +
                `Must be one of: ${this.categories.join(', ')}`
            );
        }

        if (!alert.status) {
            throw new Error('Alert status is required');
        }

        if (!alert.description) {
            throw new Error('Alert description is required');
        }
    }

    /**
     * Classify severity of a finding
     * Uses severity from finding if valid, otherwise determines based on category and keywords
     * 
     * @private
     * @param {Object} finding - Security finding
     * @returns {string} Severity level (High, Medium, Low)
     */
    _classifySeverity(finding) {
        // If valid severity is provided, use it
        if (finding.severity && this.severityLevels.includes(finding.severity)) {
            return finding.severity;
        }

        // Otherwise, classify based on category and description keywords
        const description = finding.description.toLowerCase();

        // High severity keywords
        const highSeverityKeywords = [
            'critical', 'urgent', 'severe', 'exploit', 'vulnerability',
            'breach', 'compromise', 'unauthorized access', 'data leak',
            'malware', 'ransomware', 'public', 'exposed'
        ];

        // Low severity keywords
        const lowSeverityKeywords = [
            'informational', 'minor', 'warning', 'recommendation',
            'best practice', 'configuration', 'versioning'
        ];

        // Check for high severity
        if (highSeverityKeywords.some(keyword => description.includes(keyword))) {
            return 'High';
        }

        // Check for low severity
        if (lowSeverityKeywords.some(keyword => description.includes(keyword))) {
            return 'Low';
        }

        // Default to Medium
        return 'Medium';
    }

    /**
     * Validate state transition
     * Implements the state machine from LLD
     * 
     * @private
     * @param {string} currentStatus - Current alert status
     * @param {string} newStatus - Desired new status
     * @returns {boolean} True if transition is valid
     */
    _isValidTransition(currentStatus, newStatus) {
        const validNextStates = this.validTransitions[currentStatus];
        
        if (!validNextStates) {
            return false;
        }

        return validNextStates.includes(newStatus);
    }

    /**
     * Generate unique alert ID
     * Format: ALT-timestamp-random
     * 
     * @private
     * @returns {string} Unique alert ID
     */
    _generateAlertId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `ALT-${timestamp}-${random}`;
    }
}

// Export for use in Node.js
module.exports = AlertManager;