const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const db = require('../config/db');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const projects = [
  {
    title: 'URL SHORTENER',
    description: 'Converts long URLs into short, easy-to-share links with reliable redirection. Improves link readability and simplifies URL management.',
    tools: {
      frontend: 'React.js',
      backend: 'Spring Boot',
      database: 'SQL'
    },
    github: 'https://github.com/Karthi220606/UrlShortener',
    category: 'React'
  },
  {
    title: 'PRIVATE EMAIL SYSTEM',
    description: 'An admin-controlled email platform for secure internal communication. Supports user management and core mailbox features like send and receive.',
    tools: {
      frontend: 'React.js',
      backend: 'Spring Boot',
      database: 'SQL'
    },
    github: 'https://github.com/Karthi220606/private-mail-system',
    category: 'Spring Boot'
  },
  {
    title: 'BUS ROUTE & TIMING INFORMATION SYSTEM',
    description: 'Allows users to search buses using source and destination within Coimbatore city. Displays bus route numbers, stops, and scheduled timings from a database.',
    tools: {
      frontend: 'React Native',
      backend: 'Node.js, Express.js',
      database: 'MongoDB'
    },
    github: 'https://github.com/Karthi220606/travid-bus-route-covai-app',
    category: 'Node'
  },
  {
    title: 'FITNESS WEBSITE',
    description: 'A comprehensive fitness website that includes a BMI Calculator, Calorie Finder, Calorie Tracker, diet plans, Workout Splits, Demo Workout Videos, and a supplementary store.',
    tools: {
      frontend: 'HTML, CSS',
      backend: 'Flask',
      database: 'MongoDB'
    },
    github: 'https://github.com/Karthi220606/Fitness-Website',
    category: 'Flask'
  }
];

const seedData = async () => {
  try {
    await db.connectDB();
    
    console.log('Seeding project data...');
    if (db.isUsingMongo()) {
      const Project = require('../models/Project');
      // Clear existing
      await Project.deleteMany({});
      console.log('Cleared existing projects in MongoDB.');
      
      // Insert new
      await Project.insertMany(projects);
      console.log('Seeded projects into MongoDB.');
      
      // Close mongoose connection after completion
      await mongoose.connection.close();
      console.log('Database connection closed.');
    } else {
      // JSON fallback seeding
      const data = db.readFallbackFile();
      data.projects = projects.map((p, idx) => ({
        _id: (idx + 1).toString(),
        ...p,
        createdAt: new Date().toISOString()
      }));
      db.writeFallbackFile(data);
      console.log('Seeded projects into local JSON fallback file.');
    }
    console.log('Data Seeding Completed Successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
