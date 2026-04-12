// Complaints and Suggestions Types

/**
 * نوع الشكوى/الاقتراح
 */
export enum ComplaintType {
  COMPLAINT = 'COMPLAINT',
  SUGGESTION = 'SUGGESTION',
}

/**
 * حالة الشكوى/الاقتراح
 */
export enum ComplaintStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

/**
 * بيانات البرنامج
 */
export interface ComplaintProgramInfo {
  nameAr: string;
}

/**
 * بيانات المتدرب
 */
export interface ComplaintTraineeInfo {
  id: number;
  nameAr: string;
  nationalId: string;
  phone?: string;
  program?: ComplaintProgramInfo;
}

/**
 * بيانات المراجع
 */
export interface ComplaintReviewerInfo {
  id: string;
  name: string;
}

/**
 * عنصر شكوى/اقتراح
 */
export interface ComplaintItem {
  id: string;
  traineeId: number;
  type: ComplaintType;
  subject: string;
  description: string;
  attachmentUrl?: string | null;
  status: ComplaintStatus;
  adminResponse?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
  trainee?: ComplaintTraineeInfo;
  reviewer?: ComplaintReviewerInfo | null;
}

/**
 * استعلامات جلب الشكاوى
 */
export interface ComplaintsQuery {
  type?: ComplaintType;
  status?: ComplaintStatus;
  page?: number;
  limit?: number;
}

/**
 * معلومات الترقيم
 */
export interface ComplaintsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * استجابة API لجلب الشكاوى
 */
export interface ComplaintsResponse {
  data: ComplaintItem[];
  pagination: ComplaintsPagination;
}

/**
 * إحصائيات الشكاوى
 */
export interface ComplaintsStatsResponse {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  closed: number;
  complaints: number;
  suggestions: number;
}

/**
 * طلب مراجعة شكوى
 */
export interface ReviewComplaintPayload {
  status: 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminResponse?: string;
}
