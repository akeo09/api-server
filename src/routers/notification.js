const express = require('express')
const auth = require('../middleware/auth')

const User = require('../models/user');
const Notification = require('../models/notification');

const router = express.Router()
const mongoose = require('mongoose') 

router.post('/notification', auth, async (req, res) => {
    try {
        const { receiver, subject, body, notification_type, studygroup_id } = req.body;

        if (!receiver || typeof receiver !== 'string') {
            return res.status(400).json({ error: 'Receiver ID is missing or invalid'})
        }

        const sender = req.user._id;
        const notification = new Notification({
            sender,
            receiver,
            subject,
            body,
            notification_type,
            studygroup_id
        });

        await notification.save();
        await User.findByIdAndUpdate(receiver, { $push: { notifications: notification._id } });

        res.status(201).json(notification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/notifications', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ receiver: req.user._id }).populate('sender', 'username');

        res.status(200).json(notifications);
    } catch(e) {
        console.error('Error fetching notifications: ', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

module.exports = router;