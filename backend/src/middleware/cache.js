// backend/src/middleware/cache.js
const cache = new Map();
const DEFAULT_TTL = 60 * 1000; // 60 ثانية

export const cacheMiddleware = (ttl = DEFAULT_TTL) => {
  return (req, res, next) => {
    // ✅ فقط GET requests
    if (req.method !== 'GET') return next();

    const accountId = req.accountId || 'anon';
    const portalId = req.portalId || 'no-portal';
    const key = `${portalId}:${accountId}:${req.originalUrl}`;

    const cached = cache.get(key);
    if (cached && Date.now() - cached.time < ttl) {
      console.log('⚡ Cache HIT:', req.originalUrl);
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // ✅ اعتراض res.json
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (data?.success !== false && res.statusCode < 400) {
        cache.set(key, { data, time: Date.now() });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
};

// ✅ مسح cache المستخدم
export const invalidateCache = (accountId, portalId) => {
  for (const key of cache.keys()) {
    if (key.startsWith(`${portalId}:${accountId}:`)) {
      cache.delete(key);
    }
  }
  console.log(`🗑️  Invalidated cache for user ${accountId}`);
};

// ✅ مسح cache كل المستخدمين للبوابة
export const invalidatePortalCache = (portalId) => {
  for (const key of cache.keys()) {
    if (key.startsWith(`${portalId}:`)) {
      cache.delete(key);
    }
  }
  console.log(`🗑️  Invalidated portal cache ${portalId}`);
};

// ✅ عرض إحصائيات Cache
export const getCacheStats = () => ({
  size: cache.size,
  keys: Array.from(cache.keys()),
});

// ✅ تنظيف دوري (كل 5 دقائق)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, value] of cache.entries()) {
    if (now - value.time > 10 * 60 * 1000) { // أقدم من 10 دقائق
      cache.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} stale cache entries`);
  }
}, 5 * 60 * 1000);