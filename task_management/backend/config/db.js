const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const FALLBACK_DIR = path.join(__dirname, '..', 'data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'fallback_db.json');

let isUsingMongoDB = false;

// Create fallback directory if it doesn't exist
if (!fs.existsSync(FALLBACK_DIR)) {
  fs.mkdirSync(FALLBACK_DIR, { recursive: true });
}

// Initialize fallback file if it doesn't exist
if (!fs.existsSync(FALLBACK_FILE)) {
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify({ users: [], projects: [], tasks: [] }, null, 2));
}

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portfolio';
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000 // 3 seconds timeout
    });
    isUsingMongoDB = true;
    console.log('MongoDB Connected Successfully.');
  } catch (err) {
    console.warn('MongoDB connection failed. Falling back to local JSON database.');
    isUsingMongoDB = false;
  }
};

const readFallbackFile = () => {
  try {
    const data = fs.readFileSync(FALLBACK_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading fallback DB file, returning empty structure.', err);
    return { projects: [], messages: [] };
  }
};

const writeFallbackFile = (data) => {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to fallback DB file.', err);
  }
};

module.exports = {
  connectDB,
  isUsingMongo: () => isUsingMongoDB,
  readFallbackFile,
  writeFallbackFile
};
