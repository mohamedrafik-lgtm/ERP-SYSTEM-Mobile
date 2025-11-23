import React, { useState } from 'react';
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
import { NonPaymentAction, NON_PAYMENT_ACTION_LABELS, CreatePaymentScheduleRequest } from '../types/paymentSchedules';

interface AddPaymentScheduleScreenProps {
  navigation: any;
  route: {
    params: {
      program: {
        id: number;
        nameAr: string;
        nameEn: string;
      };
      fees: any[];
    };
  };
}

const AddPaymentScheduleScreen = ({ navigation, route }: AddPaymentScheduleScreenProps) => {
  const { program, fees } = route.params;
  
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

  const availableActions = [
    NonPaymentAction.DISABLE_ATTENDANCE,
    NonPaymentAction.DISABLE_PLATFORM,
    NonPaymentAction.DISABLE_QUIZZES,
    NonPaymentAction.DISABLE_ALL,
  ];

  const toggleAction = (action: NonPaymentAction) => {
    setSelectedActions(prev => {
      if (prev.includes(action)) {
        return prev.filter(a => a !== action);
      } else {
        return [...prev, action];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedActions.length === availableActions.length) {
      setSelectedActions([]);
    } else {
      setSelectedActions([...availableActions]);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedFeeId) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'يرجى اختيار الرسوم',
      });
      return;
    }

    try {
      setLoading(true);

      const scheduleData: CreatePaymentScheduleRequest = {
        feeId: selectedFeeId,
        paymentStartDate: paymentStartDate ? paymentStartDate.toISOString().split('T')[0] : undefined,
        paymentEndDate: paymentEndDate ? paymentEndDate.toISOString().split('T')[0] : undefined,
        gracePeriodDays: parseInt(gracePeriodDays) || 0,
        nonPaymentActions: selectedActions.length > 0 ? selectedActions : undefined,
        actionEnabled: actionEnabled,
        notes: notes || undefined,
      };

      await AuthService.createPaymentSchedule(scheduleData);

      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم إضافة موعد السداد بنجاح',
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error creating payment schedule:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل في إضافة موعد السداد',
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

  const feeOptions = fees.map(fee => ({
    label: `${fee.name} - ${fee.amount} ج.م`,
    value: fee.id.toString(),
  }));

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return 'اختر التاريخ';
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleStartDateConfirm = (date: Date) => {
    setPaymentStartDate(date);
    setShowStartDatePicker(false);
  };

  const handleEndDateConfirm = (date: Date) => {
    setPaymentEndDate(date);
    setShowEndDatePicker(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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
            <Text style={styles.headerTitle}>إضافة موعد سداد</Text>
            <Text style={styles.headerSubtitle}>{program.nameAr}</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* اختيار الرسوم */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            الرسوم <Text style={styles.required}>*</Text>
          </Text>
          <SelectBox<string>
            label=""
            items={feeOptions}
            selectedValue={selectedFeeId?.toString()}
            onValueChange={(value) => setSelectedFeeId(parseInt(value as string))}
            placeholder="اختر الرسوم"
          />
        </View>

        {/* التواريخ */}
        <View style={styles.datesRow}>
          <View style={styles.dateGroup}>
            <Text style={styles.label}>موعد بداية السداد</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Icon name="event" size={20} color="#1a237e" />
              <Text style={[styles.dateButtonText, !paymentStartDate && styles.dateButtonPlaceholder]}>
                {formatDateForDisplay(paymentStartDate)}
              </Text>
            </TouchableOpacity>
            <Text style={styles.hint}>اتركه فارغاً [لا] كان غير محدد</Text>
          </View>

          <View style={styles.dateGroup}>
            <Text style={styles.label}>موعد نهاية السداد</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Icon name="event" size={20} color="#dc2626" />
              <Text style={[styles.dateButtonText, !paymentEndDate && styles.dateButtonPlaceholder]}>
                {formatDateForDisplay(paymentEndDate)}
              </Text>
            </TouchableOpacity>
            <Text style={styles.hint}>اتركه فارغاً [لا] كان غير محدد</Text>
          </View>
        </View>

        {/* Date Pickers - Simple Modal Version */}
        {showStartDatePicker && (
          <DatePickerModal
            visible={showStartDatePicker}
            onClose={() => setShowStartDatePicker(false)}
            onConfirm={handleStartDateConfirm}
            initialDate={paymentStartDate}
            title="اختر موعد بداية السداد"
          />
        )}

        {showEndDatePicker && (
          <DatePickerModal
            visible={showEndDatePicker}
            onClose={() => setShowEndDatePicker(false)}
            onConfirm={handleEndDateConfirm}
            initialDate={paymentEndDate}
            title="اختر موعد نهاية السداد"
          />
        )}

        {/* فترة السماح */}
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
        </View>

        {/* الإجراءات عند عدم السداد */}
        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              الإجراءات عند عدم السداد (اختيار متعدد)
            </Text>
            <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllButton}>
              <Text style={styles.selectAllText}>تحديد الكل</Text>
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
                    <Text style={styles.actionLabel}>
                      {NON_PAYMENT_ACTION_LABELS[action]}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Icon name="check" size={18} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* الإجراءات المفعلة */}
        {selectedActions.length > 0 && (
          <View style={styles.selectedActionsInfo}>
            <View style={styles.selectedActionsHeader}>
              <Icon name="info" size={20} color="#1a237e" />
              <Text style={styles.selectedActionsTitle}>الإجراءات المفعلة:</Text>
            </View>
            <View style={styles.selectedActionsList}>
              {selectedActions.map((action, index) => (
                <View key={index} style={styles.selectedActionTag}>
                  <Icon name="check-circle" size={14} color="#059669" />
                  <Text style={styles.selectedActionText}>
                    {NON_PAYMENT_ACTION_LABELS[action]}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.warningBox}>
              <Icon name="warning" size={16} color="#f59e0b" />
              <Text style={styles.warningText}>
                يمنع الوصول الكامل - ينصح بالتسجيل الكامل المذكور عند التطبيق
              </Text>
            </View>
          </View>
        )}

        {/* تفعيل الإجراءات */}
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

        {/* ملاحظات */}
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

        {/* أزرار الحفظ والإلغاء */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="save" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>حفظ موعد السداد</Text>
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
  dateInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a237e',
    textAlign: 'center',
  },
  hint: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 6,
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
    marginBottom: 12,
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 11,
    color: '#78350f',
    flex: 1,
    textAlign: 'right',
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
});

export default AddPaymentScheduleScreen;