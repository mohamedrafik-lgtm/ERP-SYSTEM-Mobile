# 🔐 دليل نظام الصلاحيات والأدوار الشامل

## 📋 نظرة عامة

تم تطوير نظام صلاحيات متقدم يتحكم في عرض وإخفاء الصفحات حسب دور المستخدم، مما يضمن أن كل مستخدم يرى فقط الصفحات المسموح له بالوصول إليها.

## 🎯 الأدوار المدعومة

| الدور | الاسم بالعربية | اللون | مستوى الصلاحية |
|-------|----------------|--------|-----------------|
| `super_admin` | مدير عام | `#e53e3e` | 1 (أعلى) |
| `admin` | مدير النظام | `#d69e2e` | 2 |
| `manager` | مدير | `#3182ce` | 3 |
| `accountant` | محاسب | `#38a169` | 4 |
| `employee` | موظف | `#805ad5` | 5 |
| `trainee_entry_clerk` | موظف إدخال بيانات المتدربين | `#dd6b20` | 6 (أقل) |

## 📂 الصفحات والصلاحيات

### 🏠 الصفحة الرئيسية
- **الصفحات:** الرئيسية
- **الأدوار المسموحة:** جميع الأدوار
- **الوصف:** نقطة البداية لجميع المستخدمين

### 🎓 الإدارة الأكاديمية

#### إدارة الطلاب
- **عرض الطلاب:** `super_admin`, `admin`, `manager`, `accountant`, `trainee_entry_clerk`
- **إضافة طالب:** `super_admin`, `admin`, `manager`, `accountant`, `trainee_entry_clerk`
- **تعديل طالب:** `super_admin`, `admin`, `manager`, `trainee_entry_clerk`
- **وثائق المتدربين:** `super_admin`, `admin`, `manager`, `trainee_entry_clerk`

#### إدارة المستخدمين
- **عرض المستخدمين:** `super_admin`, `admin`, `manager`
- **إضافة مستخدم:** `super_admin`, `admin`
- **تعديل مستخدم:** `super_admin`, `admin`

#### إدارة البرامج
- **عرض البرامج:** `super_admin`, `admin`, `manager`
- **إضافة برنامج:** `super_admin`, `admin`, `manager`
- **تعديل برنامج:** `super_admin`, `admin`, `manager`

#### إدارة المحتوى التدريبي
- **عرض المحتوى:** `super_admin`, `admin`, `manager`
- **إضافة محتوى:** `super_admin`, `admin`, `manager`
- **تعديل محتوى:** `super_admin`, `admin`, `manager`

#### إدارة الأسئلة
- **عرض الأسئلة:** `super_admin`, `admin`, `manager`
- **إضافة سؤال:** `super_admin`, `admin`, `manager`

#### أخرى
- **متدربو الموظفين:** `super_admin`, `admin`, `manager`, `employee`

### 📈 إدارة التسويق

#### إدارة المسوقين
- **عرض المسوقين:** `super_admin`, `admin`, `manager`
- **إضافة مسوق:** `super_admin`, `admin`, `manager`
- **تعديل مسوق:** `super_admin`, `admin`, `manager`

#### إدارة الأهداف والإحصائيات
- **تحديد التارجيت:** `super_admin`, `admin`, `manager`
- **المتدربين مع التسويق:** `super_admin`, `admin`, `manager`
- **إحصائيات التسويق:** `super_admin`, `admin`, `manager`

### 🤖 الأتمتة التلقائية
- **إدارة WhatsApp:** `super_admin`, `admin`

### 💰 الإدارة المالية

#### إدارة الخزائن
- **عرض الخزائن:** `super_admin`, `admin`, `manager`, `accountant`
- **إضافة خزينة:** `super_admin`, `admin`, `accountant`

#### إدارة الرسوم
- **عرض الرسوم:** `super_admin`, `admin`, `manager`, `accountant`
- **إضافة رسوم:** `super_admin`, `admin`, `accountant`

#### إدارة المدفوعات
- **مدفوعات المتدربين:** `super_admin`, `admin`, `manager`, `accountant`
- **تفاصيل المدفوعات:** `super_admin`, `admin`, `manager`, `accountant`
- **إضافة معاملة:** `super_admin`, `admin`, `accountant`

### ⚙️ إدارة النظام
- **الصلاحيات:** `super_admin` فقط
- **إضافة صلاحية:** `super_admin` فقط
- **تفاصيل الأدوار:** `super_admin` فقط

## 🛠️ المكونات المطورة

### 1. نظام الصلاحيات الأساسي

#### `src/types/permissions.ts`
```typescript
// تعريف الأدوار والصلاحيات
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'accountant' | 'employee' | 'trainee_entry_clerk';

// تكوين الصفحات والصلاحيات
export const SCREEN_PERMISSIONS: PermissionConfig[]
```

#### `src/services/PermissionService.ts`
```typescript
// خدمة إدارة الصلاحيات
class PermissionService {
  static async canAccessScreen(screenId: string): Promise<boolean>
  static async getAllowedScreens(): Promise<PermissionConfig[]>
  static async hasMinimumRole(role: UserRole): Promise<boolean>
  // ... المزيد من الطرق
}
```

### 2. مكونات الحماية

#### `src/components/PermissionGuard.tsx`
```typescript
// حماية الصفحات من الوصول غير المصرح به
<PermissionGuard screenId=\"Treasury\" navigation={navigation}>
  <YourScreenContent />
</PermissionGuard>
```

#### `src/components/PermissionBasedMenu.tsx`
```typescript
// قائمة تنقل ذكية تعرض فقط الصفحات المسموحة
<PermissionBasedMenu navigation={navigation} activeRouteName={route.name} />
```

### 3. Hook للصلاحيات

#### `src/hooks/usePermissions.ts`
```typescript
const { 
  canAccess, 
  allowedScreens, 
  userRoleInfo, 
  isSuperAdmin, 
  isManager 
} = usePermissions();
```

### 4. مكونات مساعدة

#### `src/components/PermissionIcon.tsx`
```typescript
// عرض أيقونة الصلاحية
<PermissionIcon screenId=\"Treasury\" showText={true} size=\"medium\" />
```

## 📖 أمثلة للاستخدام

### استخدام حماية الصفحات
```typescript
import PermissionGuard from '../components/PermissionGuard';

const TreasuryScreen = ({ navigation }) => (
  <PermissionGuard screenId=\"Treasury\" navigation={navigation}>
    <View>
      <Text>محتوى الخزائن المالية</Text>
    </View>
  </PermissionGuard>
);
```

### استخدام القائمة الذكية
```typescript
import PermissionBasedMenu from '../components/PermissionBasedMenu';

const App = () => (
  <NavigationContainer>
    <PermissionBasedMenu navigation={navigation} />
    <Stack.Navigator>
      {/* شاشاتك هنا */}
    </Stack.Navigator>
  </NavigationContainer>
);
```

### التحقق من الصلاحيات برمجياً
```typescript
import { usePermissions } from '../hooks/usePermissions';

const MyComponent = () => {
  const { canAccessSync, isSuperAdmin, userRoleInfo } = usePermissions();
  
  return (
    <View>
      {canAccessSync('Treasury') && (
        <Button title=\"الخزائن المالية\" />
      )}
      
      {isSuperAdmin && (
        <Button title=\"إدارة الصلاحيات\" />
      )}
      
      <Text>مرحباً {userRoleInfo?.displayName}</Text>
    </View>
  );
};
```

### إضافة صفحة جديدة للنظام
```typescript
// 1. إضافة الصفحة في permissions.ts
{
  id: 'NewScreen',
  title: 'صفحة جديدة',
  icon: 'new-releases',
  screen: 'NewScreen',
  priority: 15,
  allowedRoles: ['super_admin', 'admin'],
  category: 'system',
  description: 'وصف الصفحة الجديدة'
}

// 2. حماية الصفحة
const NewScreen = ({ navigation }) => (
  <PermissionGuard screenId=\"NewScreen\" navigation={navigation}>
    <YourContent />
  </PermissionGuard>
);
```

## 🔧 إعدادات متقدمة

### تخصيص الأدوار
```typescript
// في permissions.ts
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  custom_role: 'دور مخصص'
};

export const ROLE_COLORS: Record<UserRole, string> = {
  custom_role: '#ff6b6b'
};
```

### تخصيص رسائل منع الوصول
```typescript
<PermissionGuard 
  screenId=\"Treasury\"
  navigation={navigation}
  fallbackComponent={CustomAccessDeniedComponent}
/>
```

## 📱 تجربة المستخدم

### للمحاسب:
- ✅ الرئيسية
- ✅ عرض الطلاب
- ✅ إضافة طالب
- ✅ الخزائن المالية
- ✅ الرسوم المالية
- ✅ مدفوعات المتدربين
- ❌ إدارة المستخدمين
- ❌ البرامج التدريبية
- ❌ إدارة التسويق

### للمدير:
- ✅ جميع الصفحات ما عدا:
- ❌ الصلاحيات (مدير عام فقط)
- ❌ إدارة WhatsApp (مدير نظام فقط)

### لموظف إدخال البيانات:
- ✅ الرئيسية
- ✅ عرض الطلاب
- ✅ إضافة طالب
- ✅ تعديل طالب
- ✅ وثائق المتدربين
- ❌ جميع الصفحات الأخرى

## 🚀 التطبيق والاستخدام

1. **استبدال القائمة الحالية:**
   ```typescript
   // استبدال CustomMenu بـ PermissionBasedMenu
   import PermissionBasedMenu from '../components/PermissionBasedMenu';
   ```

2. **حماية الشاشات الحساسة:**
   ```typescript
   // لف كل شاشة بـ PermissionGuard
   <PermissionGuard screenId=\"ScreenName\">
     <ScreenContent />
   </PermissionGuard>
   ```

3. **تحديث بيانات تسجيل الدخول:**
   - تأكد من أن استجابة تسجيل الدخول تتضمن بيانات الأدوار
   - استخدم الـ interface الجديد `LoginResponse`

## 🔍 المميزات الرئيسية

- ✅ **أمان متقدم:** حماية على مستوى المكونات والشاشات
- ✅ **تجربة مستخدم محسنة:** إخفاء الخيارات غير المسموحة
- ✅ **مرونة في التخصيص:** سهولة إضافة أدوار وصفحات جديدة
- ✅ **أداء محسن:** تخزين مؤقت للصلاحيات
- ✅ **إدارة ذكية:** نظام هرمي للأدوار
- ✅ **تتبع شامل:** hooks وخدمات متكاملة

هذا النظام يضمن أن كل مستخدم يرى فقط ما يحتاجه ولا يستطيع الوصول لما لا يملك صلاحية له! 🎯
