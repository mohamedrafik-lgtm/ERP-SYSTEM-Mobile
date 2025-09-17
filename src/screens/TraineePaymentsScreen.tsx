import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import { TraineePaymentResponse, PaymentStatus } from '../types/student';

const TraineePaymentsScreen = ({ navigation }: any) => {
  const [payments, setPayments] = useState<TraineePaymentResponse[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // دالة لجلب البيانات
  const loadPayments = useCallback(async () => {
    try {
      console.log('📡 loadPayments called with params:', { searchText, filterStatus });

      const data = await AuthService.getTraineePayments({
        search: searchText || undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
      });

      console.log('📦 Received data:', data);
      console.log('📊 Data type:', typeof data, 'Is array:', Array.isArray(data));

      if (Array.isArray(data)) {
        console.log('✅ Setting payments array with length:', data.length);
        setPayments(data);
        setTotalItems(data.length);
        console.log('✅ setPayments called with array of length:', data.length);
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        console.log('✅ Setting payments from data.data with length:', data.data.length);
        setPayments(data.data);
        setTotalItems(data.data.length);
        console.log('✅ setPayments called with data.data of length:', data.data.length);
      } else {
        console.warn('❌ Invalid data format:', data);
        setPayments([]);
        setTotalItems(0);
        console.log('✅ setPayments called with empty array');
      }

    } catch (error) {
      console.error('💥 Error loading payments:', error);
      Alert.alert('خطأ', 'فشل في تحميل المدفوعات');
      setPayments([]);
    }
  }, [searchText, filterStatus]);

  // التحميل الأولي
  useEffect(() => {
    console.log('🚀 Initial load useEffect triggered');
    loadPayments();
  }, []);

  // البحث والفلتر مع debounce
  useEffect(() => {
    console.log('🔍 Search/Filter useEffect triggered with:', { searchText, filterStatus });

    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout executed - calling loadPayments');
      loadPayments();
    }, 500);

    return () => {
      console.log('🧹 Cleanup timeout');
      clearTimeout(timeoutId);
    };
  }, [searchText, filterStatus, loadPayments]);

  // تتبع تغييرات payments state (reduced logging)
  useEffect(() => {
    console.log('🔄 Payments state updated - Length:', payments.length);
  }, [payments]);

  // دالة التحديث
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  }, [loadPayments]);

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
  const filteredPayments = payments || [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredPayments.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = useCallback((page: number) => {
    console.log('🔄 Going to page:', page, 'Total pages:', totalPages);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    console.log('➡️ Next page - Current:', currentPage, 'Total:', totalPages);
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    console.log('⬅️ Previous page - Current:', currentPage);
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Change items per page
  const changeItemsPerPage = useCallback((newItemsPerPage: number) => {
    console.log('📊 Changing items per page to:', newItemsPerPage);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterStatus]);

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

  // Render info (reduced logging for performance)
  console.log('🎨 Render - Payments:', payments.length, 'Filtered:', filteredPayments.length);
  console.log('🎨 Pagination - Current page:', currentPage, 'Total pages:', totalPages, 'Items per page:', itemsPerPage);
  console.log('🎨 Current page data length:', currentPageData.length);

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
              onChangeText={(text) => {
                console.log('Search text changed to:', text);
                setSearchText(text);
              }}
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
                onPress={() => {
                  console.log('Filter status changed to:', status);
                  setFilterStatus(status);
                }}
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
          {/* Stats and Controls */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>📊 إحصائيات المدفوعات</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>إجمالي المدفوعات:</Text>
              <Text style={styles.statsValue}>{filteredPayments.length.toLocaleString()}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>الصفحة الحالية:</Text>
              <Text style={styles.statsValue}>{currentPage} من {totalPages}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>المعروضة:</Text>
              <Text style={styles.statsValue}>
                {startIndex + 1} - {Math.min(endIndex, filteredPayments.length)} من {filteredPayments.length}
              </Text>
            </View>
            {searchText && (
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>البحث:</Text>
                <Text style={styles.statsValue}>"{searchText}"</Text>
              </View>
            )}
            {filterStatus !== 'ALL' && (
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>الفلتر:</Text>
                <Text style={styles.statsValue}>{getStatusLabel(filterStatus as PaymentStatus)}</Text>
              </View>
            )}

            {/* Items per page selector */}
            <View style={styles.itemsPerPageContainer}>
              <Text style={styles.itemsPerPageLabel}>عدد العناصر في الصفحة:</Text>
              <View style={styles.itemsPerPageButtons}>
                {[10, 20, 50, 100].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.itemsPerPageButton,
                      itemsPerPage === count && styles.itemsPerPageButtonActive
                    ]}
                    onPress={() => changeItemsPerPage(count)}
                  >
                    <Text style={[
                      styles.itemsPerPageButtonText,
                      itemsPerPage === count && styles.itemsPerPageButtonTextActive
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

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
            <>
              {/* Payment Cards */}
              {currentPageData.map(renderPaymentCard)}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <View style={styles.paginationInfo}>
                    <Text style={styles.paginationText}>
                      صفحة {currentPage} من {totalPages}
                    </Text>
                    <Text style={styles.paginationSubtext}>
                      ({startIndex + 1}-{Math.min(endIndex, filteredPayments.length)} من {filteredPayments.length})
                    </Text>
                  </View>

                  <View style={styles.paginationButtons}>
                    {/* First Page */}
                    <TouchableOpacity
                      style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                      onPress={() => {
                        console.log('🔄 First page button pressed');
                        goToPage(1);
                      }}
                      disabled={currentPage === 1}
                    >
                      <Icon name="first-page" size={20} color={currentPage === 1 ? '#9ca3af' : '#1a237e'} />
                    </TouchableOpacity>

                    {/* Previous Page */}
                    <TouchableOpacity
                      style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                      onPress={() => {
                        console.log('⬅️ Previous page button pressed');
                        goToPrevPage();
                      }}
                      disabled={currentPage === 1}
                    >
                      <Icon name="chevron-right" size={20} color={currentPage === 1 ? '#9ca3af' : '#1a237e'} />
                    </TouchableOpacity>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <TouchableOpacity
                          key={pageNum}
                          style={[
                            styles.paginationButton,
                            styles.paginationNumberButton,
                            currentPage === pageNum && styles.paginationButtonActive
                          ]}
                          onPress={() => {
                            console.log('🔢 Page number button pressed:', pageNum);
                            goToPage(pageNum);
                          }}
                        >
                          <Text style={[
                            styles.paginationButtonText,
                            currentPage === pageNum && styles.paginationButtonTextActive
                          ]}>
                            {pageNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Next Page */}
                    <TouchableOpacity
                      style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                      onPress={() => {
                        console.log('➡️ Next page button pressed');
                        goToNextPage();
                      }}
                      disabled={currentPage === totalPages}
                    >
                      <Icon name="chevron-left" size={20} color={currentPage === totalPages ? '#9ca3af' : '#1a237e'} />
                    </TouchableOpacity>

                    {/* Last Page */}
                    <TouchableOpacity
                      style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                      onPress={() => {
                        console.log('🔄 Last page button pressed');
                        goToPage(totalPages);
                      }}
                      disabled={currentPage === totalPages}
                    >
                      <Icon name="last-page" size={20} color={currentPage === totalPages ? '#9ca3af' : '#1a237e'} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
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
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  loadMoreContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  loadMoreText: {
    fontSize: 16,
    color: '#1a237e',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadMoreHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Pagination Styles
  paginationContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paginationInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  paginationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 4,
  },
  paginationSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paginationNumberButton: {
    minWidth: 40,
  },
  paginationButtonActive: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  paginationButtonDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  paginationButtonTextActive: {
    color: '#fff',
  },
  // Items per page styles
  itemsPerPageContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  itemsPerPageLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  itemsPerPageButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  itemsPerPageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 50,
    alignItems: 'center',
  },
  itemsPerPageButtonActive: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  itemsPerPageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  itemsPerPageButtonTextActive: {
    color: '#fff',
  },
});

export default TraineePaymentsScreen;
