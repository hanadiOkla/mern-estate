import mongoose from 'mongoose';
import Listing from '../models/listing.model.js';

// 💡 ضعي رابط المونجو الخاص بكِ مباشرة هنا بين التنصيص
const MONGO_URI ="mongodb+srv://enghanadiokla_db_user:Uaa0jR1JTqAJhKxB@mern-estate.w0ywtmo.mongodb.net/?appName=mern-estate"

const updateExistingListings = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for update script...');

    const result = await Listing.updateMany(
      { status: { $exists: false } },
      { 
        $set: { 
          status: 'active', 
          isApproved: true 
        } 
      }
    );

    console.log(`✅ Success! Updated ${result.modifiedCount} listings.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating listings:', error.message);
    process.exit(1);
  }
};

updateExistingListings();