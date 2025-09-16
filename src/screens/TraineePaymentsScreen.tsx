import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import { TraineePaymentResponse, PaymentStatus, FeeType, SafeCategory } from '../types/student';

const TraineePaymentsScreen = ({ navigation }: any) => {
  console.log('=== TraineePaymentsScreen Component Initialized ===');
  const [payments, setPayments] = useState<TraineePaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  console.log('Initial state - loading:', true, 'payments:', []);
  
  // إضافة useEffect للتأكد من أن الـ component تم mount
  useEffect(() => {
    console.log('=== COMPONENT MOUNTED ===');
    return () => {
      console.log('=== COMPONENT UNMOUNTED ===');
    };
  }, []);

  useEffect(() => {
    console.log('=== INITIAL useEffect ===');
    console.log('Initial useEffect triggered - fetching payments');
    fetchPayments();
    console.log('=== END INITIAL useEffect ===');
  }, []);

  // إعادة تحميل البيانات عند تغيير البحث أو الفلتر
  useEffect(() => {
    console.log('=== SEARCH/FILTER useEffect ===');
    console.log('useEffect triggered for search/filter change', { searchText, filterStatus });
    
    // لا نعيد تحميل البيانات في المرة الأولى (عندما تكون القيم الافتراضية)
    if (searchText === '' && filterStatus === 'ALL') {
      console.log('Skipping search/filter effect - initial values');
      console.log('=== END SEARCH/FILTER useEffect (skipped) ===');
      return;
    }
    
    console.log('Fetching payments due to search/filter change');
    const timeoutId = setTimeout(() => {
      fetchPayments(false); // عدم إظهار loading عند البحث
    }, 500); // تأخير 500ms لتجنب الطلبات المتكررة

    console.log('=== END SEARCH/FILTER useEffect ===');
    return () => clearTimeout(timeoutId);
  }, [searchText, filterStatus]);

  const fetchPayments = async (showLoading = true) => {
    console.log('fetchPayments called with showLoading:', showLoading);
    try {
      if (showLoading) {
        console.log('Setting loading to true');
        setLoading(true);
        console.log('Loading state should be true now');
        
        // إضافة callback للتأكد من أن الـ state تم تحديثه
        setLoading((prevLoading) => {
          console.log('setLoading(true) callback - prevLoading:', prevLoading);
          return true;
        });
      }
      console.log('Fetching trainee payments...');
      
      const data = await AuthService.getTraineePayments({
        search: searchText || undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
      });
      
      console.log('=== Screen Response Processing ===');
      console.log('Fetched payments:', data);
      console.log('Data type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      // التأكد من أن البيانات عبارة عن array
      if (Array.isArray(data)) {
        console.log('Setting payments array with length:', data.length);
        setPayments(data);
        console.log('Payments array set successfully');
      } else if (data && data.data && Array.isArray(data.data)) {
        // في حالة إن البيانات جاية في wrapper object
        console.log('Setting payments from data.data with length:', data.data.length);
        setPayments(data.data);
        console.log('Payments from data.data set successfully');
      } else {
        console.warn('Received non-array data:', data);
        setPayments([]);
        console.log('Empty payments array set due to invalid data');
      }
      
      console.log('Payments set successfully, loading will be set to false');
      console.log('=== End Screen Response Processing ===');
      
      // إضافة timeout للتأكد من أن الـ state تم تحديثه
      setTimeout(() => {
        console.log('After setting payments - loading should be false soon');
        console.log('Current loading state after setting payments:', loading);
        console.log('Payments length after setting payments:', payments.length);
      }, 50);
    } catch (error) {
      console.error('=== ERROR in fetchPayments ===');
      console.error('Error fetching payments:', error);
      Alert.alert('خطأ', 'فشل في تحميل المدفوعات');
      
      // Fallback to empty array on error
      setPayments([]);
      console.log('Empty payments array set due to error');
      console.log('=== END ERROR in fetchPayments ===');
    } finally {
      // تأكد من إيقاف الـ loading في جميع الحالات
      console.log('Finally block - setting loading to false');
      setLoading(false);
      console.log('Loading set to false');
      
      // إضافة callback للتأكد من أن الـ state تم تحديثه
      setLoading((prevLoading) => {
        console.log('setLoading(false) callback - prevLoading:', prevLoading);
        return false;
      });
      
      // إضافة timeout للتأكد من أن الـ state تم تحديثه
      setTimeout(() => {
        console.log('After timeout - loading should be false now');
        console.log('Current loading state after timeout:', loading);
        console.log('Payments length after timeout:', payments.length);
      }, 100);
    }
  };

  const onRefresh = async () => {
    console.log('=== onRefresh triggered ===');
    setRefreshing(true);
    await fetchPayments(false); // عدم إظهار loading عند الـ refresh
    setRefreshing(false);
    console.log('=== onRefresh completed ===');
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
      case 'PARTIALLY_PAID':
        return '#3b82f6';
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return 'مدفوع';
      case 'PENDING':
        return 'معلق';
      case 'PARTIALLY_PAID':
        return 'مدفوع جزئياً';
      case 'CANCELLED':
        return 'ملغي';
      default:
        return 'غير محدد';
    }
  };

  // البيانات مفلترة بالفعل من الـ API
  const filteredPayments = payments;

  const renderPaymentCard = (payment: TraineePaymentResponse) => (
    <View key={payment.id} style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.traineeInfo}>
          <Text style={styles.traineeName}>{payment.trainee.nameAr}</Text>
          <Text style={styles.traineeNationalId}>
            الرقم القومي: {payment.trainee.nationalId}
          </Text>
          <Text style={styles.traineePhone}>
            الهاتف: {payment.trainee.phone}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
            {getStatusLabel(payment.status)}
          </Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>المبلغ المطلوب:</Text>
          <Text style={styles.amountValue}>{payment.amount.toLocaleString()} ج.م</Text>
        </View>
        
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>المبلغ المدفوع:</Text>
          <Text style={[styles.amountValue, { color: getStatusColor(payment.status) }]}>
            {payment.paidAmount.toLocaleString()} ج.م
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>المتبقي:</Text>
          <Text style={[styles.amountValue, { color: payment.amount - payment.paidAmount > 0 ? '#ef4444' : '#10b981' }]}>
            {(payment.amount - payment.paidAmount).toLocaleString()} ج.م
          </Text>
        </View>

        <View style={styles.feeInfoContainer}>
          <Text style={styles.feeInfoLabel}>تفاصيل الرسوم:</Text>
          <Text style={styles.feeInfoText}>الاسم: {payment.fee.name}</Text>
          <Text style={styles.feeInfoText}>النوع: {payment.fee.type}</Text>
          <Text style={styles.feeInfoText}>العام الدراسي: {payment.fee.academicYear}</Text>
        </View>

        <View style={styles.safeInfoContainer}>
          <Text style={styles.safeInfoLabel}>الخزينة:</Text>
          <Text style={styles.safeInfoText}>{payment.safe.name}</Text>
          <Text style={styles.safeInfoText}>الرصيد: {payment.safe.balance.toLocaleString()} {payment.safe.currency}</Text>
        </View>

        {payment.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>ملاحظات:</Text>
            <Text style={styles.notesText}>{payment.notes}</Text>
          </View>
        )}

        {payment.paidAt && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>تاريخ الدفع:</Text>
            <Text style={styles.dateText}>
              {new Date(payment.paidAt).toLocaleDateString('ar-EG')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="edit" size={16} color="#1a237e" />
          <Text style={styles.actionButtonText}>تعديل</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.paymentButton}
          onPress={() => navigation.navigate('TraineePaymentDetails', { 
            traineeId: payment.trainee.id,
            traineeName: payment.trainee.nameAr,
            paymentId: payment.id 
          })}
        >
          <Icon name="payment" size={16} color="#059669" />
          <Text style={styles.paymentButtonText}>دفع</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton}>
          <Icon name="delete" size={16} color="#dc2626" />
          <Text style={styles.deleteButtonText}>حذف</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  console.log('=== RENDER ===');
  console.log('Current loading state:', loading);
  console.log('Current payments length:', payments.length);
  console.log('Current refreshing state:', refreshing);
  console.log('Search text:', searchText);
  console.log('Filter status:', filterStatus);
  console.log('Payments data:', payments);
  console.log('=== END RENDER ===');

  if (loading) {
    console.log('Showing loading screen');
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل المدفوعات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مدفوعات المتدربين</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="البحث بالاسم أو الرقم القومي..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'CANCELLED'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.activeFilterButton,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.activeFilterButtonText,
                ]}
              >
                {status === 'ALL' ? 'الكل' : getStatusLabel(status as PaymentStatus)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredPayments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="receipt" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا توجد مدفوعات</Text>
            <Text style={styles.emptySubtitle}>
              {searchText || filterStatus !== 'ALL'
                ? 'لا توجد مدفوعات تطابق البحث'
                : 'لم يتم إضافة أي مدفوعات بعد'}
            </Text>
          </View>
        ) : (
          filteredPayments.map(renderPaymentCard)
        )}
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 60, // إضافة padding إضافي للجزء العلوي
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 30, // زيادة padding العلوي للهيدر أكثر
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10, // إضافة margin سفلي للهيدر
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 22, // زيادة حجم الخط
    fontWeight: 'bold',
    color: '#1a237e',
    flex: 1,
    textAlign: 'center',
    marginTop: 5, // إضافة margin علوي
    letterSpacing: 0.5, // تحسين المسافات بين الحروف
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 25, // زيادة padding العلوي للبحث
    backgroundColor: '#fff',
    marginBottom: 5, // إضافة margin سفلي
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 15, // زيادة نصف قطر الحدود
    paddingHorizontal: 18, // زيادة padding
    paddingVertical: 5, // إضافة padding عمودي
    borderWidth: 1.5, // زيادة سمك الحدود
    borderColor: '#d1d5db', // تحسين لون الحدود
    elevation: 1, // إضافة ظل خفيف
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingVertical: 12,
  },
  filtersContainer: {
    paddingVertical: 20,
    paddingTop: 25, // زيادة padding العلوي للفلاتر
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 10, // إضافة margin سفلي
  },
  filterButton: {
    paddingHorizontal: 22, // زيادة padding
    paddingVertical: 12, // زيادة padding
    marginHorizontal: 8, // زيادة المسافة
    borderRadius: 25, // زيادة نصف قطر الحدود
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5, // زيادة سمك الحدود
    borderColor: '#e5e7eb',
    elevation: 1, // إضافة ظل خفيف
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activeFilterButton: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  filterButtonText: {
    fontSize: 15, // زيادة حجم الخط
    fontWeight: '600', // زيادة سماكة الخط
    color: '#6b7280',
    letterSpacing: 0.3, // تحسين المسافات بين الحروف
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 25, // زيادة padding العلوي للمحتوى
    paddingBottom: 20, // إضافة padding سفلي
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20, // زيادة المسافة بين البطاقات
    elevation: 3, // زيادة الظل
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9', // إضافة حدود خفيفة
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  traineeInfo: {
    flex: 1,
  },
  traineeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  traineeNationalId: {
    fontSize: 14,
    color: '#6b7280',
  },
  traineePhone: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  feeInfoContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  feeInfoLabel: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
    marginBottom: 6,
  },
  feeInfoText: {
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 2,
  },
  safeInfoContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  safeInfoLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 6,
  },
  safeInfoText: {
    fontSize: 13,
    color: '#059669',
    marginBottom: 2,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
  },
  dateContainer: {
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    color: '#374151',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#1a237e',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
  },
  paymentButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#dc2626',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default TraineePaymentsScreen;
