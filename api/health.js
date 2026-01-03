const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  try {
    if (cachedClient && cachedDb) {
      return { client: cachedClient, db: cachedDb };
    }

    const MONGODB_URI = process.env.MONGODB_URI;
    const DB_NAME = process.env.MONGODB_DB_NAME || 'attendly';

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set in Vercel');
    }

    console.log('Attempting MongoDB connection...');
    const client = await MongoClient.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    const db = client.db(DB_NAME);
    console.log('MongoDB connected successfully to:', DB_NAME);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    // Set CORS headers first
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Check environment variables
    const hasMongoUri = !!process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'attendly';
    
    console.log('Health check called');
    console.log('MONGODB_URI exists:', hasMongoUri);
    console.log('DB_NAME:', dbName);

    if (!hasMongoUri) {
      console.error('MONGODB_URI not found in environment');
      return res.status(200).json({ 
        status: 'error',
        database: 'not_configured',
        error: 'MONGODB_URI is not set',
        envVars: {
          MONGODB_URI: 'not set',
          MONGODB_DB_NAME: dbName
        }
      });
    }

    try {
      const { db } = await connectToDatabase();
      console.log('MongoDB connection successful');
      return res.status(200).json({ 
        status: 'ok', 
        database: 'connected',
        dbName: dbName,
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('MongoDB connection failed:', dbError.message);
      return res.status(200).json({ 
        status: 'error', 
        database: 'connection_failed',
        error: dbError.message,
        hint: 'Check MongoDB Atlas IP whitelist (set to 0.0.0.0/0) and connection string format'
      });
    }
  } catch (error) {
    console.error('Critical error:', error.message, error.stack);
    return res.status(200).json({ 
      status: 'error',
      error: error.message,
      stack: error.stack
    });
  }
};
