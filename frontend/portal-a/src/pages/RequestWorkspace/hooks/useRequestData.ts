// src/pages/RequestWorkspace/hooks/useRequestData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import type { Request } from '../types';

// ============================================================
// ✅ Helper: استخراج portalId
// ============================================================
const resolvePortalId = (): string => {
  const envId = import.meta.env.VITE_PORTAL_ID;
  if (envId) return envId;
  const pathMatch = window.location.pathname.match(/\/portal\/([^/]+)/);
  if (pathMatch?.[1]) return pathMatch[1];
  const host = window.location.hostname;
  if (host !== 'localhost' && host.includes('.')) {
    const sub = host.split('.')[0];
    if (sub && sub !== 'www') return sub;
  }
  return '';
};

// ============================================================
// ✅ Hook: useRequestData
// ============================================================
export const useRequestData = (requestId: string | undefined) => {
  const { token } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = resolvePortalId();

  // ============================================================
  // ✅ fetchRequest
  // ============================================================
  const fetchRequest = useCallback(async () => {
    if (!requestId || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/requests/${requestId}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!mountedRef.current) return;

      if (response.status === 404) {
        setError('الطلب غير موجود');
        return;
      }

      if (response.status === 403) {
        setError('ليس لديك صلاحية الوصول لهذا الطلب');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setRequest(data.data);
        setError(null);
      } else {
        setError(data.message || 'حدث خطأ في تحميل الطلب');
      }
    } catch (err: any) {
      console.error('❌ Fetch request error:', err);
      if (mountedRef.current) {
        setError(err.message || 'حدث خطأ في تحميل الطلب');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
      isFetchingRef.current = false;
    }
  }, [requestId, API_URL, PORTAL_ID, token]);

  // ============================================================
  // ✅ useEffect
  // ============================================================
  useEffect(() => {
  console.log('🔄 useRequestData — requestId changed:', requestId);

  // ✅ إعادة تعيين الحالات عند تغيير الطلب
  setRequest(null);
  setError(null);
  isFetchingRef.current = false;

  mountedRef.current = true;
  fetchRequest();

  return () => {
    mountedRef.current = false;
  };
}, [requestId, fetchRequest]);
  return {
    request,
    loading,
    error,
    refresh: fetchRequest,
    setRequest,
    API_URL,
    PORTAL_ID,
    token,
  };
};