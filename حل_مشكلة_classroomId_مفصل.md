# 🔍 تم إضافة Debug Logs شاملة لحل مشكلة classroomId

## 🎯 المشكلة:

**"فشل في تحميل الجدول الدراسي"** - المشكلة في الـ `classroomId` الذي يتم إرساله للـ API

## 🔧 الحل المطبق:

### **1. إضافة Debug Logs شاملة** ✅
- في `ScheduleScreen` لمراقبة الـ `classroom.id`
- في `SemesterSelectionScreen` لمراقبة الـ navigation
- في `ScheduleDetailsScreen` لمراقبة الـ API call
- في `AuthService.getClassroomSchedule` لمراقبة الـ API response

### **2. إضافة Validation للـ classroomId** ✅
- التحقق من نوع البيانات (number vs string)
- التحقق من صحة الـ ID (أكبر من 0)
- تحويل الـ string إلى number إذا لزم الأمر

### **3. تحسين Error Messages** ✅
- رسائل خطأ أكثر تفصيلاً
- عرض الـ classroomId في رسائل الخطأ
- عرض نوع البيانات والسبب

## 🔍 Debug Logs المضافة:

### **1. ScheduleScreen** ✅
```javascript
// Debug: Check each classroom ID
if (program.classrooms && program.classrooms.length > 0) {
  program.classrooms.forEach((classroom, index) => {
    console.log(`🔍 ScheduleScreen - Classroom ${index + 1}:`, {
      id: classroom.id,
      name: classroom.name,
      classNumber: classroom.classNumber,
      idType: typeof classroom.id,
      idValue: classroom.id,
      isIdValid: !isNaN(classroom.id) && classroom.id > 0
    });
  });
}
```

### **2. SemesterSelectionScreen** ✅
```javascript
const handleSemesterPress = (classroom: ProgramsResponse['classrooms'][0]) => {
  console.log('🔍 SemesterSelectionScreen - Classroom pressed:', {
    id: classroom.id,
    name: classroom.name,
    classNumber: classroom.classNumber,
    startDate: classroom.startDate,
    endDate: classroom.endDate,
    idType: typeof classroom.id,
    idValue: classroom.id,
    isIdValid: !isNaN(classroom.id) && classroom.id > 0
  });
  
  // Validate classroom ID
  if (!classroom.id || isNaN(classroom.id) || classroom.id <= 0) {
    console.error('🔍 SemesterSelectionScreen - Invalid classroom ID:', classroom.id);
    Alert.alert('خطأ', `معرف الفصل الدراسي غير صحيح: ${classroom.id}`);
    return;
  }
  
  navigation.navigate('ScheduleDetails', { 
    programId: programId,
    programName: programName,
    classroomId: classroom.id,
    classroomName: classroom.name
  });
};
```

### **3. ScheduleDetailsScreen** ✅
```javascript
const fetchScheduleSlots = async () => {
  try {
    setLoading(true);
    console.log('🔍 ScheduleDetailsScreen - Fetching classroom schedule for classroomId:', classroomId);
    console.log('🔍 ScheduleDetailsScreen - classroomId type:', typeof classroomId);
    console.log('🔍 ScheduleDetailsScreen - classroomId value:', classroomId);
    console.log('🔍 ScheduleDetailsScreen - classroomId is number?', typeof classroomId === 'number');
    console.log('🔍 ScheduleDetailsScreen - classroomId is string?', typeof classroomId === 'string');
    console.log('🔍 ScheduleDetailsScreen - classroomId toString:', classroomId?.toString());
    
    // Ensure classroomId is a number
    const numericClassroomId = typeof classroomId === 'string' ? parseInt(classroomId, 10) : classroomId;
    console.log('🔍 ScheduleDetailsScreen - Numeric classroomId:', numericClassroomId);
    console.log('🔍 ScheduleDetailsScreen - Is numeric classroomId valid?', !isNaN(numericClassroomId) && numericClassroomId > 0);
    
    if (isNaN(numericClassroomId) || numericClassroomId <= 0) {
      throw new Error(`Invalid classroomId: ${classroomId} (converted to: ${numericClassroomId})`);
    }
    
    const response = await AuthService.getClassroomSchedule(numericClassroomId);
    // ... rest of the function
  } catch (error) {
    console.error('🔍 ScheduleDetailsScreen - Error fetching classroom schedule:', error);
    Alert.alert('خطأ', `فشل في تحميل الجدول الدراسي: ${error.message}`);
    setScheduleSlots([]);
  }
};
```

### **4. AuthService.getClassroomSchedule** ✅
```javascript
static async getClassroomSchedule(classroomId: number) {
  try {
    console.log('🔍 AuthService.getClassroomSchedule() - Fetching classroom schedule for ID:', classroomId);
    console.log('🔍 AuthService.getClassroomSchedule() - classroomId type:', typeof classroomId);
    console.log('🔍 AuthService.getClassroomSchedule() - classroomId value:', classroomId);
    console.log('🔍 AuthService.getClassroomSchedule() - Is classroomId valid?', !isNaN(classroomId) && classroomId > 0);
    
    const apiBaseUrl = getCurrentApiBaseUrl();
    const url = `${apiBaseUrl}/api/schedule/classroom/${classroomId}`;
    console.log('🔍 AuthService.getClassroomSchedule() - API URL:', url);
    console.log('🔍 AuthService.getClassroomSchedule() - Full URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('🔍 AuthService.getClassroomSchedule() - Response status:', response.status);
    console.log('🔍 AuthService.getClassroomSchedule() - Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔍 AuthService.getClassroomSchedule() - Error response:', errorText);
      console.log('🔍 AuthService.getClassroomSchedule() - Error status:', response.status);
      
      if (response.status === 404) {
        throw new Error(`الفصل الدراسي غير موجود (ID: ${classroomId})`);
      } else if (response.status === 401) {
        throw new Error('غير مصرح - يرجى تسجيل الدخول مرة أخرى');
      } else {
        throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('🔍 AuthService.getClassroomSchedule() - Response data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('[AuthService] Error fetching classroom schedule:', error);
    throw error;
  }
}
```

## 📱 كيفية التشخيص:

### **1. افتح Developer Console**
- اضغط F12 في المتصفح
- أو استخدم React Native Debugger
- أو استخدم Metro bundler logs

### **2. اتبع التدفق التالي:**
1. **افتح صفحة الجداول الدراسية**
2. **اختر برنامج**
3. **اختر فصل دراسي**
4. **راقب الـ console logs**

### **3. راقب الـ Logs التالية:**

#### **أ. في ScheduleScreen:**
```
🔍 ScheduleScreen - Program pressed: {...}
🔍 ScheduleScreen - Classroom 1: {id: X, name: "Y", idType: "number", isIdValid: true}
🔍 ScheduleScreen - Classroom 2: {id: Z, name: "W", idType: "number", isIdValid: true}
```

#### **ب. في SemesterSelectionScreen:**
```
🔍 SemesterSelectionScreen - Classroom pressed: {id: X, name: "Y", idType: "number", isIdValid: true}
🔍 SemesterSelectionScreen - Navigating to schedule details with: {...}
```

#### **ج. في ScheduleDetailsScreen:**
```
🔍 ScheduleDetailsScreen - Component loaded with params: {...}
🔍 ScheduleDetailsScreen - classroomId exists, fetching schedule slots
🔍 ScheduleDetailsScreen - Fetching classroom schedule for classroomId: X
🔍 ScheduleDetailsScreen - classroomId type: number
🔍 ScheduleDetailsScreen - classroomId value: X
🔍 ScheduleDetailsScreen - Numeric classroomId: X
🔍 ScheduleDetailsScreen - Is numeric classroomId valid? true
```

#### **د. في AuthService:**
```
🔍 AuthService.getClassroomSchedule() - Fetching classroom schedule for ID: X
🔍 AuthService.getClassroomSchedule() - classroomId type: number
🔍 AuthService.getClassroomSchedule() - classroomId value: X
🔍 AuthService.getClassroomSchedule() - Is classroomId valid? true
🔍 AuthService.getClassroomSchedule() - API URL: [URL]
🔍 AuthService.getClassroomSchedule() - Response status: [STATUS]
```

## 🚨 المشاكل المحتملة والحلول:

### **1. مشكلة في الـ classroom.id من API**
**الأعراض:**
```
🔍 ScheduleScreen - Classroom 1: {id: undefined, name: "Y", idType: "undefined", isIdValid: false}
```

**الحل:**
- تحقق من أن الـ API `/api/programs` يرجع `classrooms` مع `id`
- تحقق من أن الـ database يحتوي على `id` للفصول الدراسية

### **2. مشكلة في نوع البيانات**
**الأعراض:**
```
🔍 ScheduleDetailsScreen - classroomId type: string
🔍 ScheduleDetailsScreen - classroomId value: "123"
🔍 ScheduleDetailsScreen - Numeric classroomId: 123
```

**الحل:**
- النظام يحول الـ string إلى number تلقائياً
- تأكد من أن الـ conversion يعمل بشكل صحيح

### **3. مشكلة في الـ API Call**
**الأعراض:**
```
🔍 AuthService.getClassroomSchedule() - Response status: 404
🔍 AuthService.getClassroomSchedule() - Error response: Classroom not found
```

**الحل:**
- تحقق من أن الـ `classroomId` صحيح
- تحقق من أن الـ API endpoint يعمل
- تحقق من أن الـ database يحتوي على بيانات الجدول الدراسي

### **4. مشكلة في الـ Authentication**
**الأعراض:**
```
🔍 AuthService.getClassroomSchedule() - Response status: 401
🔍 AuthService.getClassroomSchedule() - Error response: Unauthorized
```

**الحل:**
- تحقق من الـ JWT token
- تأكد من تسجيل الدخول
- جرب تسجيل الدخول مرة أخرى

## 🔧 التحسينات المضافة:

### **1. Type Conversion** ✅
```javascript
// Ensure classroomId is a number
const numericClassroomId = typeof classroomId === 'string' ? parseInt(classroomId, 10) : classroomId;
```

### **2. Validation** ✅
```javascript
if (isNaN(numericClassroomId) || numericClassroomId <= 0) {
  throw new Error(`Invalid classroomId: ${classroomId} (converted to: ${numericClassroomId})`);
}
```

### **3. Better Error Messages** ✅
```javascript
if (response.status === 404) {
  throw new Error(`الفصل الدراسي غير موجود (ID: ${classroomId})`);
}
```

### **4. Comprehensive Logging** ✅
```javascript
console.log('🔍 ScheduleDetailsScreen - classroomId type:', typeof classroomId);
console.log('🔍 ScheduleDetailsScreen - classroomId value:', classroomId);
console.log('🔍 ScheduleDetailsScreen - classroomId is number?', typeof classroomId === 'number');
console.log('🔍 ScheduleDetailsScreen - classroomId is string?', typeof classroomId === 'string');
```

## 📋 قائمة التحقق:

- [ ] فتح Developer Console
- [ ] فتح صفحة الجداول الدراسية
- [ ] اختيار برنامج
- [ ] مراقبة logs الـ classrooms
- [ ] اختيار فصل دراسي
- [ ] مراقبة logs الـ navigation
- [ ] مراقبة logs الـ API call
- [ ] تحديد المشكلة بناءً على الـ logs

## 🎯 الخطوات التالية:

### **1. بعد مراجعة الـ Logs:**
- إذا كانت المشكلة في الـ `classroom.id` → تحقق من الـ API `/api/programs`
- إذا كانت المشكلة في الـ type conversion → النظام يحلها تلقائياً
- إذا كانت المشكلة في الـ API call → تحقق من الـ backend

### **2. إذا كانت المشكلة في الـ Backend:**
- تحقق من أن `/api/programs` يرجع `classrooms` مع `id`
- تحقق من أن `/api/schedule/classroom/{classroomId}` يعمل
- تحقق من أن الـ database يحتوي على البيانات

### **3. إذا كانت المشكلة في الـ Frontend:**
- تحقق من الـ navigation parameters
- تحقق من معالجة البيانات
- تحقق من الـ type conversion

---

## 🔍 الآن افتح الصفحة وراقب الـ console logs!

**الـ debug logs ستظهر لنا:**
1. **هل الـ classroom.id موجود في البيانات المرجعة من `/api/programs`؟**
2. **هل الـ classroomId يتم تمريره بشكل صحيح؟**
3. **هل الـ API call يتم بنجاح؟**
4. **ما هو الـ response من الـ API؟**

**بعد مراجعة الـ logs، أخبرني بالنتائج وسأتمكن من تحديد المشكلة وإصلاحها! 🚀**
