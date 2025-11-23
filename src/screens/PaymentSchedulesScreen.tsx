import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';

interface Program {
  id: number;
  nameAr: string;
  nameEn: string;
  price: number;
  description: string;
  _count: {
    trainees: number;
  };
}

interface PaymentSchedulesScreenProps {
  navigation: any;
}

const PaymentSchedulesScreen = ({ navigation }: PaymentSchedulesScreenProps) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      
      const token = await AuthService.getToken();
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'خطأ في المصادقة',
          text2: 'يرجى تسجيل الدخول مرة أخرى',
        });
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const baseUrl = await AuthService.getCurrentApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/programs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          await AuthService.clearAuthData();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Program[] = await response.json();
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      
      Toast.show({
        type: 'error',
        text1: 'خطأ في الاتصال',
        text2: 'تعذر تحميل البرامج التدريبية',
      });
      
      setPrograms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPrograms();
  };

  const handleProgramSelect = (program: Program) => {
    navigation.navigate('PaymentScheduleDetails', { program });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="PaymentSchedules" />
        <View style={styles.headerCenter}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>مواعيد السداد</Text>
            <Text style={styles.headerSubtitle}>
              إدارة مواعيد سداد الرسوم والإجراءات عند عدم السداد
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.calendarButton}>
          <Icon name="event" size={24} color="#7c3aed" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* القسم العلوي */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>اختر البرنامج التدريبي</Text>
        </View>

        {/* قائمة البرامج */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل البرامج...</Text>
          </View>
        ) : programs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="school" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا توجد برامج تدريبية</Text>
            <Text style={styles.emptySubtitle}>
              لم يتم العثور على أي برامج تدريبية أو تعذر الاتصال بالخادم
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchPrograms}
            >
              <Icon name="refresh" size={20} color="#1a237e" />
              <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.programsGrid}>
            {programs.map((program) => (
              <TouchableOpacity
                key={program.id}
                style={styles.programCard}
                onPress={() => handleProgramSelect(program)}
                activeOpacity={0.7}
              >
                <View style={styles.programIcon}>
                  <Icon name="school" size={32} color="#7c3aed" />
                </View>
                
                <View style={styles.programInfo}>
                  <Text style={styles.programNameAr} numberOfLines={2}>
                    {program.nameAr}
                  </Text>
                  <Text style={styles.programNameEn} numberOfLines={1}>
                    {program.nameEn}
                  </Text>
                </View>
                
                <View style={styles.programFooter}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>السعر:</Text>
                    <Text style={styles.priceValue}>{formatPrice(program.price)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  calendarButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'right',
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  retryButtonText: {
    color: '#1a237e',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  programsGrid: {
    gap: 16,
  },
  programCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    elevation: 3,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#e9d5ff',
    marginBottom: 16,
  },
  programIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ddd6fe',
  },
  programInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  programNameAr: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
  },
  programNameEn: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  programFooter: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceContainer: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
});

export default PaymentSchedulesScreen;