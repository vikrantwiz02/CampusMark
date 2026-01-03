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
      throw new Error('❌ MONGODB_URI not set in Vercel environment variables');
    }

    console.log('Connecting to MongoDB...');
    const client = await MongoClient.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    const db = client.db(DB_NAME);
    console.log('✓ Connected to database:', DB_NAME);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { db } = await connectToDatabase();
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    if (req.method === 'GET') {
      const [records, courses, semesters] = await Promise.all([
        db.collection('attendance_records').find({ userId }).toArray(),
        db.collection('courses').find({ userId }).toArray(),
        db.collection('semesters').find({ userId }).toArray()
      ]);

      return res.json({ records, courses, semesters });
    }

    if (req.method === 'DELETE') {
      await Promise.all([
        db.collection('attendance_records').deleteMany({ userId }),
        db.collection('courses').deleteMany({ userId }),
        db.collection('semesters').deleteMany({ userId })
      ]);

      return res.json({ success: true, message: 'All user data deleted' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Data operation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.query.userId,
      method: req.method,
      mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
      dbName: process.env.MONGODB_DB_NAME || 'attendly (default)'
    });
    res.status(500).json({ 
      error: 'Database operation failed',
      details: error.message,
      hint: 'Check Vercel logs and ensure MONGODB_URI is set in environment variables'
    });
  }
};
