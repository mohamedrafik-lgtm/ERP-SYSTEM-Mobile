import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import DatePickerModal from '../components/DatePickerModal';
import AuthService from '../services/AuthService';
import { ITransaction, ISafe, TransactionType } from '../types/student';
import { usePermissions } from '../hooks/usePermissions';

interface TreasurySafeReportScreenProps {
  navigation: any;
  route: {
    params: {
      safeId: string;
      safeName?: string;
    };
  };
}

const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  DEPOSIT: 'إيداع',
  WITHDRAW: 'سحب',
  TRANSFER: 'تحويل',
  FEE: 'رسوم',
  PAYMENT: 'دفع',
};

const TreasurySafeReportScreen = ({ navigation, route }: TreasurySafeReportScreenProps) => {
  const { safeId, safeName } = route.params;
  const { hasPermission } = usePermissions();

  const [safe, setSafe] = useState<ISafe | null>(null);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'today' | 'custom'>('today');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [pickerType, setPickerType] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const canViewBalances = hasPermission('finances.safes.balances', 'view');

  const formatCurrency = (amount: number, currency?: string) => {
    return `${amount.toLocaleString('ar-EG')} ${currency || safe?.currency || 'جنيه'}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const loadSafe = async () => {
    try {
      const data = await AuthService.getSafeById(safeId);
      setSafe(data);
    } catch (error) {
      console.error('Error loading safe details:', error);
      Alert.alert('خطأ', 'فشل في تحميل بيانات الخزينة');
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);

      const params: { limit?: number; dateFrom?: string; dateTo?: string } = { limit: 1000 };

      if (reportType === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        params.dateFrom = today.toISOString();
        params.dateTo = tomorrow.toISOString();
      } else if (reportType === 'custom') {
        if (!dateFrom || !dateTo) {
          Alert.alert('تنبيه', 'يرجى اختيار فترة التقرير');
          return;
        }
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        params.dateFrom = from.toISOString();
        params.dateTo = to.toISOString();
      }

      const data = await AuthService.getSafeTransactions(safeId, params);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading safe transactions report:', error);
      Alert.alert('خطأ', 'فشل في تحميل التقرير');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSafe();
    void loadTransactions();
  }, [safeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDepositTransaction = (transaction: ITransaction) => {
    return (
      transaction.type === 'DEPOSIT' ||
      transaction.type === 'PAYMENT' ||
      (transaction.type === 'TRANSFER' && transaction.targetSafe?.id === safeId)
    );
  };

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return transactions;

    return transactions.filter((transaction) => {
      const createdByName = (transaction as any)?.createdBy?.name || '';
      const sourceName = transaction.sourceSafe?.name || '';
      const targetName = transaction.targetSafe?.name || '';

      return (
        String(transaction.id).includes(query) ||
        String(transaction.amount).includes(query) ||
        (transaction.description || '').toLowerCase().includes(query) ||
        (TRANSACTION_TYPE_LABELS[transaction.type] || '').toLowerCase().includes(query) ||
        sourceName.toLowerCase().includes(query) ||
        targetName.toLowerCase().includes(query) ||
        createdByName.toLowerCase().includes(query) ||
        formatDate(transaction.createdAt).toLowerCase().includes(query)
      );
    });
  }, [transactions, searchQuery]);

  const totalDeposits = useMemo(() => {
    return filteredTransactions
      .filter(isDepositTransaction)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [filteredTransactions]);

  const totalWithdrawals = useMemo(() => {
    return filteredTransactions
      .filter((transaction) => !isDepositTransaction(transaction))
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [filteredTransactions]);

  const handlePrint = async () => {
    try {
      const baseUrl = await AuthService.getCurrentApiBaseUrl();
      const params = new URLSearchParams();

      params.append('reportType', reportType);
      if (reportType === 'custom' && dateFrom && dateTo) {
        params.append('dateFrom', dateFrom.toISOString().split('T')[0]);
        params.append('dateTo', dateTo.toISOString().split('T')[0]);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const printUrl = `${baseUrl}/print/safe-transactions/${safeId}${params.toString() ? `?${params.toString()}` : ''}`;
      const canOpen = await Linking.canOpenURL(printUrl);
      if (!canOpen) {
        Alert.alert('خطأ', 'تعذر فتح رابط الطباعة على هذا الجهاز');
        return;
      }

      await Linking.openURL(printUrl);
    } catch (error) {
      console.error('Error opening print report:', error);
      Alert.alert('خطأ', 'فشل في فتح تقرير الطباعة');
    }
  };

  const renderTransaction = (transaction: ITransaction) => {
    const isDeposit = isDepositTransaction(transaction);

    return (
      <View key={transaction.id} style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View>
            <Text style={styles.transactionDescription}>
              {transaction.description || 'معاملة مالية'}
            </Text>
            <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
            {transaction.type === 'TRANSFER' && (
              <Text style={styles.transferMeta}>
                من: {transaction.sourceSafe?.name || '-'} | إلى: {transaction.targetSafe?.name || '-'}
              </Text>
            )}
          </View>
          <View style={[
            styles.typeBadge,
            { backgroundColor: isDeposit ? '#dcfce7' : '#fee2e2' },
          ]}>
            <Text style={[
              styles.typeText,
              { color: isDeposit ? '#166534' : '#991b1b' },
            ]}>
              {TRANSACTION_TYPE_LABELS[transaction.type] || transaction.type}
            </Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={[
            styles.amountText,
            { color: isDeposit ? '#059669' : '#dc2626' },
          ]}>
            {isDeposit ? '+' : '-'} {formatCurrency(transaction.amount)}
          </Text>
          {(transaction as any)?.createdBy?.name ? (
            <Text style={styles.userText}>بواسطة: {(transaction as any).createdBy.name}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomMenu navigation={navigation} activeRouteName="Treasury" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>تقرير معاملات الخزينة</Text>
          <Text style={styles.headerSubtitle}>{safe?.name || safeName || 'الخزينة'}</Text>
        </View>
        <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
          <Icon name="print" size={22} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.safeSummaryCard}>
          <Text style={styles.summaryLabel}>الخزينة</Text>
          <Text style={styles.summaryName}>{safe?.name || safeName || '-'}</Text>
          <Text style={styles.summaryBalance}>
            {canViewBalances
              ? formatCurrency(safe?.balance || 0, safe?.currency)
              : 'لا توجد صلاحية لعرض الرصيد'}
          </Text>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.sectionTitle}>تصفية التقرير</Text>

          <View style={styles.reportTypeRow}>
            <TouchableOpacity
              style={[styles.reportTypeBtn, reportType === 'today' && styles.reportTypeBtnActive]}
              onPress={() => setReportType('today')}
            >
              <Text style={[styles.reportTypeText, reportType === 'today' && styles.reportTypeTextActive]}>
                معاملات اليوم
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reportTypeBtn, reportType === 'custom' && styles.reportTypeBtnActive]}
              onPress={() => setReportType('custom')}
            >
              <Text style={[styles.reportTypeText, reportType === 'custom' && styles.reportTypeTextActive]}>
                فترة مخصصة
              </Text>
            </TouchableOpacity>
          </View>

          {reportType === 'custom' && (
            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setPickerType('from')}>
                <Icon name="event" size={18} color="#475569" />
                <Text style={styles.dateBtnText}>
                  من: {dateFrom ? dateFrom.toLocaleDateString('ar-EG') : 'اختر التاريخ'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setPickerType('to')}>
                <Icon name="event" size={18} color="#475569" />
                <Text style={styles.dateBtnText}>
                  إلى: {dateTo ? dateTo.toLocaleDateString('ar-EG') : 'اختر التاريخ'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.generateBtn} onPress={loadTransactions} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="filter-list" size={18} color="#fff" />
                <Text style={styles.generateBtnText}>إنشاء التقرير</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: '#22c55e' }]}>
            <Text style={styles.statLabel}>إجمالي الإيداعات</Text>
            <Text style={styles.statValue}>
              {canViewBalances ? formatCurrency(totalDeposits) : 'لا توجد صلاحية'}
            </Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#ef4444' }]}>
            <Text style={styles.statLabel}>إجمالي المسحوبات</Text>
            <Text style={styles.statValue}>
              {canViewBalances ? formatCurrency(totalWithdrawals) : 'لا توجد صلاحية'}
            </Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Icon name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث في المعاملات..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
        </View>

        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>سجل المعاملات</Text>
            <Text style={styles.transactionsCount}>{filteredTransactions.length} معاملة</Text>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#1a237e" />
              <Text style={styles.loadingText}>جاري تحميل التقرير...</Text>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Icon name="receipt-long" size={54} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>لا توجد معاملات</Text>
              <Text style={styles.emptySub}>لا توجد نتائج مطابقة للفلاتر الحالية</Text>
            </View>
          ) : (
            filteredTransactions.map(renderTransaction)
          )}
        </View>
      </ScrollView>

      <DatePickerModal
        visible={pickerType === 'from'}
        onClose={() => setPickerType(null)}
        onConfirm={(date) => {
          setDateFrom(date);
          setPickerType(null);
        }}
        initialDate={dateFrom}
        title="اختر تاريخ البداية"
      />

      <DatePickerModal
        visible={pickerType === 'to'}
        onClose={() => setPickerType(null)}
        onConfirm={(date) => {
          setDateTo(date);
          setPickerType(null);
        }}
        initialDate={dateTo}
        title="اختر تاريخ النهاية"
      />
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
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  headerTextWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#64748b',
  },
  printButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
  },
  content: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  safeSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  summaryName: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryBalance: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#1a237e',
  },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  reportTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  reportTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  reportTypeBtnActive: {
    borderColor: '#1a237e',
    backgroundColor: '#eef2ff',
  },
  reportTypeText: {
    color: '#475569',
    fontWeight: '600',
  },
  reportTypeTextActive: {
    color: '#1a237e',
  },
  dateRow: {
    marginTop: 12,
    gap: 8,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dateBtnText: {
    color: '#334155',
    fontWeight: '600',
  },
  generateBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a237e',
    borderRadius: 10,
    paddingVertical: 12,
  },
  generateBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  statValue: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    paddingVertical: 10,
    marginLeft: 6,
  },
  transactionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionsCount: {
    color: '#64748b',
    fontWeight: '600',
  },
  transactionCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  transactionDate: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  transferMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#334155',
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  userText: {
    fontSize: 12,
    color: '#64748b',
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    color: '#64748b',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  emptySub: {
    marginTop: 4,
    color: '#94a3b8',
  },
});

export default TreasurySafeReportScreen;
