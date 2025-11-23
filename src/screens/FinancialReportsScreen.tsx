import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import { FinancialDashboardResponse } from '../types/financialReports';

const { width } = Dimensions.get('window');

interface FinancialReportsScreenProps {
  navigation: any;
}

const FinancialReportsScreen = ({ navigation }: FinancialReportsScreenProps) => {
  const [dashboardData, setDashboardData] = useState<FinancialDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const fetchDashboardData = async () => {
    if (!dateFrom) {
      Alert.alert('تنبيه', 'يرجى اختيار تاريخ البداية على الأقل');
      return;
    }

    // إذا لم يتم اختيار تاريخ النهاية، استخدم نفس تاريخ البداية
    const fromDateStr = dateFrom.toISOString().split('T')[0];
    const toDateStr = dateTo ? dateTo.toISOString().split('T')[0] : fromDateStr;
    
    console.log('📅 Fetching data for date range:', fromDateStr, 'to', toDateStr);

    const dateFilter = {
      dateFrom: fromDateStr,
      dateTo: toDateStr,
    };

    try {
      setLoading(true);
      const data = await AuthService.getFinancialDashboard(dateFilter);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching financial dashboard:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل التقارير المالية';
      
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
        Alert.alert('خطأ في المصادقة', 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.');
        AuthService.clearAuthData().then(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        });
      } else {
        Alert.alert('خطأ', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
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

  const handleApplyFilter = async () => {
    if (!dateFrom) {
      Alert.alert('تنبيه', 'يرجى اختيار تاريخ البداية على الأقل');
      return;
    }
    if (dateTo && dateFrom > dateTo) {
      Alert.alert('خطأ', 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return;
    }
    await fetchDashboardData();
  };

  const handleResetFilter = () => {
    setDateFrom(null);
    setDateTo(null);
    setDashboardData(null);
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return 'اختر التاريخ';
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT':
        return 'payment';
      case 'DEPOSIT':
        return 'savings';
      case 'WITHDRAW':
        return 'money-off';
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
      case 'PAYMENT':
      case 'DEPOSIT':
        return '#059669';
      case 'WITHDRAW':
      case 'FEE':
        return '#dc2626';
      case 'TRANSFER':
        return '#1a237e';
      default:
        return '#6b7280';
    }
  };

  const renderSummaryCard = (
    title: string,
    value: number,
    icon: string,
    color: string,
    subtitle?: string
  ) => (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <View style={[styles.summaryIconContainer, { backgroundColor: color + '15' }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={[styles.summaryValue, { color }]}>
          {formatCurrency(value)}
        </Text>
        {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const renderSafeCard = (safe: FinancialDashboardResponse['safes'][0], index: number) => {
    const colors = [
      { bg: '#fef3c7', text: '#f59e0b', icon: '#d97706' },
      { bg: '#f3f4f6', text: '#6b7280', icon: '#4b5563' },
      { bg: '#dcfce7', text: '#059669', icon: '#047857' },
      { bg: '#dbeafe', text: '#3b82f6', icon: '#2563eb' },
      { bg: '#ede9fe', text: '#7c3aed', icon: '#6d28d9' },
    ];
    const colorScheme = colors[index % colors.length];
    
    return (
      <View key={safe.id} style={[styles.safeCard, { backgroundColor: colorScheme.bg }]}>
        <View style={styles.safeRow}>
          <View style={[styles.safeNumber, { backgroundColor: colorScheme.icon }]}>
            <Text style={styles.safeNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.safeDetails}>
            <Text style={[styles.safeName, { color: colorScheme.icon }]}>{safe.name}</Text>
            <Text style={styles.safeTransactions}>{safe.transactionsCount} معاملة</Text>
          </View>
          <Text style={[styles.safeBalance, { color: colorScheme.icon }]}>
            {formatCurrency(safe.balance)}
          </Text>
        </View>
      </View>
    );
  };

  const renderIncomeTypeCard = (item: FinancialDashboardResponse['incomeByType'][0]) => (
    <View key={item.type} style={styles.incomeTypeCard}>
      <View style={styles.incomeTypeHeader}>
        <View style={[styles.incomeTypeIndicator, { backgroundColor: getTransactionTypeColor(item.type) }]} />
        <View style={styles.incomeTypeInfo}>
          <Text style={styles.incomeTypeLabel}>{item.type === 'PAYMENT' ? 'مدفوعات' : 'إيداعات'}</Text>
          <Text style={styles.incomeTypeCount}>{item.count} معاملة</Text>
        </View>
      </View>
      <View style={styles.incomeTypeAmountContainer}>
        <Text style={styles.incomeTypeAmount}>{formatCurrency(item.amount)}</Text>
        <View style={styles.incomeTypePercentage}>
          <Text style={styles.incomeTypePercentageText}>{item.percentage}%</Text>
        </View>
      </View>
    </View>
  );

  const renderTransactionCard = (transaction: FinancialDashboardResponse['recentTransactions'][0]) => (
    <View key={transaction.id} style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={[styles.transactionIcon, { backgroundColor: getTransactionTypeColor(transaction.type) + '15' }]}>
          <Icon name={getTransactionTypeIcon(transaction.type)} size={20} color={getTransactionTypeColor(transaction.type)} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription} numberOfLines={2}>
            {transaction.description}
          </Text>
          {transaction.traineeName && (
            <Text style={styles.transactionMeta}>
              <Icon name="person" size={12} color="#6b7280" /> {transaction.traineeName}
            </Text>
          )}
          {transaction.feeName && (
            <Text style={styles.transactionMeta}>
              <Icon name="receipt" size={12} color="#6b7280" /> {transaction.feeName}
            </Text>
          )}
          <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
        </View>
        <Text style={[styles.transactionAmount, { color: getTransactionTypeColor(transaction.type) }]}>
          {formatCurrency(transaction.amount)}
        </Text>
      </View>
      {(transaction.sourceSafe || transaction.targetSafe) && (
        <View style={styles.transactionFlow}>
          {transaction.sourceSafe && (
            <Text style={styles.transactionFlowText}>من: {transaction.sourceSafe}</Text>
          )}
          {transaction.sourceSafe && transaction.targetSafe && (
            <Icon name="arrow-forward" size={14} color="#9ca3af" style={{ marginHorizontal: 8 }} />
          )}
          {transaction.targetSafe && (
            <Text style={styles.transactionFlowText}>إلى: {transaction.targetSafe}</Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="FinancialReports" />
        <View style={styles.headerCenter}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>التقارير المالية</Text>
            <Text style={styles.headerSubtitle}>نظرة شاملة على الوضع المالي</Text>
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
          <Text style={styles.filterTitle}>اختر الفترة الزمنية</Text>
          
          <View style={styles.dateInputContainer}>
            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateLabel}>من تاريخ</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => handleDateSelect('from')}
              >
                <Icon name="calendar-today" size={18} color="#1a237e" />
                <Text style={[styles.datePickerText, !dateFrom && styles.datePickerPlaceholder]}>
                  {formatDisplayDate(dateFrom)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateLabel}>إلى تاريخ (اختياري)</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => handleDateSelect('to')}
              >
                <Icon name="calendar-today" size={18} color="#1a237e" />
                <Text style={[styles.datePickerText, !dateTo && styles.datePickerPlaceholder]}>
                  {formatDisplayDate(dateTo)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleResetFilter}
            >
              <Icon name="clear" size={18} color="#dc2626" />
              <Text style={styles.resetButtonText}>إعادة تعيين</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.applyButton}
              onPress={handleApplyFilter}
            >
              <Icon name="search" size={18} color="#fff" />
              <Text style={styles.applyButtonText}>عرض التقرير</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={showDatePicker !== null}
          transparent={true}
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
                  <Icon name="close" size={24} color="#1a237e" />
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>السنة</Text>
                  <TouchableOpacity 
                    style={styles.datePickerArrow}
                    onPress={() => changeDateValue('year', 1)}
                  >
                    <Icon name="keyboard-arrow-up" size={24} color="#1a237e" />
                  </TouchableOpacity>
                  <Text style={styles.datePickerValue}>{tempDate.getFullYear()}</Text>
                  <TouchableOpacity 
                    style={styles.datePickerArrow}
                    onPress={() => changeDateValue('year', -1)}
                  >
                    <Icon name="keyboard-arrow-down" size={24} color="#1a237e" />
                  </TouchableOpacity>
                </View>

                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>الشهر</Text>
                  <TouchableOpacity 
                    style={styles.datePickerArrow}
                    onPress={() => changeDateValue('month', 1)}
                  >
                    <Icon name="keyboard-arrow-up" size={24} color="#1a237e" />
                  </TouchableOpacity>
                  <Text style={styles.datePickerValue}>{tempDate.getMonth() + 1}</Text>
                  <TouchableOpacity 
                    style={styles.datePickerArrow}
                    onPress={() => changeDateValue('month', -1)}
                  >
                    <Icon name="keyboard-arrow-down" size={24} color="#1a237e" />
                  </TouchableOpacity>
                </View>

                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>اليوم</Text>
                  <TouchableOpacity 
                    style={styles.datePickerArrow}
                    onPress={() => changeDateValue('day', 1)}
                  >
                    <Icon name="keyboard-arrow-up" size={24} color="#1a237e" />
                  </TouchableOpacity>
                  <Text style={styles.datePickerValue}>{tempDate.getDate()}</Text>
                  <TouchableOpacity 
                    style={styles.datePickerArrow}
                    onPress={() => changeDateValue('day', -1)}
                  >
                    <Icon name="keyboard-arrow-down" size={24} color="#1a237e" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setShowDatePicker(null)}
                >
                  <Text style={styles.modalCancelText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalConfirmButton}
                  onPress={handleDateConfirm}
                >
                  <Text style={styles.modalConfirmText}>تأكيد</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل التقارير...</Text>
          </View>
        ) : dashboardData ? (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الملخص المالي</Text>
              
              {renderSummaryCard(
                'إجمالي الدخل',
                dashboardData.summary.totalIncome,
                'trending-up',
                '#059669',
                `${dashboardData.summary.incomeTransactions} معاملة دخل`
              )}
              
              {renderSummaryCard(
                'إجمالي المصروفات',
                dashboardData.summary.totalExpenses,
                'trending-down',
                '#dc2626',
                `${dashboardData.summary.expenseTransactions} معاملة مصروف`
              )}
              
              {renderSummaryCard(
                'صافي الدخل',
                dashboardData.summary.netIncome,
                'account-balance',
                dashboardData.summary.netIncome >= 0 ? '#1a237e' : '#dc2626',
                'الفرق بين الدخل والمصروفات'
              )}

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Icon name="account-balance-wallet" size={24} color="#7c3aed" />
                  <Text style={styles.statLabel}>إجمالي الأرصدة</Text>
                  <Text style={[styles.statValue, { color: '#7c3aed' }]}>
                    {formatCurrency(dashboardData.summary.totalBalance)}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Icon name="swap-horiz" size={24} color="#f59e0b" />
                  <Text style={styles.statLabel}>التحويلات</Text>
                  <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                    {formatCurrency(dashboardData.summary.totalTransfers)}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Icon name="today" size={24} color="#3b82f6" />
                  <Text style={styles.statLabel}>معاملات اليوم</Text>
                  <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                    {dashboardData.summary.transactionsToday}
                  </Text>
                </View>
              </View>
            </View>

            {dashboardData.safes && dashboardData.safes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>توزيع الدخل حسب الخزائن</Text>
                  <Icon name="account-balance" size={24} color="#1a237e" />
                </View>
                {dashboardData.safes.map((safe, index) => renderSafeCard(safe, index))}
              </View>
            )}

            {dashboardData.incomeByType && dashboardData.incomeByType.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>توزيع الدخل حسب النوع</Text>
                  <Icon name="pie-chart" size={24} color="#1a237e" />
                </View>
                {dashboardData.incomeByType.map(renderIncomeTypeCard)}
              </View>
            )}

            {dashboardData.incomeByTarget && dashboardData.incomeByTarget.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>الدخل حسب الخزينة</Text>
                  <Icon name="donut-large" size={24} color="#1a237e" />
                </View>
                {dashboardData.incomeByTarget.map((item) => (
                  <View key={item.safeId} style={styles.incomeTargetCard}>
                    <View style={styles.incomeTargetHeader}>
                      <Icon name="account-balance" size={20} color="#1a237e" />
                      <Text style={styles.incomeTargetName}>{item.safeName}</Text>
                    </View>
                    <View style={styles.incomeTargetStats}>
                      <View style={styles.incomeTargetStat}>
                        <Text style={styles.incomeTargetLabel}>الدخل</Text>
                        <Text style={styles.incomeTargetValue}>{formatCurrency(item.income)}</Text>
                      </View>
                      <View style={styles.incomeTargetStat}>
                        <Text style={styles.incomeTargetLabel}>المعاملات</Text>
                        <Text style={styles.incomeTargetValue}>{item.transactionsCount}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>آخر المعاملات المالية</Text>
                  <Icon name="history" size={24} color="#1a237e" />
                </View>
                <View style={styles.transactionsList}>
                  {dashboardData.recentTransactions.map(renderTransactionCard)}
                </View>
              </View>
            )}

            {dashboardData.recentTransactions?.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="receipt-long" size={64} color="#d1d5db" />
                <Text style={styles.emptyTitle}>لا توجد معاملات</Text>
                <Text style={styles.emptySubtitle}>لم يتم تسجيل أي معاملات مالية بعد</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Icon name="date-range" size={80} color="#d1d5db" />
            <Text style={styles.noDataTitle}>اختر الفترة الزمنية</Text>
            <Text style={styles.noDataSubtitle}>
              اختر التاريخ أعلاه ثم اضغط "عرض التقرير" لعرض البيانات المالية
            </Text>
          </View>
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
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 16,
    textAlign: 'right',
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateInputWrapper: {
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    textAlign: 'right',
    marginRight: 12,
  },
  datePickerPlaceholder: {
    color: '#9ca3af',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width - 48,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  datePickerColumn: {
    alignItems: 'center',
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  datePickerArrow: {
    padding: 8,
  },
  datePickerValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a237e',
    marginVertical: 8,
    minWidth: 60,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1a237e',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
    letterSpacing: 0.3,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
  },
  summaryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: (width - 48) / 2,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  safeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  safeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safeNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  safeNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  safeDetails: {
    flex: 1,
    marginRight: 16,
  },
  safeName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'right',
  },
  safeTransactions: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'right',
  },
  safeBalance: {
    fontSize: 18,
    fontWeight: '800',
  },
  incomeTypeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  incomeTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  incomeTypeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  incomeTypeInfo: {
    flex: 1,
  },
  incomeTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  incomeTypeCount: {
    fontSize: 13,
    color: '#6b7280',
  },
  incomeTypeAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incomeTypeAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
  },
  incomeTypePercentage: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  incomeTypePercentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
  },
  incomeTargetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  incomeTargetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  incomeTargetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  incomeTargetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  incomeTargetStat: {
    flex: 1,
  },
  incomeTargetLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  incomeTargetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a237e',
  },
  transactionsList: {
    marginTop: 8,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  transactionMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  transactionFlowText: {
    fontSize: 13,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  noDataTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  noDataSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default FinancialReportsScreen;