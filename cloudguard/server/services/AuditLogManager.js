class AuditLogManager {
    constructor(mongoClient, tableName = 'audit_logs') {
        this.db = mongoClient;
        this.tableName = tableName;
    }

    async log(logEntry) {
        try {
            const collection = this.db.collection(this.tableName);
            const entry = {
                ...logEntry,
                timestamp: logEntry.timestamp || new Date().toISOString()
            };
            await collection.insertOne(entry);
            console.log(`📝 Audit Log: ${logEntry.action}`);
        } catch (error) {
            console.error('❌ AuditLogManager: Error logging:', error);
        }
    }

    async getLogs(filter = {}) {
        try {
            const collection = this.db.collection(this.tableName);
            return await collection.find(filter).sort({ timestamp: -1 }).toArray();
        } catch (error) {
            console.error('❌ AuditLogManager: Error getting logs:', error);
            return [];
        }
    }
}

module.exports = AuditLogManager;
