import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import ResourceAvailability from '../models/ResourceAvailability.js';
import Department from '../models/Department.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get department requirements for calendar
router.get('/department/:departmentId/requirements', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({
      departmentId: department._id,
      departmentName: department.name,
      requirements: department.requirements
    });
  } catch (error) {
    console.error('Error fetching department requirements:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get availability for a specific date range
router.get('/department/:departmentId/availability', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    const { startDate, endDate } = req.query;

    const query: any = { departmentId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    } else if (startDate) {
      query.date = startDate;
    }

    const availability = await ResourceAvailability.find(query)
      .populate('setBy', 'name email')
      .sort({ date: 1, requirementText: 1 });

    res.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set availability for a specific requirement on a date
router.post('/availability', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      departmentId,
      departmentName,
      requirementId,
      requirementText,
      date,
      isAvailable,
      notes,
      quantity,
      maxCapacity
    } = req.body;

    // Validate required fields
    if (!departmentId || !requirementId || !requirementText || !date) {
      return res.status(400).json({ 
        message: 'Department ID, requirement ID, requirement text, and date are required' 
      });
    }

    // Check if availability already exists for this requirement on this date
    let availability = await ResourceAvailability.findOne({
      departmentId,
      requirementId,
      date
    });

    if (availability) {
      // Update existing availability
      availability.isAvailable = isAvailable !== undefined ? isAvailable : availability.isAvailable;
      availability.notes = notes !== undefined ? notes : availability.notes;
      availability.quantity = quantity !== undefined ? quantity : availability.quantity;
      availability.maxCapacity = maxCapacity !== undefined ? maxCapacity : availability.maxCapacity;
      availability.setBy = req.user!._id as mongoose.Types.ObjectId;
      availability.updatedAt = new Date();
      
      await availability.save();
    } else {
      // Create new availability record
      availability = new ResourceAvailability({
        departmentId,
        departmentName,
        requirementId,
        requirementText,
        date,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        notes: notes || '',
        quantity: quantity || 1,
        maxCapacity: maxCapacity || 1,
        setBy: req.user!._id as mongoose.Types.ObjectId
      });
      
      await availability.save();
    }

    // Populate the setBy field before sending response
    await availability.populate('setBy', 'name email');

    res.json({
      message: 'Availability updated successfully',
      availability
    });
  } catch (error) {
    console.error('Error setting availability:', error);
    
    if ((error as any).code === 11000) {
      return res.status(400).json({ 
        message: 'Availability already exists for this requirement on this date' 
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk set availability for multiple requirements on a date
router.post('/availability/bulk', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      departmentId,
      departmentName,
      date,
      requirements // Array of { requirementId, requirementText, isAvailable, notes, quantity, maxCapacity }
    } = req.body;

    if (!departmentId || !date || !requirements || !Array.isArray(requirements)) {
      return res.status(400).json({ 
        message: 'Department ID, date, and requirements array are required' 
      });
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const req_item of requirements) {
      try {
        let availability = await ResourceAvailability.findOne({
          departmentId,
          requirementId: req_item.requirementId,
          date
        });

        if (availability) {
          // Update existing
          availability.isAvailable = req_item.isAvailable !== undefined ? req_item.isAvailable : availability.isAvailable;
          availability.notes = req_item.notes !== undefined ? req_item.notes : availability.notes;
          availability.quantity = req_item.quantity !== undefined ? req_item.quantity : availability.quantity;
          availability.maxCapacity = req_item.maxCapacity !== undefined ? req_item.maxCapacity : availability.maxCapacity;
          availability.setBy = req.user!._id as mongoose.Types.ObjectId;
          availability.updatedAt = new Date();
          
          await availability.save();
        } else {
          // Create new
          availability = new ResourceAvailability({
            departmentId,
            departmentName,
            requirementId: req_item.requirementId,
            requirementText: req_item.requirementText,
            date,
            isAvailable: req_item.isAvailable !== undefined ? req_item.isAvailable : true,
            notes: req_item.notes || '',
            quantity: req_item.quantity || 1,
            maxCapacity: req_item.maxCapacity || 1,
            setBy: req.user!._id as mongoose.Types.ObjectId
          });
          
          await availability.save();
        }

        await availability.populate('setBy', 'name email');
        results.push(availability);
      } catch (error) {
        errors.push({
          requirementId: req_item.requirementId,
          error: (error as Error).message
        });
      }
    }

    res.json({
      message: 'Bulk availability update completed',
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Error in bulk availability update:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete availability for a specific requirement on a date
router.delete('/availability/:departmentId/:requirementId/:date', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { departmentId, requirementId, date } = req.params;

    const availability = await ResourceAvailability.findOneAndDelete({
      departmentId,
      requirementId,
      date
    });

    if (!availability) {
      return res.status(404).json({ message: 'Availability record not found' });
    }

    res.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get availability summary for a department
router.get('/department/:departmentId/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    const { month, year } = req.query;

    let dateFilter: any = {};
    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      dateFilter = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }

    const summary = await ResourceAvailability.aggregate([
      {
        $match: {
          departmentId: new mongoose.Types.ObjectId(departmentId),
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            requirementId: '$requirementId',
            requirementText: '$requirementText'
          },
          totalDays: { $sum: 1 },
          availableDays: {
            $sum: { $cond: ['$isAvailable', 1, 0] }
          },
          unavailableDays: {
            $sum: { $cond: ['$isAvailable', 0, 1] }
          }
        }
      },
      {
        $project: {
          requirementId: '$_id.requirementId',
          requirementText: '$_id.requirementText',
          totalDays: 1,
          availableDays: 1,
          unavailableDays: 1,
          availabilityRate: {
            $multiply: [
              { $divide: ['$availableDays', '$totalDays'] },
              100
            ]
          }
        }
      }
    ]);

    res.json(summary);
  } catch (error) {
    console.error('Error fetching availability summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cleanup function to delete past resource availability records
export const cleanupPastResourceAvailabilities = async () => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`🧹 Starting cleanup of resource availabilities before ${todayStr}`);
    
    // Delete all resource availability records with dates before today
    const result = await ResourceAvailability.deleteMany({
      date: { $lt: todayStr }
    });
    
    console.log(`✅ Cleanup completed: Deleted ${result.deletedCount} past resource availability records`);
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} past resource availability records`
    };
  } catch (error) {
    console.error('❌ Error during resource availability cleanup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to cleanup past resource availabilities'
    };
  }
};

// Manual cleanup endpoint (for testing or manual triggers)
router.post('/cleanup-past', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await cleanupPastResourceAvailabilities();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        deletedCount: result.deletedCount
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in manual resource cleanup endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute resource cleanup',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
