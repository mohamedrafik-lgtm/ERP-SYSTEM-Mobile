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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';

const { width } = Dimensions.get('window');

interface CustomMenuProps {
  navigation: any;
  activeRouteName?: string;
}

const CustomMenu: React.FC<CustomMenuProps> = ({ navigation, activeRouteName }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));

  const menuSections = [
    {
      title: 'الرئيسية',
      items: [
        {
          id: 'Home',
          title: 'الرئيسية',
          icon: 'home',
          screen: 'Home',
          priority: 1,
        },
      ],
    },
    {
      title: 'الإدارة الأكاديمية',
      items: [
        {
          id: 'Students',
          title: 'الطلاب',
          icon: 'people',
          screen: 'StudentsList',
          priority: 2,
        },
        {
          id: 'Programs',
          title: 'البرامج التدريبية',
          icon: 'school',
          screen: 'Programs',
          priority: 3,
        },
        {
          id: 'TrainingContents',
          title: 'المحتوى التدريبي',
          icon: 'library-books',
          screen: 'TrainingContents',
          priority: 4,
        },
      ],
    },
    {
      title: 'الإدارة المالية',
      items: [
        {
          id: 'Treasury',
          title: 'الخزائن المالية',
          icon: 'account-balance',
          screen: 'Treasury',
          priority: 5,
        },
        {
          id: 'Fees',
          title: 'الرسوم المالية',
          icon: 'account-balance-wallet',
          screen: 'Fees',
          priority: 6,
        },
        {
          id: 'TraineePayments',
          title: 'مدفوعات المتدربين',
          icon: 'payment',
          screen: 'TraineePayments',
          priority: 7,
        },
      ],
    },
    {
      title: 'النظام',
      items: [
        {
          id: 'Logout',
          title: 'تسجيل الخروج',
          icon: 'exit-to-app',
          screen: 'Login',
          isLogout: true,
          priority: 8,
        },
      ],
    },
  ];

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
      // تسجيل الخروج مع إشعار الـ API
      await AuthService.logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else {
      navigation.navigate(item.screen);
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
              <TouchableOpacity style={styles.closeButton} onPress={hideMenu}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.menuItems}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuItemsContent}
            >
              {menuSections.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.menuSection}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.items.map((item) => (
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
                                : '#3a4a63'
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
              ))}
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
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    color: '#1a237e',
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
