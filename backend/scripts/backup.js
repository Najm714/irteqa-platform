// backend/scripts/backup.js
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(__dirname, '../backups');

// ✅ التأكد من وجود مجلد النسخ الاحتياطي
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * إنشاء نسخة احتياطية من قاعدة البيانات
 */
async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `mongodb-backup-${timestamp}.gz`);
    
    console.log(`📦 Creating database backup...`);
    
    // الحصول على URI من المتغيرات البيئية
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment');
    }
    
    // استخراج اسم قاعدة البيانات من URI
    const dbName = uri.split('/').pop().split('?')[0];
    
    // استخدام mongodump لإنشاء النسخة الاحتياطية
    const command = `mongodump --uri="${uri}" --gzip --archive="${backupFile}"`;
    
    await execAsync(command);
    
    console.log(`✅ Database backup created: ${backupFile}`);
    console.log(`📊 Database: ${dbName}`);
    console.log(`📁 Size: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

/**
 * استعادة قاعدة البيانات من نسخة احتياطية
 */
async function restoreDatabase(backupFile) {
  try {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    console.log(`🔄 Restoring database from: ${backupFile}`);
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment');
    }
    
    // استعادة من ملف النسخة الاحتياطية
    const command = `mongorestore --uri="${uri}" --gzip --archive="${backupFile}" --drop`;
    
    await execAsync(command);
    
    console.log(`✅ Database restored successfully from: ${backupFile}`);
    return true;
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
}

/**
 * قائمة جميع النسخ الاحتياطية
 */
function listBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.gz'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      size: fs.statSync(path.join(BACKUP_DIR, f)).size,
      created: fs.statSync(path.join(BACKUP_DIR, f)).mtime,
    }))
    .sort((a, b) => b.created - a.created);
  
  console.log('\n📋 Available backups:');
  console.log('─'.repeat(60));
  
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}`);
    console.log(`   📁 Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📅 Created: ${file.created.toLocaleString()}`);
    console.log('');
  });
  
  return files;
}

/**
 * حذف النسخ الاحتياطية القديمة (أكثر من N أيام)
 */
async function cleanOldBackups(daysToKeep = 7) {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.gz'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime,
      }));
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);
    
    let deleted = 0;
    for (const file of files) {
      if (file.mtime < cutoff) {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Deleted old backup: ${file.name}`);
        deleted++;
      }
    }
    
    console.log(`✅ Cleaned up ${deleted} old backups (kept last ${daysToKeep} days)`);
    return deleted;
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  }
}

// ============================================================
// تشغيل السكريبت من سطر الأوامر
// ============================================================

const command = process.argv[2];
const args = process.argv.slice(3);

(async () => {
  try {
    switch (command) {
      case 'backup':
        await backupDatabase();
        break;
        
      case 'restore':
        if (args.length === 0) {
          console.log('Usage: node scripts/backup.js restore <backup-file>');
          console.log('Or: node scripts/backup.js restore --latest');
          process.exit(1);
        }
        
        if (args[0] === '--latest') {
          const backups = listBackups();
          if (backups.length === 0) {
            console.log('❌ No backups found');
            process.exit(1);
          }
          await restoreDatabase(backups[0].path);
        } else {
          await restoreDatabase(args[0]);
        }
        break;
        
      case 'list':
        listBackups();
        break;
        
      case 'clean':
        const days = parseInt(args[0]) || 7;
        await cleanOldBackups(days);
        break;
        
      default:
        console.log(`
Usage: node scripts/backup.js <command>

Commands:
  backup              Create a new backup
  restore <file>      Restore from backup file
  restore --latest    Restore from latest backup
  list                List all backups
  clean [days]        Delete backups older than N days (default: 7)

Examples:
  node scripts/backup.js backup
  node scripts/backup.js restore ./backups/mongodb-backup-2024-01-01.gz
  node scripts/backup.js restore --latest
  node scripts/backup.js list
  node scripts/backup.js clean 14
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

export { backupDatabase, restoreDatabase, listBackups, cleanOldBackups };