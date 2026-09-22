// src/context/PortalConfigContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

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

export const PortalConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveStats, setLiveStats] = useState<any>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-Portal-Id': PORTAL_ID,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const refreshConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const [configRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/appearance/hero`, { headers: getHeaders() }),
        fetch(`${API_URL}/appearance/hero/stats`, { headers: getHeaders() }),
      ]);

      const configData = await configRes.json();
      const statsData = await statsRes.json();

      if (configData.success) setConfig(configData.data);
      if (statsData.success) setLiveStats(statsData.data);
    } catch (err: any) {
      console.error('❌ Config error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: any) => {
    try {
      const res = await fetch(`${API_URL}/appearance/hero`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      }
      return data;
    } catch (err: any) {
      console.error('❌ Update config error:', err);
      throw err;
    }
  };

  // ✅ ✅ ✅ رفع ملف Hero (صورة/فيديو)
  const uploadHeroFile = async (file: File, category: string = 'main') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await fetch(`${API_URL}/appearance/hero/upload`, {
        method: 'POST',
        headers: {
          'X-Portal-Id': PORTAL_ID,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // ⚠️ لا تضع Content-Type — fetch يضعه تلقائياً مع FormData
        },
        body: formData,
      });

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

  useEffect(() => {
    refreshConfig();
  }, [PORTAL_ID, token]);

  return (
    <PortalConfigContext.Provider value={{
      config,
      loading,
      error,
      refreshConfig,
      updateConfig,
      uploadHeroFile,
      liveStats,
    }}>
      {children}
    </PortalConfigContext.Provider>
  );
};