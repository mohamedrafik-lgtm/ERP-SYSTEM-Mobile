// Academic Supplies Types and Enums

/**
 * أنواع الأدوات الدراسية
 */
export enum SupplyType {
  ACADEMIC_CARD = 'ACADEMIC_CARD',        // كارنيه أكاديمي
  BOOKS = 'BOOKS',                        // كتب
  UNIFORM = 'UNIFORM',                    // زي موحد
  LAB_EQUIPMENT = 'LAB_EQUIPMENT',        // معدات معملية
  STATIONERY = 'STATIONERY',              // أدوات كتابية
  ID_CARD = 'ID_CARD',                    // بطاقة هوية
  OTHER = 'OTHER'                         // أخرى
}

/**
 * حالات طلب الأدوات
 */
export enum SupplyRequestStatus {
  PENDING = 'PENDING',                    // قيد المراجعة
  APPROVED = 'APPROVED',                  // تمت الموافقة
  REJECTED = 'REJECTED',                  // مرفوض
  IN_PROGRESS = 'IN_PROGRESS',            // قيد التجهيز
  READY_FOR_DELIVERY = 'READY_FOR_DELIVERY', // جاهز للتسليم
  DELIVERED = 'DELIVERED',                // تم التسليم
  CANCELLED = 'CANCELLED'                 // ملغي
}

/**
 * عنصر الأدوات الدراسية المتاح
 */
export interface SupplyItem {
  id: string;
  type: SupplyType;
  nameAr: string;
  nameEn: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  imageUrl?: string;
  requiresApproval: boolean;
  stockQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * عنصر في طلب الأدوات
 */
export interface SupplyRequestItem {
  id: string;
  supplyRequestId: string;
  supplyItemId: string;
  supplyItem: SupplyItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  deliveredQuantity?: number;
  deliveredAt?: string;
}

/**
 * طلب الأدوات الدراسية
 */
export interface SupplyRequest {
  id: string;
  traineeId: number;
  trainee: {
    id: number;
    nameAr: string;
    nameEn: string;
    phone: string;
    email?: string;
    nationalId: string;
    program: {
      id: number;
      nameAr: string;
      nameEn: string;
    };
  };
  items: SupplyRequestItem[];
  status: SupplyRequestStatus;
  totalAmount: number;
  notes?: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    id: string;
    name: string;
  };
  rejectionReason?: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  deliveredBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO لإنشاء طلب أدوات جديد
 */
export interface CreateSupplyRequestDto {
  traineeId: number;
  items: {
    supplyItemId: string;
    quantity: number;
    notes?: string;
  }[];
  notes?: string;
}

/**
 * DTO لتحديث طلب الأدوات
 */
export interface UpdateSupplyRequestDto {
  status?: SupplyRequestStatus;
  rejectionReason?: string;
  estimatedDeliveryDate?: string;
  notes?: string;
}

/**
 * معلمات البحث والفلترة
 */
export interface GetSupplyRequestsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SupplyRequestStatus;
  traineeId?: number;
  supplyType?: SupplyType;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * استجابة قائمة الطلبات مع Pagination
 */
export interface SupplyRequestsResponse {
  data: SupplyRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * استجابة قائمة الأدوات المتاحة
 */
export interface SupplyItemsResponse {
  data: SupplyItem[];
}

/**
 * إحصائيات الأدوات الدراسية
 */
export interface SupplyStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  deliveredRequests: number;
  rejectedRequests: number;
  totalValue: number;
  thisMonthRequests: number;
  thisMonthValue: number;
}

/**
 * سجل التسليم
 */
export interface DeliveryRecord {
  id: string;
  supplyRequestId: string;
  request: SupplyRequest;
  deliveredBy: {
    id: string;
    name: string;
  };
  deliveredAt: string;
  receivedBy?: string; // اسم المستلم
  signature?: string; // توقيع المستلم
  notes?: string;
}