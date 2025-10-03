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

interface CustomMenuProps {
  navigation: any;
  activeRouteName?: string;
}

const CustomMenu: React.FC<CustomMenuProps> = ({ navigation, activeRouteName }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const { allowedMenuSections, isLoading, userRoleInfo } = usePermissions();

  // إضافة عناصر مخصصة (إدارة التوزيع + تسجيل الخروج) لجميع الأقسام المسموحة
  const getMenuSectionsWithLogout = () => {
    const sectionsWithLogout = [...allowedMenuSections];
    
    // إضافة قسم/عنصر إدارة التوزيع إذا لم يكن موجوداً
    let distributionSection = sectionsWithLogout.find((section: any) => section.category === 'distribution');
    if (!distributionSection) {
      distributionSection = {
        title: 'التوزيع',
        category: 'distribution',
        items: [],
      };
      sectionsWithLogout.push(distributionSection);
    }
    const hasDistributionItem = distributionSection.items.some((item: any) => item.id === 'DistributionManagement');
    if (!hasDistributionItem) {
      distributionSection.items.push({
        id: 'DistributionManagement',
        title: 'إدارة التوزيع',
        icon: 'groups',
        screen: 'DistributionManagement',
        priority: 50,
        allowedRoles: ['super_admin', 'admin', 'manager', 'employee'],
        category: 'distribution' as const,
      });
    }
    
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
    const hasLogout = systemSection.items.some(item => item.isLogout);
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
        navigation.navigate(item.screen);
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
        <Icon name="menu" size={28} color="#1a237e" />
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
                      .sort((a, b) => a.priority - b.priority)
                      .map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.menuItem,
                          activeRouteName === item.screen && styles.activeMenuItem,
                        ]}
                        onPress={() => handleMenuPress(item)}
                      >
                        <View style={styles.menuItemContent}>
                          <View style={[
                            styles.iconContainer,
                            activeRouteName === item.screen && styles.activeIconContainer,
                            item.isLogout && styles.logoutIconContainer,
                          ]}>
                            <Icon
                              name={item.icon}
                              size={22}
                              color={
                                activeRouteName === item.screen
                                  ? '#1a237e'
                                  : item.isLogout
                                  ? '#e53e3e'
                                  : '#fff'
                              }
                              style={styles.menuIcon}
                            />
                          </View>
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
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: width * 0.85,
    backgroundColor: '#1a237e',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  userSection: {
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
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
    top: 40,
    right: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuItems: {
    flex: 1,
  },
  menuItemsContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  menuSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    marginLeft: 24,
    marginRight: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activeIconContainer: {
    backgroundColor: '#fff',
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutIconContainer: {
    backgroundColor: 'rgba(229, 62, 62, 0.15)',
  },
  menuIcon: {
    // Remove marginRight as it's now handled by iconContainer
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: 0.3,
    flex: 1,
  },
  activeMenuText: {
    fontWeight: '700',
    color: '#fff',
  },
  logoutText: {
    color: '#e53e3e',
    fontWeight: '600',
  },
  activeIndicator: {
    width: 4,
    height: 32,
    backgroundColor: '#1a237e',
    borderRadius: 2,
    marginLeft: 8,
  },
  subMenuItem: {
    marginLeft: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 4,
  },
  subMenuIcon: {
    marginRight: 12,
  },
  subMenuText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  branchSection: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default CustomMenu;
