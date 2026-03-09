import AsyncStorage from '@react-native-async-storage/async-storage';
import { WhatsAppQRCodeResponse, WhatsAppStatusResponse, WhatsAppSendMessageRequest, WhatsAppSendMessageResponse, WhatsAppLogoutResponse } from '../types/whatsapp';
import { AuthData, User } from '../types/auth';
import { getCurrentApiBaseUrl } from '../config/api';

// Keep legacy interface for backward compatibility
interface LegacyAuthDataLocal {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  expiresAt: number;
}

class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'user_data';
  private static readonly EXPIRES_KEY = 'token_expires';

  // Helper method to get the current API base URL
  private static async getApiBaseUrl(): Promise<string> {
    try {
      const baseUrl = await getCurrentApiBaseUrl();
      console.log('🔍 AuthService.getApiBaseUrl() - Retrieved base URL:', baseUrl);
      return baseUrl;
    } catch (error) {
      console.error('Error getting API base URL:', error);
      const fallbackUrl = 'https://erpproductionbackend-production.up.railway.app';
      console.log('🔍 AuthService.getApiBaseUrl() - Using fallback URL:', fallbackUrl);
      return fallbackUrl; // fallback to default
    }
  }

  // التحقق من صحة API endpoint
  private static async validateApiEndpoint(baseUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
      });
      
      return response.ok;
    } catch (error) {
      console.warn('🔍 AuthService.validateApiEndpoint() - Validation failed:', error);
      return false;
    }
  }

  // Public method to get the current API base URL for external use
  static async getCurrentApiBaseUrl(): Promise<string> {
    return this.getApiBaseUrl();
  }

  // حفظ بيانات تسجيل الدخول - محدث لدعم الأدوار
  static async saveAuthData(token: string, user: User | any, expiresIn?: number) {
    try {
      // إذا لم يتم تحديد مدة الانتهاء، استخدم 7 أيام كافتراضي
      const defaultExpiresIn = 7 * 24 * 60 * 60 * 1000; // 7 أيام
      const expiresAt = Date.now() + (expiresIn || defaultExpiresIn);
      
      await AsyncStorage.multiSet([
        [this.TOKEN_KEY, token],
        [this.USER_KEY, JSON.stringify(user)],
        [this.EXPIRES_KEY, expiresAt.toString()]
      ]);
      
      console.log('Auth data saved successfully');
      console.log('User roles:', user.roles ? `${user.roles.length} roles` : 'no roles');
      console.log('Primary role:', user.primaryRole?.displayName || 'no primary role');
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  }

  // جلب بيانات تسجيل الدخول - محدث لدعم الأدوار
  static async getAuthData(): Promise<AuthData | LegacyAuthDataLocal | null> {
    try {
      const [token, userData, expiresAt] = await AsyncStorage.multiGet([
        this.TOKEN_KEY,
        this.USER_KEY,
        this.EXPIRES_KEY
      ]);

      if (!token[1] || !userData[1] || !expiresAt[1]) {
        return null;
      }

      const expires = parseInt(expiresAt[1], 10);
      
      // التحقق من انتهاء صلاحية الـ token
      if (Date.now() > expires) {
        await this.clearAuthData();
        return null;
      }

      const user = JSON.parse(userData[1]);
      
      return {
        token: token[1],
        user,
        expiresAt: expires
      };
    } catch (error) {
      console.error('Error getting auth data:', error);
      return null;
    }
  }

  // التحقق من وجود جلسة صالحة
  static async isAuthenticated(): Promise<boolean> {
    const authData = await this.getAuthData();
    return authData !== null;
  }

  // جلب الـ token
  static async getToken(): Promise<string | null> {
    const authData = await this.getAuthData();
    return authData?.token || null;
  }

  // جلب بيانات المستخدم
  static async getUser(): Promise<User | any | null> {
    const authData = await this.getAuthData();
    return authData?.user || null;
  }

  // جلب أدوار المستخدم الحالي
  static async getUserRoles(): Promise<any[] | null> {
    const user = await this.getUser();
    return user?.roles || null;
  }

  // جلب الدور الأساسي للمستخدم
  static async getUserPrimaryRole(): Promise<any | null> {
    const user = await this.getUser();
    return user?.primaryRole || null;
  }

  // التحقق من وجود دور محدد للمستخدم
  static async hasRole(roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles();
    if (!roles) return false;
    return roles.some(role => role.name === roleName || role.displayName === roleName);
  }

  // التحقق من الصلاحية حسب أولوية الدور
  static async hasMinimumRolePriority(minimumPriority: number): Promise<boolean> {
    const primaryRole = await this.getUserPrimaryRole();
    if (!primaryRole) return false;
    return primaryRole.priority >= minimumPriority;
  }

  // مسح بيانات تسجيل الدخول
  static async clearAuthData() {
    try {
      await AsyncStorage.multiRemove([
        this.TOKEN_KEY,
        this.USER_KEY,
        this.EXPIRES_KEY
      ]);
      console.log('Auth data cleared successfully');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // تحديث الـ token
  static async refreshToken(newToken: string, expiresIn: number = 7 * 24 * 60 * 60 * 1000) {
    try {
      const expiresAt = Date.now() + expiresIn;
      await AsyncStorage.setItem(this.TOKEN_KEY, newToken);
      await AsyncStorage.setItem(this.EXPIRES_KEY, expiresAt.toString());
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }

  // التحقق من انتهاء صلاحية الـ token
  static async isTokenExpired(): Promise<boolean> {
    try {
      const expiresAt = await AsyncStorage.getItem(this.EXPIRES_KEY);
      if (!expiresAt) return true;
      
      return Date.now() > parseInt(expiresAt, 10);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  // التحقق من صحة الـ token مع الـ API
  static async validateTokenWithAPI(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) return false;

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating token with API:', error);
      return false;
    }
  }

  // تسجيل الخروج مع إشعار الـ API
  static async logout(clearBranch = false) {
    try {
      const token = await this.getToken();
      
      // إشعار الـ API بتسجيل الخروج (اختياري)
      if (token) {
        try {
          const baseUrl = await this.getApiBaseUrl();
          await fetch(`${baseUrl}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.log('Logout API call failed, but continuing with local logout');
        }
      }

      // مسح البيانات المحلية
      await this.clearAuthData();
      
      // مسح بيانات الفرع إذا طُلب ذلك
      if (clearBranch) {
        console.log('🔓 AuthService.logout() - Clearing branch data as requested');
        const BranchService = require('./BranchService').default;
        await BranchService.clearBranchData();
      } else {
        console.log('🔓 AuthService.logout() - Not clearing branch data (clearBranch=false)');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // مسح البيانات المحلية حتى لو فشل الـ API call
      await this.clearAuthData();
      
      // مسح بيانات الفرع إذا طُلب ذلك
      if (clearBranch) {
        try {
          console.log('🔓 AuthService.logout() - Clearing branch data in catch block');
          const BranchService = require('./BranchService').default;
          await BranchService.clearBranchData();
        } catch (branchError) {
          console.error('Error clearing branch data:', branchError);
        }
      } else {
        console.log('🔓 AuthService.logout() - Not clearing branch data in catch block (clearBranch=false)');
      }
    }
  }

  // حذف برنامج تدريبي
  static async deleteProgram(programId: number): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/programs/${programId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // إلقاء خطأ مع رسالة من الـ API إذا كانت متاحة
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error deleting program in AuthService:', error);
      // إعادة إلقاء الخطأ ليتم التعامل معه في الشاشة
      throw error;
    }
  }

  // تحديث برنامج تدريبي
  static async updateProgram(programId: number, programData: any): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/programs/${programId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(programData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating program in AuthService:', error);
      throw error;
    }
  }

  // جلب قائمة الطلاب مع الفلاتر والترقيم
  static async getTrainees(params: { page?: number; limit?: number; search?: string; programId?: string; status?: string; includeDetails?: boolean }): Promise<import('../types/student').IPaginatedTraineesResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      // بناء الـ query string
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.programId) queryParams.append('programId', params.programId);
      if (params.status) queryParams.append('status', params.status);
      if (params.includeDetails) queryParams.append('includeDetails', 'true');

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/trainees?${queryParams.toString()}`;
      console.log('🔍 AuthService.getTrainees() - Fetching from URL:', url);
      console.log('🔍 AuthService.getTrainees() - Using token:', token.substring(0, 20) + '...');
      console.log('🔍 AuthService.getTrainees() - Query params:', queryParams.toString());

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 AuthService.getTrainees() - Response status:', response.status);
      console.log('🔍 AuthService.getTrainees() - Response headers:', Object.fromEntries(response.headers.entries()));

      // التحقق من حالة الاستجابة
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData;
        
        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.log('🔍 AuthService.getTrainees() - Error response data:', errorData);
        } catch (parseError) {
          const textResponse = await response.text();
          console.log('🔍 AuthService.getTrainees() - Error response text:', textResponse);
          errorMessage = textResponse || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
        console.log('🔍 AuthService.getTrainees() - Success response data:', data);
      } catch (parseError) {
        console.error('🔍 AuthService.getTrainees() - Error parsing JSON response:', parseError);
        const textResponse = await response.text();
        console.log('🔍 AuthService.getTrainees() - Raw response:', textResponse);
        throw new Error(`Invalid JSON response: ${textResponse}`);
      }

      return data;
    } catch (error) {
      console.error('🔍 AuthService.getTrainees() - Error fetching trainees:', error);
      
      // معالجة أنواع مختلفة من الأخطاء
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.');
        } else if (error.message.includes('Network request failed')) {
          throw new Error('فشل في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        } else if (error.message.includes('500') || error.message.includes('Internal server error')) {
          // إرجاع خطأ مخصص للخادم الداخلي
          const serverError = new Error('خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.');
          serverError.name = 'InternalServerError';
          throw serverError;
        }
      }
      
      throw error;
    }
  }

  // إضافة طالب جديد
  static async addTrainee(traineeData: any): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/trainees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(traineeData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error adding trainee in AuthService:', error);
      throw error;
    }
  }

  // جلب كل البرامج التدريبية
  static async getAllPrograms(): Promise<any[]> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      console.log('🔍 AuthService.getAllPrograms() - API URL:', `${baseUrl}/api/programs`);
      
      const response = await fetch(`${baseUrl}/api/programs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 AuthService.getAllPrograms() - Response status:', response.status);

      const data = await response.json();
      console.log('🔍 AuthService.getAllPrograms() - Raw response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Debug: Check if data contains classrooms
      if (Array.isArray(data)) {
        data.forEach((program, index) => {
          console.log(`🔍 AuthService.getAllPrograms() - Program ${index + 1}:`, {
            id: program.id,
            nameAr: program.nameAr,
            hasClassrooms: !!program.classrooms,
            classroomsLength: program.classrooms?.length || 0,
            classrooms: program.classrooms
          });
        });
      }

      return data;
    } catch (error) {
      console.error('Error fetching all programs in AuthService:', error);
      throw error;
    }
  }

  // جلب كل المستخدمين
  static async getAllUsers(role?: string): Promise<any[]> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      let url = `${baseUrl}/api/users`;
      if (role) {
        url += `?role=${role}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching all users in AuthService:', error);
      throw error;
    }
  }

  // إضافة محتوى تدريبي جديد
  static async addTrainingContent(contentData: any): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/training-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(contentData),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          // Throw error with message from API if available
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (e) {
          // If parsing JSON fails, use the raw text response
          const errorText = await response.text();
          throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding training content in AuthService:', error);
      throw error;
    }
  }

  static async generateTrainingContentCode(): Promise<{ code: string }> {
    try {
      // Try to get token using the old method first (for backward compatibility)
      let token = await AsyncStorage.getItem('token');
      
      // If not found, try the new method
      if (!token) {
        token = await this.getToken();
      }
      
      if (!token) {
        throw new Error('لم يتم العثور على رمز المصادقة');
      }

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/training-contents/generate-code`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.log('API Error Response:', errorData);
        console.log('Response Status:', response.status);
        
        if (response.status === 401) {
          await this.logout();
          throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        }
        throw new Error(`فشل في توليد كود المادة: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      
      // Check if the response has the expected structure
      if (!data || !data.code) {
        console.log('Invalid response structure:', data);
        throw new Error('استجابة غير صحيحة من الخادم');
      }
      
      return data;
    } catch (error) {
      console.error('Error generating training content code:', error);
      throw error;
    }
  }

  // جلب قائمة المحتوى التدريبي
  static async getTrainingContents(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    programId?: number; 
    semester?: string; 
    year?: string;
    includeQuestionCount?: boolean;
  }): Promise<import('../types/student').ITrainingContent[]> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      // بناء الـ query string
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.programId) queryParams.append('programId', params.programId.toString());
      if (params?.semester) queryParams.append('semester', params.semester);
      if (params?.year) queryParams.append('year', params.year);
      if (params?.includeQuestionCount) queryParams.append('includeQuestionCount', 'true');

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/training-contents?${queryParams.toString()}`;
      console.log('Fetching training contents from URL:', url);
      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        const textResponse = await response.text();
        console.log('Raw response:', textResponse);
        throw new Error(`Invalid JSON response: ${textResponse}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching training contents in AuthService:', error);
      throw error;
    }
  }

  // تحديث محتوى تدريبي
  static async updateTrainingContent(contentId: number, contentData: any): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/training-contents/${contentId}`;
      console.log('Updating training content at URL:', url);
      console.log('Update data:', JSON.stringify(contentData, null, 2));

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(contentData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        const textResponse = await response.text();
        console.log('Raw response:', textResponse);
        throw new Error(`Invalid JSON response: ${textResponse}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating training content in AuthService:', error);
      throw error;
    }
  }

  // حذف محتوى تدريبي
  static async deleteTrainingContent(contentId: number): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/training-contents/${contentId}`;
      console.log('Deleting training content at URL:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        const textResponse = await response.text();
        console.log('Raw response:', textResponse);
        // للحذف، قد لا يكون هناك response body
        if (response.ok) {
          return { success: true };
        }
        throw new Error(`Invalid JSON response: ${textResponse}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error deleting training content in AuthService:', error);
      throw error;
    }
  }

  // Get All Questions (Question Bank)
  static async getAllQuestions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    contentId?: number;
    type?: string;
    skill?: string;
    difficulty?: string;
  }): Promise<import('../types/student').IQuestion[]> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      
      // محاولة الـ API endpoint الجديد أولاً
      try {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.contentId) queryParams.append('contentId', params.contentId.toString());
        if (params?.type) queryParams.append('type', params.type);
        if (params?.skill) queryParams.append('skill', params.skill);
        if (params?.difficulty) queryParams.append('difficulty', params.difficulty);

        const url = `${baseUrl}/api/questions?${queryParams.toString()}`;
        console.log('Fetching all questions from URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('Get all questions response status:', response.status);

        if (response.ok) {
          let data;
          try {
            data = await response.json();
            console.log('Get all questions response data:', data);
          } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            const textResponse = await response.text();
            console.log('Raw response:', textResponse);
            throw new Error(`Invalid JSON response: ${textResponse}`);
          }

          // معالجة البيانات إذا كانت في بنية pagination
          if (Array.isArray(data)) {
            return data;
          } else if (data && Array.isArray(data.data)) {
            return data.data;
          } else if (data && Array.isArray(data.questions)) {
            return data.questions;
          } else if (data && Array.isArray(data.items)) {
            return data.items;
          } else {
            console.warn('Unexpected data structure:', data);
            return [];
          }
        } else {
          console.warn('Question bank API failed, falling back to content-specific endpoint');
          throw new Error(`Question bank API failed: ${response.status}`);
        }
      } catch (apiError) {
        console.warn('Question bank API not available, trying alternative approach:', apiError);
        
        // إذا فشل الـ API الجديد، جرب الـ API القديم
        if (params?.contentId) {
          console.log('Falling back to content-specific questions endpoint');
          const contentData = await this.getQuestionsByContent(params.contentId);
          
          // معالجة البيانات من الـ API القديم
          if (Array.isArray(contentData)) {
            return contentData;
          } else if (contentData && Array.isArray(contentData.data)) {
            return contentData.data;
          } else if (contentData && Array.isArray(contentData.questions)) {
            return contentData.questions;
          }
        }
        
        throw apiError;
      }
    } catch (error) {
      console.error('Error fetching all questions in AuthService:', error);
      throw error;
    }
  }

  // Get Questions by Content ID
  static async getQuestionsByContent(contentId: number): Promise<import('../types/student').IQuestionsByContentResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      console.log(`[AuthService] Fetching questions for content ID: ${contentId}`);

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/questions/content/${contentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`[AuthService] Get questions response status: ${response.status}`);
      console.log(`[AuthService] Get questions response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AuthService] Get questions failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[AuthService] Questions fetched successfully:`, data);

      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching questions:', error);
      throw error;
    }
  }

  // Create Question
  static async createQuestion(questionData: import('../types/student').CreateQuestionPayload): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      console.log(`[AuthService] Creating question for content ID: ${questionData.contentId}`);

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });

      console.log(`[AuthService] Create question response status: ${response.status}`);
      console.log(`[AuthService] Create question response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AuthService] Create question failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to create question: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[AuthService] Question created successfully:`, data);

      return data;
    } catch (error) {
      console.error('[AuthService] Error creating question:', error);
      throw error;
    }
  }

  // Create Safe (Treasury)
  static async createSafe(safeData: import('../types/student').CreateSafePayload): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      console.log(`[AuthService] Creating safe:`, safeData);

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/finances/safes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(safeData),
      });

      console.log(`[AuthService] Create safe response status: ${response.status}`);
      console.log(`[AuthService] Create safe response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AuthService] Create safe failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to create safe: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[AuthService] Safe created successfully:`, data);

      return data;
    } catch (error) {
      console.error('[AuthService] Error creating safe:', error);
      throw error;
    }
  }

  // Get Trainee Payments
  static async getTraineePayments(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string;
    traineeId?: number;
    feeId?: number;
  }): Promise<import('../types/student').ITraineePaymentsResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      // بناء الـ query string
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.traineeId) queryParams.append('traineeId', params.traineeId.toString());
      if (params?.feeId) queryParams.append('feeId', params.feeId.toString());

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/finances/trainee-payments?${queryParams.toString()}`;
      console.log('Fetching trainee payments from URL:', url);
      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        const textResponse = await response.text();
        console.log('Raw response:', textResponse);
        throw new Error(`Invalid JSON response: ${textResponse}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('=== AuthService Response ===');
      console.log('AuthService: Returning data:', data);
      console.log('AuthService: Data type:', typeof data);
      console.log('AuthService: Is array:', Array.isArray(data));
      if (Array.isArray(data)) {
        console.log('AuthService: Array length:', data.length);
      } else if (data && typeof data === 'object') {
        console.log('AuthService: Object keys:', Object.keys(data));
      }
      console.log('=== End AuthService Response ===');
      
      return data;
    } catch (error) {
      console.error('Error fetching trainee payments in AuthService:', error);
      throw error;
    }
  }

  // Get Trainee Payments by Trainee ID
  static async getTraineePaymentsByTrainee(traineeId: number): Promise<import('../types/student').TraineePaymentByTraineeResponse[]> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }
      
      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/finances/trainees/${traineeId}/payments`;
      console.log('Fetching trainee payments by trainee from URL:', url);
      console.log('Using token:', token.substring(0, 20) + '...');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        const textResponse = await response.text();
        console.log('Raw response:', textResponse);
        throw new Error(`Invalid JSON response: ${textResponse}`);
      }
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching trainee payments by trainee in AuthService:', error);
      throw error;
    }
  }

  // Auto Payment
  static async processAutoPayment(paymentData: import('../types/student').AutoPaymentRequest): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }
      
      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/finances/auto-payment`;
      console.log('Processing auto payment to URL:', url);
      console.log('Payment data:', paymentData);
      console.log('Using token:', token.substring(0, 20) + '...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        const textResponse = await response.text();
        console.log('Raw response:', textResponse);
        throw new Error(`Invalid JSON response: ${textResponse}`);
      }
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error processing auto payment in AuthService:', error);
      throw error;
    }
  }

  // Get All Safes (Treasuries)
  static async getAllSafes(): Promise<import('../types/student').ISafesResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      console.log(`[AuthService] Fetching all safes`);

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/finances/safes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`[AuthService] Get safes response status: ${response.status}`);
      console.log(`[AuthService] Get safes response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AuthService] Get safes failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch safes: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[AuthService] Safes fetched successfully:`, data);

      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching safes:', error);
      throw error;
    }
  }

  // Permissions: Get roles with relations
  static async getRoles(): Promise<import('../types/permissions').RolesResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/permissions/roles`;
      console.log('[AuthService] Fetching roles from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AuthService] Get roles response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AuthService] Get roles failed:', response.status, errorText);
        throw new Error(`Failed to fetch roles: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching roles:', error);
      throw error;
    }
  }

  // Permissions: Get role by id
  static async getRoleById(roleId: string): Promise<import('../types/permissions').RoleByIdResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/permissions/roles/${roleId}`;
      console.log('[AuthService] Fetching role by id from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AuthService] Get role by id response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AuthService] Get role by id failed:', response.status, errorText);
        throw new Error(`Failed to fetch role: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching role by id:', error);
      throw error;
    }
  }

  // Users: Create user
  static async createUser(payload: import('../types/users').CreateUserRequest): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/users`;
      console.log('[AuthService] Creating user');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to create user: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error creating user:', error);
      throw error;
    }
  }

  // Users: Get all users with relations
  static async getUsers(): Promise<import('../types/users').UsersResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/users`;
      console.log('[AuthService] Fetching users');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch users: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error fetching users:', error);
      throw error;
    }
  }

  // Users: Update user (PATCH)
  static async updateUser(userId: string, payload: import('../types/users').UpdateUserRequest): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const url = `https://erpproductionbackend-production.up.railway.app/api/users/${userId}`;
      // Sanitize payload: drop undefined/empty string fields
      const cleanedEntries = Object.entries(payload).filter(([key, value]) => value !== undefined && value !== '');
      const cleanedPayload = cleanedEntries.reduce((acc: any, [k, v]) => {
        if (typeof v === 'string') acc[k] = v.trim(); else acc[k] = v;
        return acc;
      }, {} as Record<string, unknown>);

      // If roleId provided but blank string, omit it
      if ('roleId' in cleanedPayload && (!cleanedPayload.roleId || cleanedPayload.roleId === '')) {
        delete (cleanedPayload as any).roleId;
      }

      console.log('[AuthService] Updating user', userId, 'with payload:', cleanedPayload);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedPayload),
      });

      if (!response.ok) {
        try {
          const errJson = await response.json();
          throw new Error(errJson?.message || `Failed to update user: ${response.status}`);
        } catch {
          const errorText = await response.text();
          throw new Error(errorText || `Failed to update user: ${response.status}`);
        }
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error updating user:', error);
      throw error;
    }
  }

  // Users: Delete user
  static async deleteUser(userId: string): Promise<{ success: boolean } | any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/users/${userId}`;
      console.log('[AuthService] Deleting user', userId);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to delete user: ${response.status}`);
      }

      try { return await response.json(); } catch { return { success: true }; }
    } catch (error) {
      console.error('[AuthService] Error deleting user:', error);
      throw error;
    }
  }

  // Marketing: Get marketing employees
  static async getMarketingEmployees(): Promise<import('../types/marketing').MarketingEmployeesResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/marketing/employees`;
      console.log('[AuthService] Fetching marketing employees');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch marketing employees: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error fetching marketing employees:', error);
      throw error;
    }
  }

  // Marketing: Create marketing employee
  static async createMarketingEmployee(payload: import('../types/marketing').CreateMarketingEmployeeRequest): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const url = `https://erpproductionbackend-production.up.railway.app/api/marketing/employees`;
      console.log('[AuthService] Creating marketing employee');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to create marketing employee: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error creating marketing employee:', error);
      throw error;
    }
  }

  // Marketing: Update marketing employee (PUT)
  static async updateMarketingEmployee(id: number | string, payload: import('../types/marketing').UpdateMarketingEmployeeRequest): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/marketing/employees/${id}`;
      console.log('[AuthService] Updating marketing employee', id);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update marketing employee: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error updating marketing employee:', error);
      throw error;
    }
  }

  // Marketing: Delete marketing employee
  static async deleteMarketingEmployee(id: number | string): Promise<{ success: boolean } | any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/marketing/employees/${id}`;
      console.log('[AuthService] Deleting marketing employee', id);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to delete marketing employee: ${response.status}`);
      }

      try { return await response.json(); } catch { return { success: true }; }
    } catch (error) {
      console.error('[AuthService] Error deleting marketing employee:', error);
      throw error;
    }
  }

  // Marketing Targets: Get marketing targets
  static async getMarketingTargets(params?: import('../types/marketing').GetMarketingTargetsQuery): Promise<import('../types/marketing').MarketingTargetsResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const queryParams = new URLSearchParams();
      if (params?.month) queryParams.append('month', params.month.toString());
      if (params?.year) queryParams.append('year', params.year.toString());

      const url = `https://erpproductionbackend-production.up.railway.app/api/marketing/targets?${queryParams.toString()}`;
      console.log('[AuthService] Fetching marketing targets from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch marketing targets: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error fetching marketing targets:', error);
      throw error;
    }
  }

  // Marketing Targets: Create marketing target
  static async createMarketingTarget(payload: import('../types/marketing').CreateMarketingTargetRequest): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      // الحصول على معلومات المستخدم الحالي
      const user = await this.getUser();
      const payloadWithUser = {
        ...payload,
        setById: user?.id || undefined, // إضافة معرف المستخدم الحالي
      };

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/marketing/targets`;
      console.log('[AuthService] Creating marketing target with payload:', payloadWithUser);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadWithUser),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to create marketing target: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error creating marketing target:', error);
      throw error;
    }
  }

  // Marketing Targets: Update marketing target
  static async updateMarketingTarget(id: number, payload: import('../types/marketing').UpdateMarketingTargetRequest): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const user = await this.getUser();
      const payloadWithUser = {
        ...payload,
        setById: user?.id || undefined, // إضافة معرف المستخدم الحالي
      };

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/marketing/targets/${id}`;
      console.log('[AuthService] Updating marketing target', id, 'with payload:', payloadWithUser);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadWithUser),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update marketing target: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error updating marketing target:', error);
      throw error;
    }
  }

  // Marketing Targets: Delete marketing target
  static async deleteMarketingTarget(id: number): Promise<{ success: boolean } | any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const url = `https://erpproductionbackend-production.up.railway.app/api/marketing/targets/${id}`;
      console.log('[AuthService] Deleting marketing target', id);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to delete marketing target: ${response.status}`);
      }

      try { return await response.json(); } catch { return { success: true }; }
    } catch (error) {
      console.error('[AuthService] Error deleting marketing target:', error);
      throw error;
    }
  }

  // Marketing Targets: Get marketing target stats
  static async getMarketingTargetStats(params?: {
    month?: number;
    year?: number;
  }): Promise<import('../types/marketing').MarketingTargetStats> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const queryParams = new URLSearchParams();
      if (params?.month) queryParams.append('month', params.month.toString());
      if (params?.year) queryParams.append('year', params.year.toString());

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/marketing/targets/stats?${queryParams.toString()}`;
      console.log('[AuthService] Fetching marketing target stats from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch marketing target stats: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error fetching marketing target stats:', error);
      throw error;
    }
  }

  // Get Safe Transactions
  static async getSafeTransactions(safeId: string): Promise<import('../types/student').ITransaction[]> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      console.log(`[AuthService] Fetching transactions for safe: ${safeId}`);

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/finances/safes/${safeId}/transactions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`[AuthService] Get safe transactions response status: ${response.status}`);
      console.log(`[AuthService] Get safe transactions response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AuthService] Get safe transactions failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch safe transactions: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[AuthService] Safe transactions fetched successfully:`, data);

      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching safe transactions:', error);
      throw error;
    }
  }

  // Create Transaction
  static async createTransaction(transactionData: import('../types/student').CreateTransactionPayload): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      console.log(`[AuthService] Creating transaction:`, transactionData);

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/finances/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      console.log(`[AuthService] Create transaction response status: ${response.status}`);
      console.log(`[AuthService] Create transaction response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AuthService] Create transaction failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to create transaction: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[AuthService] Transaction created successfully:`, data);

      return data;
    } catch (error) {
      console.error('[AuthService] Error creating transaction:', error);
      throw error;
    }
  }

  // Create Trainee Fee
  static async createTraineeFee(feeData: import('../types/student').CreateTraineeFeePayload): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      console.log(`[AuthService] Creating trainee fee:`, feeData);

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/finances/trainee-fees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feeData),
      });

      console.log(`[AuthService] Create trainee fee response status: ${response.status}`);
      console.log(`[AuthService] Create trainee fee response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AuthService] Create trainee fee failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to create trainee fee: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[AuthService] Trainee fee created successfully:`, data);

      return data;
    } catch (error) {
      console.error('[AuthService] Error creating trainee fee:', error);
      throw error;
    }
  }

  // Get All Trainee Fees
  static async getAllTraineeFees(): Promise<import('../types/student').ITraineeFeesResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      console.log(`[AuthService] Fetching all trainee fees`);

      const baseUrl = await this.getApiBaseUrl();
      const fullUrl = `${baseUrl}/api/finances/trainee-fees`;
      console.log(`[AuthService] Full URL for trainee fees:`, fullUrl);
      console.log(`[AuthService] Base URL:`, baseUrl);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`[AuthService] Get trainee fees response status: ${response.status}`);
      console.log(`[AuthService] Get trainee fees response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AuthService] Get trainee fees failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch trainee fees: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[AuthService] Trainee fees fetched successfully:`, data);

      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching trainee fees:', error);
      throw error;
    }
  }

  // Apply Trainee Fee
  static async applyTraineeFee(feeId: number): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      console.log(`[AuthService] Applying trainee fee: ${feeId}`);

      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/finances/trainee-fees/${feeId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`[AuthService] Apply trainee fee response status: ${response.status}`);
      console.log(`[AuthService] Apply trainee fee response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AuthService] Apply trainee fee failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to apply trainee fee: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[AuthService] Trainee fee applied successfully:`, data);

      return data;
    } catch (error) {
      console.error('[AuthService] Error applying trainee fee:', error);
      throw error;
    }
  }

  // Marketing Trainees: Get marketing trainees with marketing info
  static async getMarketingTrainees(params?: {
    page?: number;
    limit?: number;
    search?: string;
    marketingEmployeeId?: number;
    programId?: number;
    status?: string;
  }): Promise<import('../types/marketing').MarketingTraineesResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.marketingEmployeeId) queryParams.append('marketingEmployeeId', params.marketingEmployeeId.toString());
      if (params?.programId) queryParams.append('programId', params.programId.toString());
      if (params?.status) queryParams.append('status', params.status);

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/marketing/trainees?${queryParams.toString()}`;
      console.log('[AuthService] Fetching marketing trainees from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch marketing trainees: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error fetching marketing trainees:', error);
      throw error;
    }
  }

  // Employee Trainees: Get trainees for a specific marketing employee
  static async getEmployeeTrainees(employeeId: number, params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<import('../types/marketing').EmployeeTraineesResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/marketing/employees/${employeeId}/trainees?${queryParams.toString()}`;
      console.log('[AuthService] Fetching employee trainees from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch employee trainees: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error fetching employee trainees:', error);
      throw error;
    }
  }

  // Marketing Stats: Get comprehensive marketing statistics
  static async getMarketingStats(params?: {
    month?: number;
    year?: number;
  }): Promise<import('../types/marketing').MarketingStatsResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const queryParams = new URLSearchParams();
      if (params?.month) queryParams.append('month', params.month.toString());
      if (params?.year) queryParams.append('year', params.year.toString());

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/marketing/stats?${queryParams.toString()}`;
      console.log('[AuthService] Fetching marketing stats from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch marketing stats: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error fetching marketing stats:', error);
      throw error;
    }
  }

  // Trainee Distribution: Create new distribution
  static async createTraineeDistribution(payload: import('../types/distribution').CreateTraineeDistributionRequest): Promise<import('../types/distribution').CreateTraineeDistributionResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/trainee-distribution`;
      console.log('[AuthService] Creating trainee distribution at URL:', url);
      console.log('[AuthService] Payload:', payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to create trainee distribution: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error creating trainee distribution:', error);
      throw error;
    }
  }

  // Trainee Distribution: Get distribution details by ID
  static async getTraineeDistribution(distributionId: string): Promise<import('../types/distribution').TraineeDistributionDetail> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/trainee-distribution/${distributionId}`;
      console.log('[AuthService] Getting trainee distribution at URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to get trainee distribution: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting trainee distribution:', error);
      throw error;
    }
  }

  // Trainee Distribution: Get all distributions with filters
  static async getTraineeDistributions(params?: {
    programId?: number;
    type?: import('../types/distribution').DistributionType;
    academicYear?: string;
  }): Promise<import('../types/distribution').TraineeDistributionsResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const queryParams = new URLSearchParams();
      if (params?.programId) queryParams.append('programId', params.programId.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.academicYear) queryParams.append('academicYear', params.academicYear);

      const url = `${baseUrl}/api/trainee-distribution?${queryParams.toString()}`;
      console.log('[AuthService] Getting trainee distributions at URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to get trainee distributions: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting trainee distributions:', error);
      throw error;
    }
  }

  // WhatsApp Management: Get QR Code for WhatsApp connection
  static async getWhatsAppQRCode(): Promise<WhatsAppQRCodeResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const url = 'https://erpproductionbackend-production.up.railway.app/api/whatsapp/qr-code';
      console.log('[AuthService] Fetching WhatsApp QR code from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch WhatsApp QR code: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AuthService] WhatsApp QR code response:', data);
      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching WhatsApp QR code:', error);
      throw error;
    }
  }

  // WhatsApp Management: Get detailed status of WhatsApp connection
  static async getWhatsAppStatus(): Promise<WhatsAppStatusResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/whatsapp/status`;
      console.log('[AuthService] Fetching WhatsApp status from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch WhatsApp status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AuthService] WhatsApp status response:', data);
      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching WhatsApp status:', error);
      throw error;
    }
  }

  // WhatsApp Management: Send test message
  static async sendWhatsAppMessage(data: WhatsAppSendMessageRequest): Promise<WhatsAppSendMessageResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/whatsapp/send-message`;
      console.log('[AuthService] Sending WhatsApp message to URL:', url);
      console.log('[AuthService] Message data:', data);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(errorText || `Failed to send WhatsApp message: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('[AuthService] WhatsApp message response:', responseData);
      return responseData;
    } catch (error) {
      console.error('[AuthService] Error sending WhatsApp message:', error);
      throw error;
    }
  }

  // WhatsApp Management: Logout from WhatsApp
  static async logoutWhatsApp(): Promise<WhatsAppLogoutResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/whatsapp/logout`;
      console.log('[AuthService] Logging out from WhatsApp at URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(errorText || `Failed to logout from WhatsApp: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('[AuthService] WhatsApp logout response:', responseData);
      return responseData;
    } catch (error) {
      console.error('[AuthService] Error logging out from WhatsApp:', error);
      throw error;
    }
  }

  // WhatsApp Management: Send Payment Confirmation
  static async sendPaymentConfirmation(data: WhatsAppSendMessageRequest): Promise<WhatsAppSendMessageResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/whatsapp/send-payment-confirmation`;
      console.log('[AuthService] Sending payment confirmation at URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(errorText || `Failed to send payment confirmation: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('[AuthService] Payment confirmation response:', responseData);
      return responseData;
    } catch (error) {
      console.error('[AuthService] Error sending payment confirmation:', error);
      throw error;
    }
  }

  // Lectures: Create lecture
  static async createLecture(payload: import('../types/lectures').CreateLectureRequest): Promise<import('../types/lectures').LectureResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/lectures`;
      console.log('[AuthService] Creating lecture at URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to create lecture: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error creating lecture:', error);
      throw error;
    }
  }

  // Lectures: Get lectures (optionally filter by contentId)
  static async getLectures(params?: { contentId?: number }): Promise<import('../types/lectures').LectureListItem[]> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const query = new URLSearchParams();
      if (params?.contentId) query.append('contentId', String(params.contentId));
      const url = `${baseUrl}/api/lectures${query.toString() ? `?${query.toString()}` : ''}`;
      console.log('[AuthService] Fetching lectures from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch lectures: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error fetching lectures:', error);
      throw error;
    }
  }

  // Lectures: Update lecture (PATCH)
  static async updateLecture(id: number, payload: import('../types/lectures').UpdateLectureRequest): Promise<import('../types/lectures').LectureResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/lectures/${id}`;
      console.log('[AuthService] Updating lecture at URL:', url);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update lecture: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error updating lecture:', error);
      throw error;
    }
  }

  // Lectures: Delete lecture
  static async deleteLecture(id: number): Promise<{ success: boolean } | any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/lectures/${id}`;
      console.log('[AuthService] Deleting lecture at URL:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to delete lecture: ${response.status}`);
      }

      try { return await response.json(); } catch { return { success: true }; }
    } catch (error) {
      console.error('[AuthService] Error deleting lecture:', error);
      throw error;
    }
  }

  // Trainee Management: Update Trainee
  static async updateTrainee(traineeId: number, updateData: import('../types/student').UpdateTraineePayload): Promise<import('../types/student').UpdateTraineeResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/trainees/${traineeId}`;
      console.log('[AuthService] Updating trainee at URL:', url);
      console.log('[AuthService] Update data:', JSON.stringify(updateData, null, 2));

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('[AuthService] Response status:', response.status);
      console.log('[AuthService] Response headers:', response.headers);

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log('[AuthService] Error response data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          console.log('[AuthService] Error response text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('[AuthService] Trainee update response:', responseData);
      
      // If the API returns the trainee data directly, wrap it in our expected format
      if (responseData && !responseData.success && !responseData.message) {
        return {
          success: true,
          message: 'تم تحديث بيانات المتدرب بنجاح',
          data: responseData
        };
      }
      
      return responseData;
    } catch (error) {
      console.error('[AuthService] Error updating trainee:', error);
      throw error;
    }
  }

  // Trainee Management: Delete Trainee
  static async deleteTrainee(traineeId: number): Promise<import('../types/student').DeleteTraineeResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/trainees/${traineeId}`;
      console.log('[AuthService] Deleting trainee at URL:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AuthService] Response status:', response.status);
      console.log('[AuthService] Response headers:', response.headers);

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log('[AuthService] Error response data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          console.log('[AuthService] Error response text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('[AuthService] Trainee delete response:', responseData);
      
      // If the API returns a simple success response, wrap it in our expected format
      if (responseData && !responseData.success && !responseData.message) {
        return {
          success: true,
          message: 'تم حذف المتدرب بنجاح'
        };
      }
      
      return responseData;
    } catch (error) {
      console.error('[AuthService] Error deleting trainee:', error);
      throw error;
    }
  }

  // Trainee Management: Get Trainee Documents
  static async getTraineeDocuments(traineeId: number): Promise<import('../types/student').TraineeDocumentsResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/trainees/${traineeId}/documents`;
      console.log('[AuthService] Getting trainee documents at URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AuthService] Response status:', response.status);
      console.log('[AuthService] Response headers:', response.headers);

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log('[AuthService] Error response data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          console.log('[AuthService] Error response text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('[AuthService] Trainee documents response:', responseData);
      
      return responseData;
    } catch (error) {
      console.error('[AuthService] Error getting trainee documents:', error);
      throw error;
    }
  }

  // User Role Management: Assign role to user
  static async assignUserRole(userId: string, roleId: string): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/permissions/users/${userId}/roles/${roleId}`;
      console.log('[AuthService] Assigning role to user at URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to assign role: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error assigning user role:', error);
      throw error;
    }
  }

  // User Role Management: Remove role from user
  static async removeUserRole(userId: string, roleId: string): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/permissions/users/${userId}/roles/${roleId}`;
      console.log('[AuthService] Removing role from user at URL:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to remove role: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error removing user role:', error);
      throw error;
    }
  }

  // User Role Management: Toggle role status (activate/deactivate)
  static async toggleUserRoleStatus(userId: string, roleId: string, isActive: boolean): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/permissions/users/${userId}/roles/${roleId}`;
      console.log('[AuthService] Toggling role status at URL:', url);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to toggle role status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error toggling user role status:', error);
      throw error;
    }
  }

  // Quiz Management Functions
  static async createQuiz(quizData: import('../types/quiz').CreateQuizRequest): Promise<import('../types/quiz').QuizResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/quizzes`;
      console.log('[AuthService] Creating quiz at URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to create quiz: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error creating quiz:', error);
      throw error;
    }
  }

  static async getAllQuizzes(params?: {
    page?: number;
    limit?: number;
    trainingContentId?: number;
    isActive?: boolean;
    isPublished?: boolean;
  }): Promise<import('../types/quiz').QuizListResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.trainingContentId) queryParams.append('trainingContentId', params.trainingContentId.toString());
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());

      const url = `${baseUrl}/api/quizzes?${queryParams.toString()}`;
      console.log('[AuthService] Getting quizzes at URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to get quizzes: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting quizzes:', error);
      throw error;
    }
  }

  static async getQuizById(quizId: number): Promise<import('../types/quiz').QuizResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/quizzes/${quizId}`;
      console.log('[AuthService] Getting quiz by ID at URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to get quiz: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting quiz by ID:', error);
      throw error;
    }
  }

  static async updateQuiz(quizId: number, quizData: import('../types/quiz').UpdateQuizRequest): Promise<import('../types/quiz').QuizResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/quizzes/${quizId}`;
      console.log('[AuthService] Updating quiz at URL:', url);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update quiz: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error updating quiz:', error);
      throw error;
    }
  }

  static async deleteQuiz(quizId: number): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/quizzes/${quizId}`;
      console.log('[AuthService] Deleting quiz at URL:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to delete quiz: ${response.status}`);
      }
    } catch (error) {
      console.error('[AuthService] Error deleting quiz:', error);
      throw error;
    }
  }

  static async getQuizStats(): Promise<import('../types/quiz').QuizStats> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/quizzes/stats`;
      console.log('[AuthService] Getting quiz stats at URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to get quiz stats: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting quiz stats:', error);
      throw error;
    }
  }

  static async getQuizAttempts(quizId: number, params?: {
    page?: number;
    limit?: number;
  }): Promise<import('../types/quiz').QuizAttemptsResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `${baseUrl}/api/quizzes/${quizId}/attempts?${queryParams.toString()}`;
      console.log('[AuthService] Getting quiz attempts at URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to get quiz attempts: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting quiz attempts:', error);
      throw error;
    }
  }

  /**
   * جلب حسابات المتدربين من منصة الطلاب
   */
  static async getTraineeAccounts(params?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: Array<{
      id: string;
      nationalId: string;
      birthDate: string;
      password: string | null;
      isActive: boolean;
      lastLoginAt: string | null;
      resetCode: string | null;
      resetCodeExpiresAt: string | null;
      resetCodeGeneratedAt: string | null;
      traineeId: number;
      createdAt: string;
      updatedAt: string;
      trainee: {
        id: number;
        nameAr: string;
        nameEn: string;
        nationalId: string;
        email: string | null;
        phone: string;
        photoUrl: string | null;
        traineeStatus: string;
        classLevel: string | null;
        academicYear: string | null;
        program: {
          id: number;
          nameAr: string;
          nameEn: string;
        };
      };
    }>;
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const queryParams = new URLSearchParams();

      if (params?.search) queryParams.append('search', params.search);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `${baseUrl}/api/trainee-platform/accounts?${queryParams.toString()}`;
      console.log('🔍 AuthService.getTraineeAccounts() - Fetching from URL:', url);
      console.log('🔍 AuthService.getTraineeAccounts() - Query params:', queryParams.toString());
      console.log('🔍 AuthService.getTraineeAccounts() - Using token:', token.substring(0, 20) + '...');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('🔍 AuthService.getTraineeAccounts() - Response not OK:', response.status, response.statusText);
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        console.log('🔍 AuthService.getTraineeAccounts() - Error response:', errorText);
        throw new Error(errorText || `Failed to get trainee accounts: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 AuthService.getTraineeAccounts() - Response:', data);
      console.log('🔍 AuthService.getTraineeAccounts() - Data length:', data.data?.length || 0);
      console.log('🔍 AuthService.getTraineeAccounts() - Meta:', data.meta);
      return data;
    } catch (error) {
      console.error('[AuthService] Error getting trainee accounts:', error);
      throw error;
    }
  }

  /**
   * جلب تفاصيل حساب متدرب معين
   */
  static async getTraineeAccountDetails(accountId: string): Promise<{
    id: string;
    nationalId: string;
    birthDate: string;
    password: string | null;
    isActive: boolean;
    lastLoginAt: string | null;
    resetCode: string | null;
    resetCodeExpiresAt: string | null;
    resetCodeGeneratedAt: string | null;
    traineeId: number;
    createdAt: string;
    updatedAt: string;
    trainee: {
      id: number;
      nameAr: string;
      nameEn: string;
      nationalId: string;
      email: string | null;
      phone: string;
      photoUrl: string | null;
      photoCloudinaryId: string | null;
      enrollmentType: string;
      maritalStatus: string;
      gender: string;
      nationality: string;
      religion: string;
      birthDate: string;
      idIssueDate: string;
      idExpiryDate: string;
      programType: string;
      programId: number;
      country: string;
      governorate: string | null;
      city: string;
      address: string;
      residenceAddress: string;
      guardianName: string;
      guardianPhone: string;
      guardianEmail: string | null;
      guardianJob: string | null;
      guardianRelation: string;
      landline: string | null;
      whatsapp: string | null;
      facebook: string | null;
      educationType: string;
      schoolName: string;
      graduationDate: string;
      totalGrade: number | null;
      gradePercentage: number | null;
      sportsActivity: string | null;
      culturalActivity: string | null;
      educationalActivity: string | null;
      traineeStatus: string;
      classLevel: string;
      academicYear: string | null;
      marketingEmployeeId: number | null;
      firstContactEmployeeId: number | null;
      secondContactEmployeeId: number | null;
      createdById: string | null;
      updatedById: string | null;
      createdAt: string;
      updatedAt: string;
      notes: string | null;
      program: {
        id: number;
        nameAr: string;
        nameEn: string;
      };
    };
  }> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/trainee-platform/accounts/${accountId}`;
      console.log('🔍 AuthService.getTraineeAccountDetails() - Fetching from URL:', url);
      console.log('🔍 AuthService.getTraineeAccountDetails() - Account ID:', accountId);
      console.log('🔍 AuthService.getTraineeAccountDetails() - Using token:', token.substring(0, 20) + '...');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('🔍 AuthService.getTraineeAccountDetails() - Response not OK:', response.status, response.statusText);
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        console.log('🔍 AuthService.getTraineeAccountDetails() - Error response:', errorText);
        throw new Error(errorText || `Failed to get trainee account details: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 AuthService.getTraineeAccountDetails() - Response:', data);
      return data;
    } catch (error) {
      console.error('[AuthService] Error getting trainee account details:', error);
      throw error;
    }
  }

  /**
   * تحديث حساب متدرب معين
   */
  static async updateTraineeAccount(accountId: string, updateData: {
    password?: string;
    isActive?: boolean;
  }): Promise<{
    id: string;
    nationalId: string;
    birthDate: string;
    password: string | null;
    isActive: boolean;
    lastLoginAt: string | null;
    resetCode: string | null;
    resetCodeExpiresAt: string | null;
    resetCodeGeneratedAt: string | null;
    traineeId: number;
    createdAt: string;
    updatedAt: string;
    trainee: {
      id: number;
      nameAr: string;
      nameEn: string;
      nationalId: string;
      email: string | null;
      phone: string;
      photoUrl: string | null;
      photoCloudinaryId: string | null;
      enrollmentType: string;
      maritalStatus: string;
      gender: string;
      nationality: string;
      religion: string;
      birthDate: string;
      idIssueDate: string;
      idExpiryDate: string;
      programType: string;
      programId: number;
      country: string;
      governorate: string | null;
      city: string;
      address: string;
      residenceAddress: string;
      guardianName: string;
      guardianPhone: string;
      guardianEmail: string | null;
      guardianJob: string | null;
      guardianRelation: string;
      landline: string | null;
      whatsapp: string | null;
      facebook: string | null;
      educationType: string;
      schoolName: string;
      graduationDate: string;
      totalGrade: number | null;
      gradePercentage: number | null;
      sportsActivity: string | null;
      culturalActivity: string | null;
      educationalActivity: string | null;
      traineeStatus: string;
      classLevel: string;
      academicYear: string | null;
      marketingEmployeeId: number | null;
      firstContactEmployeeId: number | null;
      secondContactEmployeeId: number | null;
      createdById: string | null;
      updatedById: string | null;
      createdAt: string;
      updatedAt: string;
      notes: string | null;
      program: {
        id: number;
        nameAr: string;
        nameEn: string;
      };
    };
  }> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/trainee-platform/accounts/${accountId}`;
      console.log('🔍 AuthService.updateTraineeAccount() - Updating account:', accountId);
      console.log('🔍 AuthService.updateTraineeAccount() - Update data:', updateData);
      console.log('🔍 AuthService.updateTraineeAccount() - URL:', url);
      console.log('🔍 AuthService.updateTraineeAccount() - Using token:', token.substring(0, 20) + '...');

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        console.log('🔍 AuthService.updateTraineeAccount() - Response not OK:', response.status, response.statusText);
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        console.log('🔍 AuthService.updateTraineeAccount() - Error response:', errorText);
        throw new Error(errorText || `Failed to update trainee account: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 AuthService.updateTraineeAccount() - Response:', data);
      return data;
    } catch (error) {
      console.error('[AuthService] Error updating trainee account:', error);
      throw error;
    }
  }

  /**
   * إضافة فترة جديدة في الجدول الدراسي
   */
  static async addScheduleSlot(slotData: {
    contentId: number;
    classroomId: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    type: string;
    location?: string;
    distributionRoomId?: string;
  }) {
    try {
      console.log('🔍 AuthService.addScheduleSlot() - Adding schedule slot:', slotData);
      
      const token = await this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiBaseUrl = getCurrentApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/schedule/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(slotData),
      });

      console.log('🔍 AuthService.addScheduleSlot() - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 AuthService.addScheduleSlot() - Error response:', errorText);
        throw new Error(errorText || `Failed to add schedule slot: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 AuthService.addScheduleSlot() - Response:', data);
      return data;
    } catch (error) {
      console.error('[AuthService] Error adding schedule slot:', error);
      throw error;
    }
  }

  /**
   * جلب الفترات الدراسية
   */
  static async getScheduleSlots(params?: {
    classroomId?: number;
    contentId?: number;
    dayOfWeek?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      console.log('🔍 AuthService.getScheduleSlots() - Fetching schedule slots:', params);
      
      const token = await this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiBaseUrl = getCurrentApiBaseUrl();
      const queryParams = new URLSearchParams();
      
      if (params?.classroomId) queryParams.append('classroomId', params.classroomId.toString());
      if (params?.contentId) queryParams.append('contentId', params.contentId.toString());
      if (params?.dayOfWeek) queryParams.append('dayOfWeek', params.dayOfWeek);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `${apiBaseUrl}/api/schedule/slots${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('🔍 AuthService.getScheduleSlots() - URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 AuthService.getScheduleSlots() - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 AuthService.getScheduleSlots() - Error response:', errorText);
        throw new Error(errorText || `Failed to fetch schedule slots: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 AuthService.getScheduleSlots() - Response:', data);
      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching schedule slots:', error);
      throw error;
    }
  }

  /**
   * جلب جدول الفصل الدراسي المحدد
   */
  static async getClassroomSchedule(classroomId: number) {
    try {
      console.log('🔍 AuthService.getClassroomSchedule() - Fetching classroom schedule for ID:', classroomId);
      console.log('🔍 AuthService.getClassroomSchedule() - classroomId type:', typeof classroomId);
      console.log('🔍 AuthService.getClassroomSchedule() - classroomId value:', classroomId);
      console.log('🔍 AuthService.getClassroomSchedule() - Is classroomId valid?', !isNaN(classroomId) && classroomId > 0);
      
      const token = await this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      console.log('🔍 AuthService.getClassroomSchedule() - Token found:', token.substring(0, 20) + '...');

      const apiBaseUrl = await getCurrentApiBaseUrl();
      const url = `${apiBaseUrl}/api/schedule/classroom/${classroomId}`;
      console.log('🔍 AuthService.getClassroomSchedule() - API Base URL:', apiBaseUrl);
      console.log('🔍 AuthService.getClassroomSchedule() - Full URL:', url);
      console.log('🔍 AuthService.getClassroomSchedule() - URL length:', url.length);

      // Test network connectivity first
      console.log('🔍 AuthService.getClassroomSchedule() - Testing network connectivity...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const testResponse = await fetch(apiBaseUrl, {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('🔍 AuthService.getClassroomSchedule() - Network test response:', testResponse.status);
      } catch (networkError) {
        console.error('🔍 AuthService.getClassroomSchedule() - Network test failed:', networkError);
        throw new Error(`Network connection failed: ${(networkError as Error).message}`);
      }

      console.log('🔍 AuthService.getClassroomSchedule() - Making API request...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('🔍 AuthService.getClassroomSchedule() - Response status:', response.status);
      console.log('🔍 AuthService.getClassroomSchedule() - Response ok:', response.ok);
      console.log('🔍 AuthService.getClassroomSchedule() - Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 AuthService.getClassroomSchedule() - Error response:', errorText);
        console.log('🔍 AuthService.getClassroomSchedule() - Error status:', response.status);
        console.log('🔍 AuthService.getClassroomSchedule() - Error statusText:', response.statusText);
        
        if (response.status === 404) {
          throw new Error(`الفصل الدراسي غير موجود (ID: ${classroomId})`);
        } else if (response.status === 401) {
          throw new Error('غير مصرح - يرجى تسجيل الدخول مرة أخرى');
        } else {
          throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('🔍 AuthService.getClassroomSchedule() - Response data:', JSON.stringify(data, null, 2));
      console.log('🔍 AuthService.getClassroomSchedule() - Response data type:', typeof data);
      console.log('🔍 AuthService.getClassroomSchedule() - Response data is array?', Array.isArray(data));
      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching classroom schedule:', error);
      console.error('[AuthService] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      
      // Provide more specific error messages
      if ((error as Error).message.includes('Network request failed')) {
        throw new Error('فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.');
      } else if ((error as Error).message.includes('timeout')) {
        throw new Error('انتهت مهلة الاتصال. حاول مرة أخرى.');
      } else {
        throw error;
      }
    }
  }

  // ==================== GRADES MANAGEMENT APIs ====================

  /**
   * جلب المتدربين للدرجات
   */
  static async getTraineesForGrades(params: {
    limit?: string;
    search?: string;
    programId?: string;
  } = {}) {
    try {
      console.log('🔍 AuthService.getTraineesForGrades() - Fetching trainees for grades with params:', params);
      
      const token = await this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      console.log('🔍 AuthService.getTraineesForGrades() - Token found:', token.substring(0, 20) + '...');

      const apiBaseUrl = await getCurrentApiBaseUrl();
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.programId) queryParams.append('programId', params.programId);
      
      const queryString = queryParams.toString();
      const url = `${apiBaseUrl}/api/grades/trainees${queryString ? `?${queryString}` : ''}`;
      
      console.log('🔍 AuthService.getTraineesForGrades() - API Base URL:', apiBaseUrl);
      console.log('🔍 AuthService.getTraineesForGrades() - Full URL:', url);

      // Test network connectivity first
      console.log('🔍 AuthService.getTraineesForGrades() - Testing network connectivity...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const testResponse = await fetch(apiBaseUrl, {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('🔍 AuthService.getTraineesForGrades() - Network test response:', testResponse.status);
      } catch (networkError) {
        console.error('🔍 AuthService.getTraineesForGrades() - Network test failed:', networkError);
        throw new Error(`Network connection failed: ${(networkError as Error).message}`);
      }

      console.log('🔍 AuthService.getTraineesForGrades() - Making API request...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('🔍 AuthService.getTraineesForGrades() - Response status:', response.status);
      console.log('🔍 AuthService.getTraineesForGrades() - Response ok:', response.ok);
      console.log('🔍 AuthService.getTraineesForGrades() - Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 AuthService.getTraineesForGrades() - Error response:', errorText);
        console.log('🔍 AuthService.getTraineesForGrades() - Error status:', response.status);
        console.log('🔍 AuthService.getTraineesForGrades() - Error statusText:', response.statusText);
        
        if (response.status === 401) {
          throw new Error('غير مصرح - يرجى تسجيل الدخول مرة أخرى');
        } else {
          throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('🔍 AuthService.getTraineesForGrades() - Response data:', JSON.stringify(data, null, 2));
      console.log('🔍 AuthService.getTraineesForGrades() - Response data type:', typeof data);
      console.log('🔍 AuthService.getTraineesForGrades() - Response data is array?', Array.isArray(data));
      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching trainees for grades:', error);
      console.error('[AuthService] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      
      // Provide more specific error messages
      if ((error as Error).message.includes('Network request failed')) {
        throw new Error('فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.');
      } else if ((error as Error).message.includes('timeout')) {
        throw new Error('انتهت مهلة الاتصال. حاول مرة أخرى.');
      } else {
        throw error;
      }
    }
  }

  /**
   * جلب درجات متدرب معين
   */
  static async getTraineeGrades(traineeId: number) {
    try {
      console.log('🔍 AuthService.getTraineeGrades() - Fetching trainee grades for ID:', traineeId);
      console.log('🔍 AuthService.getTraineeGrades() - traineeId type:', typeof traineeId);
      console.log('🔍 AuthService.getTraineeGrades() - traineeId value:', traineeId);
      console.log('🔍 AuthService.getTraineeGrades() - Is traineeId valid?', !isNaN(traineeId) && traineeId > 0);
      
      const token = await this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      console.log('🔍 AuthService.getTraineeGrades() - Token found:', token.substring(0, 20) + '...');

      const apiBaseUrl = await getCurrentApiBaseUrl();
      const url = `${apiBaseUrl}/api/grades/trainee/${traineeId}`;
      console.log('🔍 AuthService.getTraineeGrades() - API Base URL:', apiBaseUrl);
      console.log('🔍 AuthService.getTraineeGrades() - Full URL:', url);
      console.log('🔍 AuthService.getTraineeGrades() - URL length:', url.length);

      // Test network connectivity first
      console.log('🔍 AuthService.getTraineeGrades() - Testing network connectivity...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const testResponse = await fetch(apiBaseUrl, {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('🔍 AuthService.getTraineeGrades() - Network test response:', testResponse.status);
      } catch (networkError) {
        console.error('🔍 AuthService.getTraineeGrades() - Network test failed:', networkError);
        throw new Error(`Network connection failed: ${(networkError as Error).message}`);
      }

      console.log('🔍 AuthService.getTraineeGrades() - Making API request...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('🔍 AuthService.getTraineeGrades() - Response status:', response.status);
      console.log('🔍 AuthService.getTraineeGrades() - Response ok:', response.ok);
      console.log('🔍 AuthService.getTraineeGrades() - Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 AuthService.getTraineeGrades() - Error response:', errorText);
        console.log('🔍 AuthService.getTraineeGrades() - Error status:', response.status);
        console.log('🔍 AuthService.getTraineeGrades() - Error statusText:', response.statusText);
        
        if (response.status === 404) {
          throw new Error(`المتدرب غير موجود (ID: ${traineeId})`);
        } else if (response.status === 401) {
          throw new Error('غير مصرح - يرجى تسجيل الدخول مرة أخرى');
        } else {
          throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('🔍 AuthService.getTraineeGrades() - Response data:', JSON.stringify(data, null, 2));
      console.log('🔍 AuthService.getTraineeGrades() - Response data type:', typeof data);
      console.log('🔍 AuthService.getTraineeGrades() - Response data is array?', Array.isArray(data));
      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching trainee grades:', error);
      console.error('[AuthService] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      
      // Provide more specific error messages
      if ((error as Error).message.includes('Network request failed')) {
        throw new Error('فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.');
      } else if ((error as Error).message.includes('timeout')) {
        throw new Error('انتهت مهلة الاتصال. حاول مرة أخرى.');
      } else {
        throw error;
      }
    }
  }

  // ==================== SCHEDULE MANAGEMENT APIs ====================

  /**
   * إنشاء فترة جديدة في الجدول الدراسي
   */
  static async createScheduleSlot(slotData: {
    contentId: number;
    classroomId: number;
    dayOfWeek: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
    startTime: string;
    endTime: string;
    type: 'THEORY' | 'PRACTICAL';
    location?: string;
    distributionRoomId?: string;
  }) {
    try {
      console.log('🔍 AuthService.createScheduleSlot() - Creating schedule slot:', slotData);
      
      const token = await this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiBaseUrl = getCurrentApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/schedule/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(slotData),
      });

      console.log('🔍 AuthService.createScheduleSlot() - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 AuthService.createScheduleSlot() - Error response:', errorText);
        throw new Error(errorText || `Failed to create schedule slot: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 AuthService.createScheduleSlot() - Response:', data);
      return data;
    } catch (error) {
      console.error('[AuthService] Error creating schedule slot:', error);
      throw error;
    }
  }

  /**
   * تحديث فترة موجودة في الجدول الدراسي
   */
  static async updateScheduleSlot(slotId: number, updateData: {
    contentId?: number;
    classroomId?: number;
    dayOfWeek?: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
    startTime?: string;
    endTime?: string;
    type?: 'THEORY' | 'PRACTICAL';
    location?: string;
    distributionRoomId?: string;
  }) {
    try {
      console.log('🔍 AuthService.updateScheduleSlot() - Updating schedule slot:', slotId, updateData);
      
      const token = await this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiBaseUrl = getCurrentApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/schedule/slots/${slotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      console.log('🔍 AuthService.updateScheduleSlot() - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 AuthService.updateScheduleSlot() - Error response:', errorText);
        throw new Error(errorText || `Failed to update schedule slot: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 AuthService.updateScheduleSlot() - Response:', data);
      return data;
    } catch (error) {
      console.error('[AuthService] Error updating schedule slot:', error);
      throw error;
    }
  }

  /**
   * حذف فترة من الجدول الدراسي
   */
  static async deleteScheduleSlot(slotId: number) {
    try {
      console.log('🔍 AuthService.deleteScheduleSlot() - Deleting schedule slot:', slotId);
      
      const token = await this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiBaseUrl = getCurrentApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/schedule/slots/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 AuthService.deleteScheduleSlot() - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 AuthService.deleteScheduleSlot() - Error response:', errorText);
        throw new Error(errorText || `Failed to delete schedule slot: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 AuthService.deleteScheduleSlot() - Response:', data);
      return data;
    } catch (error) {
      console.error('[AuthService] Error deleting schedule slot:', error);
      throw error;
    }
  }

  /**
   * جلب المحتوى التدريبي
   */
  static async getTrainingContent() {
    try {
      console.log('🔍 AuthService.getTrainingContent() - Fetching training content...');
      
      const token = await this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiBaseUrl = getCurrentApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/training-content`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 AuthService.getTrainingContent() - Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 AuthService.getTrainingContent() - Error response:', errorText);
        throw new Error(errorText || `Failed to fetch training content: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 AuthService.getTrainingContent() - Response:', data);
      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching training content:', error);
      throw error;
    }
  }
  // ==================== FINANCIAL REPORTS APIs ====================

  /**
   * جلب بيانات التقرير المالي Dashboard
   */
  static async getFinancialDashboard(params?: {
    dateFrom?: string;  // ISO 8601 format
    dateTo?: string;    // ISO 8601 format
  }): Promise<import('../types/financialReports').FinancialDashboardResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const queryParams = new URLSearchParams();
      
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

      const url = `${baseUrl}/api/finances/reports/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('[AuthService] Fetching financial dashboard from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AuthService] Financial dashboard response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        console.error('[AuthService] Financial dashboard error:', errorText);
        throw new Error(errorText || `Failed to fetch financial dashboard: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AuthService] Financial dashboard data fetched successfully');
      return data;
    } catch (error) {
      console.error('[AuthService] Error fetching financial dashboard:', error);
      throw error;
    }
  }

  // ==================== DEFERRAL REQUESTS APIs ====================

  /**
   * جلب طلبات تأجيل السداد
   */
  static async getDeferralRequests(params?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    programId?: number;
    traineeId?: number;
    page?: number;
    limit?: number;
  }): Promise<import('../types/deferralRequests').DeferralRequestsResponse> {
    try {
      const token = await this.getToken();
      console.log('🔍 [AuthService] Token:', token ? `${token.substring(0, 20)}...` : 'NULL');
      
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      console.log('🔍 [AuthService] Base URL:', baseUrl);
      
      const queryParams = new URLSearchParams();
      
      if (params?.status) queryParams.append('status', params.status);
      if (params?.programId) queryParams.append('programId', params.programId.toString());
      if (params?.traineeId) queryParams.append('traineeId', params.traineeId.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `${baseUrl}/api/deferral-requests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔍 [AuthService] Full URL:', url);
      console.log('🔍 [AuthService] Query params:', queryParams.toString());

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 [AuthService] Response status:', response.status);
      console.log('📡 [AuthService] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AuthService] Error response body:', errorText);
        
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        if (response.status === 500) {
          console.error('❌ [AuthService] Internal server error - Full details:', errorText);
          throw new Error('خطأ في الخادم. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.');
        }
        
        throw new Error(errorText || `Failed to fetch deferral requests: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [AuthService] Data fetched successfully, count:', data.data?.length);
      return data;
    } catch (error) {
      console.error('❌ [AuthService] Error fetching deferral requests:', error);
      if (error instanceof Error) {
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * جلب تفاصيل طلب تأجيل محدد
   */
  static async getDeferralRequestById(requestId: string): Promise<import('../types/deferralRequests').DeferralRequest> {
    try {
      const token = await this.getToken();
      console.log('🔍 [AuthService] Getting deferral request by ID:', requestId);
      
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/deferral-requests/${requestId}`;
      console.log('🔍 [AuthService] Request details URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 [AuthService] Request details response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AuthService] Error getting request details:', errorText);
        
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        throw new Error(errorText || `Failed to fetch request details: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [AuthService] Request details fetched successfully');
      return data;
    } catch (error) {
      console.error('❌ [AuthService] Error fetching request details:', error);
      throw error;
    }
  }

  /**
   * مراجعة طلب تأجيل السداد (قبول أو رفض)
   */
  static async reviewDeferralRequest(
    requestId: string,
    reviewData: import('../types/deferralRequests').ReviewDeferralRequestPayload
  ): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/deferral-requests/${requestId}/review`;
      console.log('[AuthService] Reviewing deferral request at URL:', url);
      console.log('[AuthService] Review data:', reviewData);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      console.log('[AuthService] Review response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        console.error('[AuthService] Review error:', errorText);
        throw new Error(errorText || `Failed to review deferral request: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AuthService] Deferral request reviewed successfully');
      return data;
    } catch (error) {
      console.error('[AuthService] Error reviewing deferral request:', error);
      throw error;
    }
  }

  /**
   * حذف طلب تأجيل سداد
   */
  static async deleteDeferralRequest(requestId: string): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/deferral-requests/${requestId}`;
      console.log('[AuthService] Deleting deferral request at URL:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AuthService] Delete response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        console.error('[AuthService] Delete error:', errorText);
        throw new Error(errorText || `Failed to delete deferral request: ${response.status}`);
      }

      try {
        const data = await response.json();
        console.log('[AuthService] Deferral request deleted successfully');
        return data;
      } catch {
        return { success: true };
      }
    } catch (error) {
      console.error('[AuthService] Error deleting deferral request:', error);
      throw error;
    }
  }

  // ==================== TRAINEE FREE REQUESTS APIs ====================

  /**
   * جلب الطلبات المجانية (إجازات، إثباتات، إفادات، تأجيل اختبارات)
   */
  static async getTraineeRequests(params?: {
    type?: string;
    status?: string;
    traineeId?: number;
    page?: number;
    limit?: number;
  }): Promise<import('../types/traineeRequests').TraineeRequestsResponse> {
    try {
      const token = await this.getToken();
      console.log('🔍 [AuthService] Token for trainee requests:', token ? `${token.substring(0, 20)}...` : 'NULL');
      
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      console.log('🔍 [AuthService] Base URL:', baseUrl);
      
      const queryParams = new URLSearchParams();
      
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.traineeId) queryParams.append('traineeId', params.traineeId.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `${baseUrl}/api/trainee-requests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔍 [AuthService] Full URL:', url);
      console.log('🔍 [AuthService] Query params:', queryParams.toString());

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 [AuthService] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AuthService] Error response:', errorText);
        
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        throw new Error(errorText || `Failed to fetch trainee requests: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [AuthService] Trainee requests fetched successfully');
      return data;
    } catch (error) {
      console.error('❌ [AuthService] Error fetching trainee requests:', error);
      throw error;
    }
  }

  /**
   * جلب تفاصيل طلب محدد
   */
  static async getTraineeRequestById(requestId: string): Promise<import('../types/traineeRequests').TraineeRequest> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/trainee-requests/${requestId}`;
      console.log('[AuthService] Getting trainee request details:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        throw new Error(errorText || `Failed to fetch request details: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting trainee request:', error);
      throw error;
    }
  }

  /**
   * مراجعة طلب مجاني (قبول أو رفض)
   */
  static async reviewTraineeRequest(
    requestId: string,
    reviewData: import('../types/traineeRequests').ReviewTraineeRequestPayload
  ): Promise<any> {
    try {
      const token = await this.getToken();
      console.log('🔍 [AuthService] Review - Token:', token ? `${token.substring(0, 20)}...` : 'NULL');
      
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/trainee-requests/${requestId}/review`;
      console.log('🔍 [AuthService] Review URL:', url);
      console.log('🔍 [AuthService] Review data being sent:', JSON.stringify(reviewData, null, 2));

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      console.log('📡 [AuthService] Review response status:', response.status);
      console.log('📡 [AuthService] Review response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AuthService] Review error response:', errorText);
        
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        throw new Error(errorText || `Failed to review request: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [AuthService] Review successful:', data);
      return data;
    } catch (error) {
      console.error('❌ [AuthService] Error reviewing trainee request:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message);
      }
      throw error;
    }
  }

  /**
   * حذف طلب مجاني
   */
  static async deleteTraineeRequest(requestId: string): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/trainee-requests/${requestId}`;
      console.log('[AuthService] Deleting trainee request:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        throw new Error(errorText || `Failed to delete request: ${response.status}`);
      }

      try {
        return await response.json();
      } catch {
        return { success: true };
      }
    } catch (error) {
      console.error('[AuthService] Error deleting trainee request:', error);
      throw error;
    }
  }

  // ==================== PAYMENT SCHEDULES APIs ====================

  /**
   * جلب مواعيد السداد
   */
  static async getPaymentSchedules(params?: {
    programId?: number;
    feeId?: number;
  }): Promise<import('../types/paymentSchedules').PaymentSchedule[]> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const queryParams = new URLSearchParams();
      
      if (params?.programId) queryParams.append('programId', params.programId.toString());
      if (params?.feeId) queryParams.append('feeId', params.feeId.toString());

      const url = `${baseUrl}/api/payment-schedules${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('[AuthService] Fetching payment schedules from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch payment schedules: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error fetching payment schedules:', error);
      throw error;
    }
  }

  /**
   * إنشاء موعد سداد جديد
   */
  static async createPaymentSchedule(
    scheduleData: import('../types/paymentSchedules').CreatePaymentScheduleRequest
  ): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/payment-schedules`;
      console.log('[AuthService] Creating payment schedule at URL:', url);
      console.log('[AuthService] Schedule data:', scheduleData);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to create payment schedule: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error creating payment schedule:', error);
      throw error;
    }
  }

  /**
   * تحديث موعد سداد
   */
  static async updatePaymentSchedule(
    scheduleId: string,
    updateData: import('../types/paymentSchedules').UpdatePaymentScheduleRequest
  ): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/payment-schedules/${scheduleId}`;
      console.log('[AuthService] Updating payment schedule at URL:', url);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update payment schedule: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('[AuthService] Error updating payment schedule:', error);
      throw error;
    }
  }

  /**
   * حذف موعد سداد
   */
  static async deletePaymentSchedule(scheduleId: string): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const baseUrl = await this.getApiBaseUrl();
      const url = `${baseUrl}/api/payment-schedules/${scheduleId}`;
      console.log('[AuthService] Deleting payment schedule at URL:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to delete payment schedule: ${response.status}`);
      }

      try {
        return await response.json();
      } catch {
        return { success: true };
      }
    } catch (error) {
      console.error('[AuthService] Error deleting payment schedule:', error);
      throw error;
    }
  }

  // ==================== PERMISSIONS MANAGEMENT ====================

  // Create a new role
  static async createRole(roleData: import('../types/permissions').CreateRoleRequest): Promise<import('../types/permissions').RoleWithRelations> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/permissions/roles`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to create role: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error creating role:', error);
      throw error;
    }
  }

  // Update a role
  static async updateRole(roleId: string, roleData: import('../types/permissions').UpdateRoleRequest): Promise<import('../types/permissions').RoleWithRelations> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/permissions/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to update role: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error updating role:', error);
      throw error;
    }
  }

  // Delete a role
  static async deleteRole(roleId: string): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/permissions/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to delete role: ${response.status}`);
      }
    } catch (error) {
      console.error('[AuthService] Error deleting role:', error);
      throw error;
    }
  }

  // Get all permissions
  static async getAllPermissions(category?: string): Promise<import('../types/permissions').PermissionItem[]> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const params = category ? `?category=${encodeURIComponent(category)}` : '';
      const response = await fetch(`${baseUrl}/api/permissions/permissions${params}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch permissions: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error fetching permissions:', error);
      throw error;
    }
  }

  // Assign permissions to a role
  static async assignPermissionsToRole(roleId: string, data: import('../types/permissions').AssignPermissionsToRoleRequest): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/permissions/roles/${roleId}/permissions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to assign permissions: ${response.status}`);
      }
    } catch (error) {
      console.error('[AuthService] Error assigning permissions to role:', error);
      throw error;
    }
  }

  // Get permissions stats
  static async getPermissionStats(): Promise<import('../types/permissions').PermissionStats> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/permissions/stats`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch permission stats: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error fetching permission stats:', error);
      throw error;
    }
  }

  // Get all users (for assigning roles)
  static async getAllUsers(): Promise<any[]> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/users?limit=1000`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('[AuthService] Error fetching all users:', error);
      throw error;
    }
  }

  // Assign role to user (using the proper endpoint)
  static async assignRoleToUser(data: { userId: string; roleId: string }): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/permissions/assign-role`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to assign role: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error assigning role to user:', error);
      throw error;
    }
  }

  // ==================== Staff Attendance ====================

  // Get my attendance status today
  static async getMyAttendanceStatus(): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/my-status`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting my attendance status:', error);
      throw error;
    }
  }

  // Check in
  static async staffCheckIn(data: import('../types/staffAttendance').CheckInDto): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/check-in`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error checking in:', error);
      throw error;
    }
  }

  // Check out
  static async staffCheckOut(data: import('../types/staffAttendance').CheckOutDto): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/check-out`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error checking out:', error);
      throw error;
    }
  }

  // Get my attendance logs
  static async getMyAttendanceLogs(params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string }): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const query = new URLSearchParams();
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));
      if (params?.status) query.append('status', params.status);
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      const response = await fetch(`${baseUrl}/api/staff-attendance/my-logs?${query.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting my attendance logs:', error);
      throw error;
    }
  }

  // Get today's attendance (admin)
  static async getTodayAttendance(): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/today`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting today attendance:', error);
      throw error;
    }
  }

  // Get all staff attendance logs (admin)
  static async getStaffAttendanceLogs(params?: { userId?: string; startDate?: string; endDate?: string; status?: string; page?: number; limit?: number }): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const query = new URLSearchParams();
      if (params?.userId) query.append('userId', params.userId);
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      if (params?.status) query.append('status', params.status);
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));
      const response = await fetch(`${baseUrl}/api/staff-attendance/logs?${query.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting staff attendance logs:', error);
      throw error;
    }
  }

  // Get staff attendance dashboard (admin)
  static async getStaffAttendanceDashboard(): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/dashboard`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting attendance dashboard:', error);
      throw error;
    }
  }

  // Get enrollments (admin)
  static async getStaffEnrollments(includeInactive?: boolean): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const query = includeInactive ? '?includeInactive=true' : '';
      const response = await fetch(`${baseUrl}/api/staff-attendance/enrollments${query}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting enrollments:', error);
      throw error;
    }
  }

  // Enroll staff member
  static async enrollStaff(userId: string, notes?: string): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/enrollments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notes }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error enrolling staff:', error);
      throw error;
    }
  }

  // Unenroll staff
  static async unenrollStaff(userId: string): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/enrollments/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[AuthService] Error unenrolling staff:', error);
      throw error;
    }
  }

  // Manual attendance record (admin)
  static async createManualAttendanceRecord(data: import('../types/staffAttendance').ManualRecordDto): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/manual-record`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error creating manual record:', error);
      throw error;
    }
  }

  // Get leave requests (admin)
  static async getStaffLeaveRequests(params?: { userId?: string; status?: string }): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const query = new URLSearchParams();
      if (params?.userId) query.append('userId', params.userId);
      if (params?.status) query.append('status', params.status);
      const response = await fetch(`${baseUrl}/api/staff-attendance/leaves?${query.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting leave requests:', error);
      throw error;
    }
  }

  // Get my leave requests
  static async getMyLeaveRequests(status?: string): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const query = status ? `?status=${status}` : '';
      const response = await fetch(`${baseUrl}/api/staff-attendance/my-leaves${query}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting my leave requests:', error);
      throw error;
    }
  }

  // Create leave request
  static async createLeaveRequest(data: import('../types/staffAttendance').CreateLeaveRequestDto): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/leaves`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error creating leave request:', error);
      throw error;
    }
  }

  // Review leave request (admin)
  static async reviewLeaveRequest(leaveId: string, status: 'APPROVED' | 'REJECTED', reviewNotes?: string): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/leaves/${leaveId}/review`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error reviewing leave request:', error);
      throw error;
    }
  }

  // Get attendance settings
  static async getStaffAttendanceSettings(): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/settings`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting attendance settings:', error);
      throw error;
    }
  }

  // Update attendance settings
  static async updateStaffAttendanceSettings(data: Partial<import('../types/staffAttendance').StaffAttendanceSettings>): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/settings`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error updating attendance settings:', error);
      throw error;
    }
  }

  // Get holidays
  static async getStaffHolidays(): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/holidays`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error getting holidays:', error);
      throw error;
    }
  }

  // Create holiday
  static async createStaffHoliday(data: { name: string; date: string; endDate?: string; isRecurring?: boolean; notes?: string }): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/holidays`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AuthService] Error creating holiday:', error);
      throw error;
    }
  }

  // Delete holiday
  static async deleteStaffHoliday(holidayId: string): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('Authentication token not found.');
      const baseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/staff-attendance/holidays/${holidayId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[AuthService] Error deleting holiday:', error);
      throw error;
    }
  }
}

export default AuthService;
