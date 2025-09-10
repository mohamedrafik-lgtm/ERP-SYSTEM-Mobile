# ميزة تعديل المحتوى التدريبي

## الميزات المنجزة

### ✅ **1. إضافة Method في AuthService**
تم إضافة `updateTrainingContent` method في `src/services/AuthService.ts`:

```typescript
static async updateTrainingContent(contentId: number, contentData: any): Promise<any>
```

**الميزات:**
- استخدام PATCH method للـ API
- معالجة أخطاء شاملة
- console.log مفصل للتشخيص
- دعم جميع حقول المحتوى التدريبي

### ✅ **2. إنشاء صفحة EditTrainingContentScreen**
تم إنشاء `src/screens/EditTrainingContentScreen.tsx` مع الميزات التالية:

#### 📝 **النموذج المكتمل**
- **جميع الحقول**: كود، اسم، فصل، سنة، برامج، محاضر، مسجلي الحضور
- **توزيع الدرجات**: أعمال السنة، عملي، تحريري، حضور، اختبارات، امتحان نهائي
- **تفاصيل المحتوى**: مدة الدراسة، عدد الحصص، عدد الفصول

#### 🔒 **الحماية والتحقق**
- **كود المادة محمي**: لا يمكن تعديله (disabled)
- **التحقق من البيانات**: جميع الحقول المطلوبة
- **رسائل خطأ واضحة**: للمستخدم

#### 🎨 **التصميم**
- **نفس تصميم صفحة الإضافة**: للاتساق
- **أزرار واضحة**: تحديث المحتوى
- **تحميل مرئي**: أثناء التحديث

### ✅ **3. إضافة زر التعديل**
تم إضافة زر التعديل في `TrainingContentsScreen.tsx`:

#### 🔧 **الأزرار الجديدة**
- **زر التعديل**: أيقونة قلم مع لون مميز
- **زر المزيد**: للوظائف الإضافية (مستقبلاً)
- **تصميم منظم**: أزرار في صف واحد

#### 🎯 **التنقل**
- **انتقال سلس**: من صفحة العرض للتعديل
- **تمرير البيانات**: المحتوى كاملاً للصفحة
- **العودة**: بعد التحديث الناجح

### ✅ **4. تسجيل الصفحة**
تم تسجيل `EditTrainingContentScreen` في `App.tsx`:
- إضافة import للصفحة
- تسجيل في Stack Navigator
- متاحة للتنقل

## API Endpoint المستخدم

```
PATCH /api/training-contents/{id}
```

### البيانات المرسلة:
```json
{
  "code": "string",
  "name": "string", 
  "semester": "FIRST" | "SECOND",
  "year": "FIRST" | "SECOND" | "THIRD" | "FOURTH",
  "programIds": [number],
  "instructorId": "string",
  "theoryAttendanceRecorderId": "string",
  "practicalAttendanceRecorderId": "string",
  "durationMonths": number,
  "theorySessionsPerWeek": number,
  "practicalSessionsPerWeek": number,
  "chaptersCount": number,
  "yearWorkMarks": number,
  "practicalMarks": number,
  "writtenMarks": number,
  "attendanceMarks": number,
  "quizzesMarks": number,
  "finalExamMarks": number
}
```

## طرق الوصول لصفحة التعديل

### 1. من صفحة المحتوى التدريبي
```
المحتوى التدريبي → محتوى معين → زر التعديل (قلم)
```

## الميزات المتقدمة

### 🔄 **تحديث البيانات**
- **تحميل البيانات الحالية**: في النموذج
- **حفظ التغييرات**: مع التحقق
- **العودة التلقائية**: بعد التحديث الناجح

### 🎯 **تجربة المستخدم**
- **نموذج مكتمل**: بجميع البيانات الحالية
- **تحميل مرئي**: أثناء التحديث
- **رسائل نجاح/خطأ**: واضحة للمستخدم
- **تصميم متسق**: مع باقي التطبيق

### 📱 **التوافق**
- **TypeScript**: types آمنة ومحددة
- **React Native**: متوافق مع iOS و Android
- **Navigation**: متكامل مع نظام التنقل
- **Styling**: أنماط متسقة

## الكود المحدث

### AuthService.ts
```typescript
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

    // معالجة الاستجابة...
    return data;
  } catch (error) {
    console.error('Error updating training content in AuthService:', error);
    throw error;
  }
}
```

### TrainingContentsScreen.tsx
```typescript
// أزرار الإجراءات
<View style={styles.actionButtons}>
  <TouchableOpacity 
    style={styles.editButton}
    onPress={() => navigation.navigate('EditTrainingContent', { content })}
  >
    <Icon name="edit" size={18} color="#1a237e" />
  </TouchableOpacity>
  <TouchableOpacity style={styles.moreButton}>
    <Icon name="more-vert" size={20} color="#6b7280" />
  </TouchableOpacity>
</View>
```

### EditTrainingContentScreen.tsx
```typescript
// تحميل البيانات الحالية
const [formData, setFormData] = useState<IEditTrainingContent>({
  code: content?.code || '',
  name: content?.name || '',
  semester: content?.semester || ISemester.FIRST,
  // ... باقي الحقول
});

// تحديث المحتوى
const handleSubmit = async () => {
  // التحقق من البيانات
  // إرسال التحديث
  await AuthService.updateTrainingContent(content.id, formData);
  // العودة للصفحة السابقة
  navigation.goBack();
};
```

## الاختبار

### 1. اختبار الوصول
- انتقل للمحتوى التدريبي
- اضغط على زر التعديل (قلم)
- تأكد من فتح صفحة التعديل

### 2. اختبار التعديل
- عدّل بعض البيانات
- اضغط على "تحديث المحتوى"
- تأكد من نجاح التحديث

### 3. اختبار الحماية
- تأكد من أن كود المادة محمي (غير قابل للتعديل)
- جرب ترك حقول مطلوبة فارغة
- تأكد من ظهور رسائل الخطأ

### 4. اختبار التنقل
- تأكد من العودة للصفحة السابقة بعد التحديث
- تأكد من تحديث البيانات في صفحة العرض

## الخطوات التالية

1. **إضافة وظائف الحذف**: حذف المحتوى التدريبي
2. **إضافة عرض التفاصيل**: صفحة تفاصيل المحتوى
3. **إضافة إدارة الأسئلة**: ربط الأسئلة بالمحتوى
4. **إضافة التقارير**: تقارير عن المحتوى التدريبي
5. **إضافة النسخ**: نسخ محتوى تدريبي موجود

## الخلاصة

تم إضافة ميزة تعديل المحتوى التدريبي بنجاح مع:
- ✅ API method للتحديث
- ✅ صفحة تعديل شاملة
- ✅ زر تعديل في صفحة العرض
- ✅ تصميم متسق ومتجاوب
- ✅ معالجة أخطاء شاملة
- ✅ تجربة مستخدم سلسة
