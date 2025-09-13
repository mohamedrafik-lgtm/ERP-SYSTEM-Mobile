import React, { useState } from 'react';
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

interface PermissionBasedMenuProps {
  navigation: any;
  activeRouteName?: string;
}

const PermissionBasedMenu: React.FC<PermissionBasedMenuProps> = ({ 
  navigation, 
  activeRouteName 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const { allowedMenuSections, isLoading } = usePermissions();

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

  // إضافة عنصر تسجيل الخروج لجميع الأقسام المسموحة
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
    const hasLogout = systemSection.items.some((item: any) => item.isLogout);
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

  const handleMenuPress = async (item: any) => {
    hideMenu();
    
    if (item.isLogout) {
      try {
        await AuthService.logout();
        Toast.show({
          type: 'success',
          text1: 'تم تسجيل الخروج بنجاح',
          position: 'bottom',
        });
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
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
        <Icon name="menu" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="none"
        onRequestClose={hideMenu}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={hideMenu}
          />
          <Animated.View
            style={[
              styles.menu,
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

            <ScrollView style={styles.menuContainer}>
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
                      .map((item: any) => (
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
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(26, 35, 126, 0.8)',
    padding: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  overlayTouchable: {
    flex: 1,
  },
  menu: {
    width: width * 0.8,
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#1a237e',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    backgroundColor: '#1a237e',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  logo: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
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
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
  },
  menuContainer: {
    flex: 1,
    backgroundColor: '#1a237e',
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
  menuSection: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    paddingHorizontal: 8,
    opacity: 0.9,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
    position: 'relative',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeIconContainer: {
    backgroundColor: '#fff',
  },
  logoutIconContainer: {
    backgroundColor: 'rgba(229, 62, 62, 0.2)',
  },
  menuIcon: {
    textAlign: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  activeMenuText: {
    color: '#1a237e',
    fontWeight: '600',
  },
  logoutText: {
    color: '#ff6b6b',
  },
  activeIndicator: {
    width: 4,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 2,
    position: 'absolute',
    right: 0,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default PermissionBasedMenu;