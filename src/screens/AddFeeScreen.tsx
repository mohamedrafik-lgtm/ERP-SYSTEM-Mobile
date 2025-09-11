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
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';
import { CreateTraineeFeePayload, FeeType, ISafe } from '../types/student';

interface Program {
  id: number;
  nameAr: string;
  nameEn: string;
}

interface AddFeeScreenProps {
  navigation: any;
}

const AddFeeScreen = ({ navigation }: AddFeeScreenProps) => {
  const [loading, setLoading] = useState(false);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [safesLoading, setSafesLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [safes, setSafes] = useState<ISafe[]>([]);
  const [formData, setFormData] = useState<CreateTraineeFeePayload>({
    name: '',
    amount: 0,
    type: 'TUITION',
    academicYear: '',
    allowMultipleApply: false,
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

  const academicYearOptions = [
    { value: '2024-2025', label: '2024-2025' },
    { value: '2025-2026', label: '2025-2026' },
    { value: '2026-2027', label: '2026-2027' },
    { value: '2027-2028', label: '2027-2028' },
  ];

  useEffect(() => {
    fetchPrograms();
    fetchSafes();
  }, []);

  const fetchPrograms = async () => {
    try {
      setProgramsLoading(true);
      console.log('Fetching programs...');
      const data = await AuthService.getAllPrograms();
      console.log('Fetched programs:', data);
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
      console.log('Fetching safes...');
      const data = await AuthService.getAllSafes();
      console.log('Fetched safes:', data);
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
      const feeData: CreateTraineeFeePayload = {
        name: formData.name.trim(),
        amount: formData.amount,
        type: formData.type,
        academicYear: formData.academicYear,
        allowMultipleApply: formData.allowMultipleApply,
        programId: formData.programId,
        safeId: formData.safeId,
      };

      // إرسال البيانات للـ API
      await AuthService.createTraineeFee(feeData);
      
      Alert.alert('نجح', 'تم إنشاء الرسوم بنجاح', [
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

  const handleInputChange = (field: string, value: any) => {
    console.log(`Updating ${field}:`, value);
    console.log('Current formData:', formData);
    
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
    console.log('Getting program options, programs:', programs);
    console.log('Programs length:', programs.length);
    
    if (programs.length === 0) {
      console.log('No programs available');
      return [];
    }
    
    const options = programs.map(program => {
      console.log('Mapping program:', program);
      return {
        value: program.id,
        label: program.nameAr,
      };
    });
    console.log('Program options:', options);
    return options;
  };

  const getSafeOptions = () => {
    console.log('Getting safe options, safes:', safes);
    const options = safes.map(safe => ({
      value: safe.id,
      label: safe.name,
    }));
    console.log('Safe options:', options);
    return options;
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
          <Text style={styles.headerTitle}>إضافة رسوم جديدة</Text>
          <Text style={styles.headerSubtitle}>إنشاء رسوم للطلاب</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Fee Name */}
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

          {/* Fee Type */}
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

          {/* Amount */}
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

          {/* Academic Year */}
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

          {/* Program */}
          <View style={styles.formGroup}>
            <SelectBox
              label="البرنامج التدريبي *"
              selectedValue={formData.programId}
              onValueChange={(value) => {
                console.log('Program selected:', value);
                handleInputChange('programId', value);
              }}
              items={getProgramOptions()}
              placeholder="اختر البرنامج التدريبي"
              error={errors.programId}
              loading={programsLoading}
            />
            {/* Debug Info */}
            <Text style={styles.debugText}>
              Selected Program ID: {formData.programId} | Programs Count: {programs.length}
            </Text>
          </View>

          {/* Safe */}
          <View style={styles.formGroup}>
            <SelectBox
              label="الخزينة *"
              selectedValue={formData.safeId}
              onValueChange={(value) => {
                console.log('Safe selected:', value);
                handleInputChange('safeId', value);
              }}
              items={getSafeOptions()}
              placeholder="اختر الخزينة"
              error={errors.safeId}
              loading={safesLoading}
            />
            {/* Debug Info */}
            <Text style={styles.debugText}>
              Selected Safe ID: {formData.safeId} | Safes Count: {safes.length}
            </Text>
          </View>

          {/* Allow Multiple Apply */}
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

          {/* Debug Form Data */}
          <View style={styles.formGroup}>
            <Text style={styles.debugText}>
              Form Data: {JSON.stringify(formData, null, 2)}
            </Text>
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
                <Text style={styles.submitButtonText}>إنشاء الرسوم</Text>
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
  debugText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default AddFeeScreen;
