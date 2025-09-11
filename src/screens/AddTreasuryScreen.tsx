import React, { useState } from 'react';
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
import { CreateSafePayload } from '../types/student';

interface AddTreasuryScreenProps {
  navigation: any;
}

const AddTreasuryScreen = ({ navigation }: AddTreasuryScreenProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSafePayload>({
    name: '',
    description: '',
    category: 'UNSPECIFIED',
    balance: 0,
    currency: 'EGP',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Remove treasury type options as it's not in the API payload

  const currencyOptions = [
    { value: 'EGP', label: 'جنيه مصري (EGP)' },
    { value: 'USD', label: 'دولار أمريكي (USD)' },
    { value: 'EUR', label: 'يورو (EUR)' },
    { value: 'SAR', label: 'ريال سعودي (SAR)' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'اسم الخزينة مطلوب';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'وصف الخزينة مطلوب';
    }

    if (formData.balance < 0) {
      newErrors.balance = 'الرصيد يجب أن يكون أكبر من أو يساوي 0';
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

      // Prepare data for API call
      const safeData: CreateSafePayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        balance: formData.balance,
        currency: formData.currency,
        isActive: formData.isActive,
      };

      // Call API
      await AuthService.createSafe(safeData);
      
      Alert.alert('نجح', 'تم إضافة الخزينة بنجاح', [
        {
          text: 'حسناً',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating safe:', error);
      Alert.alert('خطأ', 'فشل في إضافة الخزينة. تأكد من صحة البيانات وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }
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
          <Text style={styles.headerTitle}>إضافة خزينة جديدة</Text>
          <Text style={styles.headerSubtitle}>إنشاء خزينة مالية جديدة</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Treasury Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>اسم الخزينة *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.errorInput]}
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="أدخل اسم الخزينة"
              placeholderTextColor="#9CA3AF"
              textAlign="right"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>الوصف *</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.errorInput]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="أدخل وصف للخزينة"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlign="right"
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Balance */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>الرصيد *</Text>
            <TextInput
              style={[styles.input, errors.balance && styles.errorInput]}
              value={formData.balance.toString()}
              onChangeText={(text) => handleInputChange('balance', Number(text) || 0)}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              textAlign="right"
            />
            {errors.balance && <Text style={styles.errorText}>{errors.balance}</Text>}
          </View>

          {/* Currency */}
          <View style={styles.formGroup}>
            <SelectBox
              label="العملة *"
              selectedValue={formData.currency}
              onValueChange={(value) => handleInputChange('currency', value)}
              items={currencyOptions}
              placeholder="اختر العملة"
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
                <Text style={styles.submitButtonText}>إضافة الخزينة</Text>
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

export default AddTreasuryScreen;
