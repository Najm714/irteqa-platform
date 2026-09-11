// frontend/portal-a/src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '6a8e3dab1175e7015f452904';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Portal-Id': PORTAL_ID, // ✅ إضافة portalId إلى كل طلب
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};