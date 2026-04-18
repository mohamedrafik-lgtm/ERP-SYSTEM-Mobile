import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import { FinancialDashboardResponse } from '../types/financialReports';

const { width } = Dimensions.get('window');

interface FinancialReportsScreenProps {
  navigation: any;
}

const TRANSACTION_TYPE_MAP: Record<string, string> = {
  DEPOSIT: 'إيداع',
  WITHDRAW: 'سحب',
  TRANSFER: 'تحويل',
  FEE: 'رسوم',
  PAYMENT: 'دفع',
};

const FinancialReportsScreen = ({ navigation }: FinancialReportsScreenProps) => {
  const [dashboardData, setDashboardData] = useState<FinancialDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const hasDateFilter = !!dateFrom || !!dateTo;

  const fetchDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const params: { dateFrom?: string; dateTo?: string } = {};
      if (dateFrom) params.dateFrom = dateFrom.toISOString().split('T')[0];
      if (dateTo) params.dateTo = dateTo.toISOString().split('T')[0];

      const data = await AuthService.getFinancialDashboard(params);
      setDashboardData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل التقارير المالية';

      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('authentication expired')) {
        Alert.alert('انتهت الجلسة', 'يرجى تسجيل الدخول مرة أخرى');
        await AuthService.clearAuthData();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      Alert.alert('خطأ', errorMessage);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData(false);
  };

  const handleDateSelect = (type: 'from' | 'to') => {
    setTempDate(type === 'from' && dateFrom ? dateFrom : type === 'to' && dateTo ? dateTo : new Date());
    setShowDatePicker(type);
  };

  const handleDateConfirm = () => {
    if (showDatePicker === 'from') {
      setDateFrom(tempDate);
    } else if (showDatePicker === 'to') {
      setDateTo(tempDate);
    }
    setShowDatePicker(null);
  };

  const handleResetFilter = () => {
    setDateFrom(null);
    setDateTo(null);
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return 'اختر التاريخ';
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const changeDateValue = (field: 'day' | 'month' | 'year', delta: number) => {
    const newDate = new Date(tempDate);
    if (field === 'day') {
      newDate.setDate(newDate.getDate() + delta);
    } else if (field === 'month') {
      newDate.setMonth(newDate.getMonth() + delta);
    } else if (field === 'year') {
      newDate.setFullYear(newDate.getFullYear() + delta);
    }
    setTempDate(newDate);
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'arrow-upward';
      case 'PAYMENT':
        return 'payments';
      case 'WITHDRAW':
        return 'arrow-downward';
      case 'TRANSFER':
        return 'swap-horiz';
      case 'FEE':
        return 'receipt';
      default:
        return 'attach-money';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return '#059669';
      case 'PAYMENT':
        return '#2563eb';
      case 'WITHDRAW':
      case 'FEE':
        return '#dc2626';
      case 'TRANSFER':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const topIncomeByTarget = useMemo(() => {
    return (dashboardData?.incomeByTarget || []).slice(0, 5);
  }, [dashboardData]);

  const renderSummaryCard = (
    title: string,
    value: number,
    icon: string,
    color: string,
    subtitle: string,
  ) => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <View style={[styles.summaryIconWrap, { backgroundColor: `${color}1A` }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
      </View>

      <Text style={[styles.summaryValue, { color }]}>{formatCurrency(value)}</Text>

      <View style={[styles.summaryBadge, { backgroundColor: `${color}12` }]}>
        <Text style={[styles.summaryBadgeText, { color }]}>{subtitle}</Text>
      </View>
    </View>
  );

  const renderIncomeByTargetCard = (
    item: FinancialDashboardResponse['incomeByTarget'][0],
    index: number,
  ) => {
    const totalIncome = dashboardData?.summary.totalIncome || 0;
    const percent = totalIncome > 0 ? (item.income / totalIncome) * 100 : 0;

    const rankColors = ['#f59e0b', '#94a3b8', '#fb923c', '#60a5fa', '#cbd5e1'];
    const rankColor = rankColors[index] || rankColors[4];

    return (
      <View key={item.safeId} style={styles.safeRankCard}>
        <View style={[styles.safeRankNumber, { backgroundColor: rankColor }]}>
          <Text style={styles.safeRankNumberText}>{index + 1}</Text>
        </View>

        <View style={styles.safeRankInfo}>
          <Text style={styles.safeRankName} numberOfLines={1}>{item.safeName}</Text>
          <Text style={styles.safeRankTransactions}>{item.transactionsCount} معاملة</Text>
        </View>

        <View style={styles.safeRankAmountBox}>
          <Text style={styles.safeRankAmount}>{formatCurrency(item.income)}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(percent, 100)}%` }]} />
          </View>
        </View>
      </View>
    );
  };

  const renderTransactionCard = (transaction: FinancialDashboardResponse['recentTransactions'][0]) => {
    const typeLabel = TRANSACTION_TYPE_MAP[transaction.type] || transaction.type;
    const isPositive = transaction.type === 'DEPOSIT' || transaction.type === 'PAYMENT';
    const amountColor = isPositive ? '#059669' : '#dc2626';

    return (
      <View key={transaction.id} style={styles.transactionCard}>
        <View style={styles.transactionTopRow}>
          <View style={[styles.transactionTypeIconWrap, { backgroundColor: `${getTransactionTypeColor(transaction.type)}1A` }]}>
            <Icon name={getTransactionTypeIcon(transaction.type)} size={18} color={getTransactionTypeColor(transaction.type)} />
          </View>

          <View style={styles.transactionInfoWrap}>
            <View style={styles.transactionRowBetween}>
              <Text style={styles.transactionTypeText}>{typeLabel}</Text>
              <Text style={[styles.transactionAmount, { color: amountColor }]}>
                {`${isPositive ? '+' : '-'}${formatCurrency(transaction.amount)}`}
              </Text>
            </View>

            <Text style={styles.transactionDescription} numberOfLines={2}>
              {transaction.description}
            </Text>

            <View style={styles.transactionTagsRow}>
              {transaction.targetSafe ? (
                <View style={[styles.tagChip, styles.tagChipBlue]}>
                  <Text style={[styles.tagChipText, styles.tagChipTextBlue]}>{transaction.targetSafe}</Text>
                </View>
              ) : null}

              {transaction.traineeName ? (
                <View style={[styles.tagChip, styles.tagChipGreen]}>
                  <Text style={[styles.tagChipText, styles.tagChipTextGreen]}>{transaction.traineeName}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="FinancialReports" />

        <View style={styles.headerCenter}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#1a237e" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>التقارير المالية</Text>
            <Text style={styles.headerSubtitle}>تحليل شامل للمعاملات والأداء المالي</Text>
          </View>
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1a237e']}
            tintColor="#1a237e"
          />
        }
      >
        <View style={styles.filterSection}>
          <View style={styles.filterTitleRow}>
            <View style={styles.filterIconWrap}>
              <Icon name="date-range" size={16} color="#2563eb" />
            </View>
            <Text style={styles.filterTitle}>فلترة حسب التاريخ</Text>
          </View>

          <View style={styles.dateInputContainer}>
            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateLabel}>من تاريخ</Text>
              <TouchableOpacity style={styles.datePickerButton} onPress={() => handleDateSelect('from')}>
                <Icon name="calendar-today" size={16} color="#1a237e" />
                <Text style={[styles.datePickerText, !dateFrom && styles.datePickerPlaceholder]}>
                  {formatDisplayDate(dateFrom)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateLabel}>إلى تاريخ</Text>
              <TouchableOpacity style={styles.datePickerButton} onPress={() => handleDateSelect('to')}>
                <Icon name="calendar-today" size={16} color="#1a237e" />
                <Text style={[styles.datePickerText, !dateTo && styles.datePickerPlaceholder]}>
                  {formatDisplayDate(dateTo)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.resetButton} onPress={handleResetFilter}>
              <Icon name="clear" size={16} color="#dc2626" />
              <Text style={styles.resetButtonText}>مسح الفلاتر</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.refreshButton} onPress={() => fetchDashboardData(false)}>
              <Icon name="refresh" size={16} color="#fff" />
              <Text style={styles.refreshButtonText}>تحديث البيانات</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={showDatePicker !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {showDatePicker === 'from' ? 'اختر تاريخ البداية' : 'اختر تاريخ النهاية'}
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                  <Icon name="close" size={22} color="#1a237e" />
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>السنة</Text>
                  <TouchableOpacity style={styles.datePickerArrow} onPress={() => changeDateValue('year', 1)}>
                    <Icon name="keyboard-arrow-up" size={24} color="#1a237e" />
                  </TouchableOpacity>
                  <Text style={styles.datePickerValue}>{tempDate.getFullYear()}</Text>
                  <TouchableOpacity style={styles.datePickerArrow} onPress={() => changeDateValue('year', -1)}>
                    <Icon name="keyboard-arrow-down" size={24} color="#1a237e" />
                  </TouchableOpacity>
                </View>

                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>الشهر</Text>
                  <TouchableOpacity style={styles.datePickerArrow} onPress={() => changeDateValue('month', 1)}>
                    <Icon name="keyboard-arrow-up" size={24} color="#1a237e" />
                  </TouchableOpacity>
                  <Text style={styles.datePickerValue}>{tempDate.getMonth() + 1}</Text>
                  <TouchableOpacity style={styles.datePickerArrow} onPress={() => changeDateValue('month', -1)}>
                    <Icon name="keyboard-arrow-down" size={24} color="#1a237e" />
                  </TouchableOpacity>
                </View>

                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>اليوم</Text>
                  <TouchableOpacity style={styles.datePickerArrow} onPress={() => changeDateValue('day', 1)}>
                    <Icon name="keyboard-arrow-up" size={24} color="#1a237e" />
                  </TouchableOpacity>
                  <Text style={styles.datePickerValue}>{tempDate.getDate()}</Text>
                  <TouchableOpacity style={styles.datePickerArrow} onPress={() => changeDateValue('day', -1)}>
                    <Icon name="keyboard-arrow-down" size={24} color="#1a237e" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowDatePicker(null)}>
                  <Text style={styles.modalCancelText}>إلغاء</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalConfirmButton} onPress={handleDateConfirm}>
                  <Text style={styles.modalConfirmText}>تأكيد</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل التقارير المالية...</Text>
          </View>
        ) : !dashboardData ? (
          <View style={styles.emptyState}>
            <Icon name="assessment" size={60} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>لا توجد بيانات متاحة</Text>
            <Text style={styles.emptySubtitle}>حاول تغيير الفلاتر أو التحديث</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryGrid}>
              {renderSummaryCard(
                `إجمالي الدخل ${hasDateFilter ? 'للفترة المحددة' : 'اليوم'}`,
                dashboardData.summary.totalIncome,
                'trending-up',
                '#059669',
                `${dashboardData.summary.incomeTransactions} معاملة دخل`,
              )}

              {renderSummaryCard(
                `إجمالي المصروفات ${hasDateFilter ? 'للفترة المحددة' : 'اليوم'}`,
                dashboardData.summary.totalExpenses || 0,
                'trending-down',
                '#dc2626',
                `${dashboardData.summary.expenseTransactions} معاملة مصروفات`,
              )}

              {renderSummaryCard(
                'صافي الدخل',
                dashboardData.summary.netIncome,
                dashboardData.summary.netIncome >= 0 ? 'arrow-upward' : 'arrow-downward',
                dashboardData.summary.netIncome >= 0 ? '#2563eb' : '#f59e0b',
                dashboardData.summary.netIncome >= 0 ? 'ربح صافي' : 'خسارة صافية',
              )}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <View style={styles.sectionHeadIconWrap}>
                  <Icon name="emoji-events" size={16} color="#4f46e5" />
                </View>
                <View>
                  <Text style={styles.sectionHeadTitle}>دفع الرسوم حسب الخزائن</Text>
                  <Text style={styles.sectionHeadSubTitle}>ترتيب الخزائن حسب إجمالي الدخل</Text>
                </View>
              </View>

              <View style={styles.sectionBody}>
                {topIncomeByTarget.length === 0 ? (
                  <View style={styles.innerEmptyState}>
                    <Icon name="account-balance-wallet" size={40} color="#cbd5e1" />
                    <Text style={styles.innerEmptyText}>لا توجد بيانات</Text>
                  </View>
                ) : (
                  topIncomeByTarget.map(renderIncomeByTargetCard)
                )}
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <View style={[styles.sectionHeadIconWrap, { backgroundColor: '#dbeafe' }]}>
                  <Icon name="payments" size={16} color="#2563eb" />
                </View>
                <View>
                  <Text style={styles.sectionHeadTitle}>أحدث المعاملات المالية</Text>
                  <Text style={styles.sectionHeadSubTitle}>آخر المعاملات المسجلة في النظام</Text>
                </View>
              </View>

              <View style={styles.sectionBody}>
                {(dashboardData.recentTransactions || []).length === 0 ? (
                  <View style={styles.innerEmptyState}>
                    <Icon name="receipt-long" size={40} color="#cbd5e1" />
                    <Text style={styles.innerEmptyText}>لا توجد معاملات</Text>
                  </View>
                ) : (
                  dashboardData.recentTransactions.map(renderTransactionCard)
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    marginRight: 10,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 12,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  dateInputContainer: {
    gap: 8,
  },
  dateInputWrapper: {
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
    textAlign: 'right',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  datePickerText: {
    flex: 1,
    textAlign: 'right',
    color: '#1f2937',
    marginRight: 8,
    fontSize: 13,
  },
  datePickerPlaceholder: {
    color: '#94a3b8',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  resetButtonText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#1a237e',
    paddingVertical: 10,
  },
  refreshButtonText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  summaryGrid: {
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  summaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  summaryBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionHeadIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionHeadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionHeadSubTitle: {
    marginTop: 1,
    fontSize: 11,
    color: '#94a3b8',
  },
  sectionBody: {
    padding: 10,
  },
  safeRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  safeRankNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  safeRankNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  safeRankInfo: {
    flex: 1,
    marginRight: 8,
  },
  safeRankName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  safeRankTransactions: {
    marginTop: 2,
    fontSize: 11,
    color: '#94a3b8',
  },
  safeRankAmountBox: {
    width: 120,
    alignItems: 'flex-end',
  },
  safeRankAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
  },
  progressTrack: {
    marginTop: 4,
    width: 90,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    backgroundColor: '#3b82f6',
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginBottom: 8,
  },
  transactionTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  transactionTypeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  transactionInfoWrap: {
    flex: 1,
  },
  transactionRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  transactionDescription: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
    marginBottom: 6,
  },
  transactionTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  tagChip: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tagChipBlue: {
    backgroundColor: '#eff6ff',
  },
  tagChipGreen: {
    backgroundColor: '#ecfdf5',
  },
  tagChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tagChipTextBlue: {
    color: '#1d4ed8',
  },
  tagChipTextGreen: {
    color: '#047857',
  },
  transactionDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#94a3b8',
  },
  innerEmptyState: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerEmptyText: {
    marginTop: 8,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: width - 48,
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a237e',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  datePickerColumn: {
    alignItems: 'center',
  },
  datePickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  datePickerArrow: {
    padding: 4,
  },
  datePickerValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a237e',
    minWidth: 52,
    textAlign: 'center',
    marginVertical: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});

export default FinancialReportsScreen;
