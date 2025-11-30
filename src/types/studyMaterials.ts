// Study Materials Types based on actual API

/**
 * Query Parameters for fetching study materials
 */
export interface GetStudyMaterialsParams {
  programId?: number;      // معرف البرنامج التدريبي (اختياري)
  search?: string;         // البحث في الاسم (اختياري)
  isActive?: boolean;      // حالة النشاط (اختياري)
  page?: number;          // رقم الصفحة (افتراضي: 1)
  limit?: number;         // عدد العناصر في الصفحة (افتراضي: 20)
}

/**
 * Study Material - الأداة الدراسية
 */
export interface StudyMaterial {
  // الحقول الأساسية
  id: string;                    // معرف الأداة
  name: string;                  // اسم الأداة بالعربية
  nameEn: string | null;         // اسم الأداة بالإنجليزية
  description: string | null;    // وصف الأداة
  quantity: number;              // الكمية المتاحة
  isActive: boolean;             // حالة النشاط
  createdBy: string;             // من أنشأ الأداة (User ID)
  createdAt: Date | string;      // تاريخ الإنشاء
  updatedAt: Date | string;      // تاريخ آخر تعديل
  
  // الربط بالبرنامج التدريبي
  programId: number;             // معرف البرنامج
  program: {
    id: number;
    nameAr: string;
    nameEn: string;
  };
  
  // الربط بالرسم (اختياري)
  linkedFeeId: number | null;    // معرف الرسم المرتبط
  linkedFee: {
    id: number;
    name: string;
    amount: number;
  } | null;
  
  // المسؤولون عن التسليم
  responsibleUsers: Array<{
    studyMaterialId: string;
    userId: string;
    assignedAt: Date | string;
    assignedBy: string | null;
    notes: string | null;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  
  // عداد سجلات التسليم
  _count: {
    deliveries: number;          // عدد عمليات التسليم
  };
}

/**
 * Response من API لجلب الأدوات الدراسية
 */
export interface StudyMaterialsResponse {
  materials: StudyMaterial[];  // مصفوفة الأدوات الدراسية
  pagination: {
    page: number;           // الصفحة الحالية
    limit: number;          // عدد العناصر في الصفحة
    total: number;          // إجمالي عدد السجلات
    totalPages: number;     // إجمالي عدد الصفحات
    hasNext: boolean;       // هل توجد صفحة تالية
    hasPrev: boolean;       // هل توجد صفحة سابقة
  };
}

/**
 * DTO لإنشاء أداة دراسية جديدة
 */
export interface CreateStudyMaterialDto {
  name: string;                  // اسم الأداة بالعربية (مطلوب)
  nameEn?: string;               // اسم الأداة بالإنجليزية
  description?: string;          // وصف الأداة
  quantity: number;              // الكمية المتاحة (مطلوب)
  isActive?: boolean;            // حالة النشاط (افتراضي: true)
  programId: number;             // معرف البرنامج (مطلوب)
  linkedFeeId?: number;          // معرف الرسم المرتبط
  responsibleUserIds?: string[]; // معرفات المسؤولين عن التسليم
}

/**
 * DTO لتحديث أداة دراسية
 */
export interface UpdateStudyMaterialDto {
  name?: string;
  nameEn?: string;
  description?: string;
  quantity?: number;
  isActive?: boolean;
  programId?: number;
  linkedFeeId?: number;
  responsibleUserIds?: string[];
}

/**
 * إحصائيات الأدوات الدراسية
 */
export interface StudyMaterialsStats {
  totalMaterials: number;        // إجمالي الأدوات
  activeMaterials: number;       // الأدوات النشطة
  totalDeliveries: number;       // إجمالي التسليمات
  pendingDeliveries: number;     // التسليمات قيد الانتظار
}

/**
 * سجل تسليم الأداة الدراسية
 */
export interface MaterialDelivery {
  id: string;
  studyMaterialId: string;
  studyMaterial: StudyMaterial;
  traineeId: number;
  trainee: {
    id: number;
    nameAr: string;
    nameEn: string;
    phone: string;
    nationalId: string;
  };
  deliveredBy: string;           // User ID
  deliveredByUser: {
    id: string;
    name: string;
    email: string;
  };
  deliveredAt: Date | string;
  quantity: number;
  notes?: string;
  receivedByTrainee: boolean;    // هل استلمها الطالب فعلياً
  signature?: string;            // توقيع الاستلام
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Response لسجلات التسليم
 */
export interface MaterialDeliveriesResponse {
  deliveries: MaterialDelivery[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * DTO لتسجيل تسليم جديد
 */
export interface CreateMaterialDeliveryDto {
  studyMaterialId: string;
  traineeId: number;
  quantity: number;
  notes?: string;
  receivedByTrainee?: boolean;
  signature?: string;
}

/**
 * معلمات البحث في التسليمات
 */
export interface GetMaterialDeliveriesParams {
  studyMaterialId?: string;
  traineeId?: number;
  deliveredBy?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}