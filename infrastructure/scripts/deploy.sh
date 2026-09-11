#!/bin/bash
# infrastructure/scripts/deploy.sh

# ============================================================
# ✅ سكريبت النشر للإنتاج
# ============================================================

echo "🚀 بدء نشر منصة ارتقاء..."

# 1. سحب أحدث الكود
echo "📥 سحب أحدث الكود من GitHub..."
git pull origin main

# 2. تثبيت الاعتماديات
echo "📦 تثبيت الاعتماديات..."
cd backend
npm install --production
cd ..

# 3. بناء Frontend
echo "🏗️ بناء Frontend..."
cd frontend/portal-a
npm run build
cd ../..

# 4. نسخ الملفات إلى Nginx
echo "📁 نسخ الملفات إلى Nginx..."
cp -r frontend/portal-a/dist/* /var/www/irteqa/frontend/portal-a/

# 5. إعادة تشغيل Backend
echo "🔄 إعادة تشغيل Backend..."
pm2 restart irteqa-backend

# 6. إعادة تحميل Nginx
echo "🔄 إعادة تحميل Nginx..."
nginx -s reload

echo "✅ تم النشر بنجاح!"