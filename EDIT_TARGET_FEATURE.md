# ميزة تعديل التارجيت

## الميزة الجديدة
تم إضافة ميزة تعديل التارجيت باستخدام الـ endpoint الجديد `/api/marketing/targets/{id}` مع PUT method.

## التحديثات المنجزة

### ✅ **1. تحديث Types (types/marketing.ts)**

#### تحديث UpdateMarketingTargetRequest:
```typescript
export interface UpdateMarketingTargetRequest {
  targetAmount: number;    // الهدف المطلوب (مطلوب)
  notes?: string;          // ملاحظات (اختياري)
  setById?: string;        // من قام بتحديد الهدف (اختياري)
}
```

### ✅ **2. تحديث AuthService (services/AuthService.ts)**

#### تحديث دالة updateMarketingTarget:
```typescript
static async updateMarketingTarget(id: number, payload: import('../types/marketing').UpdateMarketingTargetRequest): Promise<any> {
  try {
    const token = await this.getToken();
    if (!token) {
      throw new Error('Authentication token not found.');
    }

    const user = await this.getUser();
    const payloadWithUser = {
      ...payload,
      setById: user?.id || undefined, // إضافة معرف المستخدم الحالي
    };

    const url = `http://10.0.2.2:4000/api/marketing/targets/${id}`;
    console.log('[AuthService] Updating marketing target', id, 'with payload:', payloadWithUser);

    const response = await fetch(url, {
      method: 'PUT',  // ✅ تغيير من PATCH إلى PUT
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadWithUser),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to update marketing target: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[AuthService] Error updating marketing target:', error);
    throw error;
  }
}
```

### ✅ **3. إنشاء EditTargetModal (components/EditTargetModal.tsx)**

#### المكون الجديد للتعديل:
```typescript
interface EditTargetModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (targetId: number, targetData: UpdateMarketingTargetRequest) => void;
  target: MarketingTargetWithAchieved | null;
}
```

#### الميزات:
- **عرض معلومات الهدف** - الموظف، الشهر، المحقق حالياً
- **تعديل عدد المتدربين** - مع التحقق من 1-1000
- **تعديل الملاحظات** - نص متعدد الأسطر
- **التحقق من البيانات** - validation شامل
- **واجهة جميلة** - تصميم متسق مع باقي التطبيق

#### التحقق من البيانات:
```typescript
const handleSubmit = async () => {
  // التحقق من البيانات المطلوبة
  if (!formData.targetAmount || parseInt(formData.targetAmount) <= 0) {
    Alert.alert('خطأ', 'يرجى إدخال عدد صحيح للأهداف');
    return;
  }

  const targetAmount = parseInt(formData.targetAmount);
  if (targetAmount < 1 || targetAmount > 1000) {
    Alert.alert('خطأ', 'يجب أن يكون الهدف بين 1 و 1000 متدرب');
    return;
  }

  if (!target) {
    Alert.alert('خطأ', 'لم يتم العثور على الهدف');
    return;
  }

  // إرسال البيانات
  const targetData: UpdateMarketingTargetRequest = {
    targetAmount: targetAmount,
    notes: formData.notes.trim() || undefined,
  };

  await onSubmit(target.id, targetData);
};
```

### ✅ **4. تحديث TargetCard (components/TargetCard.tsx)**

#### تحديث الـ Interface:
```typescript
interface TargetCardProps {
  target: MarketingTargetWithAchieved;
  achievementRate: number;
  onEdit: (target: MarketingTargetWithAchieved) => void;  // ✅ تمرير الـ target كاملاً
  onDelete: () => void;
}
```

#### تحديث دالة التعديل:
```typescript
const handleEdit = () => {
  setShowActions(false);
  onEdit(target);  // ✅ تمرير الـ target كاملاً بدلاً من البيانات فقط
};
```

### ✅ **5. تحديث TargetSettingScreen (screens/TargetSettingScreen.tsx)**

#### إضافة الـ State الجديد:
```typescript
const [showEditModal, setShowEditModal] = useState(false);
const [selectedTarget, setSelectedTarget] = useState<MarketingTargetWithAchieved | null>(null);
```

#### تحديث دالة التعديل:
```typescript
const handleEditTarget = (target: MarketingTargetWithAchieved) => {
  setSelectedTarget(target);
  setShowEditModal(true);
};

const handleUpdateTarget = async (targetId: number, targetData: UpdateMarketingTargetRequest) => {
  try {
    await AuthService.updateMarketingTarget(targetId, targetData);
    setShowEditModal(false);
    setSelectedTarget(null);
    await fetchData();
    Alert.alert('نجح', 'تم تحديث الهدف بنجاح');
  } catch (error) {
    console.error('Error updating target:', error);
    Alert.alert('خطأ', 'فشل في تحديث الهدف');
  }
};
```

#### إضافة EditTargetModal:
```typescript
<EditTargetModal
  visible={showEditModal}
  onClose={() => {
    setShowEditModal(false);
    setSelectedTarget(null);
  }}
  onSubmit={handleUpdateTarget}
  target={selectedTarget}
/>
```

## الـ API Endpoint

### **PUT /api/marketing/targets/{id}**

#### Request Body:
```typescript
{
  "targetAmount": 0,      // الهدف المطلوب (مطلوب)
  "notes": "string",      // ملاحظات (اختياري)
  "setById": "string"     // من قام بتحديد الهدف (اختياري)
}
```

#### مثال على الاستخدام:
```typescript
// تحديث هدف مع ID = 123
const response = await AuthService.updateMarketingTarget(123, {
  targetAmount: 50,
  notes: "هدف محدث للربع الأول",
});
```

## الميزات الجديدة

### ✅ **1. واجهة تعديل متقدمة**
- عرض معلومات الهدف الحالي
- تعديل عدد المتدربين المطلوب
- تعديل الملاحظات
- التحقق من صحة البيانات

### ✅ **2. التحقق من البيانات**
- التحقق من أن عدد المتدربين بين 1 و 1000
- التحقق من وجود الهدف
- رسائل خطأ واضحة

### ✅ **3. تجربة مستخدم محسنة**
- modal جميل ومتسق
- عرض معلومات الهدف الحالي
- أزرار واضحة (إلغاء/حفظ)
- رسائل نجاح وخطأ

### ✅ **4. تكامل مع الـ API**
- استخدام PUT method
- إضافة setById تلقائياً
- معالجة الأخطاء
- تحديث البيانات بعد التعديل

## كيفية الاستخدام

### 1. فتح صفحة تحديد التارجيت
- انتقل إلى "إدارة التسويق" > "تحديد التارجيت"

### 2. تعديل هدف موجود
- اضغط على أيقونة "المزيد" (⋮) في كارت الهدف
- اختر "تعديل" من القائمة
- سيتم فتح modal التعديل

### 3. تعديل البيانات
- غيّر عدد المتدربين المطلوب
- غيّر الملاحظات (اختياري)
- اضغط "حفظ التعديلات"

### 4. تأكيد التعديل
- سيتم إرسال البيانات للـ API
- ستظهر رسالة نجاح
- ستتم إعادة تحميل البيانات

## الاختبار

### 1. اختبار التعديل الأساسي
```typescript
// افتح صفحة تحديد التارجيت
// اضغط على تعديل أي هدف
// غيّر عدد المتدربين
// احفظ التعديلات
// تأكد من تحديث البيانات
```

### 2. اختبار التحقق من البيانات
```typescript
// جرب إدخال عدد أقل من 1
// جرب إدخال عدد أكبر من 1000
// جرب إدخال نص بدلاً من رقم
// تأكد من ظهور رسائل الخطأ المناسبة
```

### 3. اختبار الـ API
```typescript
// تأكد من إرسال PUT request
// تأكد من إضافة setById
// تأكد من تحديث البيانات في الـ backend
```

## الخلاصة

تم إضافة ميزة تعديل التارجيت بنجاح:

- ✅ **تحديث Types** - UpdateMarketingTargetRequest الجديد
- ✅ **تحديث AuthService** - استخدام PUT method مع setById
- ✅ **إنشاء EditTargetModal** - واجهة تعديل متقدمة
- ✅ **تحديث TargetCard** - تمرير الـ target كاملاً
- ✅ **تحديث TargetSettingScreen** - تكامل مع الـ modal الجديد

الميزة الآن جاهزة للاستخدام مع الـ endpoint الجديد! 🎉

**ملاحظة:** الـ `setById` يتم إضافته تلقائياً من المستخدم المسجل دخوله حالياً.
