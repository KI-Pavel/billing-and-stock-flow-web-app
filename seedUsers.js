// File: seedUsers.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import User model from backend
const User = require('./backend/models/User');

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    await User.deleteMany(); // Optional: clears previous users

    await User.create([
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'seller', password: 'seller123', role: 'seller' },
    ]);

    console.log('✅ Users seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err.message);
    process.exit(1);
  }
}

seedUsers();
