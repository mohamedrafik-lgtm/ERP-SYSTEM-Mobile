import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export type LoginType = 'admin' | 'instructor';

const LOGIN_TYPE_KEY = 'login_type';

interface LoginTypeOption {
  id: LoginType;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
}

const LOGIN_TYPES: LoginTypeOption[] = [
  {
    id: 'admin',
    title: 'موظف إداري',
    subtitle: 'Administrative Staff',
    description: 'الدخول كموظف إداري للوصول إلى لوحة التحكم الكاملة وإدارة النظام',
    icon: 'admin-panel-settings',
    color: '#1a237e',
  },
  {
    id: 'instructor',
    title: 'محاضر',
    subtitle: 'Instructor',
    description: 'الدخول كمحاضر للوصول إلى المحتوى التدريبي والحضور والغياب',
    icon: 'school',
    color: '#6366f1',
  },
];

/** حفظ نوع تسجيل الدخول */
export const saveLoginType = async (type: LoginType) => {
  await AsyncStorage.setItem(LOGIN_TYPE_KEY, type);
};

/** جلب نوع تسجيل الدخول المحفوظ */
export const getLoginType = async (): Promise<LoginType | null> => {
  const type = await AsyncStorage.getItem(LOGIN_TYPE_KEY);
  return (type as LoginType) || null;
};

/** التحقق من وجود نوع تسجيل دخول محفوظ */
export const hasLoginType = async (): Promise<boolean> => {
  const type = await AsyncStorage.getItem(LOGIN_TYPE_KEY);
  return !!type;
};

interface LoginTypeSelectionScreenProps {
  navigation: any;
}

const LoginTypeSelectionScreen: React.FC<LoginTypeSelectionScreenProps> = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState<LoginType | null>(null);

  const handleContinue = async () => {
    if (!selectedType) return;

    await saveLoginType(selectedType);
    navigation.replace('BranchSelection');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../img/502585454_122235753458244801_413190920156398012_n-removebg-preview.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.welcomeTitle}>مرحباً بك في</Text>
        <Text style={styles.appTitle}>نظام إدارة مركز طيبة للتدريب</Text>
        <Text style={styles.subtitle}>اختر نوع الحساب للمتابعة</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>نوع تسجيل الدخول</Text>
          <Text style={styles.sectionDescription}>
            حدد صفتك للدخول إلى النظام
          </Text>

          <View style={styles.optionsGrid}>
            {LOGIN_TYPES.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedType === option.id && [
                    styles.optionCardSelected,
                    { borderColor: option.color },
                  ],
                ]}
                onPress={() => setSelectedType(option.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: option.color }]}>
                  <Icon name={option.icon} size={48} color="#fff" />
                </View>

                <Text style={[styles.optionTitle, { color: option.color }]}>
                  {option.title}
                </Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>

                {selectedType === option.id && (
                  <View style={[styles.selectedBadge, { backgroundColor: option.color }]}>
                    <Icon name="check" size={16} color="#fff" />
                    <Text style={styles.selectedBadgeText}>تم الاختيار</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              selectedType && styles.continueButtonActive,
            ]}
            onPress={handleContinue}
            disabled={!selectedType}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.continueButtonText}>متابعة</Text>
              <Icon name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  header: {
    backgroundColor: '#1a237e',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    padding: 10,
  },
  welcomeTitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#e8eaf6',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  optionsGrid: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionCardSelected: {
    borderWidth: 3,
    elevation: 6,
    shadowOpacity: 0.15,
  },
  optionIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 10,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  continueButton: {
    backgroundColor: '#9ca3af',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  continueButtonActive: {
    backgroundColor: '#1a237e',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default LoginTypeSelectionScreen;
