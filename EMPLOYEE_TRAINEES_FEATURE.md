# صفحة متدربي الموظف

## الميزة الجديدة
تم إنشاء صفحة جديدة لعرض جميع المتدربين الذين جلبهم مسوق معين، مع إمكانية البحث والفلترة والترقيم.

## التحديثات المنجزة

### ✅ **1. تحديث Types (types/marketing.ts)**

#### إضافة الـ Interfaces الجديدة:
```typescript
export interface TraineeBasicInfo {
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

  // البرنامج التدريبي
  program: {
    id: number;
    nameAr: string;
  };
}

export interface EmployeeTraineesResponse {
  data: TraineeBasicInfo[];
  total: number;           // إجمالي عدد المتدربين المُعيّنين لهذا الموظف
  page: number;            // الصفحة الحالية
  limit: number;           // عدد العناصر في الصفحة
  totalPages: number;      // إجمالي عدد الصفحات
}
```

### ✅ **2. تحديث AuthService (services/AuthService.ts)**

#### إضافة دالة getEmployeeTrainees:
```typescript
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

    const url = `http://10.0.2.2:4000/api/marketing/employees/${employeeId}/trainees?${queryParams.toString()}`;
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
```

### ✅ **3. إنشاء TraineeBasicCard (components/TraineeBasicCard.tsx)**

#### المكون الجديد لعرض معلومات المتدرب الأساسية:
```typescript
interface TraineeBasicCardProps {
  trainee: TraineeBasicInfo;
  onPress?: () => void;
}
```

#### الميزات:
- **عرض معلومات المتدرب** - الاسم، الهاتف، الإيميل، الرقم القومي
- **عرض حالة المتدرب** - مع لون مناسب (نشط، غير نشط، معلق، متخرج)
- **عرض الجنس** - مع أيقونة مناسبة (ذكر/أنثى)
- **عرض البرنامج التدريبي** - اسم البرنامج
- **تصميم مدمج** - كارت أصغر وأكثر تركيزاً

#### الأقسام:
1. **Header** - صورة المتدرب، الاسم، الحالة
2. **Contact Info** - الهاتف، الإيميل، الرقم القومي
3. **Program Info** - البرنامج التدريبي
4. **Footer** - تواريخ التسجيل والتحديث

### ✅ **4. إنشاء EmployeeTraineesScreen (screens/EmployeeTraineesScreen.tsx)**

#### الصفحة الرئيسية الجديدة:
```typescript
interface EmployeeTraineesScreenProps {
  navigation: any;
  route: {
    params: {
      employeeId: number;
      employeeName: string;
    };
  };
}
```

#### الميزات:
- **معرف الموظف** - يتم تمرير employeeId و employeeName من الصفحة السابقة
- **البحث** - بالاسم، الهاتف، الرقم القومي
- **الفلاتر** - حسب حالة المتدرب
- **الترقيم** - pagination مع تحميل المزيد
- **الإحصائيات** - إجمالي المتدربين، المعروضين، عدد الصفحات
- **التحديث** - pull-to-refresh
- **زر العودة** - للعودة لصفحة المسوقين

### ✅ **5. تحديث MarketersScreen (screens/MarketersScreen.tsx)**

#### إضافة زر "المتدربين":
```typescript
<TouchableOpacity 
  style={[styles.editBtn, { backgroundColor: '#dbeafe' }]} 
  onPress={() => navigation.navigate('EmployeeTrainees', { 
    employeeId: emp.id, 
    employeeName: emp.name 
  })}
>
  <Text style={[styles.editBtnText, { color: '#1e40af' }]}>المتدربين</Text>
</TouchableOpacity>
```

### ✅ **6. تحديث التنقل (App.tsx)**

#### إضافة الصفحة للتنقل:
```typescript
import EmployeeTraineesScreen from './src/screens/EmployeeTraineesScreen';

<Stack.Screen name="EmployeeTrainees" component={EmployeeTraineesScreen} />
```

## الـ API Endpoint

### **GET /api/marketing/employees/{employeeId}/trainees**

#### Path Parameters:
- `employeeId` - معرف موظف التسويق

#### Query Parameters:
```typescript
{
  page?: number;              // الصفحة (افتراضي: 1)
  limit?: number;             // عدد العناصر (افتراضي: 20)
  search?: string;            // البحث بالاسم أو الهاتف
  status?: string;            // فلتر حسب الحالة
}
```

#### Response:
```typescript
{
  data: TraineeBasicInfo[];
  total: number;              // إجمالي عدد المتدربين المُعيّنين لهذا الموظف
  page: number;               // الصفحة الحالية
  limit: number;              // عدد العناصر في الصفحة
  totalPages: number;         // إجمالي عدد الصفحات
}
```

## الميزات الجديدة

### ✅ **1. عرض متدربي موظف معين**
- معلومات شخصية كاملة للمتدربين
- البرنامج التدريبي لكل متدرب
- حالة المتدرب مع ألوان مناسبة

### ✅ **2. البحث والفلترة**
- البحث بالاسم أو الهاتف أو الرقم القومي
- فلترة حسب حالة المتدرب
- نتائج محدثة فورياً

### ✅ **3. الترقيم والتحميل**
- ترقيم الصفحات
- تحميل المزيد
- إحصائيات شاملة
- تحديث تلقائي

### ✅ **4. التنقل السلس**
- زر العودة لصفحة المسوقين
- تمرير معرف الموظف واسمه
- عرض اسم الموظف في الهيدر

### ✅ **5. واجهة مستخدم محسنة**
- تصميم مدمج للكروت
- ألوان مناسبة لكل قسم
- أيقونات واضحة
- تجربة مستخدم سلسة

## كيفية الاستخدام

### 1. الوصول للصفحة
- انتقل إلى "إدارة التسويق" > "موظفي التسويق"
- اضغط على زر "المتدربين" في كارت أي موظف

### 2. البحث والفلترة
- استخدم شريط البحث للبحث بالاسم أو الهاتف
- اختر حالة المتدرب من القائمة المنسدلة
- اضغط على أيقونة التحديث لتحديث البيانات

### 3. عرض التفاصيل
- كل كارت يعرض معلومات المتدرب الأساسية
- البرنامج التدريبي مع لون مميز
- حالة المتدرب مع لون مناسب

### 4. الترقيم
- استخدم "تحميل المزيد" لرؤية المزيد من المتدربين
- شاهد إحصائيات الصفحات في الأسفل

### 5. العودة
- اضغط على زر العودة للعودة لصفحة المسوقين

## الاختبار

### 1. اختبار التنقل
```typescript
// افتح صفحة المسوقين
// اضغط على زر "المتدربين" لأي موظف
// تأكد من فتح صفحة متدربي الموظف
// تأكد من عرض اسم الموظف في الهيدر
```

### 2. اختبار تحميل البيانات
```typescript
// تأكد من تحميل بيانات المتدربين
// تأكد من عرض الإحصائيات
// تأكد من عمل الترقيم
```

### 3. اختبار البحث
```typescript
// جرب البحث بالاسم
// جرب البحث بالهاتف
// جرب البحث بالرقم القومي
// تأكد من تحديث النتائج
```

### 4. اختبار الفلاتر
```typescript
// جرب فلترة حسب الحالة
// تأكد من تحديث النتائج
// جرب إزالة الفلتر
```

### 5. اختبار الترقيم
```typescript
// تأكد من عمل "تحميل المزيد"
// تأكد من تحديث الإحصائيات
// تأكد من عدم تكرار البيانات
```

### 6. اختبار العودة
```typescript
// اضغط على زر العودة
// تأكد من العودة لصفحة المسوقين
```

## الخلاصة

تم إنشاء صفحة متدربي الموظف بنجاح:

- ✅ **تحديث Types** - TraineeBasicInfo و EmployeeTraineesResponse
- ✅ **تحديث AuthService** - دالة getEmployeeTrainees مع فلاتر
- ✅ **إنشاء TraineeBasicCard** - عرض مدمج لمعلومات المتدرب
- ✅ **إنشاء EmployeeTraineesScreen** - صفحة شاملة مع بحث وفلترة
- ✅ **تحديث MarketersScreen** - إضافة زر "المتدربين"
- ✅ **تحديث التنقل** - إضافة الصفحة للتنقل

الصفحة الآن جاهزة للاستخدام مع الـ endpoint الجديد! 🎉

**ملاحظة:** الصفحة تدعم البحث والفلترة المتقدمة ويمكن تطويرها لإضافة المزيد من الفلاتر حسب الحاجة. كما يمكن إضافة ميزات أخرى مثل تصدير البيانات أو إحصائيات مفصلة.
