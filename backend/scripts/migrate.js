import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { config } from '../src/config/env.js';

dotenv.config();

const runMigration = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Add migration logic here
    // Example: Add new fields, update existing documents, etc.

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

runMigration();