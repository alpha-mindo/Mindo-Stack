// One-time script to make a user an admin
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const makeAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindo-stack');
    console.log('Connected to MongoDB');

    // Update the user - change the email to match yours
    const result = await User.updateOne(
      { username: 'Mindo' }, // or use email: 'vnmmindo@gmail.com'
      { $set: { isAdmin: true } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ User successfully made admin!');
      const user = await User.findOne({ username: 'Mindo' });
      console.log('User details:', {
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      });
    } else if (result.matchedCount > 0) {
      console.log('⚠️ User already is an admin');
    } else {
      console.log('❌ User not found');
    }

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

makeAdmin();
