require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Start Express server
        app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log('🛡️  CloudGuard Alert Management System');
            console.log('='.repeat(50));
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`📊 Dashboard: http://localhost:${PORT}`);
            console.log(`🔌 API: http://localhost:${PORT}/api/alerts`);
            console.log('='.repeat(50));
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
