import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import UserRoleDisplay from './UserRoleDisplay';
import { usePermissions } from '../hooks/usePermissions';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

// Types
interface MenuItem {
  id: string;
  title: string;
  icon: string;
  screen: string;
  priority: number;
  allowedRoles: string[];
  category: string;
  isLogout?: boolean;
}

interface MenuSection {
  title: string;
  category: string;
  items: MenuItem[];
}

interface CustomMenuProps {
  navigation: any;
  activeRouteName?: string;
}

const CustomMenu: React.FC<CustomMenuProps> = ({ navigation, activeRouteName }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const { allowedMenuSections, isLoading } = usePermissions();

  // إضافة عناصر مخصصة (التوزيعات + إدارة التوزيع + طلاب غير موزعين + تسجيل الخروج) لجميع الأقسام المسموحة
  const getMenuSectionsWithLogout = () => {
    const sectionsWithLogout = [...allowedMenuSections];
    
    // البحث عن قسم النظام أو إنشاؤه
    let systemSection = sectionsWithLogout.find(section => section.category === 'system');
    
    if (!systemSection) {
      systemSection = {
        title: 'النظام',
        category: 'system',
        items: []
      };
      sectionsWithLogout.push(systemSection);
    }
    
    // إضافة عنصر تسجيل الخروج إذا لم يكن موجوداً
    const hasLogout = systemSection.items.some((item: MenuItem) => item.isLogout);
    if (!hasLogout) {
      systemSection.items.push({
        id: 'Logout',
        title: 'تسجيل الخروج',
        icon: 'exit-to-app',
        screen: 'Login',
        priority: 999,
        allowedRoles: ['super_admin', 'admin', 'manager', 'accountant', 'employee', 'trainee_entry_clerk'],
        category: 'system' as const,
        isLogout: true,
      });
    }

    // ضمان أن قسم النظام (تسجيل الخروج) يكون آخر قسم دائماً
    const sysIdx = sectionsWithLogout.indexOf(systemSection);
    if (sysIdx !== -1 && sysIdx !== sectionsWithLogout.length - 1) {
      sectionsWithLogout.splice(sysIdx, 1);
      sectionsWithLogout.push(systemSection);
    }
    
    return sectionsWithLogout;
  };

  const showMenu = () => {
    setIsVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const handleMenuPress = async (item: any) => {
    hideMenu();
    
    if (item.isLogout) {
      try {
        // تسجيل الخروج ومسح بيانات الفرع للعودة لشاشة اختيار الفرع
        await AuthService.logout(true);
        Toast.show({
          type: 'success',
          text1: 'تم تسجيل الخروج بنجاح',
          text2: 'اختر الفرع لتسجيل الدخول مرة أخرى',
          position: 'bottom',
        });
        navigation.reset({
          index: 0,
          routes: [{ name: 'BranchSelection' }],
        });
      } catch (error) {
        console.error('Logout error:', error);
        Toast.show({
          type: 'error',
          text1: 'خطأ في تسجيل الخروج',
          text2: 'يرجى المحاولة مرة أخرى',
          position: 'bottom',
        });
      }
    } else {
      try {
        const screenName = item.screen || item.screenName;
        if (screenName) {
          navigation.navigate(screenName);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        Toast.show({
          type: 'error',
          text1: 'خطأ في التنقل',
          text2: 'الصفحة غير متاحة حالياً',
          position: 'bottom',
        });
      }
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.menuButton} onPress={showMenu}>
        <Icon name="menu" size={24} color="#1e3a8a" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={hideMenu}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={hideMenu}
          />
          <Animated.View
            style={[
              styles.menuContainer,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.header}>
              <Image
                source={require('../../img/502585454_122235753458244801_413190920156398012_n-removebg-preview.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.headerTitle}>مركز طيبة للتدريب</Text>
              <Text style={styles.headerSubtitle}>النظام الإداري</Text>
              
              {/* عرض معلومات المستخدم والدور */}
              <View style={styles.userSection}>
                <UserRoleDisplay compact={true} showPrimaryRoleOnly={true} />
              </View>

              
              <TouchableOpacity style={styles.closeButton} onPress={hideMenu}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.menuItems}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuItemsContent}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1a237e" />
                  <Text style={styles.loadingText}>جاري تحميل القائمة...</Text>
                </View>
              ) : (
                getMenuSectionsWithLogout().map((section, sectionIndex) => (
                  <View key={sectionIndex} style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    {section.items
                      .sort((a: any, b: any) => a.priority - b.priority)
                      .map((item: any) => {
                      const itemScreen = item.screen || item.screenName;
                      const isActive = activeRouteName === itemScreen;
                      return (
                      <TouchableOpacity
                        key={item.id || item.screenName}
                        style={[
                          styles.menuItem,
                          item.isLogout && styles.logoutMenuItem,
                          isActive && styles.activeMenuItem,
                        ]}
                        onPress={() => handleMenuPress(item)}
                      >
                        <View style={styles.menuItemContent}>
                          <View style={[
                            styles.iconContainer,
                            isActive && styles.activeIconContainer,
                            item.isLogout && styles.logoutIconContainer,
                          ]}>
                            <Icon
                              name={item.icon}
                              size={22}
                              color={
                                item.isLogout
                                  ? '#dc2626'
                                  : isActive
                                  ? '#1e3a8a'
                                  : '#fff'
                              }
                              style={styles.menuIcon}
                            />
                          </View>
                          <Text
                            style={[
                              styles.menuText,
                              isActive && styles.activeMenuText,
                              item.isLogout && styles.logoutText,
                            ]}
                          >
                            {item.title}
                          </Text>
                        </View>
                        {!item.isLogout && (
                          <Icon
                            name="chevron-left"
                            size={20}
                            color={isActive ? '#1e3a8a' : 'rgba(255, 255, 255, 0.7)'}
                          />
                        )}
                        {isActive && (
                          <View style={styles.activeIndicator} />
                        )}
                      </TouchableOpacity>
                    );})}
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.footerText}>الإصدار 1.0.0</Text>
              <Text style={styles.footerText}>© 2024 مركز طيبة للتدريب</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.46)',
  },
  menuContainer: {
    width: Math.min(width * 0.86, 360),
    backgroundColor: '#102a82',
    height: '100%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 18,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.16)',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.84)',
    textAlign: 'center',
    fontWeight: '500',
  },
  userSection: {
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 44,
    left: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  menuItems: {
    flex: 1,
  },
  menuItemsContent: {
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  menuSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.84)',
    marginBottom: 8,
    marginHorizontal: 6,
    textAlign: 'right',
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  activeMenuItem: {
    backgroundColor: '#ffffff',
    borderColor: '#dbeafe',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutMenuItem: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  menuItemContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  activeIconContainer: {
    backgroundColor: '#eaf1ff',
  },
  logoutIconContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.16)',
  },
  menuIcon: {
    textAlign: 'center',
  },
  menuText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  activeMenuText: {
    color: '#1e3a8a',
    fontWeight: '800',
  },
  logoutText: {
    color: '#fecaca',
    fontWeight: '700',
  },
  activeIndicator: {
    width: 5,
    height: 26,
    backgroundColor: '#1e3a8a',
    borderRadius: 999,
    marginLeft: 8,
  },
  footer: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.78)',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
  },
});

export default CustomMenu;
