#!/bin/bash
# infrastructure/scripts/setup-ssl.sh

# ============================================================
# ✅ سكريبت إعداد SSL مع Let's Encrypt
# ============================================================

echo "🔐 إعداد SSL لمنصة ارتقاء..."

# تثبيت Certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# الحصول على شهادة SSL
certbot --nginx -d portal-a.irteqa.com -d portal-b.irteqa.com

# التجديد التلقائي
echo "0 0 * * * certbot renew --quiet" >> /etc/crontab

echo "✅ تم إعداد SSL بنجاح!"