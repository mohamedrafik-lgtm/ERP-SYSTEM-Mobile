# صفحة المتدربين مع تفاصيل التسويق

## الميزة الجديدة
تم إنشاء صفحة جديدة لعرض المتدربين مع تفاصيل التسويق الكاملة، بما في ذلك موظف التسويق المسؤول وموظفي التواصل والكومشن.

## التحديثات المنجزة

### ✅ **1. تحديث Types (types/marketing.ts)**

#### إضافة الـ Interfaces الجديدة:
```typescript
export interface TraineeWithMarketingInfo {
  id: number;
  nameAr: string;          // الاسم بالعربية
  nameEn: string;          // الاسم بالإنجليزية
  nationalId: string;      // الرقم القومي
  phone: string;           // رقم الهاتف
  email?: string | null;   // البريد الإلكتروني
  gender: Gender;          // الجنس
  traineeStatus: TraineeStatus; // حالة المتدرب
  programId: number;       // معرف البرنامج
  createdAt: string;       // ISO date
  updatedAt: string;       // ISO date

  // موظف التسويق المسؤول
  marketingEmployee?: {
    id: number;
    name: string;
  } | null;

  // موظف التواصل الأول
  firstContactEmployee?: {
    id: number;
    name: string;
  } | null;

  // موظف التواصل الثاني
  secondContactEmployee?: {
    id: number;
    name: string;
  } | null;

  // البرنامج التدريبي
  program: {
    id: number;
    nameAr: string;
  };
}

export interface MarketingTraineesResponse {
  data: TraineeWithMarketingInfo[];
  total: number;           // إجمالي عدد المتدربين
  page: number;            // الصفحة الحالية
  limit: number;           // عدد العناصر في الصفحة
  totalPages: number;      // إجمالي عدد الصفحات
}
```

### ✅ **2. تحديث AuthService (services/AuthService.ts)**

#### إضافة دالة getMarketingTrainees:
```typescript
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

    const url = `http://10.0.2.2:4000/api/marketing/trainees?${queryParams.toString()}`;
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
```

### ✅ **3. إنشاء TraineeCard (components/TraineeCard.tsx)**

#### المكون الجديد لعرض معلومات المتدرب:
```typescript
interface TraineeCardProps {
  trainee: TraineeWithMarketingInfo;
  onPress?: () => void;
}
```

#### الميزات:
- **عرض معلومات المتدرب** - الاسم، الهاتف، الإيميل، الرقم القومي
- **عرض حالة المتدرب** - مع لون مناسب (نشط، غير نشط، معلق، متخرج)
- **عرض الجنس** - مع أيقونة مناسبة (ذكر/أنثى)
- **عرض البرنامج التدريبي** - اسم البرنامج
- **عرض تفاصيل التسويق** - موظف التسويق، موظفي التواصل
- **تصميم جميل** - ألوان مناسبة لكل قسم

#### الأقسام:
1. **Header** - صورة المتدرب، الاسم، الحالة
2. **Contact Info** - الهاتف، الإيميل، الرقم القومي
3. **Program Info** - البرنامج التدريبي
4. **Marketing Info** - تفاصيل التسويق
5. **Footer** - تواريخ التسجيل والتحديث

### ✅ **4. إنشاء MarketingTraineesScreen (screens/MarketingTraineesScreen.tsx)**

#### الصفحة الرئيسية الجديدة:
```typescript
const MarketingTraineesScreen = ({ navigation }: any) => {
  const [trainees, setTrainees] = useState<TraineeWithMarketingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TraineeStatus | undefined>(undefined);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
```

#### الميزات:
- **البحث** - بالاسم، الهاتف، الرقم القومي
- **الفلاتر** - حسب حالة المتدرب
- **الترقيم** - pagination مع تحميل المزيد
- **الإحصائيات** - إجمالي المتدربين، المعروضين، عدد الصفحات
- **التحديث** - pull-to-refresh
- **التصميم** - واجهة جميلة ومتسقة

### ✅ **5. تحديث التنقل (App.tsx & CustomMenu.tsx)**

#### إضافة الصفحة للتنقل:
```typescript
// App.tsx
import MarketingTraineesScreen from './src/screens/MarketingTraineesScreen';

<Stack.Screen name="MarketingTrainees" component={MarketingTraineesScreen} />
```

#### إضافة الصفحة للقائمة:
```typescript
// CustomMenu.tsx
{
  id: 'MarketingTrainees',
  title: 'المتدربين مع تفاصيل التسويق',
  icon: 'people',
  screen: 'MarketingTrainees',
  priority: 5.7,
}
```

## الـ API Endpoint

### **GET /api/marketing/trainees**

#### Query Parameters:
```typescript
{
  page?: number;              // الصفحة (افتراضي: 1)
  limit?: number;             // عدد العناصر (افتراضي: 20)
  search?: string;            // البحث بالاسم أو الهاتف
  marketingEmployeeId?: number; // فلتر حسب موظف التسويق
  programId?: number;         // فلتر حسب البرنامج
  status?: string;            // فلتر حسب الحالة
}
```

#### Response:
```typescript
{
  data: TraineeWithMarketingInfo[];
  total: number;              // إجمالي عدد المتدربين
  page: number;               // الصفحة الحالية
  limit: number;              // عدد العناصر في الصفحة
  totalPages: number;         // إجمالي عدد الصفحات
}
```

## الميزات الجديدة

### ✅ **1. عرض شامل للمتدربين**
- معلومات شخصية كاملة
- تفاصيل التسويق
- البرنامج التدريبي
- حالة المتدرب

### ✅ **2. تفاصيل التسويق**
- موظف التسويق المسؤول
- موظف التواصل الأول
- موظف التواصل الثاني
- إمكانية تتبع الكومشن

### ✅ **3. البحث والفلترة**
- البحث بالاسم أو الهاتف أو الرقم القومي
- فلترة حسب حالة المتدرب
- فلترة حسب موظف التسويق (قابل للتطوير)
- فلترة حسب البرنامج (قابل للتطوير)

### ✅ **4. الترقيم والتحميل**
- ترقيم الصفحات
- تحميل المزيد
- إحصائيات شاملة
- تحديث تلقائي

### ✅ **5. واجهة مستخدم محسنة**
- تصميم جميل ومتسق
- ألوان مناسبة لكل قسم
- أيقونات واضحة
- تجربة مستخدم سلسة

## كيفية الاستخدام

### 1. الوصول للصفحة
- انتقل إلى "إدارة التسويق" > "المتدربين مع تفاصيل التسويق"

### 2. البحث والفلترة
- استخدم شريط البحث للبحث بالاسم أو الهاتف
- اختر حالة المتدرب من القائمة المنسدلة
- اضغط على أيقونة التحديث لتحديث البيانات

### 3. عرض التفاصيل
- كل كارت يعرض معلومات المتدرب كاملة
- تفاصيل التسويق في قسم منفصل
- البرنامج التدريبي مع لون مميز

### 4. الترقيم
- استخدم "تحميل المزيد" لرؤية المزيد من المتدربين
- شاهد إحصائيات الصفحات في الأسفل

## الاختبار

### 1. اختبار تحميل الصفحة
```typescript
// افتح صفحة المتدربين مع تفاصيل التسويق
// تأكد من تحميل البيانات
// تأكد من عرض الإحصائيات
```

### 2. اختبار البحث
```typescript
// جرب البحث بالاسم
// جرب البحث بالهاتف
// جرب البحث بالرقم القومي
// تأكد من تحديث النتائج
```

### 3. اختبار الفلاتر
```typescript
// جرب فلترة حسب الحالة
// تأكد من تحديث النتائج
// جرب إزالة الفلتر
```

### 4. اختبار الترقيم
```typescript
// تأكد من عمل "تحميل المزيد"
// تأكد من تحديث الإحصائيات
// تأكد من عدم تكرار البيانات
```

## الخلاصة

تم إنشاء صفحة المتدربين مع تفاصيل التسويق بنجاح:

- ✅ **تحديث Types** - TraineeWithMarketingInfo و MarketingTraineesResponse
- ✅ **تحديث AuthService** - دالة getMarketingTrainees مع فلاتر متقدمة
- ✅ **إنشاء TraineeCard** - عرض جميل لمعلومات المتدرب
- ✅ **إنشاء MarketingTraineesScreen** - صفحة شاملة مع بحث وفلترة
- ✅ **تحديث التنقل** - إضافة الصفحة للقائمة والتنقل

الصفحة الآن جاهزة للاستخدام مع الـ endpoint الجديد! 🎉

**ملاحظة:** الصفحة تدعم البحث والفلترة المتقدمة ويمكن تطويرها لإضافة المزيد من الفلاتر حسب الحاجة.
