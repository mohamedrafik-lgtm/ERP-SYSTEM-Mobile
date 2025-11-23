// Trainee Requests Types (Free Requests)

/**
 * أنواع الطلبات المجانية
 */
export enum RequestType {
  EXAM_POSTPONE = 'EXAM_POSTPONE',       // تأجيل اختبار
  SICK_LEAVE = 'SICK_LEAVE',             // إجازة مرضية
  ENROLLMENT_PROOF = 'ENROLLMENT_PROOF', // إثبات قيد
  CERTIFICATE = 'CERTIFICATE',           // إفادة
}

/**
 * أنواع الاختبارات
 */
export enum ExamType {
  MIDTERM = 'MIDTERM',  // ميد تيرم
  FINAL = 'FINAL',      // نهائي
}

/**
 * حالة الطلب
 */
export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * معلومات البرنامج
 */
export interface ProgramInfo {
  nameAr: string;  // اسم البرنامج بالعربي
}

/**
 * معلومات المتدرب
 */
export interface TraineeInfo {
  id: number;              // معرف المتدرب
  nameAr: string;          // الاسم بالعربي
  nationalId: string;      // رقم الهوية
  phone: string;           // رقم الجوال
  photoUrl: string | null; // رابط الصورة الشخصية (اختياري)
  program: ProgramInfo;    // بيانات البرنامج التدريبي
}

/**
 * معلومات المراجع
 */
export interface ReviewerInfo {
  id: string;   // معرف المراجع
  name: string; // اسم المراجع
}

/**
 * معلومات الترقيم
 */
export interface PaginationInfo {
  page: number;       // رقم الصفحة الحالية
  limit: number;      // عدد العناصر في الصفحة
  total: number;      // إجمالي عدد الطلبات
  totalPages: number; // إجمالي عدد الصفحات
}

/**
 * بيانات الطلب
 */
export interface TraineeRequest {
  id: string;                           // معرف الطلب (UUID)
  traineeId: number;                    // معرف المتدرب
  type: RequestType;                    // نوع الطلب
  reason: string;                       // سبب الطلب
  attachmentUrl: string | null;         // رابط المرفق (للإجازة المرضية)
  attachmentCloudinaryId: string | null; // معرف المرفق في Cloudinary
  examType: ExamType | null;            // نوع الاختبار (لتأجيل اختبار فقط)
  examDate: string | null;              // تاريخ الاختبار الأصلي (ISO string)
  status: RequestStatus;                // حالة الطلب
  createdAt: string;                    // تاريخ إنشاء الطلب (ISO string)
  reviewedAt: string | null;            // تاريخ المراجعة (ISO string)
  reviewedBy: string | null;            // معرف المراجع
  adminResponse: string | null;         // رد الإدارة على الطلب
  adminNotes: string | null;            // ملاحظات إدارية إضافية
  trainee: TraineeInfo;                 // بيانات المتدرب
  reviewer: ReviewerInfo | null;        // بيانات المراجع (إن وجد)
}

/**
 * Response من API الطلبات المجانية
 */
export interface TraineeRequestsResponse {
  data: TraineeRequest[];      // مصفوفة الطلبات
  pagination: PaginationInfo;  // معلومات الترقيم
}

/**
 * Query Parameters للطلبات المجانية
 */
export interface TraineeRequestsQuery {
  type?: RequestType;       // فلترة حسب نوع الطلب (اختياري)
  status?: RequestStatus;   // فلترة حسب حالة الطلب (اختياري)
  traineeId?: number;       // فلترة حسب معرف المتدرب (اختياري)
  page?: number;            // رقم الصفحة (افتراضي: 1)
  limit?: number;           // عدد العناصر في الصفحة (افتراضي: 20)
}

/**
 * إحصائيات الطلبات
 */
export interface TraineeRequestsStatsResponse {
  total: number;      // إجمالي عدد الطلبات
  pending: number;    // عدد الطلبات قيد المراجعة
  approved: number;   // عدد الطلبات المقبولة
  rejected: number;   // عدد الطلبات المرفوضة
}

/**
 * Request لمراجعة الطلب
 */
export interface ReviewTraineeRequestPayload {
  status: 'APPROVED' | 'REJECTED';  // قرار المراجعة (قبول أو رفض فقط)
  adminResponse?: string;            // رد الإدارة (اختياري)
  adminNotes?: string;               // ملاحظات إدارية داخلية (اختياري)
}