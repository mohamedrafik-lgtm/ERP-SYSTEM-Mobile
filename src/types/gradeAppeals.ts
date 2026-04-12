// Grade Appeals Types

/**
 * حالة التظلم
 */
export enum GradeAppealStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

/**
 * حالة مادة داخل التظلم
 */
export enum GradeAppealSubjectStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

/**
 * بيانات البرنامج
 */
export interface GradeAppealProgramInfo {
  nameAr: string;
}

/**
 * بيانات المتدرب
 */
export interface GradeAppealTraineeInfo {
  id: number;
  nameAr: string;
  nationalId: string;
  phone: string;
  photoUrl?: string | null;
  program?: GradeAppealProgramInfo;
}

/**
 * بيانات المراجع
 */
export interface GradeAppealReviewerInfo {
  id: string;
  name: string;
}

/**
 * بيانات المادة
 */
export interface GradeAppealContentInfo {
  id: number;
  name: string;
  code?: string;
}

/**
 * مادة متظلم منها
 */
export interface GradeAppealSubject {
  id: string;
  appealId: string;
  contentId: number;
  currentScore: number;
  maxScore: number;
  percentage: number;
  status: GradeAppealSubjectStatus;
  content?: GradeAppealContentInfo;
}

/**
 * عنصر تظلم
 */
export interface GradeAppealItem {
  id: string;
  traineeId: number;
  traineeNotes?: string | null;
  status: GradeAppealStatus;
  adminResponse?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
  trainee?: GradeAppealTraineeInfo;
  reviewer?: GradeAppealReviewerInfo | null;
  subjects: GradeAppealSubject[];
}

/**
 * استعلامات جلب التظلمات
 */
export interface GradeAppealsQuery {
  status?: GradeAppealStatus;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * معلومات الترقيم
 */
export interface GradeAppealsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * استجابة API لجلب التظلمات
 */
export interface GradeAppealsResponse {
  data: GradeAppealItem[];
  pagination: GradeAppealsPagination;
}

/**
 * إحصائيات التظلمات
 */
export interface GradeAppealsStatsResponse {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

/**
 * طلب مراجعة تظلم
 */
export interface ReviewGradeAppealPayload {
  status: 'ACCEPTED' | 'REJECTED';
  adminResponse?: string;
}
