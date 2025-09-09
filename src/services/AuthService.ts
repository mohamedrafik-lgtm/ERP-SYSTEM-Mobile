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

      const expires = parseInt(expiresAt[1]);
      
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
      
      return Date.now() > parseInt(expiresAt);
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
}

export default AuthService;
