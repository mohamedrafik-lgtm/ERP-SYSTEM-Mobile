# صفحة إحصائيات التسويق

## الميزة الجديدة
تم إنشاء صفحة شاملة لعرض إحصائيات التسويق التفصيلية، بما في ذلك نظرة عامة، إحصائيات شهرية، أداء الموظفين، أفضل الأداء، وإحصائيات البرامج.

## التحديثات المنجزة

### ✅ **1. تحديث Types (types/marketing.ts)**

#### إضافة الـ Interfaces الجديدة:
```typescript
export interface MarketingStatsResponse {
  overview: {
    totalEmployees: number;           // إجمالي موظفي التسويق
    totalTrainees: number;            // إجمالي المتدربين
    assignedTrainees: number;         // المتدربين المُعيّنين لموظف تسويق
    unassignedTrainees: number;       // المتدربين غير المُعيّنين
    assignmentRate: number;           // نسبة التخصيص (%)
    firstContactTrainees: number;     // المتدربين المُعيّن لهم موظف تواصل أول
    unassignedFirstContact: number;   // المتدربين غير المُعيّن لهم موظف تواصل أول
    firstContactRate: number;         // نسبة التواصل الأول (%)
  };

  monthly: {
    newTrainees: number;              // المتدربين الجدد في الشهر
    assignedTrainees: number;         // المتدربين المُعيّنين في الشهر
    firstContactTrainees: number;     // المتدربين المُعيّن لهم تواصل أول في الشهر
    assignmentRate: number;           // نسبة التخصيص للشهر (%)
    firstContactRate: number;         // نسبة التواصل الأول للشهر (%)
  };

  employees: EmployeePerformance[];   // أداء كل موظف
  topPerformers: TopPerformer[];      // أفضل 5 موظفين
  programs: ProgramStats[];           // إحصائيات حسب البرامج
  detailed: DetailedStats;            // إحصائيات تفصيلية
  period: {
    month: number;                    // الشهر المحدد
    year: number;                     // السنة المحددة
    startDate: string;               // بداية الشهر (ISO)
    endDate: string;                  // نهاية الشهر (ISO)
  };
}

export interface EmployeePerformance {
  id: number;
  name: string;
  monthlyTarget: number;              // الهدف الشهري
  totalAssigned: number;              // إجمالي المُعيّنين له
  monthlyAssigned: number;            // المُعيّنين في الشهر
  monthlyFirstContact: number;        // التواصل الأول في الشهر
  achievementRate: number;            // نسبة تحقيق الهدف (%)
}

export interface TopPerformer extends EmployeePerformance {
  rank: number;                       // الترتيب (1-5)
}

export interface ProgramStats {
  programId: number;
  programName: string;
  count: number;                      // عدد المتدربين في البرنامج
}

export interface DetailedStats {
  statusDistribution: StatusCount[];  // توزيع المتدربين حسب الحالة
  averagePerEmployee: number;         // متوسط المتدربين لكل موظف
  activeEmployeesRate: number;         // نسبة الموظفين النشطين (%)
}

export interface StatusCount {
  status: string;                     // حالة المتدرب
  count: number;                       // العدد
}
```

### ✅ **2. تحديث AuthService (services/AuthService.ts)**

#### إضافة دالة getMarketingStats:
```typescript
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

    const url = `http://10.0.2.2:4000/api/marketing/stats?${queryParams.toString()}`;
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
```

### ✅ **3. إنشاء StatsCard (components/StatsCard.tsx)**

#### المكون الجديد لعرض الإحصائيات:
```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  backgroundColor?: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}
```

#### الميزات:
- **عرض القيم** - أرقام واضحة مع أيقونات
- **الألوان** - ألوان مناسبة لكل نوع إحصائية
- **الاتجاهات** - عرض الاتجاهات الإيجابية والسلبية
- **التصميم** - كروت جميلة ومتسقة

### ✅ **4. إنشاء EmployeePerformanceCard (components/EmployeePerformanceCard.tsx)**

#### المكون الجديد لعرض أداء الموظفين:
```typescript
interface EmployeePerformanceCardProps {
  employee: EmployeePerformance;
  rank?: number;
  onPress?: () => void;
}
```

#### الميزات:
- **عرض الأداء** - الهدف الشهري، المُعيّنين، نسبة التحقيق
- **الألوان الديناميكية** - ألوان تتغير حسب نسبة التحقيق
- **شريط التقدم** - عرض مرئي لتقدم تحقيق الهدف
- **الترتيب** - عرض ترتيب أفضل الأداء
- **التفاعل** - إمكانية الضغط للانتقال لمتدربي الموظف

### ✅ **5. إنشاء ProgramStatsCard (components/ProgramStatsCard.tsx)**

#### المكون الجديد لعرض إحصائيات البرامج:
```typescript
interface ProgramStatsCardProps {
  programs: ProgramStats[];
  totalTrainees: number;
}
```

#### الميزات:
- **عرض البرامج** - قائمة أفقية قابلة للتمرير
- **الأيقونات** - أيقونات مناسبة لكل نوع برنامج
- **النسب المئوية** - حساب وعرض النسب المئوية
- **الملخص** - إحصائيات إجمالية في الأسفل

### ✅ **6. إنشاء MarketingStatsScreen (screens/MarketingStatsScreen.tsx)**

#### الصفحة الرئيسية الجديدة:
```typescript
const MarketingStatsScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<MarketingStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
```

#### الميزات:
- **اختيار الفترة** - اختيار الشهر والسنة
- **النظرة العامة** - إحصائيات شاملة
- **الإحصائيات الشهرية** - بيانات الشهر المحدد
- **أفضل الأداء** - أفضل 5 موظفين
- **أداء جميع الموظفين** - قائمة شاملة
- **إحصائيات البرامج** - توزيع المتدربين حسب البرامج
- **الإحصائيات التفصيلية** - بيانات إضافية وتوزيع الحالات

### ✅ **7. تحديث التنقل (App.tsx & CustomMenu.tsx)**

#### إضافة الصفحة للتنقل:
```typescript
// App.tsx
import MarketingStatsScreen from './src/screens/MarketingStatsScreen';

<Stack.Screen name="MarketingStats" component={MarketingStatsScreen} />
```

#### إضافة الصفحة للقائمة:
```typescript
// CustomMenu.tsx
{
  id: 'MarketingStats',
  title: 'إحصائيات التسويق',
  icon: 'analytics',
  screen: 'MarketingStats',
  priority: 5.8,
}
```

## الـ API Endpoint

### **GET /api/marketing/stats**

#### Query Parameters:
```typescript
{
  month?: number;              // الشهر (1-12)
  year?: number;              // السنة (مثل 2025)
}
```

#### Response:
```typescript
{
  overview: {
    totalEmployees: number;
    totalTrainees: number;
    assignedTrainees: number;
    unassignedTrainees: number;
    assignmentRate: number;
    firstContactTrainees: number;
    unassignedFirstContact: number;
    firstContactRate: number;
  };
  monthly: {
    newTrainees: number;
    assignedTrainees: number;
    firstContactTrainees: number;
    assignmentRate: number;
    firstContactRate: number;
  };
  employees: EmployeePerformance[];
  topPerformers: TopPerformer[];
  programs: ProgramStats[];
  detailed: DetailedStats;
  period: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  };
}
```

## الميزات الجديدة

### ✅ **1. نظرة عامة شاملة**
- إجمالي الموظفين والمتدربين
- المتدربين المُعيّنين وغير المُعيّنين
- نسب التخصيص والتواصل الأول
- عرض بصري جميل مع أيقونات

### ✅ **2. إحصائيات شهرية**
- المتدربين الجدد في الشهر
- المُعيّنين في الشهر
- التواصل الأول في الشهر
- نسب التخصيص للشهر

### ✅ **3. أداء الموظفين**
- الهدف الشهري لكل موظف
- المُعيّنين الشهري والإجمالي
- نسبة تحقيق الهدف
- شريط تقدم مرئي
- ألوان ديناميكية حسب الأداء

### ✅ **4. أفضل الأداء**
- ترتيب أفضل 5 موظفين
- عرض الترتيب مع أيقونة الجائزة
- إمكانية الانتقال لمتدربي الموظف

### ✅ **5. إحصائيات البرامج**
- توزيع المتدربين حسب البرامج
- أيقونات مناسبة لكل برنامج
- النسب المئوية
- إحصائيات إجمالية

### ✅ **6. إحصائيات تفصيلية**
- متوسط المتدربين لكل موظف
- نسبة الموظفين النشطين
- توزيع المتدربين حسب الحالة

### ✅ **7. اختيار الفترة**
- اختيار الشهر والسنة
- تحديث البيانات تلقائياً
- عرض معلومات الفترة المحددة

### ✅ **8. التفاعل والتنقل**
- إمكانية الضغط على الموظفين للانتقال لمتدربيهم
- تحديث البيانات (pull-to-refresh)
- تصميم متجاوب وجميل

## كيفية الاستخدام

### 1. الوصول للصفحة
- انتقل إلى "إدارة التسويق" > "إحصائيات التسويق"

### 2. اختيار الفترة
- اختر الشهر والسنة من القوائم المنسدلة
- ستتحدث البيانات تلقائياً

### 3. استعراض الإحصائيات
- **النظرة العامة** - إحصائيات شاملة
- **الإحصائيات الشهرية** - بيانات الشهر المحدد
- **أفضل الأداء** - أفضل 5 موظفين
- **أداء جميع الموظفين** - قائمة شاملة
- **إحصائيات البرامج** - توزيع حسب البرامج
- **الإحصائيات التفصيلية** - بيانات إضافية

### 4. التفاعل
- اضغط على أي موظف للانتقال لمتدربيه
- اسحب لأسفل لتحديث البيانات
- استخدم الألوان لفهم الأداء بسرعة

## الاختبار

### 1. اختبار تحميل الصفحة
```typescript
// افتح صفحة إحصائيات التسويق
// تأكد من تحميل البيانات
// تأكد من عرض جميع الأقسام
```

### 2. اختبار اختيار الفترة
```typescript
// جرب تغيير الشهر
// جرب تغيير السنة
// تأكد من تحديث البيانات
```

### 3. اختبار التفاعل
```typescript
// اضغط على موظف في قسم أفضل الأداء
// تأكد من الانتقال لصفحة متدربي الموظف
// جرب تحديث البيانات
```

### 4. اختبار العرض
```typescript
// تأكد من عرض الألوان الصحيحة
// تأكد من عمل أشرطة التقدم
// تأكد من عرض النسب المئوية
```

## الخلاصة

تم إنشاء صفحة إحصائيات التسويق بنجاح:

- ✅ **تحديث Types** - MarketingStatsResponse وجميع الـ interfaces المرتبطة
- ✅ **تحديث AuthService** - دالة getMarketingStats مع فلاتر الشهر والسنة
- ✅ **إنشاء StatsCard** - عرض جميل للإحصائيات
- ✅ **إنشاء EmployeePerformanceCard** - عرض أداء الموظفين مع أشرطة التقدم
- ✅ **إنشاء ProgramStatsCard** - عرض إحصائيات البرامج
- ✅ **إنشاء MarketingStatsScreen** - صفحة شاملة مع جميع الإحصائيات
- ✅ **تحديث التنقل** - إضافة الصفحة للقائمة والتنقل

الصفحة الآن جاهزة للاستخدام مع الـ endpoint الجديد! 🎉

**ملاحظة:** الصفحة تدعم عرض شامل لإحصائيات التسويق مع إمكانية التفاعل والتنقل السلس. يمكن تطويرها لإضافة المزيد من الميزات مثل التصدير أو الرسوم البيانية.
