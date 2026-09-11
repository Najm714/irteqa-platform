// backend/src/scripts/drop-index.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/irteqa';

const dropIndex = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const collections = await db.collections();
    
    // البحث عن Collection videos
    const videosCollection = collections.find(c => c.collectionName === 'videos');
    
    if (!videosCollection) {
      console.log('❌ Collection "videos" not found');
      process.exit(1);
    }
    
    // الحصول على جميع الفهارس
    const indexes = await videosCollection.indexes();
    console.log('📊 Current indexes:', indexes.map(i => i.name));
    
    // البحث عن الفهرس streamUid_1
    const hasStreamUidIndex = indexes.some(idx => idx.name === 'streamUid_1');
    
    if (hasStreamUidIndex) {
      await videosCollection.dropIndex('streamUid_1');
      console.log('✅ Index streamUid_1 dropped successfully');
    } else {
      console.log('ℹ️ Index streamUid_1 not found - no action needed');
    }
    
    // عرض الفهارس المتبقية
    const updatedIndexes = await videosCollection.indexes();
    console.log('📊 Updated indexes:', updatedIndexes.map(i => i.name));
    
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

dropIndex();