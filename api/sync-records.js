const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.MONGODB_DB_NAME || 'CampusMark';

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { db } = await connectToDatabase();
    const { records, userId } = req.body;

    if (!records || !userId) {
      return res.status(400).json({ error: 'Missing records or userId' });
    }

    const collection = db.collection('attendance_records');

    const operations = records
      .filter(r => !r.isSynced)
      .map(record => ({
        updateOne: {
          filter: {
            date: record.date,
            courseId: record.courseId,
            userId: userId
          },
          update: {
            $set: {
              ...record,
              userId,
              isSynced: true,
              syncedAt: new Date()
            }
          },
          upsert: true
        }
      }));

    if (operations.length > 0) {
      await collection.bulkWrite(operations);
    }

    res.json({ success: true, synced: operations.length });
  } catch (error) {
    console.error('Sync records error:', error);
    res.status(500).json({ error: 'Failed to sync records' });
  }
};
