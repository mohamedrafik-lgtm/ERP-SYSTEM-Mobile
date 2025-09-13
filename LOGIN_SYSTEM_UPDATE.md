# تحديث نظام تسجيل الدخول - دعم الأدوار والصلاحيات

## 🔄 **التحديثات المطبقة**

### **1. إنشاء Types جديدة**
```typescript
// src/types/auth.ts
interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    roles: Array<Role>;
    primaryRole: Role;
  };
}
```

### **2. تحديث AuthService**
تم إضافة الطرق التالية للتعامل مع الأدوار:
- `getUserRoles()`: جلب جميع أدوار المستخدم
- `getUserPrimaryRole()`: جلب الدور الأساسي
- `hasRole(roleName)`: التحقق من وجود دور محدد
- `hasMinimumRolePriority(priority)`: التحقق من أولوية الدور

### **3. تحديث LoginScreen**
- تم تحديث معالج تسجيل الدخول للتوافق مع البنية الجديدة
- إضافة تحقق شامل من البيانات المستلمة
- عرض الدور الأساسي في رسالة الترحيب

### **4. إنشاء مكونات جديدة**

#### **UserRoleDisplay Component**
```typescript
// استخدام بسيط
<UserRoleDisplay compact={true} showPrimaryRoleOnly={true} />

// عرض كامل
<UserRoleDisplay showRoles={true} />
```

#### **useAuth Hook**
```typescript
const { user, roles, primaryRole, hasRole, hasMinimumPriority } = useAuth();

// أمثلة الاستخدام:
if (hasRole('admin')) {
  // عرض خيارات المدير
}

if (hasMinimumPriority(5)) {
  // عرض ميزات الأولوية العالية
}
```

## 📋 **بنية الاستجابة المطلوبة من Backend**

```json
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "اسم المستخدم",
    "email": "user@example.com",
    "roles": [
      {
        "id": "role_id_1",
        "name": "admin",
        "displayName": "مدير النظام",
        "color": "#dc2626",
        "icon": "admin_panel_settings",
        "priority": 10
      },
      {
        "id": "role_id_2", 
        "name": "teacher",
        "displayName": "مدرس",
        "color": "#059669",
        "icon": "school",
        "priority": 5
      }
    ],
    "primaryRole": {
      "id": "role_id_1",
      "name": "admin", 
      "displayName": "مدير النظام",
      "color": "#dc2626",
      "icon": "admin_panel_settings",
      "priority": 10
    }
  }
}
```

## 🛡️ **التحقق من الصلاحيات**

### **في المكونات:**
```typescript
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { hasRole, hasMinimumPriority } = useAuth();
  
  return (
    <View>
      {hasRole('admin') && (
        <AdminPanel />
      )}
      
      {hasMinimumPriority(7) && (
        <HighLevelFeatures />
      )}
    </View>
  );
};
```

### **في الخدمات:**
```typescript
// في أي مكان في التطبيق
const canDeleteUsers = await AuthService.hasRole('admin');
const canModifyContent = await AuthService.hasMinimumRolePriority(5);
```

## 🎨 **عرض معلومات المستخدم**

### **في القائمة الجانبية:**
تم تحديث `CustomMenu` لعرض:
- اسم المستخدم
- الدور الأساسي مع اللون والأيقونة

### **في أي مكان بالتطبيق:**
```typescript
<UserRoleDisplay 
  compact={false} 
  showRoles={true} 
  showPrimaryRoleOnly={false} 
/>
```

## 🔧 **التوافق مع الأنظمة القديمة**

- تم الحفاظ على التوافق مع البيانات القديمة
- النظام يتعامل مع البنية الجديدة والقديمة
- في حالة عدم وجود أدوار، يتم إنشاء دور افتراضي

## 🚀 **الخطوات التالية**

1. **تحديث Backend** ليرسل البنية الجديدة
2. **تطبيق فحص الصلاحيات** في الشاشات المختلفة
3. **إضافة إدارة الأدوار** في شاشة الصلاحيات
4. **تخصيص القائمة الجانبية** حسب الأدوار

## 📝 **ملاحظات مهمة**

- تأكد من أن Backend يرسل `access_token` وليس `token`
- تأكد من وجود `primaryRole` في استجابة تسجيل الدخول
- يمكن للمستخدم أن يكون له أكثر من دور
- الأولوية تحدد مستوى الصلاحيات (رقم أكبر = صلاحية أعلى)

## 🔍 **اختبار النظام**

```typescript
// للاختبار، يمكن إضافة هذا في LoginScreen
console.log('Login response structure:', {
  hasAccessToken: !!loginData.access_token,
  hasUser: !!loginData.user,
  userHasRoles: !!loginData.user?.roles,
  userHasPrimaryRole: !!loginData.user?.primaryRole,
  rolesCount: loginData.user?.roles?.length || 0
});
```
