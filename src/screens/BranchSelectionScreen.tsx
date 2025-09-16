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
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

interface Branch {
  id: string;
  name: string;
  nameEn: string;
  city: string;
  icon: string;
  color: string;
  apiEndpoint: string;
}

const BRANCHES: Branch[] = [
  {
    id: 'mansoura',
    name: 'فرع المنصورة',
    nameEn: 'Mansoura Branch',
    city: 'المنصورة',
    icon: 'location-city',
    color: '#1a237e',
    apiEndpoint: 'https://erpproductionbackend-production.up.railway.app',
  },
  {
    id: 'zagazig',
    name: 'فرع الزقازيق',
    nameEn: 'Zagazig Branch',
    city: 'الزقازيق',
    icon: 'business',
    color: '#059669',
    apiEndpoint: 'https://betaerpv1backend-production.up.railway.app',
  },
];

interface BranchSelectionScreenProps {
  navigation: any;
}

const BranchSelectionScreen: React.FC<BranchSelectionScreenProps> = ({ navigation }) => {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranch(branchId);
  };

  const handleContinue = async () => {
    if (!selectedBranch) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى اختيار الفرع أولاً',
        position: 'top',
      });
      return;
    }

    try {
      setLoading(true);
      
      const branch = BRANCHES.find(b => b.id === selectedBranch);
      if (!branch) return;

      // حفظ بيانات الفرع المختار
      await AsyncStorage.setItem('selected_branch', JSON.stringify({
        id: branch.id,
        name: branch.name,
        nameEn: branch.nameEn,
        city: branch.city,
        apiEndpoint: branch.apiEndpoint,
        selectedAt: new Date().toISOString(),
      }));

      Toast.show({
        type: 'success',
        text1: 'تم بنجاح',
        text2: `تم اختيار ${branch.name}`,
        position: 'top',
      });

      // الانتقال إلى شاشة تسجيل الدخول
      setTimeout(() => {
        navigation.replace('Login');
      }, 1000);

    } catch (error) {
      console.error('Error saving branch selection:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'حدث خطأ في حفظ اختيار الفرع',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.subtitle}>اختر الفرع للمتابعة</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.branchesContainer}>
          <Text style={styles.sectionTitle}>اختر الفرع</Text>
          <Text style={styles.sectionDescription}>
            حدد الفرع الذي تريد الدخول إليه للوصول إلى البيانات الخاصة به
          </Text>

          <View style={styles.branchesGrid}>
            {BRANCHES.map((branch) => (
              <TouchableOpacity
                key={branch.id}
                style={[
                  styles.branchCard,
                  selectedBranch === branch.id && styles.branchCardSelected,
                  { borderColor: branch.color }
                ]}
                onPress={() => handleBranchSelect(branch.id)}
                activeOpacity={0.8}
              >
                <View style={styles.branchContent}>
                  <View style={[styles.branchIcon, { backgroundColor: branch.color }]}>
                    <Icon name={branch.icon} size={32} color="#fff" />
                  </View>
                  
                  <View style={styles.branchInfo}>
                    <Text style={styles.branchName}>{branch.name}</Text>
                    <Text style={styles.branchNameEn}>{branch.nameEn}</Text>
                    <Text style={styles.branchCity}>{branch.city}</Text>
                  </View>

                  {selectedBranch === branch.id && (
                    <View style={styles.selectedIndicator}>
                      <Icon name="check-circle" size={24} color={branch.color} />
                    </View>
                  )}
                </View>

                <View style={[styles.branchFooter, { backgroundColor: branch.color }]}>
                  <Text style={styles.branchFooterText}>
                    {selectedBranch === branch.id ? 'تم الاختيار' : 'اضغط للاختيار'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              selectedBranch && styles.continueButtonActive,
              loading && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedBranch || loading}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              {loading ? (
                <>
                  <Text style={styles.continueButtonText}>جاري المتابعة...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.continueButtonText}>متابعة</Text>
                  <Icon name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <View style={styles.infoCard}>
            <Icon name="info" size={20} color="#1a237e" />
            <Text style={styles.infoText}>
              يمكنك تغيير الفرع في أي وقت من خلال إعدادات التطبيق
            </Text>
          </View>
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
  branchesContainer: {
    marginTop: 30,
    marginBottom: 30,
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
  branchesGrid: {
    gap: 16,
  },
  branchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  branchCardSelected: {
    borderWidth: 3,
    elevation: 6,
    shadowOpacity: 0.15,
  },
  branchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  branchIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  branchNameEn: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  branchCity: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  branchFooter: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  branchFooterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 30,
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
  continueButtonDisabled: {
    backgroundColor: '#d1d5db',
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
  footerInfo: {
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1a237e',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default BranchSelectionScreen;
