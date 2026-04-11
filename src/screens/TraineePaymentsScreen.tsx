import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';

type AggregatePaymentStatus = 'paid' | 'partial' | 'unpaid';

interface TraineeWithFinancialData {
  id: number;
  nameAr: string;
  nationalId: string;
  phone?: string;
  photoUrl?: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: AggregatePaymentStatus;
  paymentsCount: number;
  program?: {
    nameAr?: string;
  } | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FinancialDataResponse {
  data: TraineeWithFinancialData[];
  pagination: PaginationMeta;
}

const LIMIT_OPTIONS = [10, 20, 30, 50, 100];

const normalizeFinancialDataResponse = (raw: any, page: number, limit: number): FinancialDataResponse => {
  const emptyPagination: PaginationMeta = {
    page,
    limit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  if (Array.isArray(raw)) {
    return {
      data: raw,
      pagination: {
        ...emptyPagination,
        total: raw.length,
        totalPages: raw.length > 0 ? 1 : 0,
      },
    };
  }

  if (raw && Array.isArray(raw.data)) {
    const pagination = raw.pagination || {};
    return {
      data: raw.data,
      pagination: {
        page: Number(pagination.page) || page,
        limit: Number(pagination.limit) || limit,
        total: Number(pagination.total) || raw.data.length,
        totalPages: Number(pagination.totalPages) || (raw.data.length > 0 ? 1 : 0),
        hasNext: Boolean(pagination.hasNext),
        hasPrev: Boolean(pagination.hasPrev),
      },
    };
  }

  return {
    data: [],
    pagination: emptyPagination,
  };
};

const getStatusLabel = (status: AggregatePaymentStatus): string => {
  switch (status) {
    case 'paid':
      return 'مدفوع بالكامل';
    case 'partial':
      return 'مدفوع جزئيا';
    case 'unpaid':
      return 'غير مدفوع';
    default:
      return 'غير محدد';
  }
};

const getStatusColors = (status: AggregatePaymentStatus) => {
  switch (status) {
    case 'paid':
      return {
        text: '#166534',
        background: '#dcfce7',
      };
    case 'partial':
      return {
        text: '#92400e',
        background: '#fef3c7',
      };
    case 'unpaid':
      return {
        text: '#991b1b',
        background: '#fee2e2',
      };
    default:
      return {
        text: '#374151',
        background: '#f3f4f6',
      };
  }
};

const formatMoney = (value: number) => `${Math.round(value || 0).toLocaleString('ar-EG')} ج.م`;

const TraineePaymentsScreen = ({navigation}: any) => {
  const [trainees, setTrainees] = useState<TraineeWithFinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchFinancialData = useCallback(
    async (
      page: number,
      limit: number,
      search: string,
      showLoader: boolean = true,
    ) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        const response = await AuthService.getTraineesWithFinancialData({
          page,
          limit,
          search: search.trim() || undefined,
        });

        const normalized = normalizeFinancialDataResponse(response, page, limit);

        const normalizedRows = normalized.data.map((row: any) => ({
          ...row,
          totalAmount: Number(row.totalAmount) || 0,
          paidAmount: Number(row.paidAmount) || 0,
          remainingAmount: Number(row.remainingAmount) || 0,
          paymentsCount: Number(row.paymentsCount) || 0,
          paymentStatus: (row.paymentStatus || 'unpaid') as AggregatePaymentStatus,
        }));

        setTrainees(normalizedRows);
        setPagination(normalized.pagination);
      } catch (error) {
        console.error('Error fetching trainee financial data:', error);
        Alert.alert('خطا', 'فشل في تحميل بيانات مدفوعات المتدربين');
        setTrainees([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timerId = setTimeout(() => {
      fetchFinancialData(1, pagination.limit, searchText);
    }, 400);

    return () => clearTimeout(timerId);
  }, [searchText, pagination.limit, fetchFinancialData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFinancialData(pagination.page, pagination.limit, searchText, false);
  }, [fetchFinancialData, pagination.page, pagination.limit, searchText]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > pagination.totalPages || loading) {
        return;
      }
      fetchFinancialData(newPage, pagination.limit, searchText);
    },
    [fetchFinancialData, loading, pagination.limit, pagination.totalPages, searchText],
  );

  const handleLimitChange = useCallback(
    (newLimit: number) => {
      fetchFinancialData(1, newLimit, searchText);
    },
    [fetchFinancialData, searchText],
  );

  const summary = useMemo(() => {
    const totalDebt = trainees.reduce((sum, row) => sum + row.remainingAmount, 0);
    const debtors = trainees.filter(row => row.remainingAmount > 0).length;

    return {
      totalDebt,
      debtors,
      totalRows: pagination.total,
    };
  }, [trainees, pagination.total]);

  const openTraineePayments = (trainee: TraineeWithFinancialData) => {
    navigation.navigate('TraineePaymentDetails', {
      traineeId: trainee.id,
      traineeName: trainee.nameAr,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#1a237e" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>مدفوعات المتدربين</Text>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => fetchFinancialData(pagination.page, pagination.limit, searchText, false)}>
            <Icon name="refresh" size={22} color="#1a237e" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Icon name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="ابحث عن متدرب بالاسم أو الرقم القومي"
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                <Icon name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>ملخص المدفوعات</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>إجمالي المتدربين:</Text>
              <Text style={styles.summaryValue}>{summary.totalRows.toLocaleString('ar-EG')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>عدد المدينين:</Text>
              <Text style={styles.summaryValue}>{summary.debtors.toLocaleString('ar-EG')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>إجمالي المديونيات:</Text>
              <Text style={[styles.summaryValue, {color: '#b91c1c'}]}>{formatMoney(summary.totalDebt)}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a237e" />
              <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
            </View>
          ) : trainees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="account-balance-wallet" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>لا توجد بيانات</Text>
              <Text style={styles.emptySubtitle}>
                {searchText ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد بيانات مالية للمتدربين حاليا'}
              </Text>
            </View>
          ) : (
            <>
              {trainees.map(trainee => {
                const statusColors = getStatusColors(trainee.paymentStatus);
                const actionLabel = trainee.remainingAmount > 0 ? 'دفع' : 'عرض';

                return (
                  <View key={trainee.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{trainee.nameAr?.charAt(0) || 'م'}</Text>
                      </View>

                      <View style={styles.traineeInfo}>
                        <Text style={styles.traineeName}>{trainee.nameAr}</Text>
                        <Text style={styles.traineeMeta}>الرقم القومي: {trainee.nationalId}</Text>
                        <Text style={styles.traineeMeta}>الهاتف: {trainee.phone || 'غير متوفر'}</Text>
                        <Text style={styles.traineeMeta}>
                          البرنامج: {trainee.program?.nameAr || 'غير محدد'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.financialGrid}>
                      <View style={styles.financialCell}>
                        <Text style={styles.finLabel}>الإجمالي</Text>
                        <Text style={styles.finValue}>{formatMoney(trainee.totalAmount)}</Text>
                      </View>
                      <View style={styles.financialCell}>
                        <Text style={styles.finLabel}>المدفوع</Text>
                        <Text style={[styles.finValue, {color: '#166534'}]}>{formatMoney(trainee.paidAmount)}</Text>
                      </View>
                      <View style={styles.financialCell}>
                        <Text style={styles.finLabel}>المتبقي</Text>
                        <Text
                          style={[
                            styles.finValue,
                            {color: trainee.remainingAmount > 0 ? '#b91c1c' : '#166534'},
                          ]}>
                          {formatMoney(trainee.remainingAmount)}
                        </Text>
                      </View>
                      <View style={styles.financialCell}>
                        <Text style={styles.finLabel}>عدد الرسوم</Text>
                        <Text style={styles.finValue}>{trainee.paymentsCount.toLocaleString('ar-EG')}</Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={[styles.statusBadge, {backgroundColor: statusColors.background}]}> 
                        <Text style={[styles.statusText, {color: statusColors.text}]}> 
                          {getStatusLabel(trainee.paymentStatus)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => openTraineePayments(trainee)}
                        style={[
                          styles.actionButton,
                          {backgroundColor: trainee.remainingAmount > 0 ? '#16a34a' : '#2563eb'},
                        ]}>
                        <Icon name="payments" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>{actionLabel}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              <View style={styles.paginationCard}>
                <Text style={styles.paginationTitle}>
                  صفحة {pagination.page} من {Math.max(1, pagination.totalPages)}
                </Text>

                <View style={styles.paginationButtonsRow}>
                  <TouchableOpacity
                    disabled={!pagination.hasPrev || loading}
                    onPress={() => handlePageChange(pagination.page - 1)}
                    style={[
                      styles.paginationButton,
                      (!pagination.hasPrev || loading) && styles.paginationButtonDisabled,
                    ]}>
                    <Icon name="chevron-right" size={20} color={pagination.hasPrev ? '#1a237e' : '#94a3b8'} />
                  </TouchableOpacity>

                  <View style={styles.paginationMiddle}>
                    <Text style={styles.paginationMetaText}>
                      {(pagination.total > 0
                        ? `${(pagination.page - 1) * pagination.limit + 1} - ${Math.min(
                            pagination.page * pagination.limit,
                            pagination.total,
                          )}`
                        : '0') + ` من ${pagination.total.toLocaleString('ar-EG')}`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    disabled={!pagination.hasNext || loading}
                    onPress={() => handlePageChange(pagination.page + 1)}
                    style={[
                      styles.paginationButton,
                      (!pagination.hasNext || loading) && styles.paginationButtonDisabled,
                    ]}>
                    <Icon name="chevron-left" size={20} color={pagination.hasNext ? '#1a237e' : '#94a3b8'} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.limitLabel}>عدد العناصر في الصفحة</Text>
                <View style={styles.limitRow}>
                  {LIMIT_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => handleLimitChange(option)}
                      style={[
                        styles.limitButton,
                        pagination.limit === option && styles.limitButtonActive,
                      ]}>
                      <Text
                        style={[
                          styles.limitButtonText,
                          pagination.limit === option && styles.limitButtonTextActive,
                        ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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
    paddingTop: 36,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1a237e',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 10,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#475569',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 70,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
  },
  traineeInfo: {
    flex: 1,
  },
  traineeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  traineeMeta: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
    gap: 8,
  },
  financialCell: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
  },
  finLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  finValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  paginationCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    marginTop: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  paginationTitle: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 10,
  },
  paginationButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paginationButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },
  paginationButtonDisabled: {
    backgroundColor: '#f1f5f9',
  },
  paginationMiddle: {
    flex: 1,
    alignItems: 'center',
  },
  paginationMetaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  limitLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  limitButton: {
    minWidth: 42,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  limitButtonActive: {
    backgroundColor: '#1a237e',
  },
  limitButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  limitButtonTextActive: {
    color: '#fff',
  },
});

export default TraineePaymentsScreen;
