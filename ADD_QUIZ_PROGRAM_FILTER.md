# ✅ تحسين صفحة إضافة اختبار مصغر - فلترة المحتوى حسب البرنامج

## 🎯 التحديث

تم تحسين صفحة "إضافة اختبار مصغر" لتكون أكثر منطقية في التعامل:

### قبل التحديث ❌
- المستخدم يختار المحتوى التدريبي مباشرة من **جميع** المحتويات
- صعوبة في إيجاد المحتوى المطلوب
- لا يوجد ترابط منطقي

### بعد التحديث ✅
1. **اختيار البرنامج أولاً** → يعرض جميع البرامج المتاحة
2. **ثم اختيار المحتوى التدريبي** → يعرض فقط المحتوى المرتبط بالبرنامج المختار
3. **ترابط منطقي** → سهولة في الاختيار والتنظيم

## 📋 ما تم تعديله

### 1. إضافة State جديدة

```typescript
// State للبرامج
const [programs, setPrograms] = useState<any[]>([]);
const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
const [selectedProgramId, setSelectedProgramId] = useState<number | undefined>(undefined);

// State للمحتوى المفلتر
const [filteredContents, setFilteredContents] = useState<any[]>([]);
```

### 2. دالة تحميل البرامج

```typescript
const loadPrograms = async () => {
  try {
    setIsLoadingPrograms(true);
    const data = await AuthService.getAllPrograms();
    setPrograms(Array.isArray(data) ? data : []);
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'فشل تحميل البرامج التدريبية',
      position: 'bottom'
    });
  } finally {
    setIsLoadingPrograms(false);
  }
};
```

### 3. دالة معالجة اختيار البرنامج مع الفلترة

```typescript
const handleProgramChange = (programId: number) => {
  setSelectedProgramId(programId);
  setSelectedContentId(undefined);
  setSelectedQuestions([]);
  
  // فلترة المحتوى التدريبي حسب البرنامج المختار
  const filtered = trainingContents.filter(content => {
    // يدعم أنواع مختلفة من البيانات
    if (content.programId && content.programId === programId) {
      return true;
    }
    if (content.programIds && Array.isArray(content.programIds) && content.programIds.includes(programId)) {
      return true;
    }
    if (content.program && content.program.id === programId) {
      return true;
    }
    return false;
  });
  
  setFilteredContents(filtered);
};
```

### 4. واجهة المستخدم المحدثة

```typescript
// SelectBox للبرامج (الخطوة الأولى)
<View style={styles.inputGroup}>
  <Text style={styles.label}>البرنامج التدريبي *</Text>
  <SelectBox
    data={programs.map(program => ({
      id: program.id,
      name: program.nameAr,
    }))}
    selectedId={selectedProgramId}
    onSelect={handleProgramChange}
    placeholder="اختر البرنامج التدريبي"
    loading={isLoadingPrograms}
  />
</View>

// SelectBox للمحتوى التدريبي (الخطوة الثانية)
<View style={styles.inputGroup}>
  <Text style={styles.label}>المحتوى التدريبي *</Text>
  {selectedProgramId ? (
    <SelectBox
      data={filteredContents.map(content => ({
        id: content.id,
        name: content.name || content.nameAr || `${content.code} - ${content.name}`,
      }))}
      selectedId={selectedContentId}
      onSelect={handleContentChange}
      placeholder={filteredContents.length > 0 ? "اختر المحتوى التدريبي" : "لا يوجد محتوى لهذا البرنامج"}
      loading={isLoadingContents}
    />
  ) : (
    <View style={styles.disabledSelectBox}>
      <Text style={styles.disabledText}>اختر البرنامج التدريبي أولاً</Text>
    </View>
  )}
</View>
```

## 🎨 التصميم

### حالات SelectBox المحتوى التدريبي:

1. **قبل اختيار البرنامج** 🔒
   ```
   ┌─────────────────────────────────────┐
   │ اختر البرنامج التدريبي أولاً       │ (معطل - رمادي)
   └─────────────────────────────────────┘
   ```

2. **بعد اختيار البرنامج - يوجد محتوى** ✅
   ```
   ┌─────────────────────────────────────┐
   │ اختر المحتوى التدريبي ▼            │
   └─────────────────────────────────────┘
   ```

3. **بعد اختيار البرنامج - لا يوجد محتوى** ⚠️
   ```
   ┌─────────────────────────────────────┐
   │ لا يوجد محتوى لهذا البرنامج        │
   └─────────────────────────────────────┘
   ```

## 📱 سيناريو الاستخدام

```
المستخدم يفتح صفحة "إضافة اختبار مصغر"
    ↓
1. يختار البرنامج التدريبي (مثلاً: "برنامج إدارة الأعمال")
    ↓
2. يظهر SelectBox المحتوى التدريبي بالمحتويات الخاصة بهذا البرنامج فقط
    ↓
3. يختار المحتوى التدريبي (مثلاً: "مبادئ المحاسبة")
    ↓
4. تظهر الأسئلة الخاصة بهذا المحتوى
    ↓
5. يختار الأسئلة ويكمل باقي الحقول
    ↓
6. ينشئ الاختبار ✓
```

## ✨ الميزات الجديدة

### 1. فلترة ذكية 🧠
- يدعم `programId` (معرف واحد)
- يدعم `programIds` (مصفوفة معرفات)
- يدعم `program.id` (object)

### 2. تجربة مستخدم محسنة 👍
- منطق واضح: برنامج → محتوى → أسئلة
- رسائل توضيحية في كل حالة
- SelectBox معطل قبل اختيار البرنامج

### 3. إعادة تعيين تلقائية 🔄
- عند تغيير البرنامج، يتم مسح:
  - المحتوى المختار
  - الأسئلة المختارة
- يمنع الأخطاء والتضارب

### 4. معالجة الحالات الخاصة ⚡
- **لا يوجد محتوى للبرنامج**: رسالة واضحة
- **البرنامج لم يختار بعد**: SelectBox معطل
- **يوجد محتوى**: SelectBox نشط مع المحتويات المفلترة

## 🎯 الفوائد

✅ **تنظيم أفضل** - ترابط منطقي بين البرنامج والمحتوى  
✅ **سهولة الاستخدام** - خطوات واضحة ومتسلسلة  
✅ **تقليل الأخطاء** - فلترة تلقائية تمنع الاختيارات الخاطئة  
✅ **سرعة أكبر** - عرض المحتوى المرتبط فقط  
✅ **مرونة** - يدعم أنواع مختلفة من بيانات API  

## 🔧 التوافق

### يعمل مع أنواع البيانات التالية:

```typescript
// النوع 1: programId مباشر
{
  id: 1,
  name: "المحتوى 1",
  programId: 5
}

// النوع 2: programIds كمصفوفة
{
  id: 2,
  name: "المحتوى 2",
  programIds: [5, 6, 7]
}

// النوع 3: program كـ object
{
  id: 3,
  name: "المحتوى 3",
  program: {
    id: 5,
    nameAr: "البرنامج"
  }
}
```

## 📂 الملفات المعدلة

```
✅ src/screens/AddQuizScreen.tsx
   ├── إضافة State للبرامج والمحتوى المفلتر
   ├── إضافة دالة loadPrograms()
   ├── إضافة دالة handleProgramChange()
   ├── تعديل واجهة المستخدم (2 SelectBox)
   └── إضافة أنماط للـ disabled state
```

## 🚀 الاختبار

### للتحقق من التحديث:

1. افتح صفحة "إضافة اختبار مصغر"
2. تأكد من وجود SelectBox "البرنامج التدريبي"
3. اختر برنامج
4. يجب أن يظهر SelectBox "المحتوى التدريبي" مع المحتويات الخاصة بالبرنامج فقط
5. اختر محتوى
6. يجب أن تظهر الأسئلة الخاصة بهذا المحتوى

### حالات الاختبار:

✅ **اختيار برنامج له محتوى** → يظهر المحتوى  
✅ **اختيار برنامج ليس له محتوى** → رسالة "لا يوجد محتوى"  
✅ **تغيير البرنامج** → يتم مسح المحتوى المختار والأسئلة  
✅ **قبل اختيار البرنامج** → SelectBox المحتوى معطل  

## 💡 نصائح للاستخدام

1. **اختر البرنامج أولاً** دائماً
2. **إذا لم تجد محتوى** → تأكد من:
   - البرنامج المختار صحيح
   - المحتوى مربوط بالبرنامج في النظام
3. **عند تغيير البرنامج** → ستفقد الاختيارات السابقة (طبيعي)

## 🔄 التحديثات المستقبلية المقترحة

- [ ] إضافة بحث داخل SelectBox
- [ ] إضافة عدد المحتويات لكل برنامج
- [ ] حفظ آخر برنامج تم اختياره
- [ ] إضافة زر "إنشاء محتوى جديد" إذا لم يوجد محتوى

---

**تاريخ التحديث:** 4 أكتوبر 2025  
**الملف المعدل:** src/screens/AddQuizScreen.tsx  
**الحالة:** ✅ جاهز للاستخدام

