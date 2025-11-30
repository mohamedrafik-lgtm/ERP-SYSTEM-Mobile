import { getCurrentApiBaseUrl } from '../config/api';
import AuthService from './AuthService';
import {
  SupplyRequest,
  SupplyItem,
  CreateSupplyRequestDto,
  UpdateSupplyRequestDto,
  GetSupplyRequestsParams,
  SupplyRequestsResponse,
  SupplyItemsResponse,
  SupplyStats,
  DeliveryRecord,
} from '../types/academicSupplies';

/**
 * Academic Supplies Service
 * Handles all API communication for academic supplies management
 * Following Single Responsibility Principle - only API calls, no business logic
 */
class AcademicSuppliesService {
  /**
   * Get authentication headers
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await AuthService.getToken();
    if (!token) {
      throw new Error('Authentication token not found.');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Generic request handler with error handling
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const baseUrl = await getCurrentApiBaseUrl();
      const headers = await this.getHeaders();

      console.log(`[AcademicSuppliesService] Request: ${endpoint}`);

      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options?.headers },
      });

      console.log(`[AcademicSuppliesService] Response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 401) {
          await AuthService.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }

        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('[AcademicSuppliesService] Error:', error);
      throw error;
    }
  }

  // ==================== SUPPLY ITEMS APIs ====================

  /**
   * جلب جميع الأدوات الدراسية المتاحة
   */
  async getAvailableItems(): Promise<SupplyItem[]> {
    const response = await this.request<SupplyItemsResponse>(
      '/api/academic-supplies/items'
    );
    return response.data;
  }

  /**
   * جلب أدوات دراسية حسب النوع
   */
  async getItemsByType(type: string): Promise<SupplyItem[]> {
    const response = await this.request<SupplyItemsResponse>(
      `/api/academic-supplies/items?type=${type}`
    );
    return response.data;
  }

  /**
   * جلب تفاصيل أداة دراسية معينة
   */
  async getItemById(id: string): Promise<SupplyItem> {
    return this.request<SupplyItem>(
      `/api/academic-supplies/items/${id}`
    );
  }

  // ==================== SUPPLY REQUESTS APIs ====================

  /**
   * جلب طلبات الأدوات مع فلاتر وترقيم
   */
  async getRequests(params?: GetSupplyRequestsParams): Promise<SupplyRequestsResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.traineeId) queryParams.append('traineeId', params.traineeId.toString());
    if (params?.supplyType) queryParams.append('supplyType', params.supplyType);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

    const queryString = queryParams.toString();
    const endpoint = `/api/academic-supplies/requests${queryString ? `?${queryString}` : ''}`;

    return this.request<SupplyRequestsResponse>(endpoint);
  }

  /**
   * جلب تفاصيل طلب معين
   */
  async getRequestById(id: string): Promise<SupplyRequest> {
    return this.request<SupplyRequest>(
      `/api/academic-supplies/requests/${id}`
    );
  }

  /**
   * إنشاء طلب أدوات جديد
   */
  async createRequest(data: CreateSupplyRequestDto): Promise<SupplyRequest> {
    return this.request<SupplyRequest>(
      '/api/academic-supplies/requests',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * تحديث طلب الأدوات
   */
  async updateRequest(
    id: string,
    data: UpdateSupplyRequestDto
  ): Promise<SupplyRequest> {
    return this.request<SupplyRequest>(
      `/api/academic-supplies/requests/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * إلغاء طلب الأدوات
   */
  async cancelRequest(id: string): Promise<void> {
    await this.request<void>(
      `/api/academic-supplies/requests/${id}/cancel`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * حذف طلب الأدوات
   */
  async deleteRequest(id: string): Promise<void> {
    await this.request<void>(
      `/api/academic-supplies/requests/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  // ==================== ADMIN ACTIONS APIs ====================

  /**
   * الموافقة على طلب (Admin only)
   */
  async approveRequest(
    id: string,
    estimatedDeliveryDate?: string
  ): Promise<SupplyRequest> {
    return this.request<SupplyRequest>(
      `/api/academic-supplies/requests/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ estimatedDeliveryDate }),
      }
    );
  }

  /**
   * رفض طلب (Admin only)
   */
  async rejectRequest(
    id: string,
    reason: string
  ): Promise<SupplyRequest> {
    return this.request<SupplyRequest>(
      `/api/academic-supplies/requests/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: reason }),
      }
    );
  }

  /**
   * تحديث حالة الطلب إلى "قيد التجهيز"
   */
  async markAsInProgress(id: string): Promise<SupplyRequest> {
    return this.request<SupplyRequest>(
      `/api/academic-supplies/requests/${id}/in-progress`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * تحديث حالة الطلب إلى "جاهز للتسليم"
   */
  async markAsReadyForDelivery(id: string): Promise<SupplyRequest> {
    return this.request<SupplyRequest>(
      `/api/academic-supplies/requests/${id}/ready`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * تسجيل التسليم
   */
  async markAsDelivered(
    id: string,
    deliveryData: {
      receivedBy?: string;
      signature?: string;
      notes?: string;
    }
  ): Promise<SupplyRequest> {
    return this.request<SupplyRequest>(
      `/api/academic-supplies/requests/${id}/deliver`,
      {
        method: 'POST',
        body: JSON.stringify(deliveryData),
      }
    );
  }

  // ==================== STATISTICS APIs ====================

  /**
   * جلب إحصائيات الأدوات الدراسية
   */
  async getStats(): Promise<SupplyStats> {
    return this.request<SupplyStats>(
      '/api/academic-supplies/stats'
    );
  }

  // ==================== DELIVERY TRACKING APIs ====================

  /**
   * جلب سجلات التسليم
   */
  async getDeliveryRecords(params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    data: DeliveryRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

    const queryString = queryParams.toString();
    const endpoint = `/api/academic-supplies/deliveries${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  /**
   * جلب سجل تسليم معين
   */
  async getDeliveryRecordById(id: string): Promise<DeliveryRecord> {
    return this.request<DeliveryRecord>(
      `/api/academic-supplies/deliveries/${id}`
    );
  }
}

// Export singleton instance
export default new AcademicSuppliesService();