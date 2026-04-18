import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import { usePermissions } from '../hooks/usePermissions';
import {
  PaymentSchedule,
  TraineeFee,
  NonPaymentAction,
  NON_PAYMENT_ACTION_LABELS,
} from '../types/paymentSchedules';

interface Program {
  id: number;
  nameAr: string;
  nameEn: string;
  price: number;
}

interface PaymentScheduleDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      program: Program;
    };
  };
}

const PAYMENT_SCHEDULES_RESOURCE = 'dashboard.financial.payment-schedules';

const ACTION_ICON_MAP: Record<string, string> = {
  DISABLE_ATTENDANCE: 'event-busy',
  DISABLE_PLATFORM: 'desktop-access-disabled',
  DISABLE_QUIZZES: 'quiz',
  DISABLE_ALL: 'block',
};

const PaymentScheduleDetailsScreen = ({ navigation, route }: PaymentScheduleDetailsScreenProps) => {
  const { program } = route.params;
  const { canManage } = usePermissions();

  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [fees, setFees] = useState<TraineeFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManageSchedules = canManage(PAYMENT_SCHEDULES_RESOURCE);

  const parseNonPaymentActions = (actions: unknown): string[] => {
    if (!actions) {
      return [];
    }

    if (Array.isArray(actions)) {
      return actions.filter((item): item is string => typeof item === 'string');
    }

    if (typeof actions === 'string') {
      try {
        const parsed = JSON.parse(actions);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string');
        }
      } catch {
        return [];
      }
    }

    return [];
  };

  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const [allSchedules, allFees] = await Promise.all([
        AuthService.getPaymentSchedules({ programId: program.id }),
        AuthService.getAllTraineeFees(),
      ]);

      const programFees = (allFees || []).filter(
        (fee: any) => Number(fee.programId) === Number(program.id),
      );

      const allowedFeeIds = new Set(programFees.map((fee: TraineeFee) => fee.id));
      const programSchedules = (allSchedules || []).filter((schedule: PaymentSchedule) =>
        allowedFeeIds.has(schedule.feeId),
      );

      setFees(programFees as TraineeFee[]);
      setSchedules(programSchedules as PaymentSchedule[]);
    } catch (error) {
      console.error('Error loading payment schedule details:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ في تحميل البيانات',
        text2: 'تعذر تحميل الرسوم أو مواعيد السداد',
      });
      setFees([]);
      setSchedules([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [program.id]);

  useFocusEffect(
    useCallback(() => {
      void loadData(true);
    }, [loadData]),
  );

  const schedulesByFeeId = useMemo(() => {
    const map = new Map<number, PaymentSchedule>();
    schedules.forEach(schedule => {
      map.set(schedule.feeId, schedule);
    });
    return map;
  }, [schedules]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadData(false);
  };

  const handleAddSchedule = (preselectedFeeId?: number) => {
    navigation.navigate('AddPaymentSchedule', {
      mode: 'create',
      program,
      fees,
      preselectedFeeId,
      scheduledFeeIds: schedules.map(schedule => schedule.feeId),
    });
  };

  const handleEditSchedule = (schedule: PaymentSchedule, fee: TraineeFee) => {
    navigation.navigate('AddPaymentSchedule', {
      mode: 'edit',
      program,
      fees,
      schedule: {
        ...schedule,
        fee: schedule.fee || fee,
      },
    });
  };

  const deleteSchedule = async (scheduleId: string) => {
    try {
      setDeletingId(scheduleId);
      await AuthService.deletePaymentSchedule(scheduleId);
      Toast.show({
        type: 'success',
        text1: 'تم الحذف بنجاح',
        text2: 'تم حذف موعد السداد',
      });
      await loadData();
    } catch (error) {
      console.error('Error deleting payment schedule:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل الحذف',
        text2: 'تعذر حذف موعد السداد',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (!canManageSchedules) {
      Toast.show({
        type: 'error',
        text1: 'غير مصرح',
        text2: 'ليس لديك صلاحية الحذف',
      });
      return;
    }

    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف موعد السداد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          void deleteSchedule(scheduleId);
        },
      },
    ]);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) {
      return 'غير محدد';
    }

    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getFeeTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      TUITION: 'رسوم دراسية',
      SERVICES: 'رسوم خدمات',
      TRAINING: 'رسوم تدريب',
      ADDITIONAL: 'رسوم إضافية',
    };
    return types[type] || type;
  };

  const renderFeeCard = (fee: TraineeFee) => {
    const schedule = schedulesByFeeId.get(fee.id);

    if (!schedule) {
      return (
        <View key={fee.id} style={styles.feeCard}>
          <View style={styles.feeHeader}>
            <Text style={styles.feeName}>{fee.name}</Text>
            <Text style={styles.feeAmount}>{formatPrice(fee.amount)}</Text>
          </View>

          <View style={styles.feeInfo}>
            <Text style={styles.feeType}>{getFeeTypeLabel(fee.type)}</Text>
            <Text style={styles.feeYear}>العام الدراسي: {fee.academicYear}</Text>
          </View>

          <View style={styles.noSchedule}>
            <Icon name="event-available" size={48} color="#d1d5db" />
            <Text style={styles.noScheduleText}>لم يتم تحديد موعد سداد</Text>
            {canManageSchedules && (
              <TouchableOpacity
                style={styles.addScheduleButton}
                onPress={() => handleAddSchedule(fee.id)}
              >
                <Icon name="add" size={20} color="#1a237e" />
                <Text style={styles.addScheduleButtonText}>إضافة موعد</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    const nonPaymentActions = parseNonPaymentActions(schedule.nonPaymentActions);

    return (
      <View key={fee.id} style={styles.feeCard}>
        <View style={styles.feeHeader}>
          <Text style={styles.feeName}>{fee.name}</Text>
          <Text style={styles.feeAmount}>{formatPrice(fee.amount)}</Text>
        </View>

        <View style={styles.feeInfo}>
          <Text style={styles.feeType}>{getFeeTypeLabel(fee.type)}</Text>
          <Text style={styles.feeYear}>العام الدراسي: {fee.academicYear}</Text>
        </View>

        <View style={styles.scheduleInfo}>
          <View style={styles.dateRow}>
            <Icon name="event" size={16} color="#1a237e" />
            <Text style={styles.dateLabel}>بداية:</Text>
            <Text style={styles.dateValue}>{formatDate(schedule.paymentStartDate)}</Text>
          </View>

          <View style={styles.dateRow}>
            <Icon name="event-busy" size={16} color="#dc2626" />
            <Text style={styles.dateLabel}>نهاية:</Text>
            <Text style={styles.dateValue}>{formatDate(schedule.paymentEndDate)}</Text>
          </View>

          <View style={styles.dateRow}>
            <Icon name="access-time" size={16} color="#f59e0b" />
            <Text style={styles.dateLabel}>فترة السماح:</Text>
            <Text style={styles.dateValue}>{schedule.gracePeriodDays || 0} يوم</Text>
          </View>

          <View style={styles.dateRow}>
            <Icon name="error-outline" size={16} color="#7c3aed" />
            <Text style={styles.dateLabel}>الموعد النهائي:</Text>
            <Text style={styles.dateValue}>{formatDate(schedule.finalDeadline)}</Text>
          </View>

          <View style={styles.actionsSection}>
            <View style={styles.actionsHeader}>
              <Text style={styles.actionsTitle}>الإجراءات:</Text>
              <View
                style={[
                  styles.statusBadge,
                  schedule.actionEnabled ? styles.statusBadgeEnabled : styles.statusBadgeDisabled,
                ]}
              >
                <Icon
                  name={schedule.actionEnabled ? 'lock-open' : 'lock'}
                  size={12}
                  color={schedule.actionEnabled ? '#b91c1c' : '#6b7280'}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    schedule.actionEnabled
                      ? styles.statusBadgeTextEnabled
                      : styles.statusBadgeTextDisabled,
                  ]}
                >
                  {schedule.actionEnabled ? 'مفعلة' : 'معطلة'}
                </Text>
              </View>
            </View>

            {nonPaymentActions.length > 0 ? (
              <View style={styles.actionsList}>
                {nonPaymentActions.map((action, index) => (
                  <View key={`${action}-${index}`} style={styles.actionTag}>
                    <Icon
                      name={ACTION_ICON_MAP[action] || 'warning'}
                      size={12}
                      color="#dc2626"
                    />
                    <Text style={styles.actionText}>
                      {NON_PAYMENT_ACTION_LABELS[action as NonPaymentAction] || action}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noActionsText}>لا توجد إجراءات محددة</Text>
            )}
          </View>

          {!!schedule.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>ملاحظات:</Text>
              <Text style={styles.notesText}>{schedule.notes}</Text>
            </View>
          )}

          {canManageSchedules && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditSchedule(schedule, fee)}
              >
                <Icon name="edit" size={18} color="#1a237e" />
                <Text style={styles.editButtonText}>تعديل</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton, deletingId === schedule.id && styles.buttonDisabled]}
                disabled={deletingId === schedule.id}
                onPress={() => handleDeleteSchedule(schedule.id)}
              >
                {deletingId === schedule.id ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <>
                    <Icon name="delete" size={18} color="#dc2626" />
                    <Text style={styles.deleteButtonText}>حذف</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="PaymentSchedules" />
        <View style={styles.headerCenter}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>مواعيد سداد الرسوم</Text>
            <Text style={styles.headerSubtitle}>إدارة مواعيد السداد والإجراءات</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.programInfo}>
          <View style={styles.programHeader}>
            <View>
              <Text style={styles.programName}>{program.nameAr}</Text>
              <Text style={styles.programNameEn}>{program.nameEn}</Text>
            </View>
            <TouchableOpacity
              style={styles.backToProgramsButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="close" size={20} color="#1a237e" />
              <Text style={styles.backToProgramsText}>العودة للبرامج</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>عدد الرسوم:</Text>
              <Text style={styles.statValue}>{fees.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>مواعيد محددة:</Text>
              <Text style={styles.statValue}>{schedules.length}</Text>
            </View>
          </View>
        </View>

        {canManageSchedules && fees.length > 0 && (
          <TouchableOpacity style={styles.addButton} onPress={() => handleAddSchedule()}>
            <Icon name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>إضافة موعد سداد</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
          </View>
        ) : fees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="receipt" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا توجد رسوم لهذا البرنامج</Text>
            <Text style={styles.emptySubtitle}>لم يتم العثور على رسوم تدريبية مرتبطة بهذا البرنامج</Text>
          </View>
        ) : (
          <View style={styles.feesList}>{fees.map(fee => renderFeeCard(fee))}</View>
        )}
      </ScrollView>

      <Toast />
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  programInfo: {
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  programName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'right',
    marginBottom: 4,
  },
  programNameEn: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  backToProgramsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  backToProgramsText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#93c5fd',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  feesList: {
    gap: 16,
  },
  feeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    flex: 1,
    textAlign: 'right',
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  feeType: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  feeYear: {
    fontSize: 12,
    color: '#64748b',
  },
  scheduleInfo: {
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionsSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  actionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeEnabled: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeDisabled: {
    backgroundColor: '#e5e7eb',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadgeTextEnabled: {
    color: '#b91c1c',
  },
  statusBadgeTextDisabled: {
    color: '#6b7280',
  },
  actionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
  },
  noActionsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  notesBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 10,
  },
  notesTitle: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'right',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  noSchedule: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noScheduleText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 16,
  },
  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
    gap: 6,
  },
  addScheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
  },
});

export default PaymentScheduleDetailsScreen;
