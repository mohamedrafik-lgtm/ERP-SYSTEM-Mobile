# 🏗️ معمارية وحدة الأدوات الدراسية - Academic Supplies Module

## 📋 نظرة عامة

تم بناء هذه الوحدة باتباع **SOLID Principles** و **Clean Architecture** لضمان:
- ✅ سهولة الصيانة
- ✅ قابلية الاختبار
- ✅ إمكانية التوسع
- ✅ فصل المسؤوليات

---

## 📁 هيكل المجلدات

```
src/
├── types/
│   └── academicSupplies.ts              # جميع Types و Interfaces و Enums
│
├── services/
│   └── AcademicSuppliesService.ts       # API calls فقط (Service Layer)
│
├── screens/
│   ├── AcademicSuppliesScreen.tsx       # الصفحة الرئيسية (Presentation)
│   └── DeliveryTrackingScreen.tsx       # صفحة تتبع التسليم (Presentation)
│
└── (سيتم إضافتها لاحقاً)
    ├── hooks/                            # Business Logic Layer
    │   ├── useSupplyRequests.ts
    │   ├── useCreateSupplyRequest.ts
    │   └── useSupplyItems.ts
    │
    └── components/                       # UI Components
        ├── SupplyRequestCard.tsx
        ├── SupplyItemSelector.tsx
        └── RequestStatusBadge.tsx
```

---

## 🎯 تطبيق SOLID Principles

### 1️⃣ **Single Responsibility Principle (SRP)**
**"كل module/class/function له مسؤولية واحدة فقط"**

#### ✅ التطبيق:

**📄 Types Layer** (`src/types/academicSupplies.ts`)
- **المسؤولية الوحيدة:** تعريف البنية البيانية فقط
- لا يحتوي على أي منطق أعمال أو API calls

**📄 Service Layer** (`src/services/AcademicSuppliesService.ts`)
- **المسؤولية الوحيدة:** التواصل مع Backend API
- لا يحتوي على:
  - ❌ State management
  - ❌ UI logic
  - ❌ Business rules
  - ❌ Validation
- فقط:
  - ✅ HTTP requests
  - ✅ Headers setup
  - ✅ Error handling على مستوى HTTP

**📄 Hooks Layer** (سيتم إنشاؤها)
- **المسؤولية الوحيدة:** Business Logic
- تحتوي على:
  - ✅ State management
  - ✅ Side effects
  - ✅ Data transformation
  - ✅ Validation rules
  - ✅ Error handling على مستوى Business

**📄 Screen Layer** (`src/screens/AcademicSuppliesScreen.tsx`)
- **المسؤولية الوحيدة:** عرض UI فقط
- تستدعي Hooks
- لا تحتوي على أي منطق معقد

**📄 Components Layer** (سيتم إنشاؤها)
- **المسؤولية الوحيدة:** عرض جزء محدد من UI
- Pure components قدر الإمكان
- Props in → UI out

---

### 2️⃣ **Open/Closed Principle (OCP)**
**"مفتوح للتوسع، مغلق للتعديل"**

#### ✅ التطبيق:

```typescript
// ✅ Base Service يمكن توسيعه بدون تعديله
class AcademicSuppliesService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Generic implementation
  }
  
  // يمكن إضافة methods جديدة بدون تعديل الموجودة
  async getRequests() { /* ... */ }
  async createRequest() { /* ... */ }
  // NEW: يمكن إضافة
  async getRequestsByProgram() { /* ... */ }
}

// ✅ Component يقبل props قابلة للتوسع
interface SupplyRequestCardProps {
  request: SupplyRequest
  onPress?: () => void
  // يمكن إضافة props جديدة
  showActions?: boolean
  customActions?: ReactNode
}
```

---

### 3️⃣ **Liskov Substitution Principle (LSP)**
**"الأنواع المشتقة يجب أن تكون قابلة للاستبدال بالنوع الأساسي"**

#### ✅ التطبيق:

```typescript
// ✅ جميع أنواع الطلبات تطبق نفس الواجهة
interface BaseSupplyRequest {
  id: string
  status: SupplyRequestStatus
  createdAt: string
}

// يمكن استخدام أي نوع مكان الآخر
const displayRequest = (request: BaseSupplyRequest) => {
  // Works with any type that implements BaseSupplyRequest
}
```

---

### 4️⃣ **Interface Segregation Principle (ISP)**
**"لا تجبر الكود على الاعتماد على واجهات لا يستخدمها"**

#### ✅ التطبيق:

```typescript
// ✅ واجهات صغيرة ومحددة بدلاً من واجهة واحدة كبيرة

// بدلاً من واجهة واحدة ضخمة
interface ISupplyService {
  getItems(): Promise<SupplyItem[]>
  createRequest(): Promise<SupplyRequest>
  approveRequest(): Promise<void>
  rejectRequest(): Promise<void>
  // ... 20 method أخرى
}

// ✅ نستخدم واجهات صغيرة
interface ISupplyReader {
  getItems(): Promise<SupplyItem[]>
  getRequests(): Promise<SupplyRequest[]>
}

interface ISupplyWriter {
  createRequest(data: CreateDto): Promise<SupplyRequest>
  updateRequest(id: string, data: UpdateDto): Promise<SupplyRequest>
}

interface ISupplyApprover {
  approveRequest(id: string): Promise<void>
  rejectRequest(id: string, reason: string): Promise<void>
}

// Components تستخدم فقط ما تحتاجه
```

---

### 5️⃣ **Dependency Inversion Principle (DIP)**
**"الاعتماد على Abstractions وليس Implementations"**

#### ✅ التطبيق:

```typescript
// ✅ Hook يعتمد على interface وليس implementation محددة
const useSupplyRequests = () => {
  // يستخدم Service عبر dependency injection
  const service = AcademicSuppliesService // يمكن تغييره
  
  const fetchRequests = async () => {
    const data = await service.getRequests()
    // Business logic
  }
}

// للتست، يمكن استخدام Mock Service
class MockSuppliesService {
  async getRequests() {
    return { data: [], pagination: {} }
  }
}
```

---

## 🏛️ الطبقات المعمارية (Layers)

### **📊 Architecture Diagram:**

```
┌─────────────────────────────────────────────┐
│         Presentation Layer                  │
│  (Screens - UI Only)                        │
│  - AcademicSuppliesScreen.tsx              │
│  - DeliveryTrackingScreen.tsx              │
└─────────────────┬───────────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────────┐
│      Business Logic Layer                   │
│  (Custom Hooks - State & Logic)            │
│  - useSupplyRequests.ts                    │
│  - useCreateSupplyRequest.ts               │
└─────────────────┬───────────────────────────┘
                  │ calls
┌─────────────────▼───────────────────────────┐
│         Service Layer                       │
│  (API Communication Only)                   │
│  - AcademicSuppliesService.ts              │
└─────────────────┬───────────────────────────┘
                  │ HTTP
┌─────────────────▼───────────────────────────┐
│         Backend API                         │
│  (Railway Server)                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         Components Layer                    │
│  (Reusable UI Components)                  │
│  - SupplyRequestCard.tsx                   │
│  - RequestStatusBadge.tsx                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         Types Layer                         │
│  (Shared across all layers)                │
│  - academicSupplies.ts                     │
└─────────────────────────────────────────────┘
```

---

## 📝 تفصيل كل طبقة

### **Layer 1: Types Layer**
📍 **الموقع:** `src/types/academicSupplies.ts`

**المحتويات:**
- ✅ Enums (SupplyType, SupplyRequestStatus)
- ✅ Interfaces (SupplyItem, SupplyRequest, etc.)
- ✅ DTOs (CreateSupplyRequestDto, UpdateSupplyRequestDto)
- ✅ Response types

**القواعد:**
- ❌ لا يستورد أي services أو components
- ❌ لا يحتوي على functions
- ✅ فقط type definitions

---

### **Layer 2: Service Layer**
📍 **الموقع:** `src/services/AcademicSuppliesService.ts`

**المسؤوليات:**
- ✅ إدارة HTTP requests
- ✅ إضافة Authentication headers
- ✅ معالجة HTTP errors
- ✅ تحويل Response إلى Types

**لا تحتوي على:**
- ❌ State management (useState, etc.)
- ❌ React hooks
- ❌ Business validation
- ❌ UI logic

**Methods المتوفرة:**
```typescript
// Supply Items
getAvailableItems(): Promise<SupplyItem[]>
getItemsByType(type: string): Promise<SupplyItem[]>
getItemById(id: string): Promise<SupplyItem>

// Supply Requests
getRequests(params?): Promise<SupplyRequestsResponse>
getRequestById(id: string): Promise<SupplyRequest>
createRequest(data: CreateSupplyRequestDto): Promise<SupplyRequest>
updateRequest(id: string, data: UpdateSupplyRequestDto): Promise<SupplyRequest>
cancelRequest(id: string): Promise<void>
deleteRequest(id: string): Promise<void>

// Admin Actions
approveRequest(id: string, date?): Promise<SupplyRequest>
rejectRequest(id: string, reason: string): Promise<SupplyRequest>
markAsInProgress(id: string): Promise<SupplyRequest>
markAsReadyForDelivery(id: string): Promise<SupplyRequest>
markAsDelivered(id: string, data): Promise<SupplyRequest>

// Statistics
getStats(): Promise<SupplyStats>

// Delivery Tracking
getDeliveryRecords(params?): Promise<DeliveryRecord[]>
getDeliveryRecordById(id: string): Promise<DeliveryRecord>
```

---

### **Layer 3: Business Logic Layer (Hooks)**
📍 **الموقع:** `src/hooks/` (سيتم إنشاؤها لاحقاً)

**المسؤوليات:**
- ✅ State management (useState)
- ✅ Side effects (useEffect)
- ✅ Business validation
- ✅ Data transformation
- ✅ Error handling + Toast messages

**مثال:**
```typescript
// useSupplyRequests.ts
const useSupplyRequests = (options) => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  
  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await AcademicSuppliesService.getRequests(options)
      setRequests(data.data)
    } catch (error) {
      Toast.show({ type: 'error', text1: 'خطأ' })
    } finally {
      setLoading(false)
    }
  }
  
  return { requests, loading, fetchRequests }
}
```

---

### **Layer 4: Components Layer**
📍 **الموقع:** `src/components/` (سيتم إنشاؤها لاحقاً)

**المسؤوليات:**
- ✅ عرض UI فقط
- ✅ Receiving props
- ✅ Emitting events

**مثال:**
```typescript
// SupplyRequestCard.tsx
interface SupplyRequestCardProps {
  request: SupplyRequest
  onPress?: () => void
  showActions?: boolean
  onApprove?: () => void
  onReject?: () => void
}

const SupplyRequestCard: FC<SupplyRequestCardProps> = (props) => {
  // فقط UI - لا يحتوي على API calls أو Business logic
  return <View>...</View>
}
```

---

### **Layer 5: Screen Layer**
📍 **الموقع:** `src/screens/`

**المسؤوليات:**
- ✅ تنسيق UI
- ✅ استدعاء Hooks
- ✅ Navigation
- ✅ Combining components

**لا تحتوي على:**
- ❌ API calls مباشرة
- ❌ Complex business logic
- ❌ Direct state management (تستخدم Hooks)

**مثال:**
```typescript
// AcademicSuppliesScreen.tsx
const AcademicSuppliesScreen = ({ navigation }) => {
  // ✅ استخدام Hook للـ business logic
  const { requests, loading, refresh } = useSupplyRequests()
  
  // ✅ UI rendering فقط
  return (
    <View>
      {requests.map(request => (
        <SupplyRequestCard 
          key={request.id}
          request={request}
          onPress={() => navigation.navigate('Details', { id: request.id })}
        />
      ))}
    </View>
  )
}
```

---

## 🔄 تدفق البيانات (Data Flow)

```
User Action (في Screen)
    ↓
Hook Method Call
    ↓
Service API Call
    ↓
Backend API
    ↓
Response Data
    ↓
Hook State Update
    ↓
Screen Re-render
    ↓
User sees updated UI
```

### **مثال عملي:**

```typescript
// 1. User clicks "Create Request" button
<TouchableOpacity onPress={handleCreateRequest}>

// 2. Screen calls Hook
const { createRequest } = useCreateSupplyRequest()
const handleCreateRequest = async () => {
  await createRequest(formData)
}

// 3. Hook calls Service
const createRequest = async (data) => {
  const result = await AcademicSuppliesService.createRequest(data)
  // Business logic here
  Toast.show({ type: 'success' })
}

// 4. Service makes API call
async createRequest(data) {
  return this.request('/api/academic-supplies/requests', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// 5. Backend responds → Service returns → Hook updates state → Screen re-renders
```

---

## 📚 الملفات المُنشأة

### ✅ **تم إنشاؤها:**

1. **`src/types/academicSupplies.ts`** - 172 سطر
   - جميع Types و Enums و Interfaces
   - DTOs للـ API requests
   - Response types

2. **`src/services/AcademicSuppliesService.ts`** - 291 سطر
   - جميع API endpoints
   - Error handling
   - Authentication headers

3. **`src/screens/AcademicSuppliesScreen.tsx`** - 103 سطر
   - الصفحة الرئيسية (فارغة حالياً)
   - جاهزة لإضافة المحتوى

4. **`src/screens/DeliveryTrackingScreen.tsx`** - 103 سطر
   - صفحة تتبع التسليم (فارغة حالياً)
   - جاهزة لإضافة المحتوى

5. **`src/types/permissions.ts`** - محدث
   - إضافة صلاحيات الأدوات الدراسية
   - إضافة category جديد: 'academic_supplies'
   - إضافة قسم جديد في القائمة

6. **`App.tsx`** - محدث
   - إضافة الصفحتين في Navigator
   - Import الـ screens الجديدة

---

## 🎯 الخطوات التالية

### **المرحلة 1: إنشاء Hooks (Business Logic)**
سيتم إنشاء:
- `useSupplyRequests.ts` - لجلب وإدارة الطلبات
- `useCreateSupplyRequest.ts` - لإنشاء طلب جديد
- `useSupplyItems.ts` - لجلب الأدوات المتاحة
- `useSupplyRequestActions.ts` - للموافقة/رفض/تسليم

### **المرحلة 2: إنشاء Components**
سيتم إنشاء:
- `SupplyRequestCard.tsx` - بطاقة عرض الطلب
- `SupplyItemSelector.tsx` - اختيار الأدوات
- `RequestStatusBadge.tsx` - عرض حالة الطلب
- `RequestTimeline.tsx` - timeline للطلب

### **المرحلة 3: تطوير الصفحات**
- إضافة المحتوى الكامل للصفحات
- ربط Hooks و Components
- إضافة Forms و Validation

---

## 🔑 نقاط مهمة للمطور

### ✅ **DO's:**
1. ✅ استخدم Hooks للـ business logic
2. ✅ افصل API calls في Service
3. ✅ اجعل Components pure قدر الإمكان
4. ✅ استخدم TypeScript types بشكل صحيح
5. ✅ اتبع نفس نمط التسمية
6. ✅ أضف comments توضيحية

### ❌ **DON'Ts:**
1. ❌ لا تضع API calls مباشرة في Screens
2. ❌ لا تضع Business logic في Components
3. ❌ لا تضع State management في Service
4. ❌ لا تخلط المسؤوليات
5. ❌ لا تستخدم `any` type
6. ❌ لا تتجاهل Error handling

---

## 🎨 معايير الكود

### **Naming Conventions:**
- **Files:** PascalCase (e.g., `AcademicSuppliesScreen.tsx`)
- **Components:** PascalCase (e.g., `SupplyRequestCard`)
- **Hooks:** camelCase starting with 'use' (e.g., `useSupplyRequests`)
- **Functions:** camelCase (e.g., `createRequest`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_ITEMS`)
- **Types/Interfaces:** PascalCase (e.g., `SupplyRequest`)
- **Enums:** PascalCase (e.g., `SupplyRequestStatus`)

### **File Structure:**
```typescript
// 1. Imports (grouped)
import React from 'react'
import { View, Text } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'

// 2. Types/Interfaces
interface Props { }

// 3. Component/Function
const Component: FC<Props> = () => { }

// 4. Styles
const styles = StyleSheet.create({ })

// 5. Export
export default Component
```

---

## 📊 API Endpoints المتوقعة

يجب أن يوفر الـ Backend الـ endpoints التالية:

### **Supply Items:**
- `GET /api/academic-supplies/items` - جلب الأدوات المتاحة
- `GET /api/academic-supplies/items/:id` - تفاصيل أداة
- `GET /api/academic-supplies/items?type=BOOKS` - فلترة حسب النوع

### **Supply Requests:**
- `GET /api/academic-supplies/requests` - جلب الطلبات
- `GET /api/academic-supplies/requests/:id` - تفاصيل طلب
- `POST /api/academic-supplies/requests` - إنشاء طلب
- `PATCH /api/academic-supplies/requests/:id` - تحديث طلب
- `DELETE /api/academic-supplies/requests/:id` - حذف طلب
- `POST /api/academic-supplies/requests/:id/cancel` - إلغاء طلب

### **Admin Actions:**
- `POST /api/academic-supplies/requests/:id/approve` - موافقة
- `POST /api/academic-supplies/requests/:id/reject` - رفض
- `POST /api/academic-supplies/requests/:id/in-progress` - قيد التجهيز
- `POST /api/academic-supplies/requests/:id/ready` - جاهز للتسليم
- `POST /api/academic-supplies/requests/:id/deliver` - تسجيل التسليم

### **Statistics:**
- `GET /api/academic-supplies/stats` - الإحصائيات

### **Delivery Tracking:**
- `GET /api/academic-supplies/deliveries` - سجلات التسليم
- `GET /api/academic-supplies/deliveries/:id` - تفاصيل تسليم

---

## 🎯 ملخص المعمارية

هذه المعمارية تضمن:

1. **Separation of Concerns** - كل طبقة لها دور محدد
2. **Testability** - يمكن اختبار كل طبقة بشكل مستقل
3. **Maintainability** - سهولة التعديل والصيانة
4. **Scalability** - يمكن التوسع بسهولة
5. **Reusability** - Components و Hooks قابلة لإعادة الاستخدام
6. **Type Safety** - TypeScript types شاملة
7. **SOLID Compliance** - اتباع جميع مبادئ SOLID

---

## 📞 جاهز للتطوير!

الآن يمكنك البدء في تطوير المحتوى الفعلي للصفحات:
- إضافة UI elements
- إنشاء Hooks
- إنشاء Components
- ربط كل شيء معاً

البنية الأساسية جاهزة وقابلة للتوسع! 🚀