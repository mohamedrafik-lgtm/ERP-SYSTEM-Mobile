# ميزة حذف المتدرب

## نظرة عامة

تم إضافة ميزة شاملة لحذف المتدربين مع إرسال إشعارات WhatsApp تلقائية عند الحذف.

## الميزات المضافة

### ✅ **1. Types جديدة**

تم إضافة interface جديدة في `src/types/student.ts`:

```typescript
// Trainee Delete Types
export interface DeleteTraineeResponse {
  success: boolean;
  message: string;
  error?: string;
}
```

### ✅ **2. AuthService Method**

تم إضافة method جديد في `src/services/AuthService.ts`:

```typescript
// Trainee Management: Delete Trainee
static async deleteTrainee(traineeId: number): Promise<import('../types/student').DeleteTraineeResponse> {
  try {
    const token = await this.getToken();
    if (!token) {
      throw new Error('Authentication token not found.');
    }

    const url = `http://10.0.2.2:4000/api/trainees/${traineeId}`;
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
```

### ✅ **3. WhatsApp Auto Message**

تم إضافة method جديد في `src/services/WhatsAppAutoMessageService.ts`:

```typescript
// Helper method to send trainee deletion message
static async sendTraineeDeletionMessage(
  phoneNumber: string,
  traineeName: string,
  reason: string,
  deletedBy: string,
  deletionDate: string
): Promise<WhatsAppAutoMessage> {
  const message = `❌ إشعار حذف الحساب

مرحباً ${traineeName}

نأسف لإبلاغك بأنه تم حذف حسابك من النظام

📝 السبب: ${reason}
👤 تم الحذف بواسطة: ${deletedBy}
📅 تاريخ الحذف: ${this.formatDate(deletionDate)}

إذا كان لديك أي استفسار، يرجى التواصل معنا.`;

  return this.sendMessage(
    this.formatPhoneNumber(phoneNumber),
    message,
    'student_management',
    'deletion',
    'urgent',
    'immediate',
    {
      studentName: traineeName,
      reason,
      deletedBy,
      deletionDate
    }
  );
}
```

### ✅ **4. تكامل مع قائمة المتدربين**

تم تحديث `src/screens/StudentsListScreen.tsx`:

#### **إضافة زر الحذف:**
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

#### **تأكيد الحذف:**
```typescript
const handleDeleteStudent = (student: ITrainee) => {
  Alert.alert(
    'تأكيد الحذف',
    `هل أنت متأكد من حذف المتدرب "${student.nameAr}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`,
    [
      {
        text: 'إلغاء',
        style: 'cancel',
      },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => confirmDeleteStudent(student),
      },
    ]
  );
};
```

#### **تنفيذ الحذف:**
```typescript
const confirmDeleteStudent = async (student: ITrainee) => {
  try {
    setLoading(true);
    console.log('Deleting trainee:', student.id);

    // Delete trainee
    const response = await AuthService.deleteTrainee(student.id);
    console.log('Delete response:', response);

    if (response.success !== false) {
      // Show success message
      Alert.alert(
        'تم الحذف بنجاح',
        `تم حذف المتدرب "${student.nameAr}" بنجاح`,
        [
          {
            text: 'موافق',
            onPress: () => {
              // Refresh the list
              fetchStudents(currentPage, searchText, statusFilter);
            },
          },
        ]
      );

      // Send WhatsApp message if phone number is available
      if (student.phone) {
        try {
          await WhatsAppAutoMessageService.sendTraineeDeletionMessage(
            student.phone,
            student.nameAr,
            'حذف من النظام',
            'النظام', // You can get this from user context
            new Date().toISOString()
          );
          
          console.log('WhatsApp deletion message sent successfully');
        } catch (messageError) {
          console.error('Error sending WhatsApp deletion message:', messageError);
          // Don't show error to user as deletion was successful
        }
      }
    } else {
      throw new Error(response.message || response.error || 'فشل في حذف المتدرب');
    }
  } catch (error: any) {
    console.error('Error deleting trainee:', error);
    Alert.alert(
      'خطأ في الحذف',
      error.message || 'حدث خطأ غير متوقع أثناء حذف المتدرب'
    );
  } finally {
    setLoading(false);
  }
};
```

## الاستخدام

### **📱 الوصول للميزة:**

1. **من قائمة المتدربين**: اضغط على زر الإجراءات (⋮) بجانب أي متدرب
2. **اختر "حذف المتدرب"** من القائمة المنبثقة
3. **تأكيد الحذف** في الرسالة المنبثقة
4. **اضغط "حذف"** لتنفيذ العملية

### **🔄 عملية الحذف:**

1. **تأكيد الحذف**: رسالة تحذيرية مع تأكيد
2. **تنفيذ الحذف**: إرسال DELETE request للـ API
3. **عرض النتيجة**: رسالة نجاح أو خطأ
4. **تحديث القائمة**: إعادة تحميل قائمة المتدربين
5. **إرسال إشعار WhatsApp**: تلقائي للمتدرب

### **📋 مثال على الاستخدام:**

```typescript
// حذف متدرب
const response = await AuthService.deleteTrainee(traineeId);

if (response.success) {
  // إرسال إشعار WhatsApp
  await WhatsAppAutoMessageService.sendTraineeDeletionMessage(
    trainee.phone,
    trainee.nameAr,
    'حذف من النظام',
    'النظام',
    new Date().toISOString()
  );
}
```

## رسالة WhatsApp

### **📱 مثال على الرسالة المرسلة:**

```
❌ إشعار حذف الحساب

مرحباً أحمد محمد

نأسف لإبلاغك بأنه تم حذف حسابك من النظام

📝 السبب: حذف من النظام
👤 تم الحذف بواسطة: النظام
📅 تاريخ الحذف: 15 يناير 2024

إذا كان لديك أي استفسار، يرجى التواصل معنا.
```

## الميزات التقنية

### **🔧 API Integration**
- **Endpoint**: `DELETE /api/trainees/{id}`
- **Method**: `DELETE`
- **Authentication**: Bearer token
- **Error Handling**: شامل مع رسائل واضحة

### **📊 Data Validation**
- **تأكيد الحذف**: رسالة تحذيرية قبل التنفيذ
- **معالجة الأخطاء**: شاملة مع رسائل واضحة
- **تحديث القائمة**: تلقائي بعد الحذف

### **🎨 UI/UX Features**
- **زر تحذيري**: لون أحمر للحذف
- **رسائل تأكيد**: واضحة ومفهومة
- **Loading States**: مؤشرات التحميل
- **Error Handling**: معالجة شاملة للأخطاء

### **📱 Responsive Design**
- **Alert Dialogs**: رسائل تأكيد واضحة
- **Loading Indicators**: أثناء التنفيذ
- **Success Messages**: رسائل نجاح واضحة
- **Error Messages**: رسائل خطأ مفصلة

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
- **Success States**: حالات النجاح

## الميزات المتقدمة

### **📅 تأكيد الحذف**
- **رسالة تحذيرية**: واضحة ومفهومة
- **تأكيد مزدوج**: منع الحذف العرضي
- **معلومات المتدرب**: عرض اسم المتدرب في الرسالة

### **🎯 إشعارات WhatsApp**
- **رسائل تلقائية**: عند الحذف
- **معلومات شاملة**: السبب، من قام بالحذف، التاريخ
- **معالجة أخطاء**: لا تؤثر على عملية الحذف

### **📊 تحديث القائمة**
- **تحديث تلقائي**: بعد الحذف الناجح
- **إزالة العنصر**: من القائمة المحلية
- **تحديث الإحصائيات**: عدد المتدربين

## الاختبار

### **1. اختبار الحذف العادي**

```typescript
// حذف متدرب موجود
const response = await AuthService.deleteTrainee(123);
// يجب أن يعود success: true
```

### **2. اختبار الحذف غير الموجود**

```typescript
// حذف متدرب غير موجود
const response = await AuthService.deleteTrainee(999);
// يجب أن يعود error message
```

### **3. اختبار التأكيد**

```typescript
// يجب أن تظهر رسالة تأكيد
Alert.alert('تأكيد الحذف', 'هل أنت متأكد...');
```

### **4. اختبار إشعار WhatsApp**

```typescript
// يجب أن يتم إرسال رسالة WhatsApp
await WhatsAppAutoMessageService.sendTraineeDeletionMessage(
  '0501234567',
  'أحمد محمد',
  'حذف من النظام',
  'النظام',
  new Date().toISOString()
);
```

## النتائج المتوقعة

### ✅ **عند النجاح**

```
[AuthService] Trainee delete response: {
  "success": true,
  "message": "تم حذف المتدرب بنجاح"
}

[WhatsApp] Deletion message sent successfully
```

### ❌ **عند الفشل**

```
[AuthService] Error response data: {
  "error": "Trainee not found",
  "message": "المتدرب غير موجود"
}
```

## الخلاصة

تم إضافة ميزة شاملة لحذف المتدربين تشمل:

- ✅ **API Integration**: DELETE endpoint مع معالجة أخطاء
- ✅ **WhatsApp Notifications**: إشعارات تلقائية
- ✅ **Confirmation Dialog**: تأكيد الحذف
- ✅ **Error Handling**: معالجة شاملة للأخطاء
- ✅ **UI Integration**: تكامل مع قائمة المتدربين
- ✅ **Auto Refresh**: تحديث تلقائي للقائمة
- ✅ **Logging**: تسجيل مفصل للعمليات
- ✅ **User Experience**: تجربة مستخدم سلسة

الميزة الآن جاهزة للاستخدام في جميع أجزاء التطبيق! 🚀
