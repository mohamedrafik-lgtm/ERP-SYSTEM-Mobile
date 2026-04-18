import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import DatePickerModal from '../components/DatePickerModal';
import AuthService from '../services/AuthService';
import { usePermissions } from '../hooks/usePermissions';
import {
  NonPaymentAction,
  NON_PAYMENT_ACTION_LABELS,
  CreatePaymentScheduleRequest,
  PaymentSchedule,
  TraineeFee,
} from '../types/paymentSchedules';

interface Program {
  id: number;
  nameAr: string;
  nameEn: string;
}

interface AddPaymentScheduleRouteParams {
  mode?: 'create' | 'edit';
  program: Program;
  fees: TraineeFee[];
  schedule?: PaymentSchedule;
  preselectedFeeId?: number;
  scheduledFeeIds?: number[];
}

interface AddPaymentScheduleScreenProps {
  navigation: any;
  route: {
    params: AddPaymentScheduleRouteParams;
  };
}

const PAYMENT_SCHEDULES_RESOURCE = 'dashboard.financial.payment-schedules';

const availableActions: NonPaymentAction[] = [
  NonPaymentAction.DISABLE_ATTENDANCE,
  NonPaymentAction.DISABLE_PLATFORM,
  NonPaymentAction.DISABLE_QUIZZES,
  NonPaymentAction.DISABLE_ALL,
];

const AddPaymentScheduleScreen = ({ navigation, route }: AddPaymentScheduleScreenProps) => {
  const {
    program,
    fees,
    schedule,
    preselectedFeeId,
    scheduledFeeIds = [],
    mode = 'create',
  } = route.params;

  const { canManage } = usePermissions();
  const canManageSchedules = canManage(PAYMENT_SCHEDULES_RESOURCE);
  const isEditMode = mode === 'edit' && !!schedule;

  const [selectedFeeId, setSelectedFeeId] = useState<number | null>(null);
  const [paymentStartDate, setPaymentStartDate] = useState<Date | null>(null);
  const [paymentEndDate, setPaymentEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [gracePeriodDays, setGracePeriodDays] = useState('0');
  const [selectedActions, setSelectedActions] = useState<NonPaymentAction[]>([]);
  const [actionEnabled, setActionEnabled] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const parseDate = (value: Date | string | null | undefined) => {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const parseNonPaymentActions = (actions: unknown): NonPaymentAction[] => {
    if (!actions) {
      return [];
    }

    const rawActions = Array.isArray(actions)
      ? actions
      : typeof actions === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(actions);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          })()
        : [];

    return rawActions.filter((action): action is NonPaymentAction =>
      Object.values(NonPaymentAction).includes(action as NonPaymentAction),
    );
  };

  useEffect(() => {
    if (isEditMode && schedule) {
      setSelectedFeeId(schedule.feeId);
      setPaymentStartDate(parseDate(schedule.paymentStartDate));
      setPaymentEndDate(parseDate(schedule.paymentEndDate));
      setGracePeriodDays(String(schedule.gracePeriodDays || 0));
      setSelectedActions(parseNonPaymentActions(schedule.nonPaymentActions));
      setActionEnabled(!!schedule.actionEnabled);
      setNotes(schedule.notes || '');
      return;
    }

    setSelectedFeeId(preselectedFeeId || null);
    setPaymentStartDate(null);
    setPaymentEndDate(null);
    setGracePeriodDays('0');
    setSelectedActions([]);
    setActionEnabled(false);
    setNotes('');
  }, [isEditMode, preselectedFeeId, schedule]);

  const availableFees = useMemo(() => {
    if (isEditMode) {
      return fees.filter(fee => fee.id === selectedFeeId);
    }

    const blocked = new Set(scheduledFeeIds);
    return fees.filter(fee => !blocked.has(fee.id));
  }, [fees, isEditMode, scheduledFeeIds, selectedFeeId]);

  const selectedFee = useMemo(
    () => fees.find(fee => fee.id === selectedFeeId),
    [fees, selectedFeeId],
  );

  const feeOptions = useMemo(
    () =>
      availableFees.map(fee => ({
        label: `${fee.name} - ${fee.amount.toLocaleString('ar-EG')} ج.م`,
        value: fee.id.toString(),
      })),
    [availableFees],
  );

  const toggleAction = (action: NonPaymentAction) => {
    if (action === NonPaymentAction.DISABLE_ALL) {
      if (selectedActions.includes(NonPaymentAction.DISABLE_ALL)) {
        setSelectedActions([]);
      } else {
        setSelectedActions([...availableActions]);
      }
      return;
    }

    if (selectedActions.includes(action)) {
      setSelectedActions(prev =>
        prev.filter(a => a !== action && a !== NonPaymentAction.DISABLE_ALL),
      );
      return;
    }

    const baseActions = selectedActions.filter(a => a !== NonPaymentAction.DISABLE_ALL);
    const updatedActions = [...baseActions, action];
    const allWithoutDisableAll = availableActions.filter(
      a => a !== NonPaymentAction.DISABLE_ALL,
    );

    if (allWithoutDisableAll.every(a => updatedActions.includes(a))) {
      updatedActions.push(NonPaymentAction.DISABLE_ALL);
    }

    setSelectedActions(updatedActions);
  };

  const handleSelectAll = () => {
    if (selectedActions.length === availableActions.length) {
      setSelectedActions([]);
      return;
    }
    setSelectedActions([...availableActions]);
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) {
      return 'اختر التاريخ';
    }

    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateFinalDeadline = () => {
    if (!paymentEndDate) {
      return 'غير محدد';
    }

    const graceDays = parseInt(gracePeriodDays, 10) || 0;
    const finalDate = new Date(paymentEndDate);
    finalDate.setDate(finalDate.getDate() + graceDays);

    return finalDate.toLocaleDateString('ar-EG');
  };

  const handleSubmit = async () => {
    if (!canManageSchedules) {
      Toast.show({
        type: 'error',
        text1: 'غير مصرح',
        text2: 'ليس لديك صلاحية إدارة مواعيد السداد',
      });
      return;
    }

    if (!selectedFeeId) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى اختيار الرسوم',
      });
      return;
    }

    if (paymentStartDate && paymentEndDate && paymentStartDate > paymentEndDate) {
      Toast.show({
        type: 'error',
        text1: 'تواريخ غير صحيحة',
        text2: 'موعد البداية يجب أن يكون قبل موعد النهاية',
      });
      return;
    }

    try {
      setLoading(true);

      const payload: CreatePaymentScheduleRequest = {
        feeId: selectedFeeId,
        paymentStartDate: paymentStartDate
          ? paymentStartDate.toISOString().split('T')[0]
          : undefined,
        paymentEndDate: paymentEndDate
          ? paymentEndDate.toISOString().split('T')[0]
          : undefined,
        gracePeriodDays: Math.max(0, parseInt(gracePeriodDays, 10) || 0),
        nonPaymentActions: selectedActions.length > 0 ? selectedActions : undefined,
        actionEnabled,
        notes: notes.trim() || undefined,
      };

      if (isEditMode && schedule?.id) {
        await AuthService.updatePaymentSchedule(schedule.id, payload);
        Toast.show({
          type: 'success',
          text1: 'تم التحديث',
          text2: 'تم تحديث موعد السداد بنجاح',
        });
      } else {
        await AuthService.createPaymentSchedule(payload);
        Toast.show({
          type: 'success',
          text1: 'تم الإنشاء',
          text2: 'تم إضافة موعد السداد بنجاح',
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving payment schedule:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل الحفظ',
        text2: 'تعذر حفظ موعد السداد',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: NonPaymentAction) => {
    const icons: Record<NonPaymentAction, { name: string; color: string }> = {
      [NonPaymentAction.DISABLE_ATTENDANCE]: { name: 'event-busy', color: '#3b82f6' },
      [NonPaymentAction.DISABLE_PLATFORM]: { name: 'desktop-access-disabled', color: '#06b6d4' },
      [NonPaymentAction.DISABLE_QUIZZES]: { name: 'quiz', color: '#f97316' },
      [NonPaymentAction.DISABLE_ALL]: { name: 'block', color: '#dc2626' },
      [NonPaymentAction.NONE]: { name: 'check', color: '#10b981' },
    };

    return icons[action] || { name: 'help', color: '#64748b' };
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
            <Text style={styles.headerTitle}>
              {isEditMode ? 'تعديل موعد السداد' : 'إضافة موعد سداد'}
            </Text>
            <Text style={styles.headerSubtitle}>{program.nameAr}</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!canManageSchedules && (
          <View style={styles.permissionWarning}>
            <Icon name="lock" size={18} color="#b45309" />
            <Text style={styles.permissionWarningText}>
              لديك صلاحية العرض فقط. الحفظ والتعديل غير متاحين.
            </Text>
          </View>
        )}

        {!isEditMode && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              الرسوم <Text style={styles.required}>*</Text>
            </Text>
            <SelectBox<string>
              label=""
              items={feeOptions}
              selectedValue={selectedFeeId?.toString()}
              onValueChange={value => setSelectedFeeId(parseInt(value, 10))}
              placeholder={
                feeOptions.length > 0 ? 'اختر الرسوم' : 'جميع الرسوم لديها مواعيد سداد بالفعل'
              }
              disabled={feeOptions.length === 0}
            />
          </View>
        )}

        {isEditMode && selectedFee && (
          <View style={styles.selectedFeeCard}>
            <View style={styles.selectedFeeIcon}>
              <Icon name="book" size={24} color="#fff" />
            </View>
            <View style={styles.selectedFeeInfo}>
              <Text style={styles.selectedFeeLabel}>الرسم المطبق عليه الموعد:</Text>
              <Text style={styles.selectedFeeName}>{selectedFee.name}</Text>
              <Text style={styles.selectedFeeAmount}>
                {selectedFee.amount.toLocaleString('ar-EG')} ج.م
              </Text>
            </View>
          </View>
        )}

        <View style={styles.datesRow}>
          <View style={styles.dateGroup}>
            <Text style={styles.label}>موعد بداية السداد</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Icon name="event" size={20} color="#1a237e" />
              <Text
                style={[
                  styles.dateButtonText,
                  !paymentStartDate && styles.dateButtonPlaceholder,
                ]}
              >
                {formatDateForDisplay(paymentStartDate)}
              </Text>
            </TouchableOpacity>
            <Text style={styles.hint}>اتركه فارغا إذا كان غير محدد</Text>
          </View>

          <View style={styles.dateGroup}>
            <Text style={styles.label}>موعد نهاية السداد</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Icon name="event" size={20} color="#dc2626" />
              <Text
                style={[
                  styles.dateButtonText,
                  !paymentEndDate && styles.dateButtonPlaceholder,
                ]}
              >
                {formatDateForDisplay(paymentEndDate)}
              </Text>
            </TouchableOpacity>
            <Text style={styles.hint}>اتركه فارغا إذا كان غير محدد</Text>
          </View>
        </View>

        {showStartDatePicker && (
          <DatePickerModal
            visible={showStartDatePicker}
            onClose={() => setShowStartDatePicker(false)}
            onConfirm={date => {
              setPaymentStartDate(date);
              setShowStartDatePicker(false);
            }}
            initialDate={paymentStartDate}
            title="اختر موعد بداية السداد"
          />
        )}

        {showEndDatePicker && (
          <DatePickerModal
            visible={showEndDatePicker}
            onClose={() => setShowEndDatePicker(false)}
            onConfirm={date => {
              setPaymentEndDate(date);
              setShowEndDatePicker(false);
            }}
            initialDate={paymentEndDate}
            title="اختر موعد نهاية السداد"
          />
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>فترة السماح (بالأيام)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={gracePeriodDays}
            onChangeText={setGracePeriodDays}
          />
          {(parseInt(gracePeriodDays, 10) || 0) > 0 && (
            <View style={styles.finalDeadlineBox}>
              <Icon name="info" size={16} color="#7c3aed" />
              <Text style={styles.finalDeadlineText}>
                الموعد النهائي بعد فترة السماح: {calculateFinalDeadline()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>الإجراءات عند عدم السداد (اختيار متعدد)</Text>
            <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllButton}>
              <Text style={styles.selectAllText}>
                {selectedActions.length === availableActions.length ? 'إلغاء الكل' : 'تحديد الكل'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsContainer}>
            {availableActions.map(action => {
              const iconInfo = getActionIcon(action);
              const isSelected = selectedActions.includes(action);

              return (
                <TouchableOpacity
                  key={action}
                  style={[styles.actionItem, isSelected && styles.actionItemSelected]}
                  onPress={() => toggleAction(action)}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionContent}>
                    <View style={[styles.actionIcon, { backgroundColor: `${iconInfo.color}20` }]}>
                      <Icon name={iconInfo.name} size={24} color={iconInfo.color} />
                    </View>
                    <Text style={styles.actionLabel}>{NON_PAYMENT_ACTION_LABELS[action]}</Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Icon name="check" size={18} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedActions.length > 0 && (
          <View style={styles.selectedActionsInfo}>
            <View style={styles.selectedActionsHeader}>
              <Icon name="info" size={20} color="#1a237e" />
              <Text style={styles.selectedActionsTitle}>الإجراءات المفعلة:</Text>
            </View>
            <View style={styles.selectedActionsList}>
              {selectedActions.map(action => (
                <View key={action} style={styles.selectedActionTag}>
                  <Icon name="check-circle" size={14} color="#059669" />
                  <Text style={styles.selectedActionText}>{NON_PAYMENT_ACTION_LABELS[action]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.toggleContainer}
          onPress={() => setActionEnabled(!actionEnabled)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleLabel}>تفعيل الإجراءات عند عدم السداد</Text>
          <View style={[styles.toggleSwitch, actionEnabled && styles.toggleSwitchActive]}>
            <View style={[styles.toggleThumb, actionEnabled && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>

        <View style={styles.formGroup}>
          <Text style={styles.label}>ملاحظات (اختياري)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="أضف ملاحظات إضافية..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || !canManageSchedules || (!isEditMode && !selectedFeeId)) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || !canManageSchedules || (!isEditMode && !selectedFeeId)}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="save" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {isEditMode ? 'حفظ التعديلات' : 'إنشاء موعد السداد'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="cancel" size={24} color="#dc2626" />
            <Text style={styles.cancelButtonText}>إلغاء</Text>
          </TouchableOpacity>
        </View>
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
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  permissionWarningText: {
    flex: 1,
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  selectedFeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    gap: 10,
  },
  selectedFeeIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFeeInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  selectedFeeLabel: {
    fontSize: 11,
    color: '#2563eb',
    marginBottom: 2,
  },
  selectedFeeName: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '700',
    textAlign: 'right',
  },
  selectedFeeAmount: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 8,
    textAlign: 'right',
  },
  required: {
    color: '#dc2626',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a237e',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateGroup: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
  },
  dateButtonPlaceholder: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  hint: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'right',
  },
  finalDeadlineBox: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f3ff',
    borderRadius: 8,
    padding: 10,
  },
  finalDeadlineText: {
    color: '#6d28d9',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a237e',
    textAlign: 'right',
    flex: 1,
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  selectAllText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
  },
  actionItemSelected: {
    borderColor: '#1a237e',
    backgroundColor: '#f0f9ff',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
    flex: 1,
    textAlign: 'right',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  selectedActionsInfo: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  selectedActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  selectedActionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a237e',
  },
  selectedActionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedActionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  selectedActionText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a237e',
    flex: 1,
    textAlign: 'right',
  },
  toggleSwitch: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#cbd5e1',
    padding: 3,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#059669',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  actions: {
    gap: 12,
    marginBottom: 32,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 4,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
});

export default AddPaymentScheduleScreen;
