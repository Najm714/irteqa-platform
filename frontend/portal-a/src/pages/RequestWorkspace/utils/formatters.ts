// src/pages/RequestWorkspace/utils/formatters.ts
import type { RequestAccount } from '../types';

// ============================================================
// ✅ حجم الملف
// ============================================================
export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes < 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

// ============================================================
// ✅ التاريخ والوقت
// ============================================================
export const formatDateTime = (date: Date | string | undefined): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
};

export const formatTime = (date: Date | string | undefined): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

// ============================================================
// ✅ المدة
// ============================================================
export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '-';
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} ساعة`;
  return `${hours} ساعة و ${mins} دقيقة`;
};

// ============================================================
// ✅ اسم المستخدم
// ============================================================
export const getUserName = (
  account: RequestAccount | string | any
): string => {
  if (!account) return 'مستخدم';

  if (typeof account === 'string') return 'مستخدم';

  if (typeof account === 'object') {
    if (account.profile?.fullName) return account.profile.fullName;
    if (account.fullName) return account.fullName;
    if (account.email) return account.email;
  }

  return 'مستخدم';
};

// ============================================================
// ✅ اسم الدور
// ============================================================
export const getUserRole = (role: string | undefined): string => {
  if (!role) return '-';

  const roles: Record<string, string> = {
    customer: 'عميل',
    specialist: 'مختص',
    portal_admin: 'مدير',
    super_admin: 'مشرف',
    system: 'النظام',
  };

  return roles[role] || role;
};

// ============================================================
// ✅ السعر
// ============================================================
export const formatPrice = (
  price: number,
  currency: string = 'SAR'
): string => {
  if (!price || price <= 0) return 'مجاني';
  return `${price.toLocaleString('ar-SA')} ${
    currency === 'SAR' ? 'ريال' : currency
  }`;
};

// ============================================================
// ✅ رقم مختصر
// ============================================================
export const formatShortNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
};