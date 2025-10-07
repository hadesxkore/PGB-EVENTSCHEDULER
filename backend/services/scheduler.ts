import cron from 'node-cron';
import { cleanupPastLocationAvailabilities } from '../routes/locationAvailability';
import { cleanupPastResourceAvailabilities } from '../routes/resourceAvailability';

// Schedule cleanup to run daily at midnight (00:00)
export const startScheduler = () => {
  console.log('🕐 Starting automated scheduler...');
  
  // Run cleanup daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('🕐 Running scheduled cleanup at midnight...');
    console.log('🧹 Cleaning up past location availabilities...');
    await cleanupPastLocationAvailabilities();
    console.log('🧹 Cleaning up past resource availabilities...');
    await cleanupPastResourceAvailabilities();
    console.log('✅ All cleanup tasks completed!');
  }, {
    scheduled: true,
    timezone: "Asia/Manila" // Adjust timezone as needed
  });
  
  // Optional: Run cleanup every hour for testing (comment out in production)
  // cron.schedule('0 * * * *', async () => {
  //   console.log('🕐 Running hourly cleanup (testing)...');
  //   await cleanupPastLocationAvailabilities();
  // });
  
  console.log('✅ Scheduler started successfully');
  console.log('📅 Daily cleanup scheduled for midnight (00:00)');
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
