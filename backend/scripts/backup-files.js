// backend/scripts/backup-files.js
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const BACKUP_DIR = path.join(__dirname, '../backups/files');

// ✅ التأكد من وجود المجلدات
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * نسخ الملفات الاحتياطية
 */
async function backupFiles() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `files-backup-${timestamp}.tar.gz`);
    
    console.log(`📦 Creating files backup...`);
    
    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log('⚠️ Uploads directory not found, creating empty backup');
      fs.writeFileSync(backupFile, '');
      return backupFile;
    }
    
    // استخدام tar لضغط الملفات
    const command = `tar -czf "${backupFile}" -C "${path.dirname(UPLOADS_DIR)}" "${path.basename(UPLOADS_DIR)}"`;
    
    await execAsync(command);
    
    console.log(`✅ Files backup created: ${backupFile}`);
    console.log(`📁 Size: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Files backup failed:', error.message);
    throw error;
  }
}

/**
 * استعادة الملفات من نسخة احتياطية
 */
async function restoreFiles(backupFile) {
  try {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    console.log(`🔄 Restoring files from: ${backupFile}`);
    
    // استعادة الملفات
    const command = `tar -xzf "${backupFile}" -C "${path.dirname(UPLOADS_DIR)}"`;
    
    await execAsync(command);
    
    console.log(`✅ Files restored successfully from: ${backupFile}`);
    return true;
  } catch (error) {
    console.error('❌ Files restore failed:', error.message);
    throw error;
  }
}

// تشغيل السكريبت من سطر الأوامر
const command = process.argv[2];
const args = process.argv.slice(3);

(async () => {
  try {
    switch (command) {
      case 'backup':
        await backupFiles();
        break;
        
      case 'restore':
        if (args.length === 0) {
          console.log('Usage: node scripts/backup-files.js restore <backup-file>');
          process.exit(1);
        }
        await restoreFiles(args[0]);
        break;
        
      default:
        console.log(`
Usage: node scripts/backup-files.js <command>

Commands:
  backup              Create a new files backup
  restore <file>      Restore from backup file

Examples:
  node scripts/backup-files.js backup
  node scripts/backup-files.js restore ./backups/files/files-backup-2024-01-01.tar.gz
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

export { backupFiles, restoreFiles };