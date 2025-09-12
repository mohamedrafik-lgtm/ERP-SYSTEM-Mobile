# ميزة تحديث بيانات المتدرب

## نظرة عامة

تم إضافة ميزة شاملة لتحديث بيانات المتدربين مع إرسال إشعارات WhatsApp تلقائية عند التحديث.

## الميزات المضافة

### ✅ **1. Types جديدة**

تم إضافة interfaces جديدة في `src/types/student.ts`:

```typescript
// Trainee Update Types
export interface UpdateTraineePayload {
  nameAr?: string;
  nameEn?: string;
  enrollmentType?: EnrollmentType;
  maritalStatus?: MaritalStatus;
  nationalId?: string;
  idIssueDate?: string;
  idExpiryDate?: string;
  programType?: ProgramType;
  nationality?: string;
  gender?: Gender;
  birthDate?: string;
  residenceAddress?: string;
  religion?: Religion;
  programId?: number;
  country?: string;
  governorate?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianJob?: string;
  guardianRelation?: string;
  guardianName?: string;
  landline?: string;
  whatsapp?: string;
  facebook?: string;
  educationType?: EducationType;
  schoolName?: string;
  graduationDate?: string;
  totalGrade?: number;
  gradePercentage?: number;
  sportsActivity?: string;
  culturalActivity?: string;
  educationalActivity?: string;
  notes?: string;
  traineeStatus?: TraineeStatus;
  classLevel?: Year;
  academicYear?: string;
  marketingEmployeeId?: number;
  firstContactEmployeeId?: number;
  secondContactEmployeeId?: number;
}

export interface UpdateTraineeResponse {
  success: boolean;
  message: string;
  data?: ITrainee;
  error?: string;
}
```

### ✅ **2. AuthService Method**

تم إضافة method جديد في `src/services/AuthService.ts`:

```typescript
// Trainee Management: Update Trainee
static async updateTrainee(traineeId: number, updateData: import('../types/student').UpdateTraineePayload): Promise<import('../types/student').UpdateTraineeResponse> {
  try {
    const token = await this.getToken();
    if (!token) {
      throw new Error('Authentication token not found.');
    }

    const url = `http://10.0.2.2:4000/api/trainees/${traineeId}`;
    console.log('[AuthService] Updating trainee at URL:', url);

    const response = await fetch(url, {
      method: 'PATCH',
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
      throw new Error(errorText || `Failed to update trainee: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('[AuthService] Trainee update response:', responseData);
    return responseData;
  } catch (error) {
    console.error('[AuthService] Error updating trainee:', error);
    throw error;
  }
}
```

### ✅ **3. WhatsApp Auto Message**

تم إضافة method جديد في `src/services/WhatsAppAutoMessageService.ts`:

```typescript
// Helper method to send trainee update message with specific data
static async sendTraineeUpdateMessage(
  phoneNumber: string,
  traineeName: string,
  updatedFields: string[],
  updatedBy: string,
  updateDate: string,
  newData?: any
): Promise<WhatsAppAutoMessage> {
  const updatedFieldsText = updatedFields.join('، ');
  const message = `📝 تم تحديث بياناتك

مرحباً ${traineeName}

تم تحديث الحقول التالية: ${updatedFieldsText}

📅 تاريخ التحديث: ${this.formatDate(updateDate)}
👤 تم التحديث بواسطة: ${updatedBy}

إذا كان لديك أي استفسار، يرجى التواصل معنا.`;

  return this.sendMessage(
    this.formatPhoneNumber(phoneNumber),
    message,
    'student_management',
    'update',
    'normal',
    'immediate',
    {
      studentName: traineeName,
      updatedFields,
      updatedBy,
      updateDate,
      newData
    }
  );
}
```

### ✅ **4. شاشة تحديث المتدرب**

تم إنشاء شاشة شاملة في `src/screens/EditTraineeScreen.tsx`:

#### **الميزات الرئيسية:**
- **تحديث جميع الحقول**: معلومات أساسية، عنوان، ولي أمر، أكاديمي
- **تتبع التغييرات**: عرض الحقول المحدثة فقط
- **تحقق من البيانات**: التأكد من صحة البيانات المدخلة
- **إرسال إشعار WhatsApp**: تلقائي عند التحديث
- **واجهة سهلة الاستخدام**: تصميم عربي متجاوب

#### **الأقسام المتاحة:**
1. **المعلومات الأساسية**: الاسم، الرقم القومي، الهاتف، البريد
2. **معلومات العنوان**: البلد، المحافظة، المدينة، العنوان
3. **معلومات ولي الأمر**: الاسم، الهاتف، البريد، العمل
4. **المعلومات الأكاديمية**: نوع التعليم، المدرسة، التخرج، الحالة
5. **معلومات إضافية**: الأنشطة، الملاحظات

### ✅ **5. تكامل مع قائمة المتدربين**

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
        text: 'عرض التفاصيل',
        onPress: () => {
          Alert.alert('تفاصيل الطالب', `الاسم: ${student.nameAr}\nالهاتف: ${student.phone}\nالبرنامج: ${student.program.nameAr}`);
        },
      },
      {
        text: 'إلغاء',
        style: 'cancel',
      },
    ]
  );
};
```

### ✅ **6. Navigation Integration**

تم إضافة الشاشة إلى `App.tsx`:

```typescript
import EditTraineeScreen from './src/screens/EditTraineeScreen';

// في Stack.Navigator
<Stack.Screen name="EditTrainee" component={EditTraineeScreen} />
```

## الاستخدام

### **📱 الوصول للميزة:**

1. **من قائمة المتدربين**: اضغط على زر الإجراءات (⋮) بجانب أي متدرب
2. **اختر "تحديث البيانات"** من القائمة المنبثقة
3. **عدّل البيانات المطلوبة** في الشاشة
4. **اضغط "تحديث البيانات"** لحفظ التغييرات

### **🔄 عملية التحديث:**

1. **تحديد الحقول المحدثة**: النظام يتتبع التغييرات تلقائياً
2. **عرض ملخص التحديث**: يظهر الحقول التي سيتم تحديثها
3. **تأكيد التحديث**: رسالة تأكيد قبل الحفظ
4. **حفظ البيانات**: إرسال PATCH request للـ API
5. **إرسال إشعار WhatsApp**: تلقائي للمتدرب

### **📋 مثال على الاستخدام:**

```typescript
// تحديث بيانات متدرب
const updateData = {
  phone: '0501234567',
  email: 'newemail@example.com',
  address: 'عنوان جديد',
  notes: 'ملاحظات محدثة'
};

const response = await AuthService.updateTrainee(traineeId, updateData);

if (response.success) {
  // إرسال إشعار WhatsApp
  await WhatsAppAutoMessageService.sendTraineeUpdateMessage(
    trainee.phone,
    trainee.nameAr,
    ['رقم الهاتف', 'البريد الإلكتروني', 'العنوان', 'الملاحظات'],
    'النظام',
    new Date().toISOString(),
    updateData
  );
}
```

## رسالة WhatsApp

### **📱 مثال على الرسالة المرسلة:**

```
📝 تم تحديث بياناتك

مرحباً أحمد محمد

تم تحديث الحقول التالية: رقم الهاتف، البريد الإلكتروني، العنوان

📅 تاريخ التحديث: 15 يناير 2024
👤 تم التحديث بواسطة: النظام

إذا كان لديك أي استفسار، يرجى التواصل معنا.
```

## الميزات التقنية

### **🔧 API Integration**
- **Endpoint**: `PATCH /api/trainees/{id}`
- **Authentication**: Bearer token
- **Content-Type**: application/json
- **Error Handling**: شامل مع رسائل واضحة

### **📊 Data Validation**
- **تتبع التغييرات**: مقارنة مع البيانات الأصلية
- **عرض الحقول المحدثة**: ملخص مرئي للتغييرات
- **تحقق من البيانات**: قبل الإرسال

### **🎨 UI/UX Features**
- **تصميم عربي**: واجهة باللغة العربية
- **أقسام منظمة**: تجميع الحقول المنطقي
- **ألوان مميزة**: للحقول المحدثة
- **أزرار واضحة**: إلغاء وتحديث

### **📱 Responsive Design**
- **ScrollView**: للتعامل مع المحتوى الطويل
- **Input Types**: مناسبة لكل نوع بيانات
- **Select Options**: قوائم منسدلة للحقول المحددة
- **Loading States**: مؤشرات التحميل

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
- **Form State**: إدارة حالة النموذج
- **Loading States**: حالات التحميل
- **Error States**: حالات الخطأ

## الخلاصة

تم إضافة ميزة شاملة لتحديث بيانات المتدربين تشمل:

- ✅ **API Integration**: PATCH endpoint مع معالجة أخطاء
- ✅ **WhatsApp Notifications**: إشعارات تلقائية
- ✅ **Comprehensive UI**: شاشة تحديث شاملة
- ✅ **Data Validation**: تحقق من البيانات
- ✅ **Change Tracking**: تتبع التغييرات
- ✅ **Navigation Integration**: تكامل مع التنقل
- ✅ **Arabic Interface**: واجهة عربية كاملة
- ✅ **Error Handling**: معالجة شاملة للأخطاء

الميزة الآن جاهزة للاستخدام في جميع أجزاء التطبيق! 🚀
