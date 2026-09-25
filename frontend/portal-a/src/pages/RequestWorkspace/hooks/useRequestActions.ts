// src/pages/RequestWorkspace/hooks/useRequestActions.ts
import { useCallback } from 'react';
import type { Toast } from '../types';

// ============================================================
// ✅ Types
// ============================================================
interface UseRequestActionsOptions {
  requestId: string | undefined;
  API_URL: string;
  PORTAL_ID: string;
  token: string | null;
  showToast: (type: Toast['type'], message: string) => void;
  onRefresh: () => Promise<void>;
  onError?: (error: string) => void;
}

// ============================================================
// ✅ Hook
// ============================================================
export const useRequestActions = ({
  requestId,
  API_URL,
  PORTAL_ID,
  token,
  showToast,
  onRefresh,
  onError,
}: UseRequestActionsOptions) => {
  // ============================================================
  // ✅ Headers
  // ============================================================
  const getHeaders = useCallback(
    (includeJson: boolean = true): Record<string, string> => ({
      ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
      'X-Portal-Id': PORTAL_ID,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [PORTAL_ID, token]
  );

  // ============================================================
  // ✅ Helper: apiRequest
  // ============================================================
  const apiRequest = useCallback(
    async (
      path: string,
      options: RequestInit = {}
    ): Promise<{ success: boolean; data?: any; message?: string }> => {
      try {
        const response = await fetch(`${API_URL}${path}`, {
          ...options,
          headers: {
            ...getHeaders(options.method !== 'GET' && !(options.body instanceof FormData)),
            ...((options.headers as Record<string, string>) || {}),
          },
        });

        if (response.status === 401) {
          onError?.('انتهت صلاحية الجلسة');
          return { success: false, message: 'انتهت صلاحية الجلسة' };
        }

        const data = await response.json();
        return data;
      } catch (err: any) {
        console.error('❌ apiRequest error:', err);
        return { success: false, message: err.message };
      }
    },
    [API_URL, getHeaders, onError]
  );

  // ============================================================
  // ✅ رفع ملف عام
  // ============================================================
  const uploadFile = useCallback(
    async (file: File, category: string): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'X-Portal-Id': PORTAL_ID,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'فشل رفع الملف');
      }

      const fileId =
        data.data?.file?._id ||
        data.data?.file?.id ||
        data.data?._id ||
        data.data?.fileId;

      if (!fileId) throw new Error('لم يتم استلام معرف الملف');
      return fileId;
    },
    [API_URL, PORTAL_ID, token]
  );

  // ============================================================
  // ✅ رفع ملفات إلى الطلب
  // ============================================================
  const uploadRequestFiles = useCallback(
    async (files: File[], category: string) => {
      try {
        const fileIds: string[] = [];
        for (const file of files) {
          const id = await uploadFile(file, category);
          fileIds.push(id);
        }

        const result = await apiRequest(`/requests/${requestId}/files`, {
          method: 'POST',
          body: JSON.stringify({ fileIds, category }),
        });

        if (result.success) {
          showToast('success', `تم رفع ${fileIds.length} ملف بنجاح`);
          await onRefresh();
          return true;
        } else {
          showToast('error', result.message || 'فشل رفع الملفات');
          return false;
        }
      } catch (err: any) {
        showToast('error', err.message || 'فشل رفع الملفات');
        return false;
      }
    },
    [requestId, uploadFile, apiRequest, showToast, onRefresh]
  );

  // ============================================================
  // ✅ إرسال رسالة
  // ============================================================
  const sendMessage = useCallback(
    async (message: string, attachments: any[] = []) => {
      const result = await apiRequest(`/requests/${requestId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message, attachments }),
      });

      if (result.success) {
        await onRefresh();
        return true;
      }

      showToast('error', result.message || 'فشل إرسال الرسالة');
      return false;
    },
    [requestId, apiRequest, onRefresh, showToast]
  );

  // ============================================================
  // ✅ تحديد النطاق
  // ============================================================
  const defineScope = useCallback(
    async (scopeData: any) => {
      const result = await apiRequest(
        `/requests/${requestId}/scope`,
        {
          method: 'POST',
          body: JSON.stringify(scopeData),
        }
      );

      if (result.success) {
        showToast('success', 'تم تحديد النطاق');
        await onRefresh();
        return true;
      }

      showToast('error', result.message || 'فشل تحديد النطاق');
      return false;
    },
    [requestId, apiRequest, onRefresh, showToast]
  );

  // ============================================================
  // ✅ اعتماد النطاق
  // ============================================================
  const approveScope = useCallback(async () => {
    const result = await apiRequest(
      `/requests/${requestId}/scope/approve`,
      { method: 'PATCH' }
    );

    if (result.success) {
      showToast('success', 'تم اعتماد النطاق');
      await onRefresh();
      return true;
    }

    showToast('error', result.message || 'فشل اعتماد النطاق');
    return false;
  }, [requestId, apiRequest, onRefresh, showToast]);

  // ============================================================
  // ✅ تقديم الدفع
  // ============================================================
  const submitPayment = useCallback(
    async (amount: number, paymentMethod: string) => {
      const result = await apiRequest(
        `/requests/${requestId}/payment`,
        {
          method: 'POST',
          body: JSON.stringify({ amount, paymentMethod }),
        }
      );

      if (result.success) {
        showToast('success', result.message || 'تم تقديم الدفع');
        await onRefresh();
        return true;
      }

      showToast('error', result.message || 'فشل تقديم الدفع');
      return false;
    },
    [requestId, apiRequest, onRefresh, showToast]
  );

  // ============================================================
  // ✅ تأكيد الدفع
  // ============================================================
  const verifyPayment = useCallback(async () => {
    const result = await apiRequest(
      `/requests/${requestId}/payment/verify`,
      {
        method: 'PATCH',
        body: JSON.stringify({ verified: true }),
      }
    );

    if (result.success) {
      showToast('success', 'تم تأكيد الدفع');
      await onRefresh();
      return true;
    }

    showToast('error', result.message || 'فشل تأكيد الدفع');
    return false;
  }, [requestId, apiRequest, onRefresh, showToast]);

  // ============================================================
  // ✅ رفض الدفع
  // ============================================================
  const rejectPayment = useCallback(
    async (reason: string) => {
      const result = await apiRequest(
        `/requests/${requestId}/payment/reject`,
        {
          method: 'PATCH',
          body: JSON.stringify({ reason }),
        }
      );

      if (result.success) {
        showToast('success', 'تم رفض الدفع');
        await onRefresh();
        return true;
      }

      showToast('error', result.message || 'فشل رفض الدفع');
      return false;
    },
    [requestId, apiRequest, onRefresh, showToast]
  );

  // ============================================================
  // ✅ تحديث الحالة
  // ============================================================
  const updateStatus = useCallback(
    async (status: string) => {
      const result = await apiRequest(
        `/requests/${requestId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      );

      if (result.success) {
        showToast('success', 'تم تحديث الحالة');
        await onRefresh();
        return true;
      }

      showToast('error', result.message || 'فشل تحديث الحالة');
      return false;
    },
    [requestId, apiRequest, onRefresh, showToast]
  );

  // ============================================================
  // ✅ جدولة مكالمة
  // ============================================================
  const scheduleCall = useCallback(
    async (callData: any) => {
      const result = await apiRequest(
        `/requests/${requestId}/calls`,
        {
          method: 'POST',
          body: JSON.stringify(callData),
        }
      );

      if (result.success) {
        showToast('success', 'تم جدولة المكالمة');
        await onRefresh();
        return true;
      }

      showToast('error', result.message || 'فشل جدولة المكالمة');
      return false;
    },
    [requestId, apiRequest, onRefresh, showToast]
  );

  // ============================================================
  // ✅ بدء مكالمة مجدولة
  // ============================================================
  const startScheduledCall = useCallback(
    async (callId: string) => {
      const result = await apiRequest(
        `/requests/${requestId}/calls/${callId}/start`,
        { method: 'POST' }
      );

      if (result.success) {
        showToast('success', 'تم بدء المكالمة');
        await onRefresh();
        return true;
      }

      showToast('error', result.message || 'فشل بدء المكالمة');
      return false;
    },
    [requestId, apiRequest, onRefresh, showToast]
  );

  // ============================================================
  // ✅ إلغاء مكالمة
  // ============================================================
  const cancelCall = useCallback(
    async (callId: string) => {
      const result = await apiRequest(
        `/requests/${requestId}/calls/${callId}`,
        { method: 'DELETE' }
      );

      if (result.success) {
        showToast('success', 'تم إلغاء المكالمة');
        await onRefresh();
        return true;
      }

      showToast('error', result.message || 'فشل إلغاء المكالمة');
      return false;
    },
    [requestId, apiRequest, onRefresh, showToast]
  );

  // ============================================================
  // ✅ إنهاء مكالمة
  // ============================================================
  const completeCall = useCallback(
    async (callId: string) => {
      const result = await apiRequest(
        `/requests/${requestId}/calls/${callId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'completed' }),
        }
      );

      if (result.success) {
        showToast('success', 'تم إنهاء المكالمة');
        await onRefresh();
        return true;
      }

      showToast('error', result.message || 'فشل إنهاء المكالمة');
      return false;
    },
    [requestId, apiRequest, onRefresh, showToast]
  );

  // ============================================================
  // ✅ جلب ملف (عرض آمن)
  // ============================================================
  const viewFile = useCallback(
    async (fileId: string) => {
      if (!fileId || !token) return;

      try {
        const response = await fetch(`${API_URL}/files/${fileId}/view`, {
          headers: getHeaders(false),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');

        if (!win) {
          showToast('error', 'يرجى السماح بالنوافذ المنبثقة');
          URL.revokeObjectURL(url);
          return;
        }

        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (err: any) {
        showToast('error', 'فشل معاينة الملف');
      }
    },
    [API_URL, token, getHeaders, showToast]
  );

  // ============================================================
  // ✅ تحميل ملف
  // ============================================================
  const downloadFile = useCallback(
    async (fileId: string, filename: string) => {
      if (!fileId || !token) return;

      try {
        const response = await fetch(
          `${API_URL}/files/${fileId}/download-direct`,
          { headers: getHeaders(false) }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err: any) {
        showToast('error', 'فشل تحميل الملف');
      }
    },
    [API_URL, token, getHeaders, showToast]
  );

  // ============================================================
  // ✅ Return
  // ============================================================
  return {
    apiRequest,
    uploadFile,
    uploadRequestFiles,
    sendMessage,
    defineScope,
    approveScope,
    submitPayment,
    verifyPayment,
    rejectPayment,
    updateStatus,
    scheduleCall,
    startScheduledCall,
    cancelCall,
    completeCall,
    viewFile,
    downloadFile,
  };
};