import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import DatePickerModal from '../components/DatePickerModal';
import AuthService from '../services/AuthService';
import { IFinancialEntry } from '../types/student';
import { usePermissions } from '../hooks/usePermissions';

interface FinancialEntriesReportScreenProps {
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

const FinancialEntriesReportScreen = ({ navigation }: FinancialEntriesReportScreenProps) => {
  const { hasPermission } = usePermissions();

  const [entries, setEntries] = useState<IFinancialEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'today' | 'custom'>('today');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [pickerType, setPickerType] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const canViewBalances = hasPermission('finances.safes.balances', 'view');

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

  const getSafeType = (safe?: any) => safe?.type || safe?.category || 'UNSPECIFIED';

  const loadReport = async () => {
    try {
      setLoading(true);

      const params: {
        limit: number;
        dateFrom?: string;
        dateTo?: string;
      } = {
        limit: 1000,
      };

      if (reportType === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        params.dateFrom = start.toISOString();
        params.dateTo = end.toISOString();
      }

      if (reportType === 'custom') {
        if (!dateFrom || !dateTo) {
          Alert.alert('تنبيه', 'يرجى تحديد الفترة الزمنية');
          return;
        }

        const start = new Date(dateFrom);
        start.setHours(0, 0, 0, 0);

        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);

        params.dateFrom = start.toISOString();
        params.dateTo = end.toISOString();
      }

      const response = await AuthService.getFinancialEntries(params);
      setEntries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading financial entries report:', error);
      Alert.alert('خطأ', 'فشل في تحميل تقرير القيود المالية');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return entries;

    return entries.filter(entry => {
      const id = String(entry.id || '');
      const amount = String(entry.amount || '');
      const description = (entry.description || '').toLowerCase();
      const fromName = (entry.fromSafe?.name || '').toLowerCase();
      const toName = (entry.toSafe?.name || '').toLowerCase();
      const fromType = (SAFE_TYPE_LABELS[getSafeType(entry.fromSafe)] || '').toLowerCase();
      const toType = (SAFE_TYPE_LABELS[getSafeType(entry.toSafe)] || '').toLowerCase();
      const userName = (entry.createdBy?.name || '').toLowerCase();
      const dateValue = formatDateTime(entry.createdAt).toLowerCase();

      return (
        id.includes(query) ||
        amount.includes(query) ||
        description.includes(query) ||
        fromName.includes(query) ||
        toName.includes(query) ||
        fromType.includes(query) ||
        toType.includes(query) ||
        userName.includes(query) ||
        dateValue.includes(query)
      );
    });
  }, [entries, searchQuery]);

  const stats = useMemo(() => {
    const totalEntries = filteredEntries.length;
    const totalAmount = filteredEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const averageAmount = totalEntries > 0 ? totalAmount / totalEntries : 0;

    return {
      totalEntries,
      totalAmount,
      averageAmount,
    };
  }, [filteredEntries]);

  const handlePrint = async () => {
    try {
      const baseUrl = await AuthService.getCurrentApiBaseUrl();
      const params = new URLSearchParams();

      if (reportType === 'today') {
        params.append('type', 'today');
      } else {
        if (!dateFrom || !dateTo) {
          Alert.alert('تنبيه', 'يرجى تحديد الفترة الزمنية قبل الطباعة');
          return;
        }
        params.append('type', 'custom');
        params.append('dateFrom', dateFrom.toISOString().split('T')[0]);
        params.append('dateTo', dateTo.toISOString().split('T')[0]);
      }

      const printUrl = `${baseUrl}/print/financial-entries?${params.toString()}`;
      const canOpen = await Linking.canOpenURL(printUrl);
      if (!canOpen) {
        Alert.alert('خطأ', 'تعذر فتح رابط الطباعة على هذا الجهاز');
        return;
      }

      await Linking.openURL(printUrl);
    } catch (error) {
      console.error('Error opening financial entries print:', error);
      Alert.alert('خطأ', 'فشل في فتح تقرير الطباعة');
    }
  };

  return (
    <View style={styles.container}>
      <CustomMenu navigation={navigation} activeRouteName="FinancialEntries" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color="#1a237e" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>تقارير القيود المالية</Text>
          <Text style={styles.headerSubtitle}>عرض وتحليل وطباعة القيود المالية</Text>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={handlePrint} disabled={entries.length === 0}>
          <Icon name="print" size={20} color={entries.length === 0 ? '#94a3b8' : '#1a237e'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.filtersCard}>
          <Text style={styles.cardTitle}>فلترة التقرير</Text>

          <View style={styles.reportTypeRow}>
            <TouchableOpacity
              style={[styles.reportTypeBtn, reportType === 'today' && styles.reportTypeBtnActive]}
              onPress={() => setReportType('today')}
            >
              <Text style={[styles.reportTypeText, reportType === 'today' && styles.reportTypeTextActive]}>
                قيود اليوم
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

          <TouchableOpacity style={styles.primaryBtn} onPress={loadReport} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="filter-list" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>عرض التقرير</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {!loading && entries.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي القيود</Text>
              <Text style={styles.statValue}>{stats.totalEntries}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>إجمالي المبالغ</Text>
              <Text style={styles.statValue}>
                {canViewBalances ? formatCurrency(stats.totalAmount) : 'لا توجد صلاحية'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>متوسط القيد</Text>
              <Text style={styles.statValue}>
                {canViewBalances ? formatCurrency(stats.averageAmount) : 'لا توجد صلاحية'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.searchCard}>
          <Icon name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ابحث في القيود..."
            placeholderTextColor="#94a3b8"
            textAlign="right"
          />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل التقرير...</Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="description" size={54} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>لا توجد قيود في الفترة المحددة</Text>
          </View>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="search-off" size={54} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>لا توجد نتائج مطابقة للبحث</Text>
          </View>
        ) : (
          filteredEntries.map((entry) => {
            const fromType = getSafeType(entry.fromSafe);
            const toType = getSafeType(entry.toSafe);

            return (
              <View key={String(entry.id)} style={styles.entryCard}>
                <View style={styles.entryTopRow}>
                  <Text style={styles.entryId}>#{entry.id}</Text>
                  <Text style={styles.entryAmount}>
                    {canViewBalances ? formatCurrency(entry.amount) : 'لا توجد صلاحية'}
                  </Text>
                </View>

                <View style={styles.routeRow}>
                  <View style={styles.routeCell}>
                    <View style={styles.routeLabelRow}>
                      <View style={[styles.safeDot, { backgroundColor: SAFE_TYPE_COLORS[fromType] || '#94a3b8' }]} />
                      <Text style={styles.routeLabel}>من</Text>
                    </View>
                    <Text style={styles.routeName}>{entry.fromSafe?.name || '-'}</Text>
                    <Text style={styles.routeType}>{SAFE_TYPE_LABELS[fromType] || 'غير محدد'}</Text>
                  </View>

                  <Icon name="arrow-back" size={18} color="#94a3b8" />

                  <View style={styles.routeCell}>
                    <View style={styles.routeLabelRow}>
                      <View style={[styles.safeDot, { backgroundColor: SAFE_TYPE_COLORS[toType] || '#94a3b8' }]} />
                      <Text style={styles.routeLabel}>إلى</Text>
                    </View>
                    <Text style={styles.routeName}>{entry.toSafe?.name || '-'}</Text>
                    <Text style={styles.routeType}>{SAFE_TYPE_LABELS[toType] || 'غير محدد'}</Text>
                  </View>
                </View>

                {!!entry.description && <Text style={styles.entryDescription}>{entry.description}</Text>}

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{formatDateTime(entry.createdAt)}</Text>
                  <Text style={styles.metaText}>{entry.createdBy?.name || 'غير محدد'}</Text>
                </View>
              </View>
            );
          })
        )}
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
  },
  headerTextWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#64748b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
  },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 10,
  },
  reportTypeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  reportTypeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginLeft: 8,
  },
  reportTypeBtnActive: {
    borderColor: '#1a237e',
    backgroundColor: '#eef2ff',
  },
  reportTypeText: {
    color: '#334155',
    fontWeight: '700',
  },
  reportTypeTextActive: {
    color: '#1a237e',
  },
  dateRow: {
    marginBottom: 10,
  },
  dateBtn: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  dateBtnText: {
    color: '#334155',
    fontWeight: '600',
  },
  primaryBtn: {
    marginTop: 2,
    backgroundColor: '#1a237e',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 11,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginRight: 6,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  statValue: {
    marginTop: 4,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '800',
  },
  searchCard: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#0f172a',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
    marginBottom: 12,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
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
  entryId: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 12,
  },
  entryAmount: {
    color: '#059669',
    fontWeight: '800',
    fontSize: 14,
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
  routeName: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  routeType: {
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
});

export default FinancialEntriesReportScreen;
