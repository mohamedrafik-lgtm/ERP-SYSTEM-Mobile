# 🔧 مثال تطبيق نظام الصلاحيات على الشاشات الموجودة

## 📋 خطوات التطبيق

### 1. تحديث شاشة الخزائن المالية (TreasuryScreen.tsx)

#### قبل التحديث:
```typescript
import React from 'react';
import { View, Text } from 'react-native';

const TreasuryScreen = ({ navigation }) => {
  return (
    <View>
      <Text>الخزائن المالية</Text>
      {/* محتوى الشاشة */}
    </View>
  );
};

export default TreasuryScreen;
```

#### بعد التحديث:
```typescript
import React from 'react';
import { View, Text } from 'react-native';
import PermissionGuard from '../components/PermissionGuard';

const TreasuryScreen = ({ navigation }) => {
  return (
    <PermissionGuard screenId="Treasury" navigation={navigation}>
      <View>
        <Text>الخزائن المالية</Text>
        {/* محتوى الشاشة */}
      </View>
    </PermissionGuard>
  );
};

export default TreasuryScreen;
```

### 2. تحديث شاشة الصلاحيات (PermissionsScreen.tsx)

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import PermissionGuard from '../components/PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';

const PermissionsScreen = ({ navigation }) => {
  const { isSuperAdmin } = usePermissions();

  return (
    <PermissionGuard screenId="Permissions" navigation={navigation}>
      <View>
        <Text>إدارة الصلاحيات</Text>
        {isSuperAdmin && (
          <Text>مرحباً أيها المدير العام</Text>
        )}
        {/* محتوى الشاشة */}
      </View>
    </PermissionGuard>
  );
};

export default PermissionsScreen;
```

### 3. تحديث الشاشة الرئيسية (HomeScreen.tsx)

```typescript
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { usePermissions } from '../hooks/usePermissions';
import PermissionIcon from '../components/PermissionIcon';

const HomeScreen = ({ navigation }) => {
  const { canAccessSync, userRoleInfo, allowedScreens } = usePermissions();

  const quickAccessItems = [
    { id: 'StudentsList', title: 'الطلاب', screen: 'StudentsList' },
    { id: 'Treasury', title: 'الخزائن', screen: 'Treasury' },
    { id: 'Marketers', title: 'التسويق', screen: 'Marketers' },
    { id: 'Permissions', title: 'الصلاحيات', screen: 'Permissions' },
  ];

  return (
    <ScrollView>
      <View style={styles.header}>
        <Text style={styles.welcome}>
          مرحباً {userRoleInfo?.displayName || 'المستخدم'}
        </Text>
        <Text style={styles.roleText}>
          الدور: {userRoleInfo?.displayName}
        </Text>
      </View>

      <View style={styles.quickAccess}>
        <Text style={styles.sectionTitle}>الوصول السريع</Text>
        {quickAccessItems.map(item => (
          canAccessSync(item.id) && (
            <TouchableOpacity
              key={item.id}
              style={styles.quickAccessItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.itemTitle}>{item.title}</Text>
              <PermissionIcon screenId={item.id} size="small" />
            </TouchableOpacity>
          )
        ))}
      </View>

      <View style={styles.stats}>
        <Text style={styles.sectionTitle}>الإحصائيات</Text>
        <Text>عدد الصفحات المتاحة: {allowedScreens.length}</Text>
      </View>
    </ScrollView>
  );
};
```

### 4. تحديث شاشة قائمة الطلاب (StudentsListScreen.tsx)

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import PermissionGuard from '../components/PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';

const StudentsListScreen = ({ navigation }) => {
  const { canAccessSync, isManager } = usePermissions();

  return (
    <PermissionGuard screenId="StudentsList" navigation={navigation}>
      <View>
        <Text>قائمة الطلاب</Text>
        
        {/* أزرار الإجراءات حسب الصلاحية */}
        <View style={styles.actions}>
          {canAccessSync('AddStudent') && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddStudent')}
            >
              <Text>إضافة طالب</Text>
            </TouchableOpacity>
          )}
          
          {isManager && (
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => {/* تصدير تقرير */}}
            >
              <Text>تصدير تقرير</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* قائمة الطلاب */}
        {/* ... */}
      </View>
    </PermissionGuard>
  );
};
```

### 5. تحديث App.tsx لاستخدام القائمة الجديدة

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import PermissionBasedMenu from './src/components/PermissionBasedMenu';
import Toast from 'react-native-toast-message';

// استيراد الشاشات
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
// ... باقي الشاشات

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={({ navigation, route }) => ({
            headerLeft: () => (
              <PermissionBasedMenu 
                navigation={navigation} 
                activeRouteName={route.name}
              />
            ),
            headerTitle: 'مركز طيبة للتدريب',
            headerLeftContainerStyle: { paddingLeft: 0 },
          })}
        />
        {/* باقي الشاشات */}
      </Stack.Navigator>
      <Toast />
    </NavigationContainer>
  );
};

export default App;
```

## 🎯 خطة التطبيق المرحلية

### المرحلة 1: الشاشات الأساسية (أولوية عالية)
- [ ] HomeScreen - الصفحة الرئيسية
- [ ] LoginScreen - تحديث استجابة تسجيل الدخول
- [ ] StudentsListScreen - قائمة الطلاب
- [ ] TreasuryScreen - الخزائن المالية
- [ ] PermissionsScreen - الصلاحيات

### المرحلة 2: الشاشات المالية (أولوية متوسطة)
- [ ] FeesScreen - الرسوم المالية
- [ ] TraineePaymentsScreen - مدفوعات المتدربين
- [ ] AddTreasuryScreen - إضافة خزينة
- [ ] AddFeeScreen - إضافة رسوم

### المرحلة 3: شاشات التسويق (أولوية متوسطة)
- [ ] MarketersScreen - المسوقون
- [ ] TargetSettingScreen - تحديد التارجيت
- [ ] MarketingStatsScreen - إحصائيات التسويق
- [ ] MarketingTraineesScreen - المتدربين مع التسويق

### المرحلة 4: الشاشات الأكاديمية (أولوية منخفضة)
- [ ] ProgramsScreen - البرامج التدريبية
- [ ] TrainingContentsScreen - المحتوى التدريبي
- [ ] UsersListScreen - المستخدمون
- [ ] QuestionsScreen - الأسئلة

### المرحلة 5: شاشات الإضافة والتعديل
- [ ] AddStudentScreen - إضافة طالب
- [ ] AddUserScreen - إضافة مستخدم
- [ ] AddProgramScreen - إضافة برنامج
- [ ] EditUserScreen - تعديل مستخدم
- [ ] EditTraineeScreen - تعديل متدرب

## 🔧 نصائح التطبيق

### 1. اختبار الصلاحيات
```typescript
// إضافة هذا للتطوير والاختبار
const TestPermissions = () => {
  const { allowedScreens, userRoleInfo } = usePermissions();
  
  console.log('User Role:', userRoleInfo?.name);
  console.log('Allowed Screens:', allowedScreens.map(s => s.id));
};
```

### 2. معالجة الأخطاء
```typescript
// إضافة معالجة أخطاء للتنقل
const handleNavigation = async (screenName: string) => {
  try {
    const canAccess = await PermissionService.canAccessScreen(screenName);
    if (canAccess) {
      navigation.navigate(screenName);
    } else {
      Toast.show({
        type: 'error',
        text1: 'ليس لديك صلاحية للوصول لهذه الصفحة',
      });
    }
  } catch (error) {
    console.error('Navigation error:', error);
  }
};
```

### 3. تحسين الأداء
```typescript
// استخدام useMemo للعمليات المكلفة
const allowedQuickAccess = useMemo(() => {
  return quickAccessItems.filter(item => canAccessSync(item.id));
}, [canAccessSync, quickAccessItems]);
```

هذا يوضح كيفية تطبيق النظام بشكل تدريجي ومنظم! 🚀
