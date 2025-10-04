# إصلاح مشكلة عدم ظهور إدارة الاختبارات المصغرة في القائمة

## المشكلة
لا تظهر صفحة "إدارة الاختبارات المصغرة" (QuizManagement) في قائمة التنقل بين الصفحات.

## السبب
كانت صفحة QuizManagement غير مضافة في ملف الصلاحيات `src/types/permissions.ts`، مما يمنع نظام الصلاحيات من عرضها في القائمة.

## الحل المطبق

### 1. إضافة QuizManagement إلى ملف الصلاحيات

تم إضافة صفحتين في `src/types/permissions.ts`:

```typescript
// إدارة الاختبارات المصغرة
{
  id: 'QuizManagement',
  title: 'إدارة الاختبارات المصغرة',
  icon: 'assignment',
  screen: 'QuizManagement',
  priority: 4.5,
  allowedRoles: ['super_admin', 'admin', 'manager'],
  category: 'academic',
  description: 'إدارة الاختبارات المصغرة والامتحانات'
},
{
  id: 'AddQuiz',
  title: 'إضافة اختبار مصغر',
  icon: 'add-box',
  screen: 'AddQuiz',
  priority: 4.6,
  allowedRoles: ['super_admin', 'admin', 'manager'],
  category: 'academic',
  description: 'إضافة اختبار مصغر جديد'
},
```

### 2. الصلاحيات المطلوبة

الصفحات متاحة للأدوار التالية:
- ✅ `super_admin` - مدير عام
- ✅ `admin` - مدير النظام
- ✅ `manager` - مدير

**غير متاحة للأدوار:**
- ❌ `accountant` - محاسب
- ❌ `employee` - موظف
- ❌ `trainee_entry_clerk` - موظف إدخال بيانات المتدربين

### 3. موقع الصفحات في القائمة

ستظهر الصفحات في:
- **القسم:** الإدارة الأكاديمية
- **الترتيب:** بعد المحتوى التدريبي (priority: 4.5 و 4.6)
- **الأيقونة:** assignment و add-box

## خطوات التطبيق

### الطريقة الأولى: إعادة تشغيل التطبيق (مفضل)

1. أوقف التطبيق تماماً (أغلق Metro Bundler)
2. امسح الكاش:
   ```bash
   # في terminal
   cd C:\projects\ERP-SSTEM\ERP-SYSTEM-Mobile
   
   # مسح الكاش
   npx react-native start --reset-cache
   ```
3. في terminal آخر، شغل التطبيق:
   ```bash
   # للأندرويد
   npx react-native run-android
   
   # للـ iOS
   npx react-native run-ios
   ```

### الطريقة الثانية: Reload في التطبيق

1. افتح التطبيق
2. اهز الجهاز أو اضغط على:
   - **Android:** Ctrl + M (على المحاكي) أو R مرتين
   - **iOS:** Cmd + D (على المحاكي)
3. اختر "Reload"

### الطريقة الثالثة: تسجيل الخروج والدخول

1. سجل الخروج من التطبيق
2. أغلق التطبيق تماماً
3. افتح التطبيق مرة أخرى
4. سجل الدخول

## التحقق من الحل

بعد تطبيق أحد الحلول أعلاه، يجب أن تظهر:

### في قائمة التنقل (Menu):
```
📚 الإدارة الأكاديمية
├── ...
├── 📖 المحتوى التدريبي
├── ➕ إضافة محتوى تدريبي
├── 📝 إدارة الاختبارات المصغرة    ← جديد ✨
├── ➕ إضافة اختبار مصغر            ← جديد ✨
└── ...
```

### التحقق من الدور:

إذا لم تظهر الصفحات، تأكد من دور المستخدم:

```javascript
// يمكنك التحقق في Console
import AuthService from './src/services/AuthService';

AuthService.getUser().then(user => {
  console.log('User Role:', user?.primaryRole?.name);
  console.log('All Roles:', user?.roles?.map(r => r.name));
});
```

يجب أن يكون الدور أحد التالية:
- `super_admin`
- `admin`
- `manager`

## استكشاف الأخطاء

### المشكلة: لا تزال الصفحات غير ظاهرة

**الحل 1:** تحقق من دور المستخدم
```bash
# افتح Metro Bundler console وابحث عن:
"User Role:" or "primaryRole"
```

**الحل 2:** امسح بيانات التطبيق
- **Android:** Settings > Apps > [Your App] > Storage > Clear Data
- **iOS:** Delete app and reinstall

**الحل 3:** تحقق من الكود
```bash
# تأكد من أن الملفات صحيحة
cat src/types/permissions.ts | grep -A 10 "QuizManagement"
```

### المشكلة: الصفحات تظهر لكن تعطي خطأ

**السبب:** قد تكون الشاشات غير موجودة أو بها أخطاء.

**التحقق:**
```bash
# تأكد من وجود الملفات
ls src/screens/QuizManagementScreen.tsx
ls src/screens/AddQuizScreen.tsx
```

**الحل:** تحقق من الأخطاء في Metro Bundler console.

## ملاحظات مهمة

1. **الكاش:** React Native يحفظ الملفات في الكاش، لذلك إعادة التشغيل مع مسح الكاش مهمة
2. **Hot Reload:** التغييرات في TypeScript types قد لا تنعكس مع Hot Reload
3. **الصلاحيات:** إذا كنت تستخدم حساب `employee` أو `accountant` لن تظهر الصفحات
4. **AsyncStorage:** بيانات الصلاحيات قد تكون محفوظة في AsyncStorage، حاول تسجيل الخروج والدخول

## الملفات المعدلة

```
src/types/permissions.ts (محدث ✅)
  ├── أضيف QuizManagement في SCREEN_PERMISSIONS
  └── أضيف AddQuiz في SCREEN_PERMISSIONS
```

## النتيجة المتوقعة

بعد تطبيق الحل:
- ✅ تظهر "إدارة الاختبارات المصغرة" في القائمة
- ✅ تظهر "إضافة اختبار مصغر" في القائمة
- ✅ يمكن الوصول للصفحات من القائمة
- ✅ الصفحات محمية بنظام الصلاحيات
- ✅ فقط المديرين يمكنهم الوصول

## التواصل

إذا استمرت المشكلة:
1. تحقق من دور المستخدم في Console
2. أرسل screenshot من القائمة
3. أرسل User Role من Console
4. تحقق من Metro Bundler للأخطاء

---

**تاريخ الإصلاح:** 4 أكتوبر 2025  
**الملفات المعدلة:** src/types/permissions.ts  
**التأثير:** إضافة 2 صفحات جديدة للقائمة

