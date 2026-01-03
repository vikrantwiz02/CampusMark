const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
  console.log('Loaded environment from .env.local');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Validate required environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'CampusMark';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is required!');
  console.error('Please set it in .env.local file');
  process.exit(1);
}

app.use(cors({
  origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(','),
  credentials: true
}));
app.use(express.json());

let db;
const client = new MongoClient(MONGODB_URI);

client.connect()
  .then(() => {
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB Atlas');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: db ? 'connected' : 'disconnected' });
});

app.post('/api/sync/records', async (req, res) => {
  try {
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
});

app.post('/api/sync/courses', async (req, res) => {
  try {
    const { courses, userId } = req.body;
    
    if (!courses || !userId) {
      return res.status(400).json({ error: 'Missing courses or userId' });
    }

    const collection = db.collection('courses');
    
    const operations = courses
      .filter(c => !c.isSynced)
      .map(course => ({
        updateOne: {
          filter: { 
            id: course.id,
            userId: userId 
          },
          update: { 
            $set: { 
              ...course, 
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
    console.error('Sync courses error:', error);
    res.status(500).json({ error: 'Failed to sync courses' });
  }
});

app.post('/api/sync/semesters', async (req, res) => {
  try {
    const { semesters, userId } = req.body;
    
    if (!semesters || !userId) {
      return res.status(400).json({ error: 'Missing semesters or userId' });
    }

    const collection = db.collection('semesters');
    
    const operations = semesters
      .filter(s => !s.isSynced)
      .map(semester => ({
        updateOne: {
          filter: { 
            id: semester.id,
            userId: userId 
          },
          update: { 
            $set: { 
              ...semester, 
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
    console.error('Sync semesters error:', error);
    res.status(500).json({ error: 'Failed to sync semesters' });
  }
});

app.get('/api/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const [records, courses, semesters] = await Promise.all([
      db.collection('attendance_records').find({ userId }).toArray(),
      db.collection('courses').find({ userId }).toArray(),
      db.collection('semesters').find({ userId }).toArray()
    ]);

    res.json({ records, courses, semesters });
  } catch (error) {
    console.error('Fetch data error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.delete('/api/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    await Promise.all([
      db.collection('attendance_records').deleteMany({ userId }),
      db.collection('courses').deleteMany({ userId }),
      db.collection('semesters').deleteMany({ userId })
    ]);

    res.json({ success: true, message: 'All user data deleted' });
  } catch (error) {
    console.error('Delete data error:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${DB_NAME}`);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
