const mongoose = require('mongoose') 
const Schema = mongoose.Schema

const notificationSchema = new Schema({
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    studygroup_id: {
      type: Schema.Types.ObjectId,
      ref: 'StudyGroup',
    },
    subject: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    notification_type: {
      type: String,
      required: true
    }
  })

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;