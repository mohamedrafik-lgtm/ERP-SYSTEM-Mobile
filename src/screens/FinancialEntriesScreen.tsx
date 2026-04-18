import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import { IFinancialEntry, ISafe } from '../types/student';
import { usePermissions } from '../hooks/usePermissions';

interface FinancialEntriesScreenProps {
  navigation: any;
}

const SAFE_TYPE_LABELS: Record<string, string> = {
  DEBT: 'خزينة الديون',
  INCOME: 'خزينة الدخل',
  EXPENSE: 'خزينة المصروفات',
  ASSET: 'خزينة الأصول',
  ASSETS: 'خزينة الأصول',
};

const SAFE_TYPE_COLORS: Record<string, string> = {
  DEBT: '#dc2626',
  INCOME: '#059669',
  EXPENSE: '#d97706',
  ASSET: '#2563eb',
  ASSETS: '#2563eb',
};

const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  hasNextPage: false,
  hasPreviousPage: false,
  startItem: 1,
  endItem: 10,
};

const FinancialEntriesScreen = ({ navigation }: FinancialEntriesScreenProps) => {
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [safes, setSafes] = useState<ISafe[]>([]);
  const [entries, setEntries] = useState<IFinancialEntry[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFromSafeId, setSelectedFromSafeId] = useState<string>('');
  const [selectedToSafeId, setSelectedToSafeId] = useState<string>('');
  const [fromSafeSearch, setFromSafeSearch] = useState('');
  const [toSafeSearch, setToSafeSearch] = useState('');
  const [isFromListOpen, setIsFromListOpen] = useState(false);
  const [isToListOpen, setIsToListOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const canViewBalances = hasPermission('finances.safes.balances', 'view');
  const canViewEntriesReport = hasPermission('finances.entries.reports', 'view');

  const incomeSafes = useMemo(
    () => safes.filter(safe => safe.category === 'INCOME' || (safe as any).type === 'INCOME'),
    [safes],
  );

  const toSafes = useMemo(
    () => safes.filter(safe => safe.id !== selectedFromSafeId),
    [safes, selectedFromSafeId],
  );

  const selectedFromSafe = useMemo(
    () => safes.find(safe => safe.id === selectedFromSafeId) || null,
    [safes, selectedFromSafeId],
  );

  const selectedToSafe = useMemo(
    () => safes.find(safe => safe.id === selectedToSafeId) || null,
    [safes, selectedToSafeId],
  );

  const filteredFromSafes = useMemo(() => {
    const query = fromSafeSearch.trim().toLowerCase();
    if (!query) {
      return incomeSafes;
    }

    return incomeSafes.filter(safe => safe.name.toLowerCase().includes(query));
  }, [incomeSafes, fromSafeSearch]);

  const filteredToSafes = useMemo(() => {
    const query = toSafeSearch.trim().toLowerCase();
    if (!query) {
      return toSafes;
    }

    return toSafes.filter(safe => safe.name.toLowerCase().includes(query));
  }, [toSafes, toSafeSearch]);

  const formatCurrency = (value: number) => `${value.toLocaleString('ar-EG')} جنيه`;

  const formatDateTime = (value: string) => {
    try {
      return new Date(value).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
  };

  const getSafeType = (safe?: ISafe | null) => {
    if (!safe) return 'UNSPECIFIED';
    return (safe as any).type || safe.category || 'UNSPECIFIED';
  };

  const loadData = async (
    page = 1,
    search = searchQuery,
    limit = pagination.itemsPerPage,
    showLoader = true,
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const effectiveLimit = search.trim() ? 9999 : limit;

      const [safesResponse, entriesResponse] = await Promise.all([
        AuthService.getAllSafes(),
        AuthService.getFinancialEntries({
          page,
          limit: effectiveLimit,
          search: search.trim() || undefined,
        }),
      ]);

      const safeList = Array.isArray(safesResponse) ? safesResponse : [];
      setSafes(safeList);

      const entryList = Array.isArray(entriesResponse.data) ? entriesResponse.data : [];
      setEntries(entryList);

      if (entriesResponse.pagination) {
        setPagination(entriesResponse.pagination);
      } else {
        const totalItems = entriesResponse.total ?? entryList.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / effectiveLimit));
        setPagination({
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: effectiveLimit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          startItem: totalItems === 0 ? 0 : (page - 1) * effectiveLimit + 1,
          endItem: Math.min(page * effectiveLimit, totalItems),
        });
      }
    } catch (error) {
      console.error('Error loading financial entries:', error);
      Alert.alert('خطأ', 'فشل في تحميل القيود المالية');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void loadData(pagination.currentPage, searchQuery, pagination.itemsPerPage, false);
    });

    return unsubscribe;
  }, [navigation, pagination.currentPage, pagination.itemsPerPage, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(pagination.currentPage, searchQuery, pagination.itemsPerPage, false);
  };

  const handleCreateEntry = async () => {
    if (!selectedFromSafeId || !selectedToSafeId || !amount.trim() || !description.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال جميع بيانات القيد');
      return;
    }

    if (selectedFromSafeId === selectedToSafeId) {
      Alert.alert('تنبيه', 'لا يمكن إنشاء قيد من خزينة إلى نفس الخزينة');
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('تنبيه', 'يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    if (selectedFromSafe && selectedFromSafe.balance < numericAmount) {
      Alert.alert(
        'تنبيه',
        `الرصيد غير كافٍ في خزينة المصدر. الرصيد المتاح: ${formatCurrency(selectedFromSafe.balance)}`,
      );
      return;
    }

    try {
      setSubmitting(true);
      await AuthService.createFinancialEntry({
        fromSafeId: selectedFromSafeId,
        toSafeId: selectedToSafeId,
        amount: numericAmount,
        description: description.trim(),
      });

      Alert.alert('نجاح', 'تم إنشاء القيد المالي بنجاح');
      setShowCreateModal(false);
      setSelectedFromSafeId('');
      setSelectedToSafeId('');
      setFromSafeSearch('');
      setToSafeSearch('');
      setIsFromListOpen(false);
      setIsToListOpen(false);
      setAmount('');
      setDescription('');
      await loadData(1, searchQuery, pagination.itemsPerPage, false);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'فشل في إنشاء القيد المالي');
    } finally {
      setSubmitting(false);
    }
  };

  const renderEntryCard = (entry: IFinancialEntry) => {
    const fromType = getSafeType(entry.fromSafe);
    const toType = getSafeType(entry.toSafe);

    return (
      <View key={String(entry.id)} style={styles.entryCard}>
        <View style={styles.entryTopRow}>
          <Text style={styles.entryIdText}>#{entry.id}</Text>
          <Text style={styles.entryAmountText}>
            {canViewBalances ? formatCurrency(entry.amount) : 'لا توجد صلاحية'}
          </Text>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routeCell}>
            <View style={styles.routeLabelRow}>
              <View style={[styles.safeDot, { backgroundColor: SAFE_TYPE_COLORS[fromType] || '#94a3b8' }]} />
              <Text style={styles.routeLabel}>من</Text>
            </View>
            <Text style={styles.routeSafeName}>{entry.fromSafe?.name || '-'}</Text>
            <Text style={styles.routeSafeType}>{SAFE_TYPE_LABELS[fromType] || 'غير محدد'}</Text>
          </View>

          <Icon name="arrow-back" size={18} color="#94a3b8" />

          <View style={styles.routeCell}>
            <View style={styles.routeLabelRow}>
              <View style={[styles.safeDot, { backgroundColor: SAFE_TYPE_COLORS[toType] || '#94a3b8' }]} />
              <Text style={styles.routeLabel}>إلى</Text>
            </View>
            <Text style={styles.routeSafeName}>{entry.toSafe?.name || '-'}</Text>
            <Text style={styles.routeSafeType}>{SAFE_TYPE_LABELS[toType] || 'غير محدد'}</Text>
          </View>
        </View>

        {!!entry.description && <Text style={styles.entryDescription}>{entry.description}</Text>}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{formatDateTime(entry.createdAt)}</Text>
          <Text style={styles.metaText}>{entry.createdBy?.name || 'غير محدد'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomMenu navigation={navigation} activeRouteName="FinancialEntries" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color="#1a237e" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>القيود المالية</Text>
          <Text style={styles.headerSubtitle}>إدارة القيود المالية والتحويلات بين الخزائن</Text>
        </View>

        {canViewEntriesReport && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('FinancialEntriesReport')}
          >
            <Icon name="description" size={20} color="#1a237e" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.iconButton} onPress={() => setShowCreateModal(true)}>
          <Icon name="add" size={22} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchCard}>
        <View style={styles.searchInputWrap}>
          <Icon name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ابحث في القيود..."
            placeholderTextColor="#94a3b8"
            textAlign="right"
            onSubmitEditing={() => void loadData(1, searchQuery, pagination.itemsPerPage)}
          />
        </View>

        <View style={styles.searchActionsRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => void loadData(1, searchQuery, pagination.itemsPerPage)}
          >
            <Icon name="search" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>بحث</Text>
          </TouchableOpacity>

          {searchQuery.trim().length > 0 && (
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => {
                setSearchQuery('');
                void loadData(1, '', 10);
              }}
            >
              <Icon name="close" size={16} color="#475569" />
              <Text style={styles.ghostBtnText}>مسح</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a237e']} />}
      >
        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionTitle}>سجل القيود</Text>
          <Text style={styles.sectionCountText}>{pagination.totalItems} قيد</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل القيود المالية...</Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="receipt-long" size={56} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>لا توجد قيود مالية</Text>
            <Text style={styles.emptySubtitle}>ابدأ بإضافة قيد جديد بين الخزائن</Text>
          </View>
        ) : (
          entries.map(renderEntryCard)
        )}

        {!loading && entries.length > 0 && pagination.totalPages > 1 && (
          <View style={styles.paginationCard}>
            <TouchableOpacity
              style={[styles.pageBtn, !pagination.hasPreviousPage && styles.pageBtnDisabled]}
              disabled={!pagination.hasPreviousPage}
              onPress={() => void loadData(pagination.currentPage - 1, searchQuery, pagination.itemsPerPage)}
            >
              <Text style={styles.pageBtnText}>السابق</Text>
            </TouchableOpacity>

            <Text style={styles.pageInfoText}>
              صفحة {pagination.currentPage} من {pagination.totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.pageBtn, !pagination.hasNextPage && styles.pageBtnDisabled]}
              disabled={!pagination.hasNextPage}
              onPress={() => void loadData(pagination.currentPage + 1, searchQuery, pagination.itemsPerPage)}
            >
              <Text style={styles.pageBtnText}>التالي</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={showCreateModal} animationType="slide" transparent onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة قيد مالي</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Icon name="close" size={22} color="#1e293b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>من خزينة (خزائن الدخل)</Text>
              <TouchableOpacity
                style={styles.selectorTrigger}
                onPress={() => {
                  setIsFromListOpen(prev => !prev);
                  if (!isFromListOpen) {
                    setIsToListOpen(false);
                  }
                }}
              >
                <Icon name="account-balance-wallet" size={17} color="#64748b" />
                <Text style={[styles.selectorTriggerText, !selectedFromSafe && styles.selectorTriggerPlaceholder]}>
                  {selectedFromSafe ? selectedFromSafe.name : 'اختر خزينة المصدر'}
                </Text>
                <Icon name={isFromListOpen ? 'expand-less' : 'expand-more'} size={20} color="#64748b" />
              </TouchableOpacity>

              {isFromListOpen && (
                <View style={styles.selectorPanel}>
                  <View style={styles.selectorSearchInputWrap}>
                    <Icon name="search" size={16} color="#94a3b8" />
                    <TextInput
                      style={styles.selectorSearchInput}
                      value={fromSafeSearch}
                      onChangeText={setFromSafeSearch}
                      placeholder="ابحث في خزائن الدخل..."
                      placeholderTextColor="#94a3b8"
                      textAlign="right"
                    />
                  </View>

                  <ScrollView style={styles.selectorList} nestedScrollEnabled>
                    {filteredFromSafes.length === 0 ? (
                      <View style={styles.selectorItemEmpty}>
                        <Text style={styles.selectorItemEmptyText}>لا توجد خزائن مطابقة</Text>
                      </View>
                    ) : (
                      filteredFromSafes.map(safe => {
                        const selected = selectedFromSafeId === safe.id;
                        return (
                          <TouchableOpacity
                            key={safe.id}
                            style={[styles.selectorItem, selected && styles.selectorItemActive]}
                            onPress={() => {
                              setSelectedFromSafeId(safe.id);
                              if (selectedToSafeId === safe.id) {
                                setSelectedToSafeId('');
                              }
                              setIsFromListOpen(false);
                            }}
                          >
                            <Text style={styles.selectorItemName}>{safe.name}</Text>
                            {canViewBalances && (
                              <Text style={styles.selectorItemMeta}>{formatCurrency(safe.balance)}</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.inputLabel}>إلى خزينة</Text>
              <TouchableOpacity
                style={styles.selectorTrigger}
                onPress={() => {
                  setIsToListOpen(prev => !prev);
                  if (!isToListOpen) {
                    setIsFromListOpen(false);
                  }
                }}
              >
                <Icon name="payments" size={17} color="#64748b" />
                <Text style={[styles.selectorTriggerText, !selectedToSafe && styles.selectorTriggerPlaceholder]}>
                  {selectedToSafe ? selectedToSafe.name : 'اختر خزينة الوجهة'}
                </Text>
                <Icon name={isToListOpen ? 'expand-less' : 'expand-more'} size={20} color="#64748b" />
              </TouchableOpacity>

              {isToListOpen && (
                <View style={styles.selectorPanel}>
                  <View style={styles.selectorSearchInputWrap}>
                    <Icon name="search" size={16} color="#94a3b8" />
                    <TextInput
                      style={styles.selectorSearchInput}
                      value={toSafeSearch}
                      onChangeText={setToSafeSearch}
                      placeholder="ابحث في كل الخزائن..."
                      placeholderTextColor="#94a3b8"
                      textAlign="right"
                    />
                  </View>

                  <ScrollView style={styles.selectorList} nestedScrollEnabled>
                    {filteredToSafes.length === 0 ? (
                      <View style={styles.selectorItemEmpty}>
                        <Text style={styles.selectorItemEmptyText}>لا توجد خزائن مطابقة</Text>
                      </View>
                    ) : (
                      filteredToSafes.map(safe => {
                        const selected = selectedToSafeId === safe.id;
                        return (
                          <TouchableOpacity
                            key={safe.id}
                            style={[styles.selectorItem, selected && styles.selectorItemActive]}
                            onPress={() => {
                              setSelectedToSafeId(safe.id);
                              setIsToListOpen(false);
                            }}
                          >
                            <Text style={styles.selectorItemName}>{safe.name}</Text>
                            <Text style={styles.selectorItemMeta}>
                              {SAFE_TYPE_LABELS[getSafeType(safe)] || 'غير محدد'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.inputLabel}>المبلغ</Text>
              <TextInput
                style={styles.textInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="أدخل المبلغ"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                textAlign="right"
              />

              <Text style={styles.inputLabel}>وصف القيد</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="اكتب وصف القيد"
                placeholderTextColor="#94a3b8"
                textAlign="right"
                multiline
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateEntry} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="add-circle" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>تأكيد القيد</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    marginLeft: 6,
  },
  headerTextWrap: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
  searchCard: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0f172a',
  },
  searchActionsRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a237e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginLeft: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginRight: 6,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  ghostBtnText: {
    color: '#334155',
    fontWeight: '700',
    marginRight: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionCountText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  loadingText: {
    marginTop: 10,
    color: '#475569',
    fontWeight: '600',
  },
  emptyWrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    marginTop: 5,
    color: '#64748b',
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
  },
  entryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  entryIdText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  entryAmountText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '800',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeCell: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  routeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  safeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 6,
  },
  routeLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
  routeSafeName: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  routeSafeType: {
    marginTop: 2,
    fontSize: 10,
    color: '#64748b',
  },
  entryDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  metaRow: {
    marginTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
  },
  paginationCard: {
    marginBottom: 20,
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageBtn: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    color: '#1e293b',
    fontWeight: '700',
  },
  pageInfoText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 17,
    color: '#0f172a',
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 8,
  },
  selectorTrigger: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorTriggerText: {
    flex: 1,
    marginHorizontal: 8,
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
  },
  selectorTriggerPlaceholder: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  selectorPanel: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 8,
  },
  selectorSearchInputWrap: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 8,
  },
  selectorList: {
    maxHeight: 180,
    marginTop: 8,
  },
  selectorItem: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    marginBottom: 6,
  },
  selectorItemActive: {
    borderColor: '#1a237e',
    backgroundColor: '#eef2ff',
  },
  selectorItemName: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  selectorItemMeta: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  selectorItemEmpty: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectorItemEmptyText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  pillsRow: {
    paddingBottom: 4,
  },
  safePill: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    minWidth: 120,
  },
  safePillActive: {
    borderColor: '#1a237e',
    backgroundColor: '#eef2ff',
  },
  safePillText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  safePillTextActive: {
    color: '#1a237e',
  },
  safePillAmount: {
    marginTop: 3,
    color: '#059669',
    fontWeight: '700',
    fontSize: 11,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
    fontSize: 14,
  },
  textArea: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 16,
    marginBottom: 14,
    backgroundColor: '#1a237e',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 12,
  },
  submitBtnText: {
    marginRight: 6,
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default FinancialEntriesScreen;
