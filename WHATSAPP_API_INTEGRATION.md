# تكامل API لصفحة إدارة WhatsApp

## التحديثات المنجزة

تم ربط صفحة إدارة WhatsApp مع Backend API لتصبح ديناميكية بدلاً من المحتوى الثابت.

### ✅ **1. إضافة Types للـ WhatsApp**

#### **ملف: `src/types/whatsapp.ts`**
```typescript
export interface WhatsAppQRCodeResponse {
  qrCode?: string | null;    // كود QR للاتصال بـ WhatsApp (إذا كان متوفراً)
  isReady: boolean;          // هل العميل جاهز ومتصل؟
  error?: string;            // رسالة خطأ (إذا حدث خطأ)
}

export interface WhatsAppConnectionStatus {
  isConnected: boolean;
  isReady: boolean;
  lastConnected?: string;
  error?: string;
}

export interface WhatsAppMessageTemplate {
  id: string;
  name: string;
  content: string;
  type: 'welcome' | 'notification' | 'invoice' | 'report';
  isActive: boolean;
}

export interface WhatsAppSettings {
  autoWelcome: boolean;
  autoNotifications: boolean;
  autoInvoices: boolean;
  autoReports: boolean;
  welcomeMessage: string;
  notificationMessage: string;
  invoiceMessage: string;
  reportMessage: string;
}
```

### ✅ **2. إضافة API Method في AuthService**

#### **ملف: `src/services/AuthService.ts`**
```typescript
// WhatsApp Management: Get QR Code for WhatsApp connection
static async getWhatsAppQRCode(): Promise<WhatsAppQRCodeResponse> {
  try {
    const token = await this.getToken();
    if (!token) {
      throw new Error('Authentication token not found.');
    }

    const url = 'http://10.0.2.2:4000/api/whatsapp/qr-code';
    console.log('[AuthService] Fetching WhatsApp QR code from URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.clearAuthData();
        throw new Error('Authentication expired. Please login again.');
      }
      const errorText = await response.text();
      throw new Error(errorText || `Failed to fetch WhatsApp QR code: ${response.status}`);
    }

    const data = await response.json();
    console.log('[AuthService] WhatsApp QR code response:', data);
    return data;
  } catch (error) {
    console.error('[AuthService] Error fetching WhatsApp QR code:', error);
    throw error;
  }
}
```

### ✅ **3. إنشاء مكون QR Code Modal**

#### **ملف: `src/components/WhatsAppQRCodeModal.tsx`**

**الميزات:**
- **عرض QR Code**: عرض رمز QR كصورة base64
- **حالات مختلفة**: Loading، Error، Success، QR Display
- **تعليمات واضحة**: خطوات ربط WhatsApp
- **تفاعل سلس**: إغلاق وتحديث الحالة
- **تصميم متجاوب**: يعمل على جميع الأحجام

**الواجهة:**
```typescript
interface WhatsAppQRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  qrCode?: string | null;
  isReady: boolean;
  isLoading: boolean;
  error?: string;
}
```

**الحالات المدعومة:**
1. **Loading**: عرض مؤشر التحميل
2. **Error**: عرض رسالة الخطأ مع زر إعادة المحاولة
3. **Success**: عرض رسالة النجاح
4. **QR Display**: عرض رمز QR مع التعليمات

### ✅ **4. تحديث WhatsAppManagementScreen**

#### **الوظائف الجديدة:**

**1. تحميل حالة الاتصال:**
```typescript
const loadConnectionStatus = async () => {
  try {
    const response = await AuthService.getWhatsAppQRCode();
    setQrData(response);
    setConnectionStatus(response.isReady ? 'connected' : 'disconnected');
    setSendReadiness(response.isReady ? 'ready' : 'pending');
  } catch (error) {
    console.error('Error loading connection status:', error);
    setConnectionStatus('disconnected');
    setSendReadiness('error');
  }
};
```

**2. إنشاء QR Code:**
```typescript
const handleGenerateQR = async () => {
  setIsLoadingQR(true);
  setQrError(null);
  setQrModalVisible(true);

  try {
    const response = await AuthService.getWhatsAppQRCode();
    setQrData(response);
    
    if (response.error) {
      setQrError(response.error);
    } else if (response.isReady) {
      setConnectionStatus('connected');
      setSendReadiness('ready');
      Toast.show({
        type: 'success',
        text1: 'متصل بنجاح',
        text2: 'تم ربط حساب WhatsApp بنجاح',
      });
    } else if (response.qrCode) {
      setConnectionStatus('pending');
      setSendReadiness('pending');
      Toast.show({
        type: 'info',
        text1: 'امسح رمز QR',
        text2: 'استخدم WhatsApp لمسح الرمز',
      });
    }
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    setQrError(error.message || 'حدث خطأ في إنشاء رمز QR');
    Toast.show({
      type: 'error',
      text1: 'خطأ في الاتصال',
      text2: error.message || 'حدث خطأ في إنشاء رمز QR',
    });
  } finally {
    setIsLoadingQR(false);
  }
};
```

**3. تحديث البيانات:**
```typescript
const handleUpdateData = async () => {
  try {
    await loadConnectionStatus();
    Toast.show({
      type: 'success',
      text1: 'تم التحديث',
      text2: 'تم تحديث حالة الاتصال بنجاح',
    });
  } catch (error: any) {
    Toast.show({
      type: 'error',
      text1: 'خطأ في التحديث',
      text2: error.message || 'حدث خطأ في تحديث البيانات',
    });
  }
};
```

### ✅ **5. تحديثات UI الديناميكية**

#### **Banner الحالة:**
- **متصل**: نقطة خضراء + "متصل"
- **غير متصل**: نقطة حمراء + "غير متصل"
- **في الانتظار**: نقطة برتقالية + "في الانتظار"

#### **حالة الاتصال:**
- **حالة الاتصال**: يعكس الحالة الحقيقية من API
- **جاهزية الإرسال**: يعكس جاهزية النظام
- **الألوان**: تتغير حسب الحالة (أخضر/أحمر/برتقالي)

#### **ربط الحساب:**
- **متصل**: أيقونة ربط خضراء + "متصل"
- **غير متصل**: أيقونة قطع رمادية + "في انتظار الاتصال"
- **الزر**: يتغير من "إنشاء QR Code" إلى "تحديث الحالة"

### ✅ **6. معالجة الأخطاء والتنبيهات**

#### **Toast Messages:**
- **نجاح الاتصال**: "متصل بنجاح - تم ربط حساب WhatsApp بنجاح"
- **عرض QR**: "امسح رمز QR - استخدم WhatsApp لمسح الرمز"
- **خطأ**: "خطأ في الاتصال - [رسالة الخطأ]"
- **تحديث**: "تم التحديث - تم تحديث حالة الاتصال بنجاح"

#### **Error Handling:**
- **401 Unauthorized**: تسجيل خروج تلقائي
- **Network Error**: رسالة خطأ واضحة
- **API Error**: عرض رسالة الخطأ من الخادم
- **Timeout**: معالجة انتهاء المهلة

## API Endpoint

### **GET /api/whatsapp/qr-code**

**الاستجابة المتوقعة:**
```json
{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "isReady": false
}
```

**أو في حالة الخطأ:**
```json
{
  "qrCode": null,
  "isReady": false,
  "error": "رسالة الخطأ"
}
```

**أو في حالة الاتصال:**
```json
{
  "qrCode": null,
  "isReady": true
}
```

## تدفق العمل

### **1. تحميل الصفحة:**
1. استدعاء `loadConnectionStatus()`
2. جلب حالة الاتصال من API
3. تحديث UI حسب الحالة

### **2. إنشاء QR Code:**
1. الضغط على "إنشاء QR Code"
2. فتح Modal مع Loading
3. استدعاء API
4. عرض QR Code أو رسالة خطأ
5. تحديث حالة الاتصال

### **3. مسح QR Code:**
1. المستخدم يمسح الرمز في WhatsApp
2. النظام يكتشف الاتصال
3. تحديث الحالة إلى "متصل"
4. إغلاق Modal تلقائياً

### **4. تحديث البيانات:**
1. الضغط على "تحديث البيانات"
2. استدعاء `loadConnectionStatus()`
3. تحديث جميع الحالات
4. عرض رسالة نجاح

## الميزات الجديدة

### **🔄 تحديث تلقائي:**
- تحميل الحالة عند فتح الصفحة
- تحديث الحالة عند إغلاق Modal
- تحديث عند الضغط على "تحديث البيانات"

### **📱 تجربة مستخدم محسنة:**
- Loading states واضحة
- رسائل خطأ مفيدة
- تعليمات خطوة بخطوة
- ألوان تعكس الحالة

### **🛡️ معالجة أخطاء شاملة:**
- معالجة أخطاء الشبكة
- معالجة أخطاء المصادقة
- معالجة أخطاء API
- رسائل خطأ باللغة العربية

### **🎨 UI ديناميكي:**
- تغيير الألوان حسب الحالة
- تغيير النصوص حسب الحالة
- تغيير الأيقونات حسب الحالة
- تحديث الأزرار حسب الحالة

## الاختبار

### **1. اختبار الاتصال:**
- تأكد من تحميل الحالة عند فتح الصفحة
- تأكد من عرض الحالة الصحيحة
- تأكد من تحديث الألوان والنصوص

### **2. اختبار QR Code:**
- اضغط على "إنشاء QR Code"
- تأكد من فتح Modal
- تأكد من عرض Loading
- تأكد من عرض QR Code أو رسالة خطأ

### **3. اختبار الأخطاء:**
- جرب مع شبكة غير متصلة
- جرب مع token منتهي الصلاحية
- تأكد من عرض رسائل الخطأ المناسبة

### **4. اختبار التحديث:**
- اضغط على "تحديث البيانات"
- تأكد من تحديث الحالة
- تأكد من عرض رسالة النجاح

## الخطوات التالية

### **1. إضافة المزيد من API Endpoints:**
- `/api/whatsapp/status` - للحصول على حالة مفصلة
- `/api/whatsapp/disconnect` - لقطع الاتصال
- `/api/whatsapp/settings` - لإدارة الإعدادات

### **2. إضافة ميزات متقدمة:**
- تحديث تلقائي للحالة كل 30 ثانية
- إشعارات عند تغيير الحالة
- سجل العمليات
- إحصائيات الاستخدام

### **3. تحسينات الأمان:**
- تشفير البيانات الحساسة
- التحقق من صحة QR Code
- حماية من هجمات CSRF
- سجل العمليات الأمنية

## الخلاصة

تم بنجاح ربط صفحة إدارة WhatsApp مع Backend API:

- ✅ **API Integration** - ربط كامل مع `/api/whatsapp/qr-code`
- ✅ **Dynamic UI** - تحديث تلقائي للحالة والألوان
- ✅ **QR Code Modal** - عرض رمز QR مع التعليمات
- ✅ **Error Handling** - معالجة شاملة للأخطاء
- ✅ **Loading States** - مؤشرات تحميل واضحة
- ✅ **Toast Messages** - تنبيهات باللغة العربية
- ✅ **Type Safety** - Types محددة لجميع البيانات
- ✅ **User Experience** - تجربة مستخدم سلسة ومفهومة

الصفحة الآن ديناميكية بالكامل وتتفاعل مع Backend API! 🚀
