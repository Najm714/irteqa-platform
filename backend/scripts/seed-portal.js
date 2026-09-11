// backend/scripts/seed-portal.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Portal } from '../src/models/Portal.model.js';

dotenv.config();

async function createPortal() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const portal = await Portal.findOneAndUpdate(
      { slug: 'portal-a' },
      {
        name: 'البوابة الأكاديمية',
        nameAr: 'البوابة الأكاديمية',
        slug: 'portal-a',
        url: 'http://localhost',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Portal created:', portal);
    console.log('📌 Portal ID:', portal._id);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createPortal();