import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Branch {
  id: string;
  name: string;
  nameEn: string;
  city: string;
  apiEndpoint: string;
  selectedAt: string;
}

export interface BranchConfig {
  id: string;
  name: string;
  nameEn: string;
  city: string;
  icon: string;
  color: string;
  apiEndpoint: string;
}

export const AVAILABLE_BRANCHES: BranchConfig[] = [
  {
    id: 'mansoura',
    name: 'فرع المنصورة',
    nameEn: 'Mansoura Branch',
    city: 'المنصورة',
    icon: 'location-city',
    color: '#1a237e',
    apiEndpoint: 'https://mansapi.tiba29.com',
  },
  {
    id: 'zagazig',
    name: 'فرع الزقازيق',
    nameEn: 'Zagazig Branch',
    city: 'الزقازيق',
    icon: 'business',
    color: '#059669',
    apiEndpoint: 'https://zagapi.tiba29.com',
  },
];

class BranchService {
  private static readonly BRANCH_KEY = 'selected_branch';
  private static readonly DEFAULT_BRANCH_ID = 'mansoura';

  /**
   * حفظ الفرع المختار
   */
  static async saveBranch(branch: Branch): Promise<void> {
    try {
      await AsyncStorage.setItem(this.BRANCH_KEY, JSON.stringify(branch));
      console.log('Branch saved successfully:', branch.name);
    } catch (error) {
      console.error('Error saving branch:', error);
      throw error;
    }
  }

  /**
   * جلب الفرع المختار
   */
  static async getSelectedBranch(): Promise<Branch | null> {
    try {
      const branchData = await AsyncStorage.getItem(this.BRANCH_KEY);
      console.log('🔍 BranchService.getSelectedBranch() - Raw data from AsyncStorage:', branchData);
      
      if (branchData) {
        const branch = JSON.parse(branchData) as Branch;
        console.log('🔍 BranchService.getSelectedBranch() - Parsed branch:', branch.name);
        return branch;
      }
      
      console.log('🔍 BranchService.getSelectedBranch() - No branch data found');
      return null;
    } catch (error) {
      console.error('Error getting selected branch:', error);
      return null;
    }
  }

  /**
   * التحقق من وجود فرع محفوظ
   */
  static async hasSavedBranch(): Promise<boolean> {
    try {
      const branch = await this.getSelectedBranch();
      const hasBranch = branch !== null;
      console.log('🔍 BranchService.hasSavedBranch() - Result:', hasBranch, 'Branch:', branch);
      return hasBranch;
    } catch (error) {
      console.error('Error checking saved branch:', error);
      return false;
    }
  }

  /**
   * الحصول على API endpoint للفرع المختار
   */
  static async getCurrentApiEndpoint(): Promise<string> {
    try {
      const branch = await this.getSelectedBranch();
      console.log('🔍 BranchService.getCurrentApiEndpoint() - Selected branch:', branch);
      
      if (branch) {
        // تأكد من مزامنة endpoint المحفوظ مع القيم الحالية في AVAILABLE_BRANCHES
        const currentConfig = this.getBranchConfig(branch.id);
        if (currentConfig && currentConfig.apiEndpoint !== branch.apiEndpoint) {
          console.log('🔄 BranchService.getCurrentApiEndpoint() - Migrating saved branch endpoint to new value from config');
          const updatedBranch = { ...branch, apiEndpoint: currentConfig.apiEndpoint };
          await this.saveBranch(updatedBranch);
          console.log('🔍 BranchService.getCurrentApiEndpoint() - Using migrated branch endpoint:', updatedBranch.apiEndpoint);
          return updatedBranch.apiEndpoint;
        }

        console.log('🔍 BranchService.getCurrentApiEndpoint() - Using branch endpoint:', branch.apiEndpoint);
        return branch.apiEndpoint;
      }
      
      // إذا لم يتم اختيار فرع، استخدم الفرع الافتراضي
      const defaultBranch = AVAILABLE_BRANCHES.find(b => b.id === this.DEFAULT_BRANCH_ID);
      const fallbackEndpoint = defaultBranch ? defaultBranch.apiEndpoint : AVAILABLE_BRANCHES[0].apiEndpoint;
      console.log('🔍 BranchService.getCurrentApiEndpoint() - No branch selected, using fallback:', fallbackEndpoint);
      return fallbackEndpoint;
    } catch (error) {
      console.error('Error getting API endpoint:', error);
      // في حالة الخطأ، استخدم endpoint الافتراضي
      const errorFallback = 'https://erpproductionbackend-production.up.railway.app';
      console.log('🔍 BranchService.getCurrentApiEndpoint() - Error occurred, using error fallback:', errorFallback);
      return errorFallback;
    }
  }

  /**
   * الحصول على تكوين الفرع بواسطة ID
   */
  static getBranchConfig(branchId: string): BranchConfig | null {
    return AVAILABLE_BRANCHES.find(branch => branch.id === branchId) || null;
  }

  /**
   * الحصول على جميع الفروع المتاحة
   */
  static getAvailableBranches(): BranchConfig[] {
    return AVAILABLE_BRANCHES;
  }

  /**
   * تغيير الفرع
   */
  static async changeBranch(branchId: string): Promise<Branch> {
    try {
      const branchConfig = this.getBranchConfig(branchId);
      if (!branchConfig) {
        throw new Error(`Branch with ID ${branchId} not found`);
      }

      const branch: Branch = {
        id: branchConfig.id,
        name: branchConfig.name,
        nameEn: branchConfig.nameEn,
        city: branchConfig.city,
        apiEndpoint: branchConfig.apiEndpoint,
        selectedAt: new Date().toISOString(),
      };

      await this.saveBranch(branch);
      return branch;
    } catch (error) {
      console.error('Error changing branch:', error);
      throw error;
    }
  }

  /**
   * مسح بيانات الفرع المحفوظة
   */
  static async clearBranchData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.BRANCH_KEY);
      console.log('🧹 BranchService.clearBranchData() - Branch data cleared successfully');
      
      // تأكيد أن البيانات تم مسحها فعلاً
      const remainingData = await AsyncStorage.getItem(this.BRANCH_KEY);
      console.log('🧹 BranchService.clearBranchData() - Remaining data after clear:', remainingData);
    } catch (error) {
      console.error('Error clearing branch data:', error);
      throw error;
    }
  }

  /**
   * الحصول على معلومات الفرع الحالي مع التحقق من صحتها
   */
  static async getCurrentBranchInfo(): Promise<{
    branch: Branch;
    config: BranchConfig;
  } | null> {
    try {
      const savedBranch = await this.getSelectedBranch();
      if (!savedBranch) {
        return null;
      }

      const config = this.getBranchConfig(savedBranch.id);
      if (!config) {
        // الفرع المحفوظ غير موجود في القائمة، امسح البيانات
        await this.clearBranchData();
        return null;
      }

      return {
        branch: savedBranch,
        config: config,
      };
    } catch (error) {
      console.error('Error getting current branch info:', error);
      return null;
    }
  }

  /**
   * التحقق من صحة endpoint للفرع
   */
  static async validateBranchEndpoint(branchId: string): Promise<boolean> {
    try {
      const config = this.getBranchConfig(branchId);
      if (!config) {
        return false;
      }

      // يمكن إضافة فحص connection هنا إذا لزم الأمر
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${config.apiEndpoint}/health`, {
        method: 'GET',
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(id);

      return response?.ok || false;
    } catch (error) {
      console.warn('Branch endpoint validation failed:', error);
      return false; // لا نريد أن نمنع المستخدم في حالة فشل الفحص
    }
  }

  /**
   * إعادة تعيين إلى الفرع الافتراضي
   */
  static async resetToDefaultBranch(): Promise<Branch> {
    try {
      const defaultBranch = await this.changeBranch(this.DEFAULT_BRANCH_ID);
      console.log('Reset to default branch:', defaultBranch.name);
      return defaultBranch;
    } catch (error) {
      console.error('Error resetting to default branch:', error);
      throw error;
    }
  }

  /**
   * الحصول على اسم الفرع بالعربية
   */
  static async getCurrentBranchName(): Promise<string> {
    try {
      const branch = await this.getSelectedBranch();
      return branch ? branch.name : 'غير محدد';
    } catch (error) {
      console.error('Error getting current branch name:', error);
      return 'غير محدد';
    }
  }

  /**
   * إحصائيات استخدام الفرع
   */
  static async getBranchStats(): Promise<{
    branchId: string;
    branchName: string;
    selectedAt: string;
    daysSinceSelection: number;
  } | null> {
    try {
      const branch = await this.getSelectedBranch();
      if (!branch) {
        return null;
      }

      const selectedDate = new Date(branch.selectedAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        branchId: branch.id,
        branchName: branch.name,
        selectedAt: branch.selectedAt,
        daysSinceSelection: daysDiff,
      };
    } catch (error) {
      console.error('Error getting branch stats:', error);
      return null;
    }
  }
}

export default BranchService;
