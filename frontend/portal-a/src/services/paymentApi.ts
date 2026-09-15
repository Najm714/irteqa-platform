// frontend/portal-a/src/services/paymentApi.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

export interface PaymentData {
  portalId: string;
  accountId: string;
  requestId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  reference: string;
  proof?: string;
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'refunded';
}

export interface PaymentResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export const paymentApi = {
  // إنشاء سجل دفع
  createPayment: async (token: string, data: PaymentData): Promise<PaymentResponse> => {
    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  // الحصول على حالة الدفع
  getPaymentStatus: async (token: string, paymentId: string): Promise<PaymentResponse> => {
    try {
      const response = await fetch(`${API_URL}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  // رفع إثبات الدفع
  uploadProof: async (token: string, paymentId: string, file: File): Promise<PaymentResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('paymentId', paymentId);
      formData.append('portalId', PORTAL_ID);

      const response = await fetch(`${API_URL}/payments/${paymentId}/proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  // التحقق من الدفع (للمدير)
  verifyPayment: async (token: string, paymentId: string, status: 'verified' | 'rejected'): Promise<PaymentResponse> => {
    try {
      const response = await fetch(`${API_URL}/payments/${paymentId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ status }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  // استرجاع المبلغ (Refund)
  refundPayment: async (token: string, paymentId: string): Promise<PaymentResponse> => {
    try {
      const response = await fetch(`${API_URL}/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  // الحصول على سجل المدفوعات
  getPayments: async (token: string, params?: { status?: string; from?: string; to?: string }): Promise<PaymentResponse> => {
    try {
      const query = new URLSearchParams(params as any).toString();
      const url = `${API_URL}/payments${query ? `?${query}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
};