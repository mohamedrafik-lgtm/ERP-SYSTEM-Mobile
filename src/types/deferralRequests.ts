// Deferral Requests Types

/**
 * حالة طلب التأجيل
 */
export type DeferralRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Query Parameters لطلبات تأجيل السداد
 */
export interface DeferralRequestsQuery {
  status?: DeferralRequestStatus;  // حالة الطلب
  programId?: number;              // معرف البرنامج التدريبي
  traineeId?: number;              // معرف المتدرب
  page?: number;                   // رقم الصفحة (افتراضي: 1)
  limit?: number;                  // عدد العناصر في الصفحة (افتراضي: 20)
}

/**
 * بيانات طلب تأجيل السداد
 */
export interface DeferralRequest {
  id: string;                        // معرف الطلب
  traineeId: number;                 // معرف المتدرب
  feeId: number;                     // معرف الرسم
  reason: string;                    // سبب طلب التأجيل
  requestedExtensionDays: number;    // عدد أيام التأجيل المطلوبة
  requestedDeadline: string;         // الموعد النهائي المطلوب (ISO string)
  status: DeferralRequestStatus;     // حالة الطلب
  createdAt: string;                 // تاريخ إنشاء الطلب (ISO string)
  reviewedAt?: string;               // تاريخ المراجعة (اختياري، ISO string)
  reviewedBy?: string;               // معرف المراجع (اختياري)
  adminResponse?: string;            // رد الإدارة (اختياري)
  adminNotes?: string;               // ملاحظات إدارية (اختياري)
  createdExceptionId?: string;       // معرف الاستثناء المُنشأ (اختياري)
  
  // بيانات المتدرب
  trainee: {
    id: number;
    nameAr: string;
    nationalId: string;
    phone: string;
    program: {
      nameAr: string;
    };
  };
  
  // بيانات الرسم
  fee: {
    id: number;
    name: string;
    amount: number;
  };
  
  // بيانات المراجع (اختياري)
  reviewer?: {
    id: string;
    name: string;
  };
}

/**
 * Response من API طلبات تأجيل السداد
 */
export interface DeferralRequestsResponse {
  data: DeferralRequest[];
  pagination: {
    page: number;           // الصفحة الحالية
    limit: number;          // عدد العناصر في الصفحة
    total: number;          // إجمالي عدد الطلبات
    totalPages: number;     // إجمالي عدد الصفحات
  };
}

/**
 * Request لمراجعة طلب التأجيل
 */
export interface ReviewDeferralRequestPayload {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';  // قرار المراجعة (مطلوب)
  adminResponse?: string;                        // رد الإدارة (اختياري)
  adminNotes?: string;                           // ملاحظات إدارية إضافية (اختياري)
}