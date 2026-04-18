import React, { useMemo, useState } from 'react';
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
import { CreateSafePayload, ISafe, SafeCategory } from '../types/student';

interface AddTreasuryScreenProps {
  navigation: any;
  route?: {
    params?: {
      safe?: ISafe;
    };
  };
}

const CATEGORY_OPTIONS: { value: SafeCategory; label: string }[] = [
  { value: 'DEBT', label: 'خزائن مديونية' },
  { value: 'INCOME', label: 'خزائن دخل' },
  { value: 'EXPENSE', label: 'خزائن مصروفات' },
  { value: 'ASSETS', label: 'خزائن أصول' },
  { value: 'UNSPECIFIED', label: 'غير محدد' },
];

const CURRENCY_OPTIONS = [
  { value: 'EGP', label: 'جنيه مصري (EGP)' },
  { value: 'USD', label: 'دولار أمريكي (USD)' },
  { value: 'EUR', label: 'يورو (EUR)' },
  { value: 'SAR', label: 'ريال سعودي (SAR)' },
];

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'نشطة' },
  { value: 'false', label: 'غير نشطة' },
];

const AddTreasuryScreen = ({ navigation, route }: AddTreasuryScreenProps) => {
  const editingSafe = route?.params?.safe;
  const isEditMode = Boolean(editingSafe?.id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSafePayload>({
    name: editingSafe?.name || '',
    description: editingSafe?.description || '',
    category: editingSafe?.category || 'UNSPECIFIED',
    balance: editingSafe?.balance || 0,
    currency: editingSafe?.currency || 'EGP',
    isActive: editingSafe?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const title = useMemo(() => (isEditMode ? 'تعديل الخزينة' : 'إضافة خزينة جديدة'), [isEditMode]);
  const subtitle = useMemo(
    () => (isEditMode ? 'تحديث بيانات الخزينة الحالية' : 'إنشاء خزينة مالية جديدة'),
    [isEditMode],
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'اسم الخزينة مطلوب';
    }

    if (formData.balance < 0) {
      newErrors.balance = 'الرصيد يجب أن يكون أكبر من أو يساوي 0';
    }

    if (!formData.category) {
      newErrors.category = 'تصنيف الخزينة مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateSafePayload, value: any) => {
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && editingSafe) {
        await AuthService.updateSafe(editingSafe.id, {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          category: formData.category as SafeCategory,
          currency: formData.currency,
          isActive: formData.isActive,
        });

        Alert.alert('نجح', 'تم تعديل الخزينة بنجاح', [{ text: 'حسنا', onPress: () => navigation.goBack() }]);
      } else {
        const payload: CreateSafePayload = {
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          category: formData.category,
          balance: formData.balance,
          currency: formData.currency,
          isActive: formData.isActive,
        };

        await AuthService.createSafe(payload);

        Alert.alert('نجح', 'تم إضافة الخزينة بنجاح', [{ text: 'حسنا', onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      console.error('Error saving safe:', error);
      Alert.alert('خطأ', isEditMode ? 'فشل في تعديل الخزينة' : 'فشل في إضافة الخزينة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>اسم الخزينة *</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.errorInput : null]}
              value={formData.name}
              onChangeText={text => handleInputChange('name', text)}
              placeholder="أدخل اسم الخزينة"
              placeholderTextColor="#9CA3AF"
              textAlign="right"
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>الوصف (اختياري)</Text>
            <TextInput
              style={styles.textArea}
              value={formData.description || ''}
              onChangeText={text => handleInputChange('description', text)}
              placeholder="أدخل وصفا للخزينة"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlign="right"
            />
          </View>

          <View style={styles.formGroup}>
            <SelectBox
              label="تصنيف الخزينة *"
              selectedValue={formData.category as SafeCategory}
              onValueChange={value => handleInputChange('category', value)}
              items={CATEGORY_OPTIONS}
              placeholder="اختر تصنيف الخزينة"
              error={errors.category}
            />
          </View>

          {!isEditMode && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>الرصيد الابتدائي *</Text>
              <TextInput
                style={[styles.input, errors.balance ? styles.errorInput : null]}
                value={String(formData.balance ?? 0)}
                onChangeText={text => handleInputChange('balance', Number(text) || 0)}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                textAlign="right"
              />
              {errors.balance ? <Text style={styles.errorText}>{errors.balance}</Text> : null}
            </View>
          )}

          <View style={styles.formGroup}>
            <SelectBox
              label="العملة *"
              selectedValue={formData.currency}
              onValueChange={value => handleInputChange('currency', value)}
              items={CURRENCY_OPTIONS}
              placeholder="اختر العملة"
            />
          </View>

          <View style={styles.formGroup}>
            <SelectBox
              label="الحالة"
              selectedValue={String(formData.isActive)}
              onValueChange={value => handleInputChange('isActive', value === 'true')}
              items={ACTIVE_OPTIONS}
              placeholder="اختر الحالة"
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
                <Icon name={isEditMode ? 'save' : 'add'} size={20} color="#fff" />
                <Text style={styles.submitButtonText}>{isEditMode ? 'حفظ التعديلات' : 'إضافة الخزينة'}</Text>
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

export default AddTreasuryScreen;
