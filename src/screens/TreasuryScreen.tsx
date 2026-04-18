import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import { ISafe, SafeCategory, ITransaction, TransactionType } from '../types/student';
import CustomMenu from '../components/CustomMenu';
import { usePermissions } from '../hooks/usePermissions';

interface TreasuryScreenProps {
  navigation: any;
}

const CATEGORY_LABELS: Record<SafeCategory, string> = {
  DEBT: 'مديونية',
  INCOME: 'دخل',
  EXPENSE: 'مصروفات',
  ASSETS: 'أصول',
  UNSPECIFIED: 'غير محدد',
};

const CATEGORY_COLORS: Record<SafeCategory, string> = {
  DEBT: '#dc2626',
  INCOME: '#059669',
  EXPENSE: '#ea580c',
  ASSETS: '#2563eb',
  UNSPECIFIED: '#6b7280',
};

const HIDE_BALANCES_KEY = 'safes_hide_balances';

const TreasuryScreen = ({ navigation }: TreasuryScreenProps) => {
  const { hasPermission, hasScreenAction } = usePermissions();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [safes, setSafes] = useState<ISafe[]>([]);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [selectedSafeId, setSelectedSafeId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<SafeCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideBalances, setHideBalances] = useState(false);

  const canManageTreasury = hasScreenAction('Treasury', 'manage') || hasPermission('dashboard.financial', 'manage');
  const canViewReports =
    hasPermission('dashboard.financial.reports', 'view') ||
    hasPermission('finances.safes.transactions', 'view');
  const canViewBalances = hasPermission('finances.safes.balances', 'view');
  const showBalances = canViewBalances && !hideBalances;

  const selectedSafe = useMemo(
    () => safes.find(safe => safe.id === selectedSafeId) || null,
    [safes, selectedSafeId],
  );

  const categoryStats = useMemo(() => {
    const build = (category: SafeCategory) => {
      const items = safes.filter(safe => safe.category === category);
      return {
        count: items.length,
        total: items.reduce((sum, item) => sum + item.balance, 0),
      };
    };

    return {
      DEBT: build('DEBT'),
      INCOME: build('INCOME'),
      EXPENSE: build('EXPENSE'),
      ASSETS: build('ASSETS'),
      UNSPECIFIED: build('UNSPECIFIED'),
    };
  }, [safes]);

  const filteredSafes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return safes.filter(safe => {
      const categoryMatch = activeCategory === 'ALL' || safe.category === activeCategory;
      if (!categoryMatch) return false;

      if (!query) return true;
      return (
        safe.name.toLowerCase().includes(query) ||
        (safe.description || '').toLowerCase().includes(query) ||
        CATEGORY_LABELS[safe.category].toLowerCase().includes(query)
      );
    });
  }, [safes, activeCategory, searchQuery]);

  const formatAmount = (amount: number, currency?: string) =>
    `${amount.toLocaleString('ar-EG')} ${currency || 'EGP'}`;

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return 'إيداع';
      case 'WITHDRAW':
        return 'سحب';
      case 'TRANSFER':
        return 'تحويل';
      case 'FEE':
        return 'رسوم';
      case 'PAYMENT':
        return 'دفع';
      default:
        return type;
    }
  };

  const getTransactionSign = (transaction: ITransaction) => {
    if (!selectedSafe) return '-';

    const isIncome =
      transaction.type === 'DEPOSIT' ||
      transaction.type === 'PAYMENT' ||
      (transaction.type === 'TRANSFER' && transaction.targetSafe?.id === selectedSafe.id);

    return isIncome ? '+' : '-';
  };

  const getTransactionColor = (transaction: ITransaction) => {
    return getTransactionSign(transaction) === '+' ? '#059669' : '#dc2626';
  };

  const loadHideBalancesPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(HIDE_BALANCES_KEY);
      setHideBalances(saved === 'true');
    } catch (error) {
      console.warn('Failed to load hide balances preference:', error);
    }
  };

  const toggleHideBalances = async () => {
    try {
      const next = !hideBalances;
      setHideBalances(next);
      await AsyncStorage.setItem(HIDE_BALANCES_KEY, String(next));
    } catch (error) {
      console.warn('Failed to save hide balances preference:', error);
    }
  };

  const fetchSafes = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getAllSafes();
      const normalized = Array.isArray(data) ? data : [];
      setSafes(normalized);

      if (selectedSafeId && !normalized.some(safe => safe.id === selectedSafeId)) {
        setSelectedSafeId(null);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching safes:', error);
      Alert.alert('خطأ', 'فشل في تحميل الخزائن');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTransactions = async (safeId: string) => {
    try {
      setTransactionsLoading(true);
      const response = await AuthService.getSafeTransactions(safeId, { limit: 50 });
      setTransactions(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('خطأ', 'فشل في تحميل معاملات الخزينة');
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSafes();
    if (selectedSafeId) {
      await fetchTransactions(selectedSafeId);
    }
  };

  useEffect(() => {
    void loadHideBalancesPreference();
    void fetchSafes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void fetchSafes();
      if (selectedSafeId) {
        void fetchTransactions(selectedSafeId);
      }
    });

    return unsubscribe;
  }, [navigation, selectedSafeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const openSafeDetails = async (safe: ISafe) => {
    setSelectedSafeId(safe.id);
    await fetchTransactions(safe.id);
  };

  const openAddTransaction = (safe: ISafe) => {
    navigation.navigate('AddTransactionScreen', { safe });
  };

  const openSafeReport = (safe: ISafe) => {
    navigation.navigate('TreasurySafeReport', { safeId: safe.id, safeName: safe.name });
  };

  const openEditSafe = (safe: ISafe) => {
    navigation.navigate('AddTreasuryScreen', { safe });
  };

  const handleDeleteSafe = (safe: ISafe) => {
    if ((safe.balance !== 0 && safe.balance != null) || safe.hasTransactions) {
      Alert.alert('غير مسموح', 'لا يمكن حذف خزينة بها رصيد أو معاملات');
      return;
    }

    Alert.alert('تأكيد الحذف', `هل تريد حذف الخزينة "${safe.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.deleteSafe(safe.id);
            if (selectedSafeId === safe.id) {
              setSelectedSafeId(null);
              setTransactions([]);
            }
            await fetchSafes();
            Alert.alert('نجح', 'تم حذف الخزينة بنجاح');
          } catch (error) {
            console.error('Error deleting safe:', error);
            Alert.alert('خطأ', 'فشل في حذف الخزينة');
          }
        },
      },
    ]);
  };

  const renderCategoryFilter = (value: SafeCategory | 'ALL', label: string, count: number, color: string) => {
    const active = activeCategory === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.categoryChip,
          active ? { backgroundColor: color, borderColor: color } : { borderColor: '#cbd5e1' },
        ]}
        onPress={() => setActiveCategory(active ? 'ALL' : value)}
      >
        <Text style={[styles.categoryChipText, active ? { color: '#fff' } : { color: '#334155' }]}> 
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSafeCard = (safe: ISafe) => {
    const selected = safe.id === selectedSafeId;

    return (
      <View key={safe.id} style={[styles.safeCard, selected && styles.safeCardSelected]}>
        <View style={styles.safeHeaderRow}>
          <View style={styles.safeHeaderTextWrap}>
            <Text style={styles.safeName}>{safe.name}</Text>
            <Text style={styles.safeDescription}>{safe.description || 'بدون وصف'}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: `${CATEGORY_COLORS[safe.category]}20` }]}>
            <Text style={[styles.categoryBadgeText, { color: CATEGORY_COLORS[safe.category] }]}> 
              {CATEGORY_LABELS[safe.category]}
            </Text>
          </View>
        </View>

        <View style={styles.safeStatsRow}>
          <View>
            <Text style={styles.statCaption}>الرصيد</Text>
            <Text style={styles.balanceText}>
              {showBalances
                ? formatAmount(safe.balance, safe.currency)
                : canViewBalances
                  ? '••••••'
                  : 'لا توجد صلاحية'}
            </Text>
          </View>
          <View style={styles.statusWrap}>
            <View style={[styles.statusDot, { backgroundColor: safe.isActive ? '#10b981' : '#ef4444' }]} />
            <Text style={styles.statusText}>{safe.isActive ? 'نشطة' : 'غير نشطة'}</Text>
          </View>
        </View>

        <View style={styles.safeActionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => void openSafeDetails(safe)}>
            <Icon name="visibility" size={16} color="#1a237e" />
            <Text style={styles.actionBtnText}>التفاصيل</Text>
          </TouchableOpacity>

          {canManageTreasury && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => openAddTransaction(safe)}>
              <Icon name="add-circle" size={16} color="#166534" />
              <Text style={styles.actionBtnText}>معاملة</Text>
            </TouchableOpacity>
          )}

          {canViewReports && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => openSafeReport(safe)}>
              <Icon name="description" size={16} color="#7c3aed" />
              <Text style={styles.actionBtnText}>تقرير</Text>
            </TouchableOpacity>
          )}

          {canManageTreasury && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => openEditSafe(safe)}>
              <Icon name="edit" size={16} color="#0369a1" />
              <Text style={styles.actionBtnText}>تعديل</Text>
            </TouchableOpacity>
          )}

          {canManageTreasury && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteSafe(safe)}>
              <Icon name="delete" size={16} color="#dc2626" />
              <Text style={styles.actionBtnText}>حذف</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderTransactionCard = (transaction: ITransaction) => (
    <View key={transaction.id} style={styles.transactionCard}>
      <View style={styles.transactionTopRow}>
        <View style={styles.transactionHeadTextWrap}>
          <Text style={styles.transactionDescription}>{transaction.description || 'معاملة مالية'}</Text>
          <Text style={styles.transactionDate}>{new Date(transaction.createdAt).toLocaleString('ar-EG')}</Text>
          {transaction.type === 'TRANSFER' && (
            <Text style={styles.transferRouteText}>
              من: {transaction.sourceSafe?.name || '-'} | إلى: {transaction.targetSafe?.name || '-'}
            </Text>
          )}
        </View>
        <View style={styles.transactionTypeBadge}>
          <Text style={styles.transactionTypeText}>{getTransactionTypeLabel(transaction.type)}</Text>
        </View>
      </View>

      <Text style={[styles.transactionAmount, { color: getTransactionColor(transaction) }]}>
        {getTransactionSign(transaction)} {formatAmount(transaction.amount, selectedSafe?.currency)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomMenu navigation={navigation} activeRouteName="Treasury" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>إدارة الخزائن</Text>
          <Text style={styles.headerSubtitle}>منطق وصلاحيات متطابقة مع نسخة الويب</Text>
        </View>

        {canViewBalances && (
          <TouchableOpacity style={styles.headerIconBtn} onPress={toggleHideBalances}>
            <Icon name={hideBalances ? 'visibility-off' : 'visibility'} size={20} color="#1a237e" />
          </TouchableOpacity>
        )}

        {canManageTreasury && (
          <TouchableOpacity
            style={[styles.headerIconBtn, { marginLeft: 8 }]}
            onPress={() => navigation.navigate('AddTreasuryScreen')}
          >
            <Icon name="add" size={22} color="#1a237e" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1a237e']} />}
      >
        <View style={styles.filtersCard}>
          <View style={styles.searchWrap}>
            <Icon name="search" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="ابحث في الخزائن..."
              placeholderTextColor="#94a3b8"
              textAlign="right"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {renderCategoryFilter('ALL', 'الكل', safes.length, '#1a237e')}
            {renderCategoryFilter('DEBT', 'مديونية', categoryStats.DEBT.count, CATEGORY_COLORS.DEBT)}
            {renderCategoryFilter('INCOME', 'دخل', categoryStats.INCOME.count, CATEGORY_COLORS.INCOME)}
            {renderCategoryFilter('EXPENSE', 'مصروفات', categoryStats.EXPENSE.count, CATEGORY_COLORS.EXPENSE)}
            {renderCategoryFilter('ASSETS', 'أصول', categoryStats.ASSETS.count, CATEGORY_COLORS.ASSETS)}
            {renderCategoryFilter(
              'UNSPECIFIED',
              'غير محدد',
              categoryStats.UNSPECIFIED.count,
              CATEGORY_COLORS.UNSPECIFIED,
            )}
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>الخزائن ({filteredSafes.length})</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل الخزائن...</Text>
          </View>
        ) : filteredSafes.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="account-balance" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>لا توجد خزائن مطابقة</Text>
            <Text style={styles.emptySubtitle}>جرّب تغيير الفلتر أو البحث</Text>
          </View>
        ) : (
          filteredSafes.map(renderSafeCard)
        )}

        {selectedSafe && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>تفاصيل الخزينة: {selectedSafe.name}</Text>
              <View style={styles.detailsActionsRow}>
                <TouchableOpacity style={styles.smallActionBtn} onPress={() => void fetchTransactions(selectedSafe.id)}>
                  <Icon name="refresh" size={16} color="#1a237e" />
                  <Text style={styles.smallActionBtnText}>تحديث</Text>
                </TouchableOpacity>
                {canViewReports && (
                  <TouchableOpacity style={styles.smallActionBtn} onPress={() => openSafeReport(selectedSafe)}>
                    <Icon name="description" size={16} color="#7c3aed" />
                    <Text style={styles.smallActionBtnText}>تقرير</Text>
                  </TouchableOpacity>
                )}
                {canManageTreasury && (
                  <TouchableOpacity style={styles.smallActionBtn} onPress={() => openAddTransaction(selectedSafe)}>
                    <Icon name="add-circle" size={16} color="#166534" />
                    <Text style={styles.smallActionBtnText}>معاملة</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.detailsStatsRow}>
              <View style={styles.detailStatItem}>
                <Text style={styles.detailStatLabel}>الرصيد الحالي</Text>
                <Text style={styles.detailStatValue}>
                  {showBalances
                    ? formatAmount(selectedSafe.balance, selectedSafe.currency)
                    : canViewBalances
                      ? '••••••'
                      : 'لا توجد صلاحية'}
                </Text>
              </View>
              <View style={styles.detailStatItem}>
                <Text style={styles.detailStatLabel}>العملة</Text>
                <Text style={styles.detailStatValue}>{selectedSafe.currency}</Text>
              </View>
              <View style={styles.detailStatItem}>
                <Text style={styles.detailStatLabel}>الحالة</Text>
                <Text style={styles.detailStatValue}>{selectedSafe.isActive ? 'نشطة' : 'غير نشطة'}</Text>
              </View>
            </View>

            <Text style={styles.transactionsTitle}>آخر المعاملات</Text>

            {transactionsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1a237e" />
                <Text style={styles.loadingText}>جاري تحميل المعاملات...</Text>
              </View>
            ) : transactions.length === 0 ? (
              <View style={styles.emptyTransactionsWrap}>
                <Text style={styles.emptyTransactionsText}>لا توجد معاملات مسجلة لهذه الخزينة</Text>
              </View>
            ) : (
              transactions.map(renderTransactionCard)
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 12,
    marginHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    paddingVertical: 10,
    marginLeft: 6,
  },
  categoriesScroll: {
    marginTop: 10,
    paddingRight: 4,
    paddingLeft: 2,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    color: '#64748b',
  },
  emptyWrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '700',
    color: '#475569',
  },
  emptySubtitle: {
    marginTop: 4,
    color: '#94a3b8',
  },
  safeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  safeCardSelected: {
    borderColor: '#1a237e',
    backgroundColor: '#f8faff',
  },
  safeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  safeHeaderTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  safeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  safeDescription: {
    marginTop: 3,
    fontSize: 13,
    color: '#64748b',
  },
  categoryBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  safeStatsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCaption: {
    fontSize: 12,
    color: '#64748b',
  },
  balanceText: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '800',
    color: '#1a237e',
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  statusText: {
    color: '#475569',
    fontWeight: '600',
  },
  safeActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  actionBtnText: {
    marginLeft: 4,
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  detailsCard: {
    marginTop: 6,
    marginBottom: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
  },
  detailsHeader: {
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  detailsActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  smallActionBtnText: {
    marginLeft: 4,
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  detailsStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailStatItem: {
    flex: 1,
    marginRight: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailStatLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  detailStatValue: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyTransactionsWrap: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyTransactionsText: {
    color: '#64748b',
  },
  transactionCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  transactionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionHeadTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  transactionDate: {
    marginTop: 3,
    fontSize: 12,
    color: '#64748b',
  },
  transferRouteText: {
    marginTop: 4,
    fontSize: 12,
    color: '#334155',
  },
  transactionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  transactionTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  transactionAmount: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '800',
  },
});

export default TreasuryScreen;
