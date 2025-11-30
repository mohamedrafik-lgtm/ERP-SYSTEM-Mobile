import { getCurrentApiBaseUrl } from '../config/api';
import AuthService from './AuthService';
import {
  StudyMaterial,
  StudyMaterialsResponse,
  GetStudyMaterialsParams,
  CreateStudyMaterialDto,
  UpdateStudyMaterialDto,
  MaterialDelivery,
  MaterialDeliveriesResponse,
  GetMaterialDeliveriesParams,
  CreateMaterialDeliveryDto,
  StudyMaterialsStats,
} from '../types/studyMaterials';

/**
 * Study Materials Service
 * Handles all API communication for study materials management
 * Following Single Responsibility Principle - only API calls, no business logic
 */
class StudyMaterialsService {
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

      console.log(`[StudyMaterialsService] Request: ${endpoint}`);

      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options?.headers },
      });

      console.log(`[StudyMaterialsService] Response status: ${response.status}`);

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
      console.error('[StudyMaterialsService] Error:', error);
      throw error;
    }
  }

  // ==================== STUDY MATERIALS APIs ====================

  /**
   * جلب جميع الأدوات الدراسية مع فلاتر وترقيم
   * GET /api/study-materials
   */
  async getStudyMaterials(params?: GetStudyMaterialsParams): Promise<StudyMaterialsResponse> {
    const queryParams = new URLSearchParams();

    if (params?.programId) queryParams.append('programId', params.programId.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/study-materials${queryString ? `?${queryString}` : ''}`;

    console.log('[StudyMaterialsService] Fetching study materials with params:', params);
    
    return this.request<StudyMaterialsResponse>(endpoint);
  }

  /**
   * جلب تفاصيل أداة دراسية معينة
   * GET /api/study-materials/:id
   */
  async getStudyMaterialById(id: string): Promise<StudyMaterial> {
    return this.request<StudyMaterial>(
      `/api/study-materials/${id}`
    );
  }

  /**
   * إنشاء أداة دراسية جديدة
   * POST /api/study-materials
   */
  async createStudyMaterial(data: CreateStudyMaterialDto): Promise<StudyMaterial> {
    console.log('[StudyMaterialsService] Creating study material:', data);
    
    return this.request<StudyMaterial>(
      '/api/study-materials',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * تحديث أداة دراسية
   * PATCH /api/study-materials/:id
   */
  async updateStudyMaterial(
    id: string,
    data: UpdateStudyMaterialDto
  ): Promise<StudyMaterial> {
    console.log('[StudyMaterialsService] Updating study material:', id, data);
    
    return this.request<StudyMaterial>(
      `/api/study-materials/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * حذف أداة دراسية
   * DELETE /api/study-materials/:id
   */
  async deleteStudyMaterial(id: string): Promise<void> {
    console.log('[StudyMaterialsService] Deleting study material:', id);
    
    await this.request<void>(
      `/api/study-materials/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * تفعيل/تعطيل أداة دراسية
   * PATCH /api/study-materials/:id/toggle-active
   */
  async toggleStudyMaterialActive(id: string): Promise<StudyMaterial> {
    return this.request<StudyMaterial>(
      `/api/study-materials/${id}/toggle-active`,
      {
        method: 'PATCH',
      }
    );
  }

  // ==================== DELIVERIES APIs ====================

  /**
   * جلب سجلات التسليم
   * GET /api/study-materials/deliveries
   */
  async getDeliveries(params?: GetMaterialDeliveriesParams): Promise<MaterialDeliveriesResponse> {
    const queryParams = new URLSearchParams();

    if (params?.studyMaterialId) queryParams.append('studyMaterialId', params.studyMaterialId);
    if (params?.traineeId) queryParams.append('traineeId', params.traineeId.toString());
    if (params?.deliveredBy) queryParams.append('deliveredBy', params.deliveredBy);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/study-materials/deliveries${queryString ? `?${queryString}` : ''}`;

    return this.request<MaterialDeliveriesResponse>(endpoint);
  }

  /**
   * جلب المتدربين الذين لم يستلموا أداة معينة
   * GET /api/study-materials/:id/non-recipients
   */
  async getNonRecipients(materialId: string): Promise<{
    material: StudyMaterial;
    nonRecipients: Array<{
      id: number;
      nameAr: string;
      nameEn: string;
      phone: string;
      nationalId: string;
      program: {
        id: number;
        nameAr: string;
      };
    }>;
  }> {
    return this.request(
      `/api/study-materials/${materialId}/non-recipients`
    );
  }

  /**
   * جلب المتدربين الذين استلموا أداة معينة
   * GET /api/study-materials/:id/recipients
   */
  async getRecipients(materialId: string): Promise<{
    material: StudyMaterial;
    recipients: MaterialDelivery[];
  }> {
    return this.request(
      `/api/study-materials/${materialId}/recipients`
    );
  }

  /**
   * تسجيل تسليم أداة دراسية لمتدرب
   * POST /api/study-materials/deliveries
   */
  async createDelivery(data: CreateMaterialDeliveryDto): Promise<MaterialDelivery> {
    console.log('[StudyMaterialsService] Creating delivery:', data);
    
    return this.request<MaterialDelivery>(
      '/api/study-materials/deliveries',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * حذف سجل تسليم
   * DELETE /api/study-materials/deliveries/:id
   */
  async deleteDelivery(id: string): Promise<void> {
    console.log('[StudyMaterialsService] Deleting delivery:', id);
    
    await this.request<void>(
      `/api/study-materials/deliveries/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  // ==================== STATISTICS APIs ====================

  /**
   * جلب إحصائيات الأدوات الدراسية
   * GET /api/study-materials/stats
   */
  async getStats(): Promise<StudyMaterialsStats> {
    return this.request<StudyMaterialsStats>(
      '/api/study-materials/stats'
    );
  }

  // ==================== RESPONSIBLE USERS APIs ====================

  /**
   * إضافة مسؤول عن تسليم أداة
   * POST /api/study-materials/:id/responsible-users
   */
  async addResponsibleUser(
    materialId: string,
    userId: string,
    notes?: string
  ): Promise<StudyMaterial> {
    return this.request<StudyMaterial>(
      `/api/study-materials/${materialId}/responsible-users`,
      {
        method: 'POST',
        body: JSON.stringify({ userId, notes }),
      }
    );
  }

  /**
   * إزالة مسؤول عن تسليم أداة
   * DELETE /api/study-materials/:materialId/responsible-users/:userId
   */
  async removeResponsibleUser(
    materialId: string,
    userId: string
  ): Promise<StudyMaterial> {
    return this.request<StudyMaterial>(
      `/api/study-materials/${materialId}/responsible-users/${userId}`,
      {
        method: 'DELETE',
      }
    );
  }
}

// Export singleton instance
export default new StudyMaterialsService();