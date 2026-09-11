// frontend/portal-a/src/types/dashboard.types.ts

export interface DashboardStats {
  // ============================================================
  // 1. إحصائيات الطلبات
  // ============================================================
  totalRequests: number;
  inProgress: number;
  completed: number;
  cancelled: number;

  // ============================================================
  // 2. إحصائيات الاشتراكات
  // ============================================================
  totalSubscriptions: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;

  // ============================================================
  // 3. إحصائيات المدفوعات
  // ============================================================
  totalPayments: number;
  totalAmount: number;
  paidPayments: number;
  pendingPayments: number;
  rejectedPayments: number;
  refundedPayments: number;

  // ============================================================
  // 4. الملفات والرسائل
  // ============================================================
  totalFiles: number;
  totalMessages: number;
  unreadMessages: number;

  // ============================================================
  // 5. الإشعارات
  // ============================================================
  totalNotifications: number;
  unreadNotificationsCount: number;
  recentNotifications: NotificationItem[];

  // ============================================================
  // 6. البيانات الأخيرة
  // ============================================================
  recentRequests: RecentRequest[];
  recentPayments: RecentPayment[];
  recentSubscriptions: RecentSubscription[];
}

// ============================================================
// ✅ الأنواع الفرعية
// ============================================================

export interface NotificationItem {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: string;
  data: Record<string, any>;
  title: string;
}

export interface RecentRequest {
  _id: string;
  title: string;
  status: string;
  serviceName: string;
  specialistName: string;
  createdAt: string;
  requestNumber: string;
}

export interface RecentPayment {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  reference: string;
}

export interface RecentSubscription {
  _id: string;
  materialName: string;
  materialCode: string;
  status: string;
  price: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}