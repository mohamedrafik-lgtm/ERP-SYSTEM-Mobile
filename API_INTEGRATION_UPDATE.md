# تحديث تكامل API لصفحة تحديد التارجيت

## التحديثات المنجزة

### ✅ **1. تحديث Types (types/marketing.ts)**

#### إضافة الـ Interfaces الجديدة:
```typescript
// Query Parameters للـ API
export interface GetMarketingTargetsQuery {
  month?: number;    // 1-12
  year?: number;     // 2020-2050
}

// Response Structure الجديد
export interface MarketingTargetWithAchieved {
  id: number;
  employeeId: number;
  month: number;           // 1-12
  year: number;            // مثل 2025
  targetAmount: number;    // الهدف المطلوب
  achievedAmount: number;  // المحقق فعلياً (محسوب من المتدربين المُعيّنين في هذا الشهر)
  notes?: string | null;
  setById?: string | null;
  setAt: string;           // ISO date
  createdAt: string;       // ISO date
  updatedAt: string;       // ISO date

  employee: {
    id: number;
    name: string;
    phone: string;
    email?: string | null;
    isActive: boolean;
    totalApplications: number;
    createdAt: string;     // ISO date
    updatedAt: string;     // ISO date
  };
}

// Response Type الجديد
export type MarketingTargetsResponse = MarketingTargetWithAchieved[];
```

### ✅ **2. تحديث AuthService (services/AuthService.ts)**

#### تحديث دالة getMarketingTargets:
```typescript
// قبل التحديث
static async getMarketingTargets(params?: {
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
  employeeId?: number;
}): Promise<import('../types/marketing').MarketingTargetsResponse>

// بعد التحديث
static async getMarketingTargets(params?: import('../types/marketing').GetMarketingTargetsQuery): Promise<import('../types/marketing').MarketingTargetsResponse>
```

#### تحديث Query Parameters:
```typescript
// قبل التحديث
const queryParams = new URLSearchParams();
if (params?.page) queryParams.append('page', params.page.toString());
if (params?.limit) queryParams.append('limit', params.limit.toString());
if (params?.month) queryParams.append('month', params.month.toString());
if (params?.year) queryParams.append('year', params.year.toString());
if (params?.employeeId) queryParams.append('employeeId', params.employeeId.toString());

// بعد التحديث
const queryParams = new URLSearchParams();
if (params?.month) queryParams.append('month', params.month.toString());
if (params?.year) queryParams.append('year', params.year.toString());
```

### ✅ **3. تحديث TargetSettingScreen (screens/TargetSettingScreen.tsx)**

#### تحديث الـ Imports:
```typescript
// قبل التحديث
import {
  MarketingTargetWithEmployee,
  MarketingTargetStats,
  MONTHS,
  YEARS,
  CreateMarketingTargetRequest,
} from '../types/marketing';

// بعد التحديث
import {
  MarketingTargetWithAchieved,
  MarketingTargetStats,
  MONTHS,
  YEARS,
  CreateMarketingTargetRequest,
} from '../types/marketing';
```

#### تحديث الـ State Types:
```typescript
// قبل التحديث
const [targets, setTargets] = useState<MarketingTargetWithEmployee[]>([]);

// بعد التحديث
const [targets, setTargets] = useState<MarketingTargetWithAchieved[]>([]);
```

#### تحديث Response Handling:
```typescript
// قبل التحديث
setTargets(targetsResponse?.data || []);

// بعد التحديث
setTargets(targetsResponse || []);
```

#### تحديث دالة getAchievementRate:
```typescript
// قبل التحديث
const getAchievementRate = (target: MarketingTargetWithEmployee) => {
  if (target.targetAmount === 0) return 0;
  return Math.round((target.achievedAmount / target.targetAmount) * 100);
};

// بعد التحديث
const getAchievementRate = (target: MarketingTargetWithAchieved) => {
  if (target.targetAmount === 0) return 0;
  return Math.round((target.achievedAmount / target.targetAmount) * 100);
};
```

#### تحسين useCallback و useEffect:
```typescript
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    
    const [targetsResponse, statsResponse] = await Promise.all([
      AuthService.getMarketingTargets({
        month: selectedMonth,
        year: selectedYear,
      }),
      AuthService.getMarketingTargetStats({
        month: selectedMonth,
        year: selectedYear,
      }),
    ]);

    setTargets(targetsResponse || []);
    setStats(statsResponse || null);
  } catch (error) {
    console.error('Error fetching target data:', error);
    setTargets([]);
    setStats(null);
    Alert.alert('خطأ', 'فشل في تحميل البيانات');
  } finally {
    setLoading(false);
  }
}, [selectedMonth, selectedYear]);

useEffect(() => {
  fetchData();
  fetchMarketingEmployees();
}, [fetchData]);
```

### ✅ **4. تحديث TargetCard (components/TargetCard.tsx)**

#### تحديث الـ Interface:
```typescript
// قبل التحديث
import { MarketingTargetWithEmployee } from '../types/marketing';

interface TargetCardProps {
  target: MarketingTargetWithEmployee;
  achievementRate: number;
  onEdit: (targetData: any) => void;
  onDelete: () => void;
}

// بعد التحديث
import { MarketingTargetWithAchieved } from '../types/marketing';

interface TargetCardProps {
  target: MarketingTargetWithAchieved;
  achievementRate: number;
  onEdit: (targetData: any) => void;
  onDelete: () => void;
}
```

#### تحسين عرض معلومات الموظف:
```typescript
<View style={styles.employeeDetails}>
  <Text style={styles.employeeName}>{target.employee.name}</Text>
  <Text style={styles.employeePhone}>{target.employee.phone}</Text>
  {target.employee.email && (
    <Text style={styles.employeeEmail}>{target.employee.email}</Text>
  )}
</View>
```

#### تحسين عرض معلومات الهدف:
```typescript
<View style={styles.targetRow}>
  <View style={styles.targetItem}>
    <Text style={styles.targetLabel}>الهدف (متدربين)</Text>
    <Text style={styles.targetValue}>{target.targetAmount}</Text>
  </View>
  <View style={styles.targetItem}>
    <Text style={styles.targetLabel}>المحقق</Text>
    <Text style={styles.targetValue}>{target.achievedAmount}</Text>
  </View>
  <View style={styles.targetItem}>
    <Text style={styles.targetLabel}>المتبقي</Text>
    <Text style={[styles.targetValue, { 
      color: target.targetAmount - target.achievedAmount > 0 ? '#ef4444' : '#10b981' 
    }]}>
      {Math.max(0, target.targetAmount - target.achievedAmount)}
    </Text>
  </View>
</View>
```

#### تحسين الـ Footer:
```typescript
<View style={styles.footer}>
  <View style={styles.footerRow}>
    <Text style={styles.footerText}>
      تم التحديد: {new Date(target.setAt).toLocaleDateString('ar-EG')}
    </Text>
    <Text style={styles.footerText}>
      آخر تحديث: {new Date(target.updatedAt).toLocaleDateString('ar-EG')}
    </Text>
  </View>
  {target.setById && (
    <Text style={styles.setByText}>
      بواسطة: {target.setById}
    </Text>
  )}
</View>
```

## الـ API Endpoint الجديد

### **GET /api/marketing/targets**

#### Query Parameters:
```typescript
interface GetMarketingTargetsQuery {
  month?: number;    // 1-12
  year?: number;     // 2020-2050
}
```

#### Response:
```typescript
type MarketingTargetsResponse = MarketingTargetWithAchieved[];
```

#### مثال على الاستخدام:
```typescript
// جلب أهداف شهر يناير 2025
const targets = await AuthService.getMarketingTargets({
  month: 1,
  year: 2025
});

// جلب جميع الأهداف
const allTargets = await AuthService.getMarketingTargets();
```

## الميزات الجديدة

### ✅ **1. عرض المحقق فعلياً**
- عرض عدد المتدربين المحققين فعلياً
- حساب النسبة المئوية للإنجاز
- عرض المتبقي من الهدف

### ✅ **2. معلومات موظف محسنة**
- عرض اسم الموظف
- عرض رقم الهاتف
- عرض البريد الإلكتروني (إن وجد)
- عرض حالة النشاط

### ✅ **3. معلومات تاريخية محسنة**
- تاريخ تحديد الهدف
- تاريخ آخر تحديث
- من قام بتحديد الهدف

### ✅ **4. واجهة محسنة**
- عرض المتبقي من الهدف مع لون مناسب
- تحسين تخطيط المعلومات
- عرض أفضل للتواريخ

## الاختبار

### 1. اختبار الـ API Integration
```typescript
// في TargetSettingScreen
const fetchData = async () => {
  try {
    const targetsResponse = await AuthService.getMarketingTargets({
      month: selectedMonth,
      year: selectedYear,
    });
    
    console.log('Targets Response:', targetsResponse);
    setTargets(targetsResponse || []);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 2. اختبار عرض البيانات
- تأكد من عرض `achievedAmount` بشكل صحيح
- تأكد من حساب النسبة المئوية
- تأكد من عرض معلومات الموظف الكاملة

### 3. اختبار الفلاتر
- جرب تغيير الشهر والسنة
- تأكد من تحديث البيانات تلقائياً
- تأكد من عمل الـ query parameters

## الخلاصة

تم تحديث صفحة تحديد التارجيت بالكامل لاستخدام الـ API الجديد:

- ✅ **تحديث Types** - إضافة `GetMarketingTargetsQuery` و `MarketingTargetWithAchieved`
- ✅ **تحديث AuthService** - استخدام query parameters الجديدة
- ✅ **تحديث TargetSettingScreen** - استخدام البيانات الجديدة مع `achievedAmount`
- ✅ **تحديث TargetCard** - عرض معلومات محسنة مع `achievedAmount` و employee data
- ✅ **تحسين الواجهة** - عرض أفضل للمعلومات والتواريخ

الصفحة الآن جاهزة للعمل مع الـ endpoint الجديد `/api/marketing/targets` مع query parameters `month` و `year`! 🎉
