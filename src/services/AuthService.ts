import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthData {
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

  // حفظ بيانات تسجيل الدخول
  static async saveAuthData(token: string, user: any, expiresIn?: number) {
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
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  }

  // جلب بيانات تسجيل الدخول
  static async getAuthData(): Promise<AuthData | null> {
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

      return {
        token: token[1],
        user: JSON.parse(userData[1]),
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
  static async getUser(): Promise<any | null> {
    const authData = await this.getAuthData();
    return authData?.user || null;
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

      const response = await fetch('http://10.0.2.2:4000/api/auth/validate', {
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
  static async logout() {
    try {
      const token = await this.getToken();
      
      // إشعار الـ API بتسجيل الخروج (اختياري)
      if (token) {
        try {
          await fetch('http://10.0.2.2:4000/api/auth/logout', {
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
    } catch (error) {
      console.error('Error during logout:', error);
      // مسح البيانات المحلية حتى لو فشل الـ API call
      await this.clearAuthData();
    }
  }

  // حذف برنامج تدريبي
  static async deleteProgram(programId: number): Promise<any> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const response = await fetch(`http://10.0.2.2:4000/api/programs/${programId}`, {
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

      const response = await fetch(`http://10.0.2.2:4000/api/programs/${programId}`, {
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

      const url = `http://10.0.2.2:4000/api/trainees?${queryParams.toString()}`;
      console.log('Fetching trainees from URL:', url);
      console.log('Using token:', token.substring(0, 20) + '...');
      console.log('Query params:', queryParams.toString());

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
      console.error('Error fetching trainees in AuthService:', error);
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

      const response = await fetch(`http://10.0.2.2:4000/api/trainees`, {
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

      const response = await fetch(`http://10.0.2.2:4000/api/programs`, {
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

      let url = `http://10.0.2.2:4000/api/users`;
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

      const response = await fetch(`http://10.0.2.2:4000/api/training-content`, {
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

      const response = await fetch(`http://10.0.2.2:4000/api/training-contents/generate-code`, {
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

      const url = `http://10.0.2.2:4000/api/training-contents?${queryParams.toString()}`;
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

      const url = `http://10.0.2.2:4000/api/training-contents/${contentId}`;
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

      const url = `http://10.0.2.2:4000/api/training-contents/${contentId}`;
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

  // Get Questions by Content ID
  static async getQuestionsByContent(contentId: number): Promise<import('../types/student').IQuestionsByContentResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      console.log(`[AuthService] Fetching questions for content ID: ${contentId}`);

      const response = await fetch(`http://10.0.2.2:4000/api/questions/content/${contentId}`, {
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

      const response = await fetch(`http://10.0.2.2:4000/api/questions`, {
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

      const response = await fetch(`http://10.0.2.2:4000/api/finances/safes`, {
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

      const url = `http://10.0.2.2:4000/api/finances/trainee-payments?${queryParams.toString()}`;
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
      
      const url = `http://10.0.2.2:4000/api/finances/trainees/${traineeId}/payments`;
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
      
      const url = `http://10.0.2.2:4000/api/finances/auto-payment`;
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

      const response = await fetch(`http://10.0.2.2:4000/api/finances/safes`, {
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

  // Get Safe Transactions
  static async getSafeTransactions(safeId: string): Promise<import('../types/student').ITransaction[]> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      console.log(`[AuthService] Fetching transactions for safe: ${safeId}`);

      const response = await fetch(`http://10.0.2.2:4000/api/finances/safes/${safeId}/transactions`, {
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

      const response = await fetch(`http://10.0.2.2:4000/api/finances/transactions`, {
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

      const response = await fetch(`http://10.0.2.2:4000/api/finances/trainee-fees`, {
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

      const response = await fetch(`http://10.0.2.2:4000/api/finances/trainee-fees`, {
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

      const response = await fetch(`http://10.0.2.2:4000/api/finances/trainee-fees/${feeId}/apply`, {
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
}

export default AuthService;
