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
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Check environment variables first
    const hasMongoUri = !!process.env.MONGODB_URI;
    
    if (!hasMongoUri) {
      return res.status(500).json({ 
        status: 'error',
        database: 'not_configured',
        error: 'MONGODB_URI environment variable is not set',
        solution: 'Add MONGODB_URI in Vercel Project Settings → Environment Variables'
      });
    }

    try {
      const { db } = await connectToDatabase();
      const status = db ? 'connected' : 'disconnected';
      console.log('Health check - DB status:', status);
      return res.json({ 
        status: 'ok', 
        database: status,
        dbName: process.env.MONGODB_DB_NAME || 'attendly',
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Database connection error:', dbError.message);
      return res.status(500).json({ 
        status: 'error', 
        database: 'connection_failed',
        error: dbError.message,
        solution: 'Check your MongoDB connection string and network access settings'
      });
    }
  } catch (error) {
    console.error('Health check critical error:', error);
    return res.status(500).json({ 
      status: 'error',
      error: 'Internal server error',
      message: error.message
    });
  }
};
