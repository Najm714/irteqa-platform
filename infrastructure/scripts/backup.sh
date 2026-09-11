#!/bin/bash
# infrastructure/scripts/backup.sh

# ============================================================
# ✅ سكريبت النسخ الاحتياطي
# ============================================================

BACKUP_DIR="/var/backups/irteqa"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

echo "📦 إنشاء نسخة احتياطية..."

# 1. نسخ قاعدة البيانات
mongodump --uri="$MONGODB_URI" --gzip --archive="$BACKUP_DIR/db-$DATE.gz"

# 2. نسخ الملفات
tar -czf "$BACKUP_DIR/files-$DATE.tar.gz" /var/www/irteqa/uploads/

# 3. حذف النسخ القديمة (أكثر من 30 يوم)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ تم إنشاء النسخة الاحتياطية بنجاح!"