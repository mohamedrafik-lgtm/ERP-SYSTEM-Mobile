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

  const menuItems = [
    {
      id: 'Home',
      title: 'الرئيسية',
      icon: 'home',
      screen: 'Home',
    },
    {
      id: 'Programs',
      title: 'البرامج التدريبية',
      icon: 'book',
      screen: 'Programs',
    },
    {
      id: 'AddProgram',
      title: 'إضافة برنامج تدريبي',
      icon: 'add',
      screen: 'AddProgram',
    },
    {
      id: 'Students',
      title: 'قائمة الطلاب',
      icon: 'people',
      screen: 'StudentsList',
    },
    {
      id: 'TrainingContents',
      title: 'المحتوى التدريبي',
      icon: 'book',
      screen: 'TrainingContents',
    },
    {
      id: 'AddTrainingContent',
      title: 'إضافة محتوى تدريبي',
      icon: 'post-add',
      screen: 'AddTrainingContent',
    },
    {
      id: 'Treasury',
      title: 'الخزائن',
      icon: 'inventory',
      screen: 'Treasury',
    },
    {
      id: 'Fees',
      title: 'الرسوم',
      icon: 'account-balance-wallet',
      screen: 'Fees',
    },
    {
      id: 'Logout',
      title: 'تسجيل الخروج',
      icon: 'logout',
      screen: 'Login',
      isLogout: true,
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

            <View style={styles.menuItems}>
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
                        activeRouteName === item.screen
                          ? '#fff'
                          : item.isLogout
                          ? '#e53e3e'
                          : '#3a4a63'
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
            </View>

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
    width: width * 0.8,
    backgroundColor: '#1a237e',
    height: '100%',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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

export default CustomMenu;
