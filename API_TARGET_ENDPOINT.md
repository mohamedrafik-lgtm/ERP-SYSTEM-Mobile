# API Endpoint: Marketing Targets

## Endpoint
```
POST /api/marketing/targets
```

## Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

## Request Body

### CreateMarketingTargetRequest
```typescript
{
  employeeId: number;      // معرف موظف التسويق (مطلوب، ≥ 1)
  month: number;           // الشهر (مطلوب، 1-12)
  year: number;            // السنة (مطلوب، 2020-2050)
  targetAmount: number;    // الهدف المطلوب (مطلوب، 1-1000)
  notes?: string;          // ملاحظات (اختياري)
  setById?: string;        // من قام بتحديد الهدف (اختياري)
}
```

## مثال على البيانات المرسلة

### 1. إنشاء هدف جديد
```json
{
  "employeeId": 1,
  "month": 9,
  "year": 2025,
  "targetAmount": 15,
  "notes": "هدف شهري للمتدربين الجدد",
  "setById": "user_12345"
}
```

### 2. إنشاء هدف بدون ملاحظات
```json
{
  "employeeId": 2,
  "month": 10,
  "year": 2025,
  "targetAmount": 20,
  "setById": "user_12345"
}
```

## Response

### Success Response (201 Created)
```json
{
  "id": 1,
  "employeeId": 1,
  "month": 9,
  "year": 2025,
  "targetAmount": 15,
  "achievedAmount": 0,
  "notes": "هدف شهري للمتدربين الجدد",
  "setById": "user_12345",
  "setAt": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "employee": {
    "id": 1,
    "name": "محمد رفيق",
    "phone": "01033821495",
    "email": "mohamed@example.com"
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "Validation Error",
  "message": "يجب أن يكون الهدف بين 1 و 1000 متدرب",
  "details": {
    "field": "targetAmount",
    "value": 1500,
    "constraint": "1-1000"
  }
}
```

### Error Response (401 Unauthorized)
```json
{
  "error": "Unauthorized",
  "message": "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى"
}
```

### Error Response (404 Not Found)
```json
{
  "error": "Not Found",
  "message": "موظف التسويق غير موجود"
}
```

## Validation Rules

### employeeId
- **مطلوب**: نعم
- **النوع**: number
- **القيم المسموحة**: ≥ 1
- **الخطأ**: "يجب اختيار موظف تسويق صحيح"

### month
- **مطلوب**: نعم
- **النوع**: number
- **القيم المسموحة**: 1-12
- **الخطأ**: "يجب أن يكون الشهر بين 1 و 12"

### year
- **مطلوب**: نعم
- **النوع**: number
- **القيم المسموحة**: 2020-2050
- **الخطأ**: "يجب أن تكون السنة بين 2020 و 2050"

### targetAmount
- **مطلوب**: نعم
- **النوع**: number
- **القيم المسموحة**: 1-1000
- **الخطأ**: "يجب أن يكون الهدف بين 1 و 1000 متدرب"

### notes
- **مطلوب**: لا
- **النوع**: string
- **الحد الأقصى**: 500 حرف
- **الخطأ**: "الملاحظات يجب أن تكون أقل من 500 حرف"

### setById
- **مطلوب**: لا
- **النوع**: string
- **المصدر**: المستخدم الحالي من JWT token
- **الملاحظة**: يتم تعيينه تلقائياً من Backend

## Business Logic

### 1. التحقق من وجود الموظف
- يجب أن يكون `employeeId` موجود في جدول `marketing_employees`
- يجب أن يكون الموظف نشط (`isActive = true`)

### 2. التحقق من عدم التكرار
- لا يمكن إنشاء هدف لنفس الموظف في نفس الشهر والسنة
- إذا كان موجود، يجب إرجاع خطأ 409 Conflict

### 3. تسجيل المستخدم
- `setById` يتم تعيينه تلقائياً من JWT token
- `setAt` يتم تعيينه تلقائياً بالوقت الحالي

### 4. القيم الافتراضية
- `achievedAmount` يتم تعيينه تلقائياً إلى 0
- `createdAt` و `updatedAt` يتم تعيينهما تلقائياً

## Error Codes

| Code | Description | Example |
|------|-------------|---------|
| 400 | Bad Request | بيانات غير صحيحة |
| 401 | Unauthorized | انتهت صلاحية الجلسة |
| 404 | Not Found | الموظف غير موجود |
| 409 | Conflict | الهدف موجود مسبقاً |
| 500 | Internal Server Error | خطأ في الخادم |

## Testing Examples

### cURL Example
```bash
curl -X POST "http://localhost:4000/api/marketing/targets" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": 1,
    "month": 9,
    "year": 2025,
    "targetAmount": 15,
    "notes": "هدف شهري للمتدربين الجدد"
  }'
```

### JavaScript Example
```javascript
const response = await fetch('/api/marketing/targets', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    employeeId: 1,
    month: 9,
    year: 2025,
    targetAmount: 15,
    notes: 'هدف شهري للمتدربين الجدد'
  })
});

const data = await response.json();
```

## Notes

1. **الأمان**: جميع الطلبات تتطلب JWT token صحيح
2. **التتبع**: يتم تسجيل من قام بإنشاء الهدف تلقائياً
3. **التحقق**: يتم التحقق من جميع البيانات قبل الحفظ
4. **الاستجابة**: يتم إرجاع البيانات الكاملة مع معلومات الموظف
5. **الأخطاء**: رسائل خطأ واضحة باللغة العربية
