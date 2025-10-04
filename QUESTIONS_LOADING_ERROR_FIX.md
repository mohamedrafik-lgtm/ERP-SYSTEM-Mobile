# 🔧 إصلاح خطأ "فشل في تحميل الأسئلة"

## 🎯 المشكلة

كان هناك خطأ "فشل في تحميل الأسئلة" عند محاولة جلب الأسئلة من بنك الأسئلة في صفحة إضافة الاختبار المصغر.

## 🔍 التشخيص

### الأسباب المحتملة:
1. **API Endpoint غير موجود** - `/api/questions` قد لا يدعم الـ parameters المرسلة
2. **بنية البيانات مختلفة** - الـ API قد يرجع البيانات في بنية غير متوقعة
3. **عدم وجود fallback** - لا يوجد آلية احتياطية عند فشل الـ API الجديد

## 🔧 الإصلاحات المنجزة

### 1. إضافة Fallback Mechanism في AddQuizScreen

#### قبل الإصلاح ❌
```typescript
const loadQuestions = async (contentId: number) => {
  try {
    setIsLoadingQuestions(true);
    const data = await AuthService.getAllQuestions({ 
      contentId: contentId,
      limit: 100
    });
    setQuestions(Array.isArray(data) ? data : []);
  } catch (error) {
    // خطأ مباشر بدون fallback
    Toast.show({
      type: 'error',
      text1: 'فشل تحميل الأسئلة',
      position: 'bottom'
    });
  }
};
```

#### بعد الإصلاح ✅
```typescript
const loadQuestions = async (contentId: number) => {
  try {
    setIsLoadingQuestions(true);
    console.log('Loading questions for content ID:', contentId);
    
    // محاولة جلب الأسئلة من بنك الأسئلة أولاً
    try {
      const data = await AuthService.getAllQuestions({ 
        contentId: contentId,
        limit: 100
      });
      console.log('Loaded questions from question bank:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
        return;
      }
    } catch (bankError) {
      console.warn('Failed to load from question bank, trying content-specific endpoint:', bankError);
    }
    
    // إذا فشل، جرب الـ API endpoint القديم
    try {
      const data = await AuthService.getQuestionsByContent(contentId);
      console.log('Loaded questions from content endpoint:', data);
      
      // معالجة البيانات من الـ API القديم
      let questions = [];
      if (Array.isArray(data)) {
        questions = data;
      } else if (data && Array.isArray(data.data)) {
        questions = data.data;
      } else if (data && Array.isArray(data.questions)) {
        questions = data.questions;
      }
      
      setQuestions(questions);
    } catch (contentError) {
      console.error('Failed to load questions from content endpoint:', contentError);
      throw contentError;
    }
    
  } catch (error) {
    console.error('Error loading questions:', error);
    Toast.show({
      type: 'error',
      text1: 'فشل تحميل الأسئلة',
      text2: error.message || 'حدث خطأ غير متوقع',
      position: 'bottom'
    });
    setQuestions([]);
  } finally {
    setIsLoadingQuestions(false);
  }
};
```

### 2. تحسين AuthService.getAllQuestions()

#### قبل الإصلاح ❌
```typescript
static async getAllQuestions(params?: {...}): Promise<IQuestion[]> {
  try {
    // محاولة واحدة فقط
    const response = await fetch(url, {...});
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    throw error; // خطأ مباشر
  }
}
```

#### بعد الإصلاح ✅
```typescript
static async getAllQuestions(params?: {...}): Promise<IQuestion[]> {
  try {
    // محاولة الـ API endpoint الجديد أولاً
    try {
      const response = await fetch(url, {...});
      
      if (response.ok) {
        // معالجة البيانات بنجاح
        return processedData;
      } else {
        console.warn('Question bank API failed, falling back to content-specific endpoint');
        throw new Error(`Question bank API failed: ${response.status}`);
      }
    } catch (apiError) {
      console.warn('Question bank API not available, trying alternative approach:', apiError);
      
      // إذا فشل الـ API الجديد، جرب الـ API القديم
      if (params?.contentId) {
        console.log('Falling back to content-specific questions endpoint');
        const contentData = await this.getQuestionsByContent(params.contentId);
        return processedContentData;
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Error fetching all questions in AuthService:', error);
    throw error;
  }
}
```

## 🔄 آلية Fallback

### المستوى الأول: Question Bank API
```
GET /api/questions?contentId=123&limit=100
```

### المستوى الثاني: Content-Specific API
```
GET /api/questions/content/123
```

### المستوى الثالث: Error Handling
- رسالة خطأ واضحة للمستخدم
- تسجيل مفصل للأخطاء في Console
- إعادة تعيين حالة التحميل

## 🔍 Debug Logs المضافة

### في AddQuizScreen:
```javascript
console.log('Loading questions for content ID:', contentId);
console.log('Loaded questions from question bank:', data);
console.warn('Failed to load from question bank, trying content-specific endpoint:', bankError);
console.log('Loaded questions from content endpoint:', data);
console.error('Failed to load questions from content endpoint:', contentError);
```

### في AuthService:
```javascript
console.log('Fetching all questions from URL:', url);
console.log('Get all questions response status:', response.status);
console.log('Get all questions response data:', data);
console.warn('Question bank API failed, falling back to content-specific endpoint');
console.warn('Question bank API not available, trying alternative approach:', apiError);
console.log('Falling back to content-specific questions endpoint');
```

## 🚀 كيفية اختبار الإصلاح

### 1. افتح التطبيق
### 2. افتح Developer Console (F12)
### 3. اذهب لصفحة إضافة اختبار مصغر
### 4. اختر برنامج ومحتوى تدريبي
### 5. راقب الـ Console logs:

```javascript
// يجب أن ترى:
Loading questions for content ID: 123
Fetching all questions from URL: http://localhost:3000/api/questions?contentId=123&limit=100
Get all questions response status: 200
Loaded questions from question bank: [...]
```

### أو في حالة Fallback:
```javascript
// يجب أن ترى:
Loading questions for content ID: 123
Fetching all questions from URL: http://localhost:3000/api/questions?contentId=123&limit=100
Get all questions response status: 404
Question bank API failed, falling back to content-specific endpoint
Falling back to content-specific questions endpoint
Loaded questions from content endpoint: [...]
```

## 📊 النتائج المتوقعة

### حالة 1: Question Bank API يعمل ✅
```
┌─────────────────────────────────────┐
│ الأسئلة                            │
│ ┌─────────────────────────────────┐ │
│ │ السؤال الأول                    │ │
│ │ [اختيار متعدد] [معرفة] [سهل]    │ │
│ │ ✓                                │ │
│ └─────────────────────────────────┘ │
│ تم اختيار 1 سؤال من 5 سؤال متاح   │
└─────────────────────────────────────┘
```

### حالة 2: Fallback إلى Content API ✅
```
┌─────────────────────────────────────┐
│ الأسئلة                            │
│ ┌─────────────────────────────────┐ │
│ │ السؤال الأول                    │ │
│ │ [اختيار متعدد]                  │ │
│ │ ✓                                │ │
│ └─────────────────────────────────┘ │
│ تم اختيار 1 سؤال من 3 سؤال متاح   │
└─────────────────────────────────────┘
```

### حالة 3: فشل كامل ❌
```
┌─────────────────────────────────────┐
│ الأسئلة                            │
│ لا توجد أسئلة متاحة لهذا المحتوى   │
│ التدريبي                           │
└─────────────────────────────────────┘
```

## 🔧 الملفات المعدلة

```
✅ src/screens/AddQuizScreen.tsx
   ├── إضافة fallback mechanism
   ├── تحسين معالجة الأخطاء
   ├── إضافة debug logs شاملة
   └── رسائل خطأ أكثر وضوحاً

✅ src/services/AuthService.ts
   ├── تحسين getAllQuestions مع fallback
   ├── معالجة أفضل للأخطاء
   ├── دعم API endpoints متعددة
   └── debug logs مفصلة
```

## 🎯 الخطوات التالية

### للتحقق من الإصلاح:
1. **افتح التطبيق**
2. **اذهب لصفحة إضافة اختبار مصغر**
3. **افتح Developer Console**
4. **اختر برنامج ومحتوى تدريبي**
5. **راقب الـ logs**
6. **أخبرني بالنتائج**

### إذا استمر الخطأ:
1. **تحقق من الـ Console logs**
2. **تحقق من Network tab**
3. **تحقق من API endpoints**
4. **أرسل لي الـ logs**

## 💡 نصائح إضافية

### للتحقق من API Response:
```javascript
// في Network tab
// ابحث عن: /api/questions
// تحقق من Response status و data
```

### للتحقق من Fallback:
```javascript
// في Console
// ابحث عن: "falling back to content-specific endpoint"
```

---

**تاريخ الإصلاح:** 4 أكتوبر 2025  
**الملفات المعدلة:** src/screens/AddQuizScreen.tsx, src/services/AuthService.ts  
**الحالة:** ✅ جاهز للاختبار

**جرب الآن وأخبرني إذا تم حل مشكلة تحميل الأسئلة! 🔧✨**
