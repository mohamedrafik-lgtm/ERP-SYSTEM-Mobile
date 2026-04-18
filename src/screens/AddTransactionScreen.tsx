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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';
import { CreateTransactionPayload, ISafe, SafeCategory, TransactionType } from '../types/student';
import { usePermissions } from '../hooks/usePermissions';

interface AddTransactionScreenProps {
  navigation: any;
  route?: {
    params?: {
      safe?: ISafe;
    };
  };
}

const AddTransactionScreen = ({ navigation, route }: AddTransactionScreenProps) => {
  const selectedSafeFromRoute = route?.params?.safe;
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(false);
  const [safesLoading, setSafesLoading] = useState(false);
  const [safes, setSafes] = useState<ISafe[]>([]);
  const [formData, setFormData] = useState<CreateTransactionPayload>({
    amount: 0,
    type: 'DEPOSIT',
    description: '',
    sourceId: selectedSafeFromRoute?.id || '',
    targetId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canViewBalances = hasPermission('finances.safes.balances', 'view');

  const currentSourceSafe = useMemo(() => {
    if (!formData.sourceId) return null;
    return safes.find(safe => safe.id === formData.sourceId) || null;
  }, [formData.sourceId, safes]);

  useEffect(() => {
    void fetchSafes();
  }, []);

  useEffect(() => {
    if (!currentSourceSafe || formData.type !== 'TRANSFER') {
      return;
    }

    const targetAllowed = getAllowedTargetSafes(currentSourceSafe).some(
      option => option.value === formData.targetId,
    );

    if (!targetAllowed) {
      setFormData(prev => ({ ...prev, targetId: '' }));
    }
  }, [currentSourceSafe, formData.type]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSafes = async () => {
    try {
      setSafesLoading(true);
      const data = await AuthService.getAllSafes();
      const normalized = Array.isArray(data) ? data : [];
      setSafes(normalized);

      if (!selectedSafeFromRoute && normalized.length > 0 && !formData.sourceId) {
        setFormData(prev => ({ ...prev, sourceId: normalized[0].id }));
      }
    } catch (error) {
      console.error('Error fetching safes:', error);
      Alert.alert('خطأ', 'فشل في تحميل قائمة الخزائن');
    } finally {
      setSafesLoading(false);
    }
  };

  const canSourceSafeTransfer = (safe: ISafe | null) => {
    if (!safe) return false;
    return !['DEBT', 'EXPENSE', 'ASSETS'].includes(safe.category);
  };

  const getAllowedTargetSafes = (sourceSafe: ISafe) => {
    if (sourceSafe.category === 'DEBT') {
      return [];
    }

    if (sourceSafe.category === 'EXPENSE' || sourceSafe.category === 'ASSETS') {
      return [];
    }

    if (sourceSafe.category === 'INCOME') {
      return safes
        .filter(
          safe =>
            safe.id !== sourceSafe.id &&
            (safe.category === 'INCOME' || safe.category === 'EXPENSE' || safe.category === 'ASSETS'),
        )
        .map(safe => ({ value: safe.id, label: `${safe.name} (${safe.category})` }));
    }

    return safes
      .filter(safe => safe.id !== sourceSafe.id)
      .map(safe => ({ value: safe.id, label: `${safe.name} (${safe.category})` }));
  };

  const transactionTypeOptions = useMemo(() => {
    const options: { value: TransactionType; label: string }[] = [{ value: 'DEPOSIT', label: 'إيداع' }];
    if (canSourceSafeTransfer(currentSourceSafe)) {
      options.push({ value: 'TRANSFER', label: 'تحويل' });
    }
    return options;
  }, [currentSourceSafe]);

  useEffect(() => {
    if (formData.type === 'TRANSFER' && !canSourceSafeTransfer(currentSourceSafe)) {
      setFormData(prev => ({ ...prev, type: 'DEPOSIT', targetId: '' }));
    }
  }, [formData.type, currentSourceSafe]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentSourceSafe) {
      newErrors.sourceId = 'يجب اختيار خزينة المصدر';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون أكبر من 0';
    }

    if (formData.type === 'TRANSFER') {
      if (!canSourceSafeTransfer(currentSourceSafe)) {
        newErrors.type = 'هذه الخزينة لا تدعم التحويل، تدعم الإيداع فقط';
      }

      if (!formData.targetId) {
        newErrors.targetId = 'يجب اختيار خزينة الهدف للتحويل';
      }

      if (formData.sourceId === formData.targetId) {
        newErrors.targetId = 'لا يمكن التحويل إلى نفس الخزينة';
      }

      if (currentSourceSafe && currentSourceSafe.balance < formData.amount) {
        newErrors.amount = `الرصيد غير كاف. الرصيد الحالي ${currentSourceSafe.balance.toLocaleString('ar-EG')} ${currentSourceSafe.currency}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateTransactionPayload, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const submitTransaction = async () => {
    if (!currentSourceSafe) return;

    const payload: CreateTransactionPayload = {
      amount: formData.amount,
      type: formData.type,
      description: formData.description?.trim() || undefined,
    };

    if (formData.type === 'TRANSFER') {
      payload.sourceId = currentSourceSafe.id;
      payload.targetId = formData.targetId || undefined;
    } else {
      payload.targetId = currentSourceSafe.id;
    }

    try {
      setLoading(true);
      await AuthService.createTransaction(payload);
      Alert.alert('نجح', 'تم تنفيذ المعاملة بنجاح', [{ text: 'حسنا', onPress: () => navigation.goBack() }]);
    } catch (error) {
      console.error('Error creating transaction:', error);
      Alert.alert('خطأ', 'فشل في إنشاء المعاملة. تأكد من البيانات وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const modeLabel = formData.type === 'TRANSFER' ? 'تحويل' : 'إيداع';
    const amountLabel = `${formData.amount.toLocaleString('ar-EG')} ${currentSourceSafe?.currency || 'EGP'}`;

    Alert.alert('تأكيد العملية', `هل تريد تنفيذ ${modeLabel} بمبلغ ${amountLabel}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تأكيد', onPress: () => void submitTransaction() },
    ]);
  };

  const getTypeHint = () => {
    if (!currentSourceSafe) return 'اختر خزينة المصدر أولاً';

    if (formData.type === 'TRANSFER') {
      if (currentSourceSafe.category === 'INCOME') {
        return 'يمكن التحويل من خزائن الدخل إلى خزائن الدخل أو المصروفات أو الأصول';
      }
      if (currentSourceSafe.category === 'UNSPECIFIED') {
        return 'يمكن التحويل من الخزينة غير المحددة إلى أي خزينة أخرى';
      }
      return 'هذه الخزينة لا تسمح بالتحويل';
    }

    return 'الإيداع متاح لجميع أنواع الخزائن';
  };

  const sourceSafeOptions = safes.map(safe => ({ value: safe.id, label: safe.name }));
  const targetSafeOptions = currentSourceSafe ? getAllowedTargetSafes(currentSourceSafe) : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>معاملة مالية جديدة</Text>
          <Text style={styles.headerSubtitle}>منطق مطابق لنسخة الويب</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.safeInfoCard}>
            <Text style={styles.safeInfoTitle}>الخزينة المصدر</Text>
            {selectedSafeFromRoute ? (
              <>
                <Text style={styles.safeInfoName}>{selectedSafeFromRoute.name}</Text>
                <Text style={styles.safeInfoBalance}>
                  {canViewBalances
                    ? `الرصيد الحالي: ${selectedSafeFromRoute.balance.toLocaleString('ar-EG')} ${selectedSafeFromRoute.currency}`
                    : 'الرصيد مخفي حسب الصلاحيات'}
                </Text>
              </>
            ) : (
              <SelectBox
                label="اختر الخزينة المصدر *"
                selectedValue={formData.sourceId}
                onValueChange={value => handleInputChange('sourceId', value)}
                items={sourceSafeOptions}
                placeholder={safesLoading ? 'جاري تحميل الخزائن...' : 'اختر الخزينة'}
                loading={safesLoading}
                error={errors.sourceId}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <SelectBox
              label="نوع المعاملة *"
              selectedValue={formData.type}
              onValueChange={value => handleInputChange('type', value)}
              items={transactionTypeOptions}
              placeholder="اختر نوع المعاملة"
              error={errors.type}
            />
            <Text style={styles.typeHint}>{getTypeHint()}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>المبلغ *</Text>
            <TextInput
              style={[styles.input, errors.amount ? styles.errorInput : null]}
              value={String(formData.amount || '')}
              onChangeText={text => handleInputChange('amount', Number(text) || 0)}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              textAlign="right"
            />
            {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
          </View>

          {formData.type === 'TRANSFER' && (
            <View style={styles.formGroup}>
              <SelectBox
                label="الخزينة الهدف *"
                selectedValue={formData.targetId}
                onValueChange={value => handleInputChange('targetId', value)}
                items={targetSafeOptions}
                placeholder="اختر الخزينة الهدف"
                error={errors.targetId}
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>الوصف (اختياري)</Text>
            <TextInput
              style={styles.textArea}
              value={formData.description || ''}
              onChangeText={text => handleInputChange('description', text)}
              placeholder="أدخل وصف المعاملة"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlign="right"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading ? styles.submitButtonDisabled : null]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="check-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>تنفيذ المعاملة</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  safeInfoCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  safeInfoTitle: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
    marginBottom: 8,
  },
  safeInfoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  safeInfoBalance: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
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
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    textAlign: 'right',
    minHeight: 100,
    textAlignVertical: 'top',
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
  typeHint: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 13,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
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
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddTransactionScreen;
