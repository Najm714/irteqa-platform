// src/services/fetchInterceptor.ts
// ============================================================
// اعتراض جميع طلبات fetch وإضافة X-Portal-Id تلقائياً
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '6aa7b3f5a30172dea41091e0';

const originalFetch = window.fetch;

window.fetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  // طبق فقط على طلبات الـ API الخاصة بنا
  if (url.startsWith(API_URL) || url.includes('/api/')) {
    const token = localStorage.getItem('token');

    const newHeaders = new Headers(init?.headers);

    // أضف X-Portal-Id إذا لم يكن موجوداً
    if (!newHeaders.has('X-Portal-Id')) {
      newHeaders.set('X-Portal-Id', PORTAL_ID);
    }

    // أضف Authorization إذا لم يكن موجوداً
    if (token && !newHeaders.has('Authorization')) {
      newHeaders.set('Authorization', `Bearer ${token}`);
    }

    // لا تضع Content-Type يدوياً مع FormData
    // لأن المتصفح يجب أن يضيف:
    // multipart/form-data; boundary=...
    const isFormData = init?.body instanceof FormData;

    if (
      !isFormData &&
      !newHeaders.has('Content-Type') &&
      init?.body
    ) {
      newHeaders.set('Content-Type', 'application/json');
    }

    init = {
      ...init,
      headers: newHeaders,
    };
  }

  return originalFetch(input, init);
};

console.log(
  '✅ Fetch interceptor installed - X-Portal-Id:',
  PORTAL_ID
);