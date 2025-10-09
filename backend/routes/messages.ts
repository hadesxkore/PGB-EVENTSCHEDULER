import express, { Request, Response } from 'express';
import Message, { IMessage } from '../models/Message.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/messages/conversation/:eventId/:userId - Get messages between current user and another user for specific event
router.get('/conversation/:eventId/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { eventId, userId } = req.params;
    const currentUserId = (req.user as any)?._id;
    const { page = 1, limit = 50 } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!eventId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and User ID are required'
      });
    }

    // Find messages between current user and target user for specific event
    const messages = await Message.find({
      eventId,
      isDeleted: false,
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    })
    .populate('senderId', 'email department')
    .populate('receiverId', 'email department')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limitNum);

    // Mark messages as read (where current user is receiver)
    const updatedMessages = await Message.updateMany({
      eventId,
      senderId: userId,
      receiverId: currentUserId,
      isRead: false,
      isDeleted: false
    }, {
      isRead: true
    });

    // Emit read status update to sender if messages were marked as read
    if (updatedMessages.modifiedCount > 0) {
      const io = (req as any).app.get('io');
      if (io) {
        // Notify sender that their messages have been read
        io.to(`user-${userId}`).emit('messages-read', {
          eventId,
          readerId: currentUserId,
          conversationId: `${eventId}-${currentUserId}`
        });
        console.log(`👀 Notified user ${userId} that messages were seen by ${currentUserId}`);
      }
    }

    // Get total count for pagination
    const total = await Message.countDocuments({
      eventId,
      isDeleted: false,
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    });

    res.status(200).json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/messages/send - Send a new message
router.post('/send', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { eventId, receiverId, content, messageType = 'text' } = req.body;
    const senderId = (req.user as any)?._id;

    if (!eventId || !receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Event ID, receiver ID, and content are required'
      });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 2000 characters'
      });
    }

    // Create new message
    const newMessage: IMessage = new Message({
      eventId,
      senderId,
      receiverId,
      content: content.trim(),
      messageType,
      timestamp: new Date(),
      isRead: false
    });

    const savedMessage = await newMessage.save();
    
    // Populate sender and receiver info
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('senderId', 'email department')
      .populate('receiverId', 'email department');

    console.log(`📨 Message sent from ${(req.user as any)?.email} to receiver ${receiverId} for event ${eventId}`);

    // Emit real-time message to receiver
    const io = (req as any).app.get('io');
    if (io) {
      // Send to receiver's personal room
      io.to(`user-${receiverId}`).emit('new-message', {
        message: populatedMessage,
        conversationId: `${eventId}-${senderId}`
      });
      
      // Send to conversation room (if both users are in the same conversation)
      io.to(`conversation-${eventId}-${senderId}-${receiverId}`).emit('new-message', {
        message: populatedMessage,
        conversationId: `${eventId}-${senderId}`
      });
      
      console.log(`🔔 Real-time message sent to user-${receiverId}`);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/messages/unread-count/:eventId/:userId - Get unread message count
router.get('/unread-count/:eventId/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { eventId, userId } = req.params;
    const currentUserId = (req.user as any)?._id;

    const unreadCount = await Message.countDocuments({
      eventId,
      senderId: userId,
      receiverId: currentUserId,
      isRead: false,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/messages/:messageId/read - Mark message as read
router.put('/:messageId/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const currentUserId = (req.user as any)?._id;

    const message = await Message.findOneAndUpdate({
      _id: messageId,
      receiverId: currentUserId,
      isDeleted: false
    }, {
      isRead: true
    }, { new: true });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you are not authorized to mark it as read'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/messages/:messageId - Delete message (soft delete)
router.delete('/:messageId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const currentUserId = (req.user as any)?._id;

    const message = await Message.findOneAndUpdate({
      _id: messageId,
      senderId: currentUserId,
      isDeleted: false
    }, {
      isDeleted: true,
      deletedAt: new Date()
    }, { new: true });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you are not authorized to delete it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
