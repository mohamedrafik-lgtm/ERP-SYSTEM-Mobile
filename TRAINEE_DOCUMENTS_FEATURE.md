# ميزة وثائق المتدرب

## نظرة عامة

تم إنشاء صفحة شاملة لإدارة وعرض وثائق المتدربين مع إحصائيات مفصلة وحالة كل وثيقة.

## الميزات المضافة

### ✅ **1. Types جديدة**

تم إضافة interfaces جديدة في `src/types/student.ts`:

```typescript
// Trainee Documents Types
export type DocumentType = 
  | 'NATIONAL_ID'
  | 'PASSPORT'
  | 'BIRTH_CERTIFICATE'
  | 'EDUCATION_CERTIFICATE'
  | 'MEDICAL_CERTIFICATE'
  | 'PHOTO'
  | 'CONTRACT'
  | 'OTHER';

export interface TraineeDocument {
  id: string;
  traineeId: number;
  documentType: DocumentType;
  fileName: string;             // اسم الملف الأصلي
  filePath: string;             // مسار الملف المخزن
  cloudinaryId?: string | null; // معرف الملف في Cloudinary
  fileSize: number;             // حجم الملف بالبايت
  mimeType: string;             // نوع الملف
  uploadedAt: string;           // ISO date
  notes?: string | null;        // ملاحظات
  isVerified: boolean;          // هل تم التحقق؟
  verifiedAt?: string | null;   // ISO date
  verifiedById?: string | null; // معرف من تحقق
  createdAt: string;            // ISO date
  updatedAt: string;            // ISO date

  uploadedBy: {
    id: string;
    name: string;
  };
}

export interface DocumentWithStatus {
  type: DocumentType;            // نوع الوثيقة
  nameAr: string;               // اسم الوثيقة بالعربية
  required: boolean;            // هل الوثيقة مطلوبة؟
  document: TraineeDocument | null; // بيانات الوثيقة (إذا كانت مرفوعة)
  isUploaded: boolean;          // هل الوثيقة مرفوعة؟
  isVerified: boolean;          // هل الوثيقة محققة؟
}

export interface TraineeDocumentsResponse {
  trainee: {
    id: number;
    nameAr: string;              // الاسم بالعربية
    photoUrl?: string | null;    // رابط الصورة الشخصية
    createdAt: string;           // ISO date
    updatedAt: string;           // ISO date
  };

  documents: DocumentWithStatus[];

  stats: {
    totalRequired: number;       // إجمالي الوثائق المطلوبة
    totalOptional: number;       // إجمالي الوثائق الاختيارية
    uploadedRequired: number;    // عدد الوثائق المطلوبة المرفوعة
    uploadedOptional: number;    // عدد الوثائق الاختيارية المرفوعة
    verifiedCount: number;       // عدد الوثائق المحققة
    completionPercentage: number; // نسبة إكمال الوثائق المطلوبة (%)
    isComplete: boolean;         // هل جميع الوثائق المطلوبة مرفوعة؟
  };
}
```

### ✅ **2. AuthService Method**

تم إضافة method جديد في `src/services/AuthService.ts`:

```typescript
// Trainee Management: Get Trainee Documents
static async getTraineeDocuments(traineeId: number): Promise<import('../types/student').TraineeDocumentsResponse> {
  try {
    const token = await this.getToken();
    if (!token) {
      throw new Error('Authentication token not found.');
    }

    const url = `http://10.0.2.2:4000/api/trainees/${traineeId}/documents`;
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
```

### ✅ **3. شاشة وثائق المتدرب**

تم إنشاء شاشة شاملة في `src/screens/TraineeDocumentsScreen.tsx`:

#### **الميزات الرئيسية:**
- **عرض معلومات المتدرب**: الاسم، الصورة، رقم المتدرب
- **إحصائيات الوثائق**: عدد المطلوب، المرفوع، المحقق، النسبة المئوية
- **قائمة الوثائق**: عرض جميع الوثائق مع حالتها
- **تفاصيل الوثائق**: اسم الملف، الحجم، تاريخ الرفع، من رفعها
- **عرض الوثائق**: فتح الوثائق في المتصفح
- **تحديث تلقائي**: إمكانية السحب للتحديث

#### **الأقسام المتاحة:**
1. **معلومات المتدرب**: الاسم، الصورة، رقم المتدرب
2. **إحصائيات الوثائق**: إحصائيات شاملة مع شريط التقدم
3. **قائمة الوثائق**: عرض جميع الوثائق مع حالتها

### ✅ **4. مكونات عرض الوثائق**

#### **بطاقة الوثيقة:**
```typescript
const renderDocumentCard = (doc: DocumentWithStatus) => {
  const iconColor = getDocumentTypeColor(doc.type);
  const iconName = getDocumentTypeIcon(doc.type);

  return (
    <View key={doc.type} style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentIconContainer}>
          <Icon name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentName}>{doc.nameAr}</Text>
          <View style={styles.documentStatusContainer}>
            {doc.required && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>مطلوب</Text>
              </View>
            )}
            {doc.isUploaded ? (
              <View style={[styles.statusBadge, { backgroundColor: doc.isVerified ? '#2ecc71' : '#f39c12' }]}>
                <Text style={styles.statusText}>
                  {doc.isVerified ? 'محقق' : 'مرفوع'}
                </Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: '#e74c3c' }]}>
                <Text style={styles.statusText}>غير مرفوع</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {doc.isUploaded && doc.document && (
        <View style={styles.documentDetails}>
          {/* تفاصيل الوثيقة */}
          <TouchableOpacity
            style={styles.viewDocumentButton}
            onPress={() => handleViewDocument(doc.document!)}
          >
            <Icon name="visibility" size={20} color="#3498db" />
            <Text style={styles.viewDocumentText}>عرض الوثيقة</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
```

#### **أيقونات الوثائق:**
```typescript
const getDocumentTypeIcon = (type: DocumentType): string => {
  switch (type) {
    case 'NATIONAL_ID': return 'credit-card';
    case 'PASSPORT': return 'book';
    case 'BIRTH_CERTIFICATE': return 'child-care';
    case 'EDUCATION_CERTIFICATE': return 'school';
    case 'MEDICAL_CERTIFICATE': return 'local-hospital';
    case 'PHOTO': return 'photo-camera';
    case 'CONTRACT': return 'description';
    case 'OTHER': return 'insert-drive-file';
    default: return 'description';
  }
};
```

#### **ألوان الوثائق:**
```typescript
const getDocumentTypeColor = (type: DocumentType): string => {
  switch (type) {
    case 'NATIONAL_ID': return '#3498db';
    case 'PASSPORT': return '#e74c3c';
    case 'BIRTH_CERTIFICATE': return '#f39c12';
    case 'EDUCATION_CERTIFICATE': return '#2ecc71';
    case 'MEDICAL_CERTIFICATE': return '#e67e22';
    case 'PHOTO': return '#9b59b6';
    case 'CONTRACT': return '#34495e';
    case 'OTHER': return '#95a5a6';
    default: return '#95a5a6';
  }
};
```

### ✅ **5. إحصائيات الوثائق**

#### **بطاقة الإحصائيات:**
```typescript
const renderStatsCard = () => {
  if (!documentsData) return null;

  const { stats } = documentsData;

  return (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>إحصائيات الوثائق</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalRequired}</Text>
          <Text style={styles.statLabel}>مطلوب</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.uploadedRequired}</Text>
          <Text style={styles.statLabel}>مرفوع</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.verifiedCount}</Text>
          <Text style={styles.statLabel}>محقق</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: stats.isComplete ? '#2ecc71' : '#e74c3c' }]}>
            {stats.completionPercentage}%
          </Text>
          <Text style={styles.statLabel}>مكتمل</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${stats.completionPercentage}%`,
                backgroundColor: stats.isComplete ? '#2ecc71' : '#f39c12'
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {stats.isComplete ? 'جميع الوثائق المطلوبة مرفوعة' : 'يحتاج رفع وثائق إضافية'}
        </Text>
      </View>
    </View>
  );
};
```

### ✅ **6. تكامل مع قائمة المتدربين**

تم تحديث `src/screens/StudentsListScreen.tsx`:

```typescript
const handleStudentAction = (student: ITrainee) => {
  Alert.alert(
    'إجراءات الطالب',
    `اختر الإجراء المطلوب لـ ${student.nameAr}`,
    [
      {
        text: 'تحديث البيانات',
        onPress: () => navigation.navigate('EditTrainee', { trainee: student }),
      },
      {
        text: 'عرض الوثائق',
        onPress: () => navigation.navigate('TraineeDocuments', { trainee: { id: student.id, nameAr: student.nameAr } }),
      },
      {
        text: 'عرض التفاصيل',
        onPress: () => {
          Alert.alert('تفاصيل الطالب', `الاسم: ${student.nameAr}\nالهاتف: ${student.phone}\nالبرنامج: ${student.program.nameAr}`);
        },
      },
      {
        text: 'حذف المتدرب',
        style: 'destructive',
        onPress: () => handleDeleteStudent(student),
      },
      {
        text: 'إلغاء',
        style: 'cancel',
      },
    ]
  );
};
```

### ✅ **7. Navigation Integration**

تم إضافة الشاشة إلى `App.tsx`:

```typescript
import TraineeDocumentsScreen from './src/screens/TraineeDocumentsScreen';

// في Stack.Navigator
<Stack.Screen name="TraineeDocuments" component={TraineeDocumentsScreen} />
```

## الاستخدام

### **📱 الوصول للميزة:**

1. **من قائمة المتدربين**: اضغط على زر الإجراءات (⋮) بجانب أي متدرب
2. **اختر "عرض الوثائق"** من القائمة المنبثقة
3. **ستفتح صفحة وثائق المتدرب** مع جميع التفاصيل

### **🔄 ميزات الصفحة:**

1. **معلومات المتدرب**: الاسم، الصورة، رقم المتدرب
2. **إحصائيات شاملة**: عدد الوثائق المطلوبة، المرفوعة، المحققة
3. **شريط التقدم**: يوضح نسبة إكمال الوثائق المطلوبة
4. **قائمة الوثائق**: عرض جميع الوثائق مع حالتها
5. **تفاصيل الوثائق**: اسم الملف، الحجم، تاريخ الرفع
6. **عرض الوثائق**: فتح الوثائق في المتصفح
7. **تحديث تلقائي**: إمكانية السحب للتحديث

### **📋 مثال على الاستخدام:**

```typescript
// جلب وثائق متدرب
const response = await AuthService.getTraineeDocuments(traineeId);

// عرض الإحصائيات
console.log('Total required:', response.stats.totalRequired);
console.log('Uploaded required:', response.stats.uploadedRequired);
console.log('Completion percentage:', response.stats.completionPercentage);

// عرض الوثائق
response.documents.forEach(doc => {
  console.log(`${doc.nameAr}: ${doc.isUploaded ? 'مرفوع' : 'غير مرفوع'}`);
});
```

## الميزات التقنية

### **🔧 API Integration**
- **Endpoint**: `GET /api/trainees/{id}/documents`
- **Method**: `GET`
- **Authentication**: Bearer token
- **Error Handling**: شامل مع رسائل واضحة

### **📊 Data Processing**
- **تنسيق التواريخ**: عرض التواريخ باللغة العربية
- **تنسيق أحجام الملفات**: تحويل البايت إلى KB/MB/GB
- **معالجة الألوان**: ألوان مميزة لكل نوع وثيقة
- **معالجة الأيقونات**: أيقونات مناسبة لكل نوع وثيقة

### **🎨 UI/UX Features**
- **تصميم عربي**: واجهة باللغة العربية
- **ألوان مميزة**: لكل نوع وثيقة
- **أيقونات واضحة**: تمثل نوع الوثيقة
- **حالات مرئية**: مرفوع، غير مرفوع، محقق
- **شريط تقدم**: يوضح نسبة الإكمال

### **📱 Responsive Design**
- **ScrollView**: للتعامل مع المحتوى الطويل
- **RefreshControl**: إمكانية السحب للتحديث
- **Loading States**: مؤشرات التحميل
- **Error Handling**: معالجة شاملة للأخطاء

## الأمان والموثوقية

### **🔐 Authentication**
- **Token Validation**: فحص صحة الـ token
- **Auto Logout**: تسجيل خروج تلقائي عند انتهاء الصلاحية
- **Error Handling**: معالجة شاملة للأخطاء

### **📝 Logging**
- **Console Logs**: تسجيل مفصل للعمليات
- **Error Tracking**: تتبع الأخطاء
- **Response Logging**: تسجيل استجابات الـ API

### **🔄 State Management**
- **Loading States**: حالات التحميل
- **Error States**: حالات الخطأ
- **Data States**: إدارة بيانات الوثائق

## الميزات المتقدمة

### **📅 عرض الوثائق**
- **فتح الملفات**: في المتصفح الخارجي
- **معالجة الأخطاء**: عند فشل فتح الملف
- **دعم أنواع مختلفة**: PDF، صور، مستندات

### **📊 إحصائيات مفصلة**
- **عدد الوثائق**: المطلوبة، المرفوعة، المحققة
- **نسبة الإكمال**: مئوية مع شريط تقدم
- **حالة الإكمال**: هل جميع الوثائق المطلوبة مرفوعة؟

### **🎯 تجربة مستخدم محسنة**
- **تحديث تلقائي**: إمكانية السحب للتحديث
- **رسائل واضحة**: للنجاح والأخطاء
- **تصميم متجاوب**: يعمل على جميع أحجام الشاشات

## الاختبار

### **1. اختبار جلب الوثائق**

```typescript
// جلب وثائق متدرب موجود
const response = await AuthService.getTraineeDocuments(123);
// يجب أن يعود TraineeDocumentsResponse
```

### **2. اختبار عرض الإحصائيات**

```typescript
// يجب أن تظهر الإحصائيات بشكل صحيح
console.log('Stats:', response.stats);
// totalRequired, uploadedRequired, verifiedCount, completionPercentage
```

### **3. اختبار عرض الوثائق**

```typescript
// يجب أن تظهر قائمة الوثائق
response.documents.forEach(doc => {
  console.log(`${doc.nameAr}: ${doc.isUploaded}`);
});
```

### **4. اختبار فتح الوثائق**

```typescript
// يجب أن يتم فتح الوثيقة في المتصفح
await Linking.openURL(document.filePath);
```

## النتائج المتوقعة

### ✅ **عند النجاح**

```
[AuthService] Trainee documents response: {
  "trainee": { "id": 123, "nameAr": "أحمد محمد" },
  "documents": [...],
  "stats": {
    "totalRequired": 5,
    "uploadedRequired": 4,
    "verifiedCount": 3,
    "completionPercentage": 80,
    "isComplete": false
  }
}
```

### ❌ **عند الفشل**

```
[AuthService] Error response data: {
  "error": "Trainee not found",
  "message": "المتدرب غير موجود"
}
```

## الخلاصة

تم إنشاء صفحة شاملة لإدارة وثائق المتدربين تشمل:

- ✅ **API Integration**: GET endpoint مع معالجة أخطاء
- ✅ **Comprehensive UI**: واجهة شاملة ومنظمة
- ✅ **Document Management**: عرض وإدارة الوثائق
- ✅ **Statistics Dashboard**: إحصائيات مفصلة مع شريط تقدم
- ✅ **Document Viewing**: فتح الوثائق في المتصفح
- ✅ **Auto Refresh**: إمكانية السحب للتحديث
- ✅ **Error Handling**: معالجة شاملة للأخطاء
- ✅ **Arabic Interface**: واجهة عربية كاملة
- ✅ **Responsive Design**: تصميم متجاوب

الميزة الآن جاهزة للاستخدام في جميع أجزاء التطبيق! 🚀
