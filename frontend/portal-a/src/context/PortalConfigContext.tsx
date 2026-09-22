// src/context/PortalConfigContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';

// ============================================================
// ✅ Types
// ============================================================
interface PortalConfigContextType {
  config: any;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  updateConfig: (updates: any) => Promise<any>;
  uploadHeroFile: (file: File, category?: string) => Promise<any>;
  liveStats: any;
}

const PortalConfigContext = createContext<PortalConfigContextType>({
  config: null,
  loading: true,
  error: null,
  refreshConfig: async () => {},
  updateConfig: async () => ({}),
  uploadHeroFile: async () => ({}),
  liveStats: null,
});

export const usePortalConfig = () => useContext(PortalConfigContext);

// ============================================================
// ✅ Helpers
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

const ensureOk = async (res: Response, context: string): Promise<Response> => {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {}
    throw new Error(`${context}: ${message}`);
  }
  return res;
};

// ============================================================
// ✅ Provider
// ============================================================
export const PortalConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveStats, setLiveStats] = useState<any>(null);

  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = resolvePortalId();
  const ENDPOINT = `${API_URL}/appearance/hero`;

  const getHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    'X-Portal-Id': PORTAL_ID,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  // ============================================================
  // ✅ refreshConfig
  // ============================================================
  const refreshConfig = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      console.log('🌐 Fetching config from:', ENDPOINT);

      const [configRes, statsRes] = await Promise.all([
        fetch(`${ENDPOINT}`, { headers: getHeaders() }),
        fetch(`${ENDPOINT}/stats`, { headers: getHeaders() }).catch(() => null),
      ]);

      await ensureOk(configRes, 'Hero config');
      const configData = await configRes.json().catch(() => ({ success: false }));

      if (!mountedRef.current) return;

      if (configData.success) {
        setConfig(configData.data);
        setError(null);
        console.log('✅ Config loaded successfully');
      } else {
        setConfig(null);
        setError(configData.message || 'Failed to load config');
      }

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json().catch(() => ({ success: false }));
        if (statsData.success && mountedRef.current) {
          setLiveStats(statsData.data);
        }
      }
    } catch (err: any) {
      console.error('❌ Config error:', err);
      if (mountedRef.current) {
        setError(err.message || 'Unknown error');
        setConfig(null);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // ============================================================
  // ✅ updateConfig
  // ============================================================
  const updateConfig = async (updates: any) => {
    try {
      const res = await fetch(`${ENDPOINT}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });

      await ensureOk(res, 'Update config');

      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      } else {
        throw new Error(data.message || 'فشل الحفظ');
      }
      return data;
    } catch (err: any) {
      console.error('❌ Update config error:', err);
      throw err;
    }
  };

  // ============================================================
  // ✅ uploadHeroFile
  // ============================================================
  const uploadHeroFile = async (file: File, category: string = 'main') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await fetch(`${ENDPOINT}/upload`, {
        method: 'POST',
        headers: {
          'X-Portal-Id': PORTAL_ID,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      await ensureOk(res, 'Upload file');

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'فشل رفع الملف');
      }
      return data.data;
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      throw err;
    }
  };

  // ============================================================
  // ✅ useEffect — مرة واحدة
  // ============================================================
  useEffect(() => {
    mountedRef.current = true;
    refreshConfig();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PortalConfigContext.Provider
      value={{
        config,
        loading,
        error,
        refreshConfig,
        updateConfig,
        uploadHeroFile,
        liveStats,
      }}
    >
      {children}
    </PortalConfigContext.Provider>
  );
};