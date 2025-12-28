const { MongoClient, ServerApiVersion } = require('mongodb');

// Load URI from environment - NO FALLBACK!
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'cloudguard';

let client = null;
let db = null;

async function connectDB() {
    try {
        // CRITICAL: Check if URI exists
        if (!uri) {
            throw new Error(
                'MONGODB_URI is not defined!\n\n' +
                'Please check:\n' +
                '1. .env file exists in project root (same folder as package.json)\n' +
                '2. .env contains: MONGODB_URI=mongodb+srv://...\n' +
                '3. No typos in variable name (must be exactly MONGODB_URI)\n' +
                '4. Server was restarted after creating .env file'
            );
        }

        // Check if URI looks like MongoDB Atlas
        if (!uri.includes('mongodb+srv://') && !uri.includes('mongodb://')) {
            throw new Error(
                'MONGODB_URI format is invalid!\n\n' +
                'It should start with: mongodb+srv:// or mongodb://\n' +
                'Current value: ' + uri.substring(0, 20) + '...'
            );
        }

        console.log('🔌 Connecting to MongoDB Atlas...');
        console.log(`📦 Target Database: ${dbName}`);

        // MongoDB Atlas connection options
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        // Connect to MongoDB Atlas
        await client.connect();
        
        // Ping to confirm connection
        await client.db("admin").command({ ping: 1 });
        
        // Get the database
        db = client.db(dbName);
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        console.log(`📦 Using Database: ${dbName}`);
        
        // List existing collections
        const collections = await db.listCollections().toArray();
        if (collections.length > 0) {
            console.log(`📋 Existing collections: ${collections.map(c => c.name).join(', ')}`);
        } else {
            console.log('📋 No collections yet (will be created automatically)');
        }
        
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('');
        
        if (error.message.includes('MONGODB_URI is not defined')) {
            // Already has detailed message
            throw error;
        } else if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
            console.error('💡 Authentication failed - password is incorrect');
            console.error('   1. Go to MongoDB Atlas → Database Access');
            console.error('   2. Change password for user dzirkiev95');
            console.error('   3. Update MONGODB_URI in .env with new password');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('localhost')) {
            console.error('💡 Trying to connect to localhost instead of Atlas!');
            console.error('   This means .env file is not loaded properly');
            console.error('   1. Check .env file is in project root');
            console.error('   2. Verify MONGODB_URI starts with mongodb+srv://');
            console.error('   3. Restart the server');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('connection timeout')) {
            console.error('💡 Network error - cannot reach MongoDB Atlas');
            console.error('   1. Check internet connection');
            console.error('   2. Go to MongoDB Atlas → Network Access');
            console.error('   3. Add your current IP address');
        }
        
        throw error;
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB() first.');
    }
    return db;
}

async function closeDB() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('📴 MongoDB Atlas connection closed');
    }
}

module.exports = { connectDB, getDB, closeDB };