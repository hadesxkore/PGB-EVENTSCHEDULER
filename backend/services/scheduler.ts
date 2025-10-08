import cron from 'node-cron';
import { cleanupPastLocationAvailabilities } from '../routes/locationAvailability.js';
import { cleanupPastResourceAvailabilities } from '../routes/resourceAvailability.js';

// Schedule cleanup to run daily at midnight (00:00)
export const startScheduler = () => {
  console.log('🕐 Starting automated scheduler...');
  
  // Get current time for logging
  const now = new Date();
  const currentTime = now.toLocaleString('en-PH', { 
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  console.log(`🕐 Current time (Asia/Manila): ${currentTime}`);
  
  // Run cleanup daily at midnight
  cron.schedule('0 0 * * *', async () => {
    const scheduleTime = new Date().toLocaleString('en-PH', { 
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    console.log(`🕐 Running scheduled cleanup at: ${scheduleTime}`);
    console.log('🧹 Cleaning up past location availabilities...');
    const locationResult = await cleanupPastLocationAvailabilities();
    console.log(`📍 Location cleanup result: ${JSON.stringify(locationResult)}`);
    
    console.log('🧹 Cleaning up past resource availabilities...');
    const resourceResult = await cleanupPastResourceAvailabilities();
    console.log(`📦 Resource cleanup result: ${JSON.stringify(resourceResult)}`);
    
    console.log('✅ All cleanup tasks completed!');
  }, {
    scheduled: true,
    timezone: "Asia/Manila"
  });
  
  // Optional: Run cleanup every 5 minutes for testing (uncomment for testing)
  // cron.schedule('*/5 * * * *', async () => {
  //   const testTime = new Date().toLocaleString('en-PH', { 
  //     timeZone: 'Asia/Manila',
  //     hour: '2-digit',
  //     minute: '2-digit',
  //     second: '2-digit'
  //   });
  //   console.log(`🧪 Running test cleanup at: ${testTime}`);
  //   const result = await cleanupPastLocationAvailabilities();
  //   console.log(`🧪 Test cleanup result: Deleted ${result.deletedCount} records`);
  // }, {
  //   scheduled: true,
  //   timezone: "Asia/Manila"
  // });
  
  console.log('✅ Scheduler started successfully');
  console.log('📅 Daily cleanup scheduled for midnight (00:00) Asia/Manila');
  console.log('🔧 Manual cleanup available at: POST /api/cleanup-now');
};

// Function to run cleanup immediately (for testing)
export const runCleanupNow = async () => {
  console.log('🧹 Running immediate cleanup...');
  console.log('🧹 Cleaning up past location availabilities...');
  const locationResult = await cleanupPastLocationAvailabilities();
  console.log('🧹 Cleaning up past resource availabilities...');
  const resourceResult = await cleanupPastResourceAvailabilities();
  
  return {
    success: locationResult.success && resourceResult.success,
    locationAvailabilities: locationResult,
    resourceAvailabilities: resourceResult,
    totalDeleted: (locationResult.deletedCount || 0) + (resourceResult.deletedCount || 0)
  };
};
