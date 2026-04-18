import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SelectBox from '../components/SelectBox';
import DatePickerModal from '../components/DatePickerModal';
import AuthService from '../services/AuthService';
import {
  CreateTraineeFeePayload,
  FeeType,
  ISafe,
  ITraineeFee,
  UpdateTraineeFeePayload,
} from '../types/student';

interface Program {
  id: number;
  nameAr: string;
  nameEn: string;
}

interface AddFeeScreenProps {
  navigation: any;
  route?: {
    params?: {
      feeId?: number;
      fee?: ITraineeFee;
      isEdit?: boolean;
    };
  };
}

const AddFeeScreen = ({ navigation, route }: AddFeeScreenProps) => {
  const feeId = route?.params?.feeId;
  const feeParam = route?.params?.fee;
  const isEdit = Boolean(route?.params?.isEdit || feeId || feeParam);

  const [loading, setLoading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(isEdit && !feeParam);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [safesLoading, setSafesLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [safes, setSafes] = useState<ISafe[]>([]);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const [formData, setFormData] = useState<CreateTraineeFeePayload>({
    name: '',
    amount: 0,
    type: 'TUITION',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    allowMultipleApply: false,
    allowPartialPayment: true,
    refundDeadlineEnabled: false,
    refundDeadlineAt: '',
    programId: 0,
    safeId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const feeTypeOptions = [
    { value: 'TUITION', label: 'رسوم دراسية' },
    { value: 'SERVICES', label: 'رسوم خدمات' },
    { value: 'TRAINING', label: 'رسوم تدريبية' },
    { value: 'ADDITIONAL', label: 'رسوم إضافية' },
  ];

  const academicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => {
      const start = currentYear - 2 + index;
      return {
        value: `${start}-${start + 1}`,
        label: `${start}-${start + 1}`,
      };
    });
  }, []);

  const debtSafes = useMemo(() => safes.filter(safe => safe.category === 'DEBT'), [safes]);

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([fetchPrograms(), fetchSafes()]);

      if (!isEdit) {
        return;
      }

      if (feeParam) {
        fillFormFromFee(feeParam);
        return;
      }

      if (feeId) {
        await fetchFeeById(feeId);
      }
    };

    bootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fillFormFromFee = (fee: ITraineeFee) => {
    const normalizedRefundDeadlineEnabled = fee.type !== 'TUITION' && Boolean(fee.refundDeadlineEnabled);
    const refundDate = fee.refundDeadlineAt ? new Date(fee.refundDeadlineAt).toISOString().split('T')[0] : '';

    setFormData({
      name: fee.name,
      amount: fee.amount,
      type: fee.type,
      academicYear: fee.academicYear,
      allowMultipleApply: fee.allowMultipleApply,
      allowPartialPayment: fee.type === 'TUITION' ? true : fee.allowPartialPayment !== false,
      refundDeadlineEnabled: normalizedRefundDeadlineEnabled,
      refundDeadlineAt: normalizedRefundDeadlineEnabled ? refundDate : '',
      programId: fee.programId,
      safeId: fee.safeId,
    });
  };

  const fetchFeeById = async (id: number) => {
    try {
      setScreenLoading(true);
      const fee = await AuthService.getTraineeFeeById(id);
      fillFormFromFee(fee);
    } catch (error) {
      console.error('Error fetching fee by id:', error);
      Alert.alert('خطأ', 'تعذر تحميل بيانات الرسوم للتعديل');
      navigation.goBack();
    } finally {
      setScreenLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      setProgramsLoading(true);
      const data = await AuthService.getAllPrograms();
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      Alert.alert('خطأ', 'فشل في تحميل البرامج التدريبية');
    } finally {
      setProgramsLoading(false);
    }
  };

  const fetchSafes = async () => {
    try {
      setSafesLoading(true);
      const data = await AuthService.getAllSafes();
      setSafes(data);
    } catch (error) {
      console.error('Error fetching safes:', error);
      Alert.alert('خطأ', 'فشل في تحميل الخزائن');
    } finally {
      setSafesLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'اسم الرسوم مطلوب';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'قيمة الرسوم يجب أن تكون أكبر من 0';
    }

    if (!formData.academicYear) {
      newErrors.academicYear = 'العام الدراسي مطلوب';
    }

    if (formData.programId === 0) {
      newErrors.programId = 'البرنامج التدريبي مطلوب';
    }

    if (!formData.safeId) {
      newErrors.safeId = 'الخزينة مطلوبة';
    }

    if (formData.type !== 'TUITION' && formData.refundDeadlineEnabled && !formData.refundDeadlineAt) {
      newErrors.refundDeadlineAt = 'يرجى إدخال آخر موعد للاسترداد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (): CreateTraineeFeePayload => {
    const isTuition = formData.type === 'TUITION';
    const canUseRefundDate = !isTuition && Boolean(formData.refundDeadlineEnabled) && Boolean(formData.refundDeadlineAt);

    return {
      name: formData.name.trim(),
      amount: formData.amount,
      type: formData.type,
      academicYear: formData.academicYear,
      allowMultipleApply: Boolean(formData.allowMultipleApply),
      allowPartialPayment: isTuition ? true : Boolean(formData.allowPartialPayment),
      refundDeadlineEnabled: isTuition ? false : Boolean(formData.refundDeadlineEnabled),
      refundDeadlineAt: canUseRefundDate ? formData.refundDeadlineAt : undefined,
      programId: formData.programId,
      safeId: formData.safeId,
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload = buildPayload();

      if (isEdit && feeId) {
        await AuthService.updateTraineeFee(feeId, payload as UpdateTraineeFeePayload);
      } else {
        await AuthService.createTraineeFee(payload);
      }

      Alert.alert('نجح', isEdit ? 'تم تعديل الرسوم بنجاح' : 'تم إنشاء الرسوم بنجاح', [
        {
          text: 'حسناً',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating fee:', error);
      Alert.alert('خطأ', 'فشل في إنشاء الرسوم. تأكد من صحة البيانات وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateTraineeFeePayload, value: any) => {
    setFormData(prev => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (field === 'type' && value === 'TUITION') {
        next.allowPartialPayment = true;
        next.refundDeadlineEnabled = false;
        next.refundDeadlineAt = '';
      }

      if (field === 'refundDeadlineEnabled' && !value) {
        next.refundDeadlineAt = '';
      }

      return next;
    });

    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }
  };

  const getFeeTypeDescription = (type: FeeType) => {
    switch (type) {
      case 'TUITION':
        return 'الرسوم الدراسية الأساسية للبرنامج';
      case 'SERVICES':
        return 'رسوم الخدمات الإضافية (مكتبة، مختبر، إلخ)';
      case 'TRAINING':
        return 'رسوم التدريب العملي والورش';
      case 'ADDITIONAL':
        return 'رسوم إضافية متنوعة';
      default:
        return '';
    }
  };

  const getProgramOptions = () => {
    return programs.map(program => ({
      value: program.id,
      label: program.nameAr,
    }));
  };

  const getSafeOptions = () => {
    return debtSafes.map(safe => ({
      value: safe.id,
      label: safe.name,
    }));
  };

  if (screenLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل بيانات الرسوم...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{isEdit ? 'تعديل الرسوم' : 'إضافة رسوم جديدة'}</Text>
          <Text style={styles.headerSubtitle}>
            {isEdit ? 'تحديث بيانات الرسوم الحالية' : 'إنشاء رسوم جديدة للمتدربين'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>اسم الرسوم *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.errorInput]}
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="أدخل اسم الرسوم"
              placeholderTextColor="#9CA3AF"
              textAlign="right"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <SelectBox
              label="نوع الرسوم *"
              selectedValue={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
              items={feeTypeOptions}
              placeholder="اختر نوع الرسوم"
            />
            <Text style={styles.typeDescription}>
              {getFeeTypeDescription(formData.type)}
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>قيمة الرسوم *</Text>
            <TextInput
              style={[styles.input, errors.amount && styles.errorInput]}
              value={formData.amount.toString()}
              onChangeText={(text) => handleInputChange('amount', Number(text) || 0)}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              textAlign="right"
            />
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          <View style={styles.formGroup}>
            <SelectBox
              label="العام الدراسي *"
              selectedValue={formData.academicYear}
              onValueChange={(value) => handleInputChange('academicYear', value)}
              items={academicYearOptions}
              placeholder="اختر العام الدراسي"
              error={errors.academicYear}
            />
          </View>

          <View style={styles.formGroup}>
            <SelectBox
              label="البرنامج التدريبي *"
              selectedValue={formData.programId}
              onValueChange={(value) => handleInputChange('programId', value)}
              items={getProgramOptions()}
              placeholder="اختر البرنامج التدريبي"
              error={errors.programId}
              loading={programsLoading}
            />
          </View>

          <View style={styles.formGroup}>
            <SelectBox
              label="خزينة الرسوم *"
              selectedValue={formData.safeId}
              onValueChange={(value) => handleInputChange('safeId', value)}
              items={getSafeOptions()}
              placeholder="اختر خزينة المديونية"
              error={errors.safeId}
              loading={safesLoading}
            />
            <Text style={styles.helperText}>يتم عرض خزائن المديونية فقط لتطبيق الرسوم عليها.</Text>

            {!safesLoading && debtSafes.length === 0 ? (
              <Text style={styles.warningText}>لا توجد خزائن مديونية متاحة حالياً.</Text>
            ) : null}
          </View>

          {formData.type !== 'TUITION' ? (
            <View style={styles.formGroup}>
              <Text style={styles.label}>سياسة السداد</Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    !formData.allowPartialPayment && styles.segmentButtonActive,
                  ]}
                  onPress={() => handleInputChange('allowPartialPayment', false)}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      !formData.allowPartialPayment && styles.segmentButtonTextActive,
                    ]}
                  >
                    سداد كامل فقط
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    formData.allowPartialPayment && styles.segmentButtonActive,
                  ]}
                  onPress={() => handleInputChange('allowPartialPayment', true)}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      formData.allowPartialPayment && styles.segmentButtonTextActive,
                    ]}
                  >
                    السماح بالسداد الجزئي
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>يتم تطبيق السياسة على الدفع الإضافي لنفس الرسم.</Text>
            </View>
          ) : null}

          {formData.type !== 'TUITION' ? (
            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <View style={styles.switchContent}>
                  <Text style={styles.switchLabel}>تفعيل الحد الأقصى للاسترداد</Text>
                  <Text style={styles.switchDescription}>
                    عند التفعيل، لا يمكن الاسترداد بعد التاريخ المحدد.
                  </Text>
                </View>
                <Switch
                  value={Boolean(formData.refundDeadlineEnabled)}
                  onValueChange={(value) => handleInputChange('refundDeadlineEnabled', value)}
                  trackColor={{ false: '#e5e7eb', true: '#1a237e' }}
                  thumbColor={formData.refundDeadlineEnabled ? '#fff' : '#f3f4f6'}
                />
              </View>

              {formData.refundDeadlineEnabled ? (
                <View style={styles.dateRow}>
                  <Text style={styles.label}>آخر موعد للاسترداد *</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, errors.refundDeadlineAt && styles.errorInput]}
                    onPress={() => setIsDatePickerVisible(true)}
                  >
                    <Icon name="event" size={18} color="#1a237e" />
                    <Text style={styles.dateButtonText}>
                      {formData.refundDeadlineAt || 'اختر تاريخ الاسترداد'}
                    </Text>
                  </TouchableOpacity>
                  {errors.refundDeadlineAt ? (
                    <Text style={styles.errorText}>{errors.refundDeadlineAt}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.formGroup}>
            <View style={styles.switchContainer}>
              <View style={styles.switchContent}>
                <Text style={styles.switchLabel}>السماح بتطبيق الرسوم أكثر من مرة</Text>
                <Text style={styles.switchDescription}>
                  إذا كان مفعلاً، يمكن للطالب دفع هذه الرسوم عدة مرات
                </Text>
              </View>
              <Switch
                value={formData.allowMultipleApply}
                onValueChange={(value) => handleInputChange('allowMultipleApply', value)}
                trackColor={{ false: '#e5e7eb', true: '#1a237e' }}
                thumbColor={formData.allowMultipleApply ? '#fff' : '#f3f4f6'}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name={isEdit ? 'save' : 'add'} size={20} color="#fff" />
                <Text style={styles.submitButtonText}>{isEdit ? 'حفظ التعديلات' : 'إنشاء الرسوم'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DatePickerModal
        visible={isDatePickerVisible}
        onClose={() => setIsDatePickerVisible(false)}
        title="اختر آخر موعد للاسترداد"
        initialDate={formData.refundDeadlineAt ? new Date(formData.refundDeadlineAt) : new Date()}
        onConfirm={(date) => {
          const formatted = date.toISOString().split('T')[0];
          handleInputChange('refundDeadlineAt', formatted);
          setIsDatePickerVisible(false);
        }}
      />
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
    marginBottom: 16,
    marginHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    textAlign: 'right',
    color: '#374151',
  },
  errorInput: {
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  helperText: {
    fontSize: 12,
    color: '#1d4ed8',
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  segmentButtonActive: {
    borderColor: '#1a237e',
    backgroundColor: '#e0e7ff',
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  segmentButtonTextActive: {
    color: '#1a237e',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  dateRow: {
    marginTop: 16,
  },
  dateButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#f9fafb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonText: {
    marginLeft: 8,
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 24,
    marginHorizontal: 8,
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default AddFeeScreen;
