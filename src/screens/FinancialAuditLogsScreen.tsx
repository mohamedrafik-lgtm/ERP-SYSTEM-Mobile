import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import DatePickerModal from '../components/DatePickerModal';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  amount?: number;
  currency?: string;
  userName: string;
  userId: string;
  userRole?: string;
  createdAt: string;
  oldData?: any;
  newData?: any;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
};

type AuditStats = {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  monthLogs: number;
  userStats?: Array<{ userId: string; userName: string; _count: number }>;
};

const actionOptions = [
  { value: '', label: 'جميع العمليات' },
  { value: 'SAFE_CREATE', label: 'إنشاء خزينة' },
  { value: 'SAFE_UPDATE', label: 'تحديث خزينة' },
  { value: 'SAFE_DELETE', label: 'حذف خزينة' },
  { value: 'SAFE_BALANCE_UPDATE', label: 'تحديث رصيد خزينة' },
  { value: 'FEE_CREATE', label: 'إنشاء رسوم' },
  { value: 'FEE_UPDATE', label: 'تحديث رسوم' },
  { value: 'FEE_DELETE', label: 'حذف رسوم' },
  { value: 'FEE_APPLY', label: 'تطبيق رسوم' },
  { value: 'FEE_CANCEL', label: 'إلغاء رسوم' },
  { value: 'PAYMENT_CREATE', label: 'تسجيل دفعة' },
  { value: 'PAYMENT_UPDATE', label: 'تحديث دفعة' },
  { value: 'PAYMENT_DELETE', label: 'حذف دفعة' },
  { value: 'PAYMENT_STATUS_CHANGE', label: 'تغيير حالة دفعة' },
  { value: 'PAYMENT_REVERSE', label: 'التراجع عن دفعة' },
  { value: 'TRANSACTION_CREATE', label: 'إنشاء معاملة' },
  { value: 'TRANSACTION_UPDATE', label: 'تحديث معاملة' },
  { value: 'TRANSACTION_DELETE', label: 'حذف معاملة' },
  { value: 'TRANSACTION_REVERSE', label: 'التراجع عن معاملة' },
  { value: 'BULK_OPERATION', label: 'عملية مجمعة' },
  { value: 'DATA_IMPORT', label: 'استيراد بيانات' },
  { value: 'DATA_EXPORT', label: 'تصدير بيانات' },
  { value: 'SYSTEM_ADJUSTMENT', label: 'تعديل نظام' },
];

const entityOptions = [
  { value: '', label: 'كل الكيانات' },
  { value: 'Safe', label: 'خزينة' },
  { value: 'TraineeFee', label: 'رسوم متدربين' },
  { value: 'TraineePayment', label: 'مدفوعات متدربين' },
  { value: 'Transaction', label: 'معاملة مالية' },
];

const actionLabelMap: Record<string, string> = {
  SAFE_CREATE: 'إنشاء خزينة',
  SAFE_UPDATE: 'تحديث خزينة',
  SAFE_DELETE: 'حذف خزينة',
  SAFE_BALANCE_UPDATE: 'تحديث رصيد خزينة',
  FEE_CREATE: 'إنشاء رسوم',
  FEE_UPDATE: 'تحديث رسوم',
  FEE_DELETE: 'حذف رسوم',
  FEE_APPLY: 'تطبيق رسوم',
  FEE_CANCEL: 'إلغاء رسوم',
  PAYMENT_CREATE: 'تسجيل دفعة',
  PAYMENT_UPDATE: 'تحديث دفعة',
  PAYMENT_DELETE: 'حذف دفعة',
  PAYMENT_STATUS_CHANGE: 'تغيير حالة دفعة',
  PAYMENT_REVERSE: 'التراجع عن دفعة',
  TRANSACTION_CREATE: 'إنشاء معاملة',
  TRANSACTION_UPDATE: 'تحديث معاملة',
  TRANSACTION_DELETE: 'حذف معاملة',
  TRANSACTION_REVERSE: 'التراجع عن معاملة',
  BULK_OPERATION: 'عملية مجمعة',
  DATA_IMPORT: 'استيراد بيانات',
  DATA_EXPORT: 'تصدير بيانات',
  SYSTEM_ADJUSTMENT: 'تعديل نظام',
};

const entityLabelMap: Record<string, string> = {
  Safe: 'خزينة',
  TraineeFee: 'رسوم متدربين',
  TraineePayment: 'مدفوعات متدربين',
  Transaction: 'معاملة مالية',
};

const roleLabelMap: Record<string, string> = {
  super_admin: 'مدير عام',
  admin: 'مدير النظام',
  manager: 'مدير',
  accountant: 'محاسب',
  employee: 'موظف',
  instructor: 'مدرب',
  trainee_entry_clerk: 'موظف إدخال بيانات',
};

const fieldLabelMap: Record<string, string> = {
  action: 'العملية',
  entityType: 'نوع الكيان',
  entityId: 'معرف الكيان',
  userName: 'اسم المستخدم',
  userRole: 'دور المستخدم',
  amount: 'المبلغ',
  currency: 'العملة',
  description: 'الوصف',
  notes: 'ملاحظات',
  status: 'الحالة',
  type: 'النوع',
  createdAt: 'تاريخ الإنشاء',
  updatedAt: 'تاريخ التحديث',
  oldData: 'البيانات القديمة',
  newData: 'البيانات الجديدة',
  changes: 'التغييرات',
};

const authService = AuthService as any;

const FinancialAuditLogsScreen = ({ navigation }: any) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showFilters, setShowFilters] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const [datePickerType, setDatePickerType] = useState<'from' | 'to' | null>(null);

  const userOptions = useMemo(() => {
    const users = stats?.userStats || [];
    return [
      { value: '', label: 'جميع المستخدمين' },
      ...users.map((u) => ({ value: u.userId, label: `${u.userName} (${u._count})` })),
    ];
  }, [stats]);

  const activeFiltersCount = [actionFilter, entityFilter, userFilter, dateFrom, dateTo].filter(Boolean).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMoney = (amount?: number, currency?: string) => {
    if (typeof amount !== 'number') {
      return '-';
    }
    const currencyLabel = currency === 'EGP' || !currency ? 'ج.م' : currency;
    return `${amount.toLocaleString('ar-EG')} ${currencyLabel}`;
  };

  const getActionLabel = (action: string) => actionLabelMap[action] || action;
  const getEntityLabel = (entity: string) => entityLabelMap[entity] || entity;
  const getRoleLabel = (role?: string) => {
    if (!role) return '-';
    return roleLabelMap[role] || role;
  };

  const getActionTone = (action: string) => {
    if (action.includes('DELETE') || action.includes('REVERSE') || action.includes('CANCEL')) {
      return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', icon: 'remove-circle-outline' };
    }
    if (action.includes('CREATE') || action.includes('APPLY')) {
      return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', icon: 'check-circle-outline' };
    }
    if (action.includes('UPDATE') || action.includes('CHANGE') || action.includes('BALANCE')) {
      return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', icon: 'edit-note' };
    }
    return { bg: '#f8fafc', text: '#334155', border: '#e2e8f0', icon: 'tune' };
  };

  const localizeObject = (input: any): any => {
    if (Array.isArray(input)) {
      return input.map((item) => localizeObject(item));
    }
    if (input && typeof input === 'object') {
      const result: Record<string, any> = {};
      Object.entries(input).forEach(([key, value]) => {
        const nextKey = fieldLabelMap[key] || key;
        result[nextKey] = localizeObject(value);
      });
      return result;
    }
    if (typeof input === 'string') {
      if (actionLabelMap[input]) return actionLabelMap[input];
      if (entityLabelMap[input]) return entityLabelMap[input];
      if (roleLabelMap[input]) return roleLabelMap[input];
      if (input === 'EGP') return 'ج.م';
    }
    return input;
  };

  const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}T/.test(value);

  const formatDisplayValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'نعم' : 'لا';
    }

    if (typeof value === 'number') {
      return value.toLocaleString('ar-EG');
    }

    if (typeof value === 'string') {
      if (actionLabelMap[value]) return actionLabelMap[value];
      if (entityLabelMap[value]) return entityLabelMap[value];
      if (roleLabelMap[value]) return roleLabelMap[value];
      if (value === 'EGP') return 'ج.م';
      if (isIsoDate(value)) return formatDate(value);
      return value;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return 'لا يوجد';
      const allPrimitive = value.every(
        (item) => ['string', 'number', 'boolean'].includes(typeof item) || item == null,
      );
      if (allPrimitive) {
        return value.map((item) => formatDisplayValue(item)).join('، ');
      }
      return `${value.length} عنصر`;
    }

    return 'بيانات مركبة';
  };

  const toDisplayEntries = (data: any): Array<{ key: string; value: string }> => {
    if (!data || typeof data !== 'object') {
      return [];
    }

    const localized = localizeObject(data);

    if (Array.isArray(localized)) {
      return localized.slice(0, 20).map((item, index) => ({
        key: `عنصر ${index + 1}`,
        value: formatDisplayValue(item),
      }));
    }

    return Object.entries(localized)
      .slice(0, 30)
      .map(([key, value]) => ({
        key,
        value: formatDisplayValue(value),
      }));
  };

  const renderDataSection = (title: string, data: any, tone: 'red' | 'green' | 'amber') => {
    const entries = toDisplayEntries(data);
    const toneStyle =
      tone === 'red'
        ? styles.sectionToneRed
        : tone === 'green'
        ? styles.sectionToneGreen
        : styles.sectionToneAmber;

    return (
      <View style={[styles.detailSectionCard, toneStyle]}>
        <Text style={styles.detailSectionTitle}>{title}</Text>
        {entries.length === 0 ? (
          <Text style={styles.detailEmptyText}>لا توجد بيانات لعرضها</Text>
        ) : (
          entries.map((entry) => (
            <View key={`${title}-${entry.key}`} style={styles.detailRowItem}>
              <Text style={styles.detailRowKey}>{entry.key}</Text>
              <Text style={styles.detailRowValue}>{entry.value}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const fetchLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const response = await authService.getFinancialAuditLogs({
        page,
        limit,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        userId: userFilter || undefined,
        dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
        dateTo: dateTo ? dateTo.toISOString() : undefined,
      });

      const nextLogs = Array.isArray(response?.logs) ? response.logs : [];
      setLogs(nextLogs);
      setTotal(Number(response?.total || 0));
      setTotalPages(Number(response?.totalPages || 0));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'فشل جلب سجل العمليات',
        text2: error?.message || 'حدث خطأ غير متوقع',
        position: 'bottom',
      });
    } finally {
      setLoadingLogs(false);
      setRefreshing(false);
    }
  }, [actionFilter, dateFrom, dateTo, entityFilter, limit, page, userFilter]);

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await authService.getFinancialAuditStatistics();
      setStats(data || null);
    } catch (error) {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
    fetchStats();
  };

  const resetFilters = () => {
    setActionFilter('');
    setEntityFilter('');
    setUserFilter('');
    setDateFrom(null);
    setDateTo(null);
    setPage(1);
  };

  const changeLimit = (next: string) => {
    const parsed = Number(next);
    if (!Number.isNaN(parsed)) {
      setLimit(parsed);
      setPage(1);
    }
  };

  const limitOptions = [
    { value: '10', label: '10' },
    { value: '20', label: '20' },
    { value: '50', label: '50' },
    { value: '100', label: '100' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="FinancialAuditLogs" />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>سجل العمليات</Text>
            <Text style={styles.subtitle}>تتبع كامل لجميع العمليات المالية</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Icon name="refresh" size={22} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Icon name="shield" size={24} color="#ffffff" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>لوحة تتبع العمليات المالية</Text>
            <Text style={styles.heroDesc}>تابع كل إجراء مالي بالوقت والمستخدم والمبلغ مع إمكانية الفلترة السريعة.</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Text style={styles.statLabel}>إجمالي العمليات</Text>
            <Text style={styles.statValue}>{loadingStats ? '...' : (stats?.totalLogs || 0).toLocaleString('ar-EG')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <Text style={styles.statLabel}>عمليات اليوم</Text>
            <Text style={styles.statValue}>{loadingStats ? '...' : (stats?.todayLogs || 0).toLocaleString('ar-EG')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAmber]}>
            <Text style={styles.statLabel}>هذا الأسبوع</Text>
            <Text style={styles.statValue}>{loadingStats ? '...' : (stats?.weekLogs || 0).toLocaleString('ar-EG')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardViolet]}>
            <Text style={styles.statLabel}>هذا الشهر</Text>
            <Text style={styles.statValue}>{loadingStats ? '...' : (stats?.monthLogs || 0).toLocaleString('ar-EG')}</Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(prev => !prev)}>
            <Icon name="filter-list" size={18} color="#1d4ed8" />
            <Text style={styles.filterToggleText}>الفلاتر</Text>
            {activeFiltersCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFiltersCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {activeFiltersCount > 0 ? (
            <TouchableOpacity style={styles.resetFiltersButton} onPress={resetFilters}>
              <Icon name="close" size={16} color="#dc2626" />
              <Text style={styles.resetFiltersText}>مسح</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {showFilters ? (
          <View style={styles.filtersCard}>
            <SelectBox<string>
              label="نوع العملية"
              selectedValue={actionFilter}
              onValueChange={(val) => {
                setActionFilter(val);
                setPage(1);
              }}
              items={actionOptions}
              placeholder="جميع العمليات"
            />

            <SelectBox<string>
              label="نوع الكيان"
              selectedValue={entityFilter}
              onValueChange={(val) => {
                setEntityFilter(val);
                setPage(1);
              }}
              items={entityOptions}
              placeholder="كل الكيانات"
            />

            <SelectBox<string>
              label="المستخدم"
              selectedValue={userFilter}
              onValueChange={(val) => {
                setUserFilter(val);
                setPage(1);
              }}
              items={userOptions}
              placeholder="جميع المستخدمين"
            />

            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setDatePickerType('from')}
              >
                <Icon name="event" size={16} color="#475569" />
                <Text style={styles.dateButtonText}>
                  {dateFrom ? dateFrom.toLocaleDateString('ar-EG') : 'من تاريخ'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setDatePickerType('to')}
              >
                <Icon name="event" size={16} color="#475569" />
                <Text style={styles.dateButtonText}>
                  {dateTo ? dateTo.toLocaleDateString('ar-EG') : 'إلى تاريخ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>السجلات</Text>
          <Text style={styles.tableMeta}>{total.toLocaleString('ar-EG')} عملية</Text>
        </View>

        {loadingLogs ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل سجل العمليات...</Text>
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="history" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>لا توجد عمليات مطابقة</Text>
          </View>
        ) : (
          logs.map((log) => (
            <TouchableOpacity
              key={log.id}
              style={styles.logCard}
              onPress={() => setSelectedLog(log)}
            >
              <View style={styles.logTopRow}>
                <View style={[styles.actionBadge, {
                  backgroundColor: getActionTone(log.action).bg,
                  borderColor: getActionTone(log.action).border,
                }]}> 
                  <Icon name={getActionTone(log.action).icon} size={12} color={getActionTone(log.action).text} />
                  <Text style={[styles.logAction, { color: getActionTone(log.action).text }]}>{getActionLabel(log.action)}</Text>
                </View>
                <Text style={styles.logDate}>{formatDate(log.createdAt)}</Text>
              </View>

              <Text style={styles.logDesc} numberOfLines={2}>{log.description || 'بدون وصف'}</Text>

              <View style={styles.logBottomRow}>
                <Text style={styles.logMeta}>{getEntityLabel(log.entityType)}</Text>
                <Text style={styles.logMeta}>{log.userName}</Text>
                <Text style={styles.logMoney}>{formatMoney(log.amount, log.currency)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {total > 0 ? (
          <View style={styles.paginationCard}>
            <View style={styles.paginationHeader}>
              <Text style={styles.paginationInfo}>صفحة {page} من {Math.max(1, totalPages)}</Text>
              <View style={styles.limitWrap}>
                <SelectBox<string>
                  label="عدد العناصر"
                  selectedValue={String(limit)}
                  onValueChange={changeLimit}
                  items={limitOptions}
                  placeholder="20"
                />
              </View>
            </View>
            <View style={styles.paginationButtons}>
              <TouchableOpacity
                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                disabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                <Text style={styles.pageBtnText}>السابق</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pageBtn, (totalPages === 0 || page >= totalPages) && styles.pageBtnDisabled]}
                disabled={totalPages === 0 || page >= totalPages}
                onPress={() => setPage((p) => p + 1)}
              >
                <Text style={styles.pageBtnText}>التالي</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <DatePickerModal
        visible={datePickerType === 'from'}
        onClose={() => setDatePickerType(null)}
        onConfirm={(date) => {
          setDateFrom(date);
          setPage(1);
          setDatePickerType(null);
        }}
        initialDate={dateFrom}
        title="اختر تاريخ البداية"
      />

      <DatePickerModal
        visible={datePickerType === 'to'}
        onClose={() => setDatePickerType(null)}
        onConfirm={(date) => {
          setDateTo(date);
          setPage(1);
          setDatePickerType(null);
        }}
        initialDate={dateTo}
        title="اختر تاريخ النهاية"
      />

      <Modal
        visible={!!selectedLog}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLog(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تفاصيل العملية</Text>
              <TouchableOpacity onPress={() => setSelectedLog(null)}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedLog ? (
                <>
                  <View style={styles.quickBadgesRow}>
                    <View style={[styles.quickBadge, { backgroundColor: getActionTone(selectedLog.action).bg }]}>
                      <Text style={[styles.quickBadgeText, { color: getActionTone(selectedLog.action).text }]}>
                        {getActionLabel(selectedLog.action)}
                      </Text>
                    </View>
                    <View style={styles.quickBadgeSecondary}>
                      <Text style={styles.quickBadgeSecondaryText}>{getEntityLabel(selectedLog.entityType)}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailMiniCard}>
                      <Text style={styles.detailMiniLabel}>معرف العملية</Text>
                      <Text style={styles.detailMiniValue}>{selectedLog.id}</Text>
                    </View>
                    <View style={styles.detailMiniCard}>
                      <Text style={styles.detailMiniLabel}>تاريخ التنفيذ</Text>
                      <Text style={styles.detailMiniValue}>{formatDate(selectedLog.createdAt)}</Text>
                    </View>
                    <View style={styles.detailMiniCard}>
                      <Text style={styles.detailMiniLabel}>المبلغ</Text>
                      <Text style={styles.detailMiniValue}>{formatMoney(selectedLog.amount, selectedLog.currency)}</Text>
                    </View>
                    <View style={styles.detailMiniCard}>
                      <Text style={styles.detailMiniLabel}>معرف الكيان</Text>
                      <Text style={styles.detailMiniValue}>{selectedLog.entityId || '-'}</Text>
                    </View>
                  </View>

                  <View style={styles.userCard}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{selectedLog.userName?.charAt(0) || '?'}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{selectedLog.userName}</Text>
                      <Text style={styles.userRole}>الدور: {getRoleLabel(selectedLog.userRole)}</Text>
                      <Text style={styles.userTech}>عنوان IP: {selectedLog.ipAddress || '-'}</Text>
                    </View>
                  </View>

                  <View style={styles.descriptionCard}>
                    <Text style={styles.descriptionTitle}>وصف العملية</Text>
                    <Text style={styles.descriptionText}>{selectedLog.description || 'لا يوجد وصف تفصيلي'}</Text>
                    <Text style={styles.userAgentText}>{selectedLog.userAgent || '-'}</Text>
                  </View>

                  {renderDataSection('التغييرات', selectedLog.changes, 'amber')}
                  {renderDataSection('البيانات القديمة', selectedLog.oldData, 'red')}
                  {renderDataSection('البيانات الجديدة', selectedLog.newData, 'green')}
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  titleContainer: { flex: 1 },
  title: { fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'right' },
  subtitle: { fontSize: 12, color: '#64748b', textAlign: 'right', marginTop: 2 },
  content: { flex: 1 },
  contentContainer: { padding: 14, gap: 12, paddingBottom: 28 },
  heroCard: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#1e40af',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#1d4ed8',
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff', textAlign: 'right' },
  heroDesc: { fontSize: 11, color: '#dbeafe', textAlign: 'right', marginTop: 3, lineHeight: 17 },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  statCard: {
    width: '48.8%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
  },
  statCardPrimary: { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
  statCardBlue: { borderColor: '#c7d2fe', backgroundColor: '#eef2ff' },
  statCardAmber: { borderColor: '#fde68a', backgroundColor: '#fffbeb' },
  statCardViolet: { borderColor: '#ddd6fe', backgroundColor: '#f5f3ff' },
  statLabel: { fontSize: 12, color: '#64748b', textAlign: 'right' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 6, textAlign: 'right' },
  topActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterToggleText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  resetFiltersButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resetFiltersText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  filtersCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  dateButtonText: { fontSize: 13, color: '#334155', fontWeight: '600' },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  tableMeta: { fontSize: 12, color: '#64748b' },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, gap: 10 },
  loadingText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: { fontSize: 13, color: '#64748b', fontWeight: '700' },
  logCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 11,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  logTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionBadge: {
    maxWidth: '66%',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logAction: { fontSize: 11, fontWeight: '800' },
  logDate: { fontSize: 11, color: '#64748b' },
  logDesc: { fontSize: 12, color: '#334155', lineHeight: 18 },
  logBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logMeta: { fontSize: 11, color: '#64748b', maxWidth: '32%' },
  logMoney: { fontSize: 11, fontWeight: '700', color: '#0f766e', maxWidth: '32%' },
  paginationCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  paginationHeader: { gap: 6 },
  paginationInfo: { fontSize: 12, color: '#475569', fontWeight: '700', textAlign: 'right' },
  limitWrap: { marginTop: 2 },
  paginationButtons: { flexDirection: 'row', gap: 8 },
  pageBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d4ed8',
  },
  pageBtnDisabled: { backgroundColor: '#cbd5e1' },
  pageBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  modalBody: { padding: 14 },
  quickBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  quickBadgeSecondary: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
  },
  quickBadgeSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  detailsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  detailMiniCard: {
    width: '48.8%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 9,
  },
  detailMiniLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 3,
    textAlign: 'right',
  },
  detailMiniValue: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '700',
    textAlign: 'right',
  },
  userCard: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e1b4b',
    textAlign: 'right',
  },
  userRole: {
    marginTop: 2,
    fontSize: 11,
    color: '#3730a3',
    textAlign: 'right',
  },
  userTech: {
    marginTop: 2,
    fontSize: 10,
    color: '#4f46e5',
    textAlign: 'right',
  },
  descriptionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  descriptionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 5,
    textAlign: 'right',
  },
  descriptionText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    textAlign: 'right',
  },
  userAgentText: {
    marginTop: 8,
    fontSize: 10,
    color: '#64748b',
    textAlign: 'right',
  },
  detailSectionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  sectionToneRed: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  sectionToneGreen: {
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
  },
  sectionToneAmber: {
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 8,
  },
  detailEmptyText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'right',
  },
  detailRowItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.22)',
    paddingTop: 6,
    marginTop: 6,
  },
  detailRowKey: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 2,
    textAlign: 'right',
  },
  detailRowValue: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '700',
    textAlign: 'right',
  },
});

export default FinancialAuditLogsScreen;
