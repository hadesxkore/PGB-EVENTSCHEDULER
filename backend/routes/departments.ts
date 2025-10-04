import express, { Request, Response } from 'express';
import Department, { IDepartment } from '../models/Department.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/departments - Get all departments (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search = '', visible } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const query: any = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    if (visible !== undefined) {
      query.isVisible = visible === 'true';
    }

    // Get departments with pagination
    const departments = await Department.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Department.countDocuments(query);

    res.status(200).json({
      success: true,
      data: departments,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/departments - Create new department (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, requirements, isVisible = true } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    // Check if department already exists
    const existingDepartment = await Department.findOne({
      name: name.toUpperCase().trim()
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department already exists'
      });
    }

    // Create new department
    const newDepartment: IDepartment = new Department({
      name: name.toUpperCase().trim(),
      requirements: requirements || '',
      isVisible
    });

    const savedDepartment = await newDepartment.save();

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: savedDepartment
    });
  } catch (error) {
    console.error('Error creating department:', error);
    
    // Handle mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }

    // Handle duplicate key errors
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Department already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/departments/:id/requirements - Get department requirements (Admin only)
router.get('/:id/requirements', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department.requirements
    });
  } catch (error) {
    console.error('Error fetching department requirements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department requirements',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/departments/:id/requirements - Add new requirement (Admin only)
router.post('/:id/requirements', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { requirement } = req.body;

    if (!requirement || !requirement.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Requirement text is required'
      });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Add new requirement
    const newRequirement = {
      text: requirement.trim(),
      createdAt: new Date()
    };

    department.requirements.push(newRequirement as any);
    await department.save();

    // Get the added requirement with its ID
    const addedRequirement = department.requirements[department.requirements.length - 1];

    res.status(201).json({
      success: true,
      message: 'Requirement added successfully',
      data: {
        id: addedRequirement._id,
        text: addedRequirement.text,
        createdAt: addedRequirement.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding department requirement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add requirement',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/departments/:id/requirements/:requirementId - Delete requirement (Admin only)
router.delete('/:id/requirements/:requirementId', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, requirementId } = req.params;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Remove requirement
    const initialLength = department.requirements.length;
    department.requirements = department.requirements.filter(
      req => req._id?.toString() !== requirementId
    );

    if (department.requirements.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found'
      });
    }

    await department.save();

    res.status(200).json({
      success: true,
      message: 'Requirement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department requirement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete requirement',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/departments/:id/visibility - Toggle department visibility (Admin only)
router.put('/:id/visibility', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isVisible } = req.body;

    if (typeof isVisible !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isVisible must be a boolean value'
      });
    }

    const department = await Department.findByIdAndUpdate(
      id,
      { isVisible },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Department visibility updated successfully',
      data: department
    });
  } catch (error) {
    console.error('Error updating department visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department visibility',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/departments/:id - Delete department (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const department = await Department.findByIdAndDelete(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/departments/sync - Sync departments from frontend (Admin only)
router.post('/sync', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { departments } = req.body;

    if (!departments || !Array.isArray(departments)) {
      return res.status(400).json({
        success: false,
        message: 'Departments array is required'
      });
    }

    const syncedDepartments = [];

    for (const dept of departments) {
      // Check if department already exists
      let existingDept = await Department.findOne({ name: dept.name.toUpperCase() });
      
      if (!existingDept) {
        // Create new department
        existingDept = new Department({
          name: dept.name.toUpperCase(),
          requirements: [],
          isVisible: dept.isVisible !== false
        });
        await existingDept.save();
      }
      
      syncedDepartments.push({
        id: (existingDept._id as any).toString(),
        name: existingDept.name,
        isVisible: existingDept.isVisible,
        createdAt: existingDept.createdAt,
        userCount: 0, // This would come from user collection count
        requirements: existingDept.requirements
      });
    }

    res.status(200).json({
      success: true,
      message: 'Departments synced successfully',
      data: syncedDepartments
    });
  } catch (error) {
    console.error('Error syncing departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync departments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/departments/visible - Get visible departments (Public)
router.get('/visible', async (req: Request, res: Response) => {
  try {
    const departments = await Department.find({ isVisible: true })
      .select('_id name requirements isVisible')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error fetching visible departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
