import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DrawerMenuProps {
  navigation: any;
  activeRouteName?: string;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({ navigation, activeRouteName }) => {
  const menuItems = [
    {
      id: 'Home',
      title: 'الرئيسية',
      icon: 'home',
      screen: 'Home',
    },
    {
      id: 'Permissions',
      title: 'الصلاحيات',
      icon: 'lock',
      screen: 'Permissions',
    },
    {
      id: 'AddUser',
      title: 'إضافة مستخدم',
      icon: 'person-add',
      screen: 'AddUser',
    },
    {
      id: 'Students',
      title: 'الطلاب',
      icon: 'school',
      screen: 'Students',
    },
    {
      id: 'UsersList',
      title: 'المستخدمون',
      icon: 'group',
      screen: 'UsersList',
    },
    {
      id: 'Marketers',
      title: 'المسوقون',
      icon: 'campaign',
      screen: 'Marketers',
    },
    {
      id: 'Courses',
      title: 'الدورات',
      icon: 'book',
      screen: 'Courses',
    },
    {
      id: 'Teachers',
      title: 'المدربين',
      icon: 'person',
      screen: 'Teachers',
    },
    {
      id: 'Schedule',
      title: 'الجدول',
      icon: 'schedule',
      screen: 'Schedule',
    },
    {
      id: 'Reports',
      title: 'التقارير',
      icon: 'assessment',
      screen: 'Reports',
    },
    {
      id: 'Fees',
      title: 'الرسوم',
      icon: 'account-balance-wallet',
      screen: 'Fees',
    },
    {
      id: 'Settings',
      title: 'الإعدادات',
      icon: 'settings',
      screen: 'Settings',
    },
    {
      id: 'Logout',
      title: 'تسجيل الخروج',
      icon: 'logout',
      screen: 'Login',
      isLogout: true,
    },
  ];

  const handleMenuPress = (item: any) => {
    if (item.isLogout) {
      // إضافة منطق تسجيل الخروج هنا
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else {
      navigation.navigate(item.screen);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../img/502585454_122235753458244801_413190920156398012_n-removebg-preview.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>مركز طيبة للتدريب</Text>
        <Text style={styles.headerSubtitle}>النظام الإداري</Text>
      </View>

      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              activeRouteName === item.screen && styles.activeMenuItem,
            ]}
            onPress={() => handleMenuPress(item)}
          >
            <View style={styles.menuItemContent}>
              <Icon
                name={item.icon}
                size={24}
                color={
                  activeRouteName === item.screen ? '#fff' : 
                  item.isLogout ? '#e53e3e' : '#fff'
                }
                style={styles.menuIcon}
              />
              <Text
                style={[
                  styles.menuText,
                  activeRouteName === item.screen && styles.activeMenuText,
                  item.isLogout && styles.logoutText,
                ]}
              >
                {item.title}
              </Text>
            </View>
            {activeRouteName === item.screen && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>الإصدار 1.0.0</Text>
        <Text style={styles.footerText}>© 2024 مركز طيبة للتدريب</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  activeMenuText: {
    fontWeight: 'bold',
  },
  logoutText: {
    color: '#e53e3e',
  },
  activeIndicator: {
    width: 4,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 2,
  },
});

export default DrawerMenu;

