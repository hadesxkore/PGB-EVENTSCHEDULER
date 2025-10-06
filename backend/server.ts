import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import eventRoutes from './routes/events.js';
import userRoutes from './routes/users.js';
import departmentRoutes from './routes/departments.js';
import resourceAvailabilityRoutes from './routes/resourceAvailability.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '.env');
console.log('🔍 Looking for .env file at:', envPath);
const result = dotenv.config({ path: envPath, debug: true });
console.log('📋 Environment variables loaded:', Object.keys(process.env).filter(key => 
  ['MONGODB_URI', 'PORT', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'NODE_ENV'].includes(key)
));

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/resource-availability', resourceAvailabilityRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PGB Event Scheduler API is running!',
    timestamp: new Date().toISOString()
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔄 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log('🚀 PGB Event Scheduler Backend Server Started!');
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📅 Events API: http://localhost:${PORT}/api/events`);
      console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
      console.log(`🏢 Departments API: http://localhost:${PORT}/api/departments`);
      console.log('─'.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
