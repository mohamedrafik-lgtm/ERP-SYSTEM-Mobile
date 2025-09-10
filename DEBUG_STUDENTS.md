# تشخيص مشكلة عرض الطلاب

## التحسينات المضافة

تم إضافة التحسينات التالية لتشخيص مشكلة عرض الطلاب:

### 1. تسجيل مفصل في Console
- إضافة `console.log` في `fetchStudents` لعرض المعاملات المرسلة
- إضافة `console.log` في `AuthService.getTrainees` لعرض URL والاستجابة
- عرض حالة الاستجابة والبيانات المستلمة

### 2. زر اختبار الاتصال
- إضافة زر "اختبار الاتصال" في شاشة قائمة الطلاب
- يمكن الضغط عليه لإعادة تحميل البيانات مع عرض التفاصيل في Console

### 3. معلومات تشخيصية
- عرض إجمالي الطلاب والصفحات في حالة عدم وجود طلاب
- رسائل خطأ مفصلة

## خطوات التشخيص

### 1. تشغيل التطبيق
```bash
npx react-native run-android
# أو
npx react-native run-ios
```

### 2. فتح Developer Console
- في Android: اضغط `Ctrl+M` أو `Cmd+M` واختر "Debug"
- في iOS: اضغط `Cmd+D` واختر "Debug"

### 3. الانتقال لشاشة الطلاب
- سجل الدخول للتطبيق
- انتقل إلى "قائمة الطلاب"

### 4. مراقبة Console
ابحث عن الرسائل التالية:
```
Fetching students with params: {...}
Fetching trainees from URL: http://10.0.2.2:4000/api/trainees?...
Using token: eyJhbGciOiJIUzI1NiIs...
Query params: page=1&limit=10&includeDetails=true
Response status: 200
Response data: {...}
Students loaded: X students
```

### 5. اختبار الاتصال
- اضغط على زر "اختبار الاتصال"
- راقب Console للرسائل الجديدة

## المشاكل المحتملة وحلولها

### 1. خطأ 401 (Unauthorized)
```
Response status: 401
```
**الحل**: انتهت صلاحية الجلسة، سجل الدخول مرة أخرى

### 2. خطأ 404 (Not Found)
```
Response status: 404
```
**الحل**: تحقق من عنوان API في `AuthService.ts`

### 3. خطأ 500 (Server Error)
```
Response status: 500
```
**الحل**: مشكلة في الخادم، تحقق من logs الخادم

### 4. خطأ في الاتصال
```
Error fetching trainees in AuthService: Network request failed
```
**الحل**: 
- تأكد من تشغيل الخادم على `http://10.0.2.2:4000`
- تحقق من اتصال الإنترنت
- تأكد من إعدادات الشبكة

### 5. استجابة فارغة
```
Response data: []
Students loaded: 0 students
```
**الحل**: 
- تحقق من وجود بيانات في قاعدة البيانات
- جرب البحث بكلمات مختلفة
- تحقق من فلاتر الحالة

## إعدادات API

العنوان الحالي: `http://10.0.2.2:4000`

### للـ Android Emulator:
- `10.0.2.2` يشير إلى `localhost` على الكمبيوتر المضيف

### للجهاز الحقيقي:
- استبدل `10.0.2.2` بعنوان IP الحقيقي للكمبيوتر
- مثال: `http://192.168.1.100:4000`

### للـ iOS Simulator:
- استخدم `localhost` بدلاً من `10.0.2.2`
- مثال: `http://localhost:4000`

## نصائح إضافية

1. **تأكد من تشغيل الخادم** قبل فتح التطبيق
2. **تحقق من logs الخادم** لمعرفة الطلبات الواردة
3. **جرب API مباشرة** باستخدام Postman أو curl
4. **تحقق من إعدادات CORS** في الخادم
5. **تأكد من صحة Token** المستخدم في الطلبات

## مثال على طلب API صحيح

```bash
curl -X GET "http://10.0.2.2:4000/api/trainees?page=1&limit=10&includeDetails=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

## إذا استمرت المشكلة

1. أرسل logs Console كاملة
2. أرسل استجابة API من الخادم
3. تأكد من إعدادات قاعدة البيانات
4. تحقق من صلاحيات المستخدم
