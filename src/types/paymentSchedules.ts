// Payment Schedules Types

export type FeeType = 'TUITION' | 'SERVICES' | 'TRAINING' | 'ADDITIONAL';
export type SafeCategory = 'DEBT' | 'INCOME' | 'EXPENSE' | 'ASSETS' | 'UNSPECIFIED';

// أنواع الإجراءات المتاحة عند عدم السداد
export enum NonPaymentAction {
  DISABLE_ATTENDANCE = 'DISABLE_ATTENDANCE',  // إيقاف نظام الحضور
  DISABLE_PLATFORM = 'DISABLE_PLATFORM',      // إيقاف المنصة الإلكترونية
  DISABLE_QUIZZES = 'DISABLE_QUIZZES',        // إيقاف الاختبارات الإلكترونية
  DISABLE_ALL = 'DISABLE_ALL',                // إيقاف الكل
  NONE = 'NONE'                               // لا شيء (افتراضي)
}

// تسميات الإجراءات بالعربية
export const NON_PAYMENT_ACTION_LABELS: Record<NonPaymentAction, string> = {
  [NonPaymentAction.DISABLE_ATTENDANCE]: 'إيقاف نظام الحضور',
  [NonPaymentAction.DISABLE_PLATFORM]: 'إيقاف المنصة الإلكترونية',
  [NonPaymentAction.DISABLE_QUIZZES]: 'إيقاف الاختبارات الإلكترونية',
  [NonPaymentAction.DISABLE_ALL]: 'إيقاف الكل',
  [NonPaymentAction.NONE]: 'لا شيء'
};

export interface Program {
  id: number;
  nameAr: string;
  nameEn: string;
  price: number;
  description: string | null;
  numberOfClassrooms: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Safe {
  id: string;
  name: string;
  description: string | null;
  category: SafeCategory;
  type: SafeCategory;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TraineeFee {
  id: number;
  name: string;
  amount: number;
  type: FeeType;
  academicYear: string;
  allowMultipleApply: boolean;
  programId: number;
  safeId: string;
  isApplied: boolean;
  appliedAt: Date | null;
  appliedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  program: Program;
  safe: Safe;
}

export interface PaymentSchedule {
  id: string;
  feeId: number;
  paymentStartDate: Date | null;
  paymentEndDate: Date | null;
  gracePeriodDays: number;
  finalDeadline: Date | null;
  nonPaymentActions: any | null;
  actionEnabled: boolean;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  fee: TraineeFee;
}

export interface CreatePaymentScheduleRequest {
  feeId: number;                              // معرف الرسوم (إجباري)
  paymentStartDate?: string;                  // موعد بداية السداد (اختياري) - ISO date string
  paymentEndDate?: string;                    // موعد نهاية السداد (اختياري) - ISO date string
  gracePeriodDays?: number;                   // فترة السماح بالأيام (اختياري، افتراضي: 0)
  nonPaymentActions?: NonPaymentAction[];     // الإجراءات عند عدم السداد (اختياري)
  actionEnabled?: boolean;                    // هل الإجراءات مفعلة؟ (اختياري، افتراضي: false)
  notes?: string;                             // ملاحظات إضافية (اختياري)
}

export interface UpdatePaymentScheduleRequest {
  feeId?: number;
  paymentStartDate?: string;
  paymentEndDate?: string;
  gracePeriodDays?: number;
  nonPaymentActions?: string[];
  actionEnabled?: boolean;
  notes?: string;
}