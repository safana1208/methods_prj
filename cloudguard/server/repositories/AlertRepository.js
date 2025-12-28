class AlertRepository {
    constructor(mongoClient, tableName = 'alerts') {
        this.db = mongoClient;
        this.tableName = tableName;
    }

    async save(alert) {
        const collection = this.db.collection(this.tableName);
        const result = await collection.insertOne(alert);
        return alert;
    }

    async findById(alertId) {
        const collection = this.db.collection(this.tableName);
        return await collection.findOne({ id: alertId });
    }

    async findAll(filter = {}) {
        const collection = this.db.collection(this.tableName);
        const query = {};
        
        if (filter.severity) {
            query.severity = filter.severity;
        }
        if (filter.status) {
            query.status = filter.status;
        }
        if (filter.category) {
            query.category = filter.category;
        }
        
        return await collection.find(query).toArray();
    }

    async updateStatus(alertId, status) {
        const collection = this.db.collection(this.tableName);
        await collection.updateOne(
            { id: alertId },
            { $set: { status, updatedAt: new Date().toISOString() } }
        );
        return await this.findById(alertId);
    }

    async delete(alertId) {
        const collection = this.db.collection(this.tableName);
        await collection.deleteOne({ id: alertId });
        return true;
    }
}

module.exports = AlertRepository;
