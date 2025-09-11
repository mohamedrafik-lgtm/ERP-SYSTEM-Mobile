import React, { useState, useEffect } from 'react';
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
import { CreateTransactionPayload, TransactionType, ISafe } from '../types/student';

interface AddTransactionScreenProps {
  navigation: any;
  route: {
    params: {
      safe: ISafe;
    };
  };
}

const AddTransactionScreen = ({ navigation, route }: AddTransactionScreenProps) => {
  const { safe } = route.params;
  const [loading, setLoading] = useState(false);
  const [safes, setSafes] = useState<ISafe[]>([]);
  const [formData, setFormData] = useState<CreateTransactionPayload>({
    amount: 0,
    type: 'DEPOSIT',
    description: '',
    reference: '',
    sourceId: '',
    targetId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const transactionTypeOptions = [
    { value: 'DEPOSIT', label: 'إيداع' },
    { value: 'WITHDRAW', label: 'سحب' },
    { value: 'TRANSFER', label: 'تحويل' },
    { value: 'FEE', label: 'رسوم' },
    { value: 'PAYMENT', label: 'دفع' },
  ];

  useEffect(() => {
    fetchSafes();
    // تعيين الخزينة المحددة كخزينة مصدر للتحويلات
    if (safe) {
      setFormData(prev => ({
        ...prev,
        sourceId: safe.id,
      }));
    }
  }, [safe]);

  const fetchSafes = async () => {
    try {
      const data = await AuthService.getAllSafes();
      setSafes(data);
    } catch (error) {
      console.error('Error fetching safes:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.amount <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون أكبر من 0';
    }

    if (formData.type === 'TRANSFER' && !formData.targetId) {
      newErrors.targetId = 'يجب اختيار خزينة الهدف للتحويل';
    }

    if (formData.type === 'TRANSFER' && formData.sourceId === formData.targetId) {
      newErrors.targetId = 'لا يمكن التحويل لنفس الخزينة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // إعداد البيانات للإرسال
      const transactionData: CreateTransactionPayload = {
        amount: formData.amount,
        type: formData.type,
        description: formData.description?.trim() || undefined,
        reference: formData.reference?.trim() || undefined,
        sourceId: formData.sourceId || undefined,
        targetId: formData.targetId || undefined,
      };

      // إرسال البيانات للـ API
      await AuthService.createTransaction(transactionData);
      
      Alert.alert('نجح', 'تم إنشاء المعاملة بنجاح', [
        {
          text: 'حسناً',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating transaction:', error);
      Alert.alert('خطأ', 'فشل في إنشاء المعاملة. تأكد من صحة البيانات وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    
    // مسح الخطأ عند بدء الكتابة
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }
  };

  const getTransactionTypeDescription = (type: TransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return 'إضافة مبلغ إلى الخزينة';
      case 'WITHDRAW':
        return 'سحب مبلغ من الخزينة';
      case 'TRANSFER':
        return 'تحويل مبلغ من خزينة إلى أخرى';
      case 'FEE':
        return 'رسوم أو تكاليف';
      case 'PAYMENT':
        return 'دفع أو تسديد';
      default:
        return '';
    }
  };

  const getSourceSafes = () => {
    return safes.map(safe => ({
      value: safe.id,
      label: safe.name,
    }));
  };

  const getTargetSafes = () => {
    return safes
      .filter(s => s.id !== formData.sourceId)
      .map(safe => ({
        value: safe.id,
        label: safe.name,
      }));
  };

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
          <Text style={styles.headerTitle}>إنشاء معاملة جديدة</Text>
          <Text style={styles.headerSubtitle}>إضافة معاملة مالية للخزينة</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Safe Info */}
          <View style={styles.safeInfoCard}>
            <Text style={styles.safeInfoTitle}>الخزينة المحددة</Text>
            <Text style={styles.safeInfoName}>{safe.name}</Text>
            <Text style={styles.safeInfoBalance}>
              الرصيد الحالي: {safe.balance.toLocaleString()} {safe.currency}
            </Text>
          </View>

          {/* Transaction Type */}
          <View style={styles.formGroup}>
            <SelectBox
              label="نوع المعاملة *"
              selectedValue={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
              items={transactionTypeOptions}
              placeholder="اختر نوع المعاملة"
            />
            <Text style={styles.typeDescription}>
              {getTransactionTypeDescription(formData.type)}
            </Text>
          </View>

          {/* Amount */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>المبلغ *</Text>
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

          {/* Source Safe (for transfers) */}
          {formData.type === 'TRANSFER' && (
            <View style={styles.formGroup}>
              <SelectBox
                label="الخزينة المصدر *"
                selectedValue={formData.sourceId}
                onValueChange={(value) => handleInputChange('sourceId', value)}
                items={getSourceSafes()}
                placeholder="اختر الخزينة المصدر"
              />
            </View>
          )}

          {/* Target Safe (for transfers) */}
          {formData.type === 'TRANSFER' && (
            <View style={styles.formGroup}>
              <SelectBox
                label="الخزينة الهدف *"
                selectedValue={formData.targetId}
                onValueChange={(value) => handleInputChange('targetId', value)}
                items={getTargetSafes()}
                placeholder="اختر الخزينة الهدف"
                error={errors.targetId}
              />
            </View>
          )}

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>الوصف (اختياري)</Text>
            <TextInput
              style={[styles.textArea]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="أدخل وصف للمعاملة"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlign="right"
            />
          </View>

          {/* Reference */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>المرجع (اختياري)</Text>
            <TextInput
              style={styles.input}
              value={formData.reference}
              onChangeText={(text) => handleInputChange('reference', text)}
              placeholder="أدخل رقم مرجعي"
              placeholderTextColor="#9CA3AF"
              textAlign="right"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="add" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>إنشاء المعاملة</Text>
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
    marginBottom: 24,
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
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '500',
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
  typeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
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
});

export default AddTransactionScreen;
