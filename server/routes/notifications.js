const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Notification = require('../models/Notification');

// Get all notifications for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, skip = 0, unreadOnly = false } = req.query;
    
    const query = { recipient: req.userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .populate('relatedClub', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.userId, 
      isRead: false 
    });
    
    res.json({
      notifications,
      totalCount,
      unreadCount,
      hasMore: totalCount > (parseInt(skip) + notifications.length)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Get unread count only
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.userId, 
      isRead: false 
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      recipient: req.userId
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await notification.markAsRead();
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.userId);
    res.json({ 
      message: 'All notifications marked as read', 
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error marking all as read', error: error.message });
  }
});

// Delete a notification
router.delete('/:notificationId', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      recipient: req.userId
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
});

// Delete all read notifications
router.delete('/cleanup/read', authMiddleware, async (req, res) => {
  try {
    const { daysOld = 7 } = req.query;
    const result = await Notification.cleanupOldNotifications(req.userId, parseInt(daysOld));
    res.json({ 
      message: `Deleted ${result.deletedCount} old read notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cleaning up notifications', error: error.message });
  }
});

// Create a test notification (for development)
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.createNotification({
      recipient: req.userId,
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working',
      priority: 'normal'
    });
    
    res.status(201).json({ message: 'Test notification created', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error creating test notification', error: error.message });
  }
});

module.exports = router;
