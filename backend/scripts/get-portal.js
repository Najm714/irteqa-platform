// backend/scripts/get-portal.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Portal } from '../src/models/Portal.model.js';

dotenv.config();

async function getPortal() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const portals = await Portal.find({ isActive: true });
    
    if (portals.length === 0) {
      console.log('❌ No portals found. Creating one...');
      
      // إنشاء بوابة جديدة
      const portal = await Portal.create({
        name: 'البوابة الأكاديمية',
        nameAr: 'البوابة الأكاديمية',
        slug: 'portal-a',
        url: 'http://localhost',
        isActive: true,
      });
      
      console.log('✅ Portal created:');
      console.log('📌 Portal ID:', portal._id);
      console.log('📌 Slug:', portal.slug);
    } else {
      console.log('✅ Found portals:');
      portals.forEach((portal, index) => {
        console.log(`\n${index + 1}.`);
        console.log(`   📌 Portal ID: ${portal._id}`);
        console.log(`   📌 Name: ${portal.name || portal.nameAr}`);
        console.log(`   📌 Slug: ${portal.slug}`);
        console.log(`   📌 URL: ${portal.url}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

getPortal();