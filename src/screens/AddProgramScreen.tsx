import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';

interface ProgramData {
  nameAr: string;
  nameEn: string;
  price: string;
  description: string;
}

const AddProgramScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState<ProgramData>({
    nameAr: '',
    nameEn: '',
    price: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ProgramData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ProgramData> = {};

    // التحقق من اسم البرنامج بالعربية
    if (!formData.nameAr.trim()) {
      newErrors.nameAr = 'اسم البرنامج بالعربية مطلوب';
    } else if (formData.nameAr.trim().length < 3) {
      newErrors.nameAr = 'اسم البرنامج بالعربية يجب أن يكون 3 أحرف على الأقل';
    }

    // التحقق من اسم البرنامج بالإنجليزية
    if (!formData.nameEn.trim()) {
      newErrors.nameEn = 'اسم البرنامج بالإنجليزية مطلوب';
    } else if (formData.nameEn.trim().length < 3) {
      newErrors.nameEn = 'اسم البرنامج بالإنجليزية يجب أن يكون 3 أحرف على الأقل';
    }

    // التحقق من السعر
    if (!formData.price.trim()) {
      newErrors.price = 'السعر مطلوب';
    } else if (isNaN(Number(formData.price))) {
      newErrors.price = 'السعر يجب أن يكون رقم صحيح';
    } else if (Number(formData.price) <= 0) {
      newErrors.price = 'السعر يجب أن يكون أكبر من صفر';
    } else if (Number(formData.price) > 100000) {
      newErrors.price = 'السعر لا يمكن أن يكون أكبر من 100,000 جنيه';
    }

    // التحقق من الوصف
    if (!formData.description.trim()) {
      newErrors.description = 'وصف البرنامج مطلوب';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'وصف البرنامج يجب أن يكون 10 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProgramData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Real-time validation for specific fields
    if (field === 'price' && value.trim()) {
      if (isNaN(Number(value))) {
        setErrors(prev => ({
          ...prev,
          price: 'السعر يجب أن يكون رقم صحيح',
        }));
      } else if (Number(value) <= 0) {
        setErrors(prev => ({
          ...prev,
          price: 'السعر يجب أن يكون أكبر من صفر',
        }));
      } else if (Number(value) > 100000) {
        setErrors(prev => ({
          ...prev,
          price: 'السعر لا يمكن أن يكون أكبر من 100,000 جنيه',
        }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'خطأ في البيانات',
        text2: 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح',
      });
      return;
    }

    try {
      setLoading(true);
      // جلب التوكن
      const token = await AuthService.getToken();
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'انتهت الجلسة',
          text2: 'يرجى تسجيل الدخول مرة أخرى',
        });
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      // تجهيز البيانات
      const payload = {
        nameAr: formData.nameAr.trim(),
        nameEn: formData.nameEn.trim(),
        price: Number(formData.price),
        description: formData.description.trim(),
      };
      const response = await fetch('https://erpproductionbackend-production.up.railway.app/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'تم بنجاح!',
          text2: 'تم إضافة البرنامج التدريبي بنجاح',
        });
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      } else if (response.status === 401) {
        await AuthService.clearAuthData();
        Toast.show({
          type: 'error',
          text1: 'انتهت الجلسة',
          text2: 'يرجى تسجيل الدخول مرة أخرى',
        });
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else {
        console.log('Add program error:', data);
        Toast.show({
          type: 'error',
          text1: 'خطأ',
          text2: data.message || data.error || 'فشل في إضافة البرنامج',
        });
      }
    } catch (error) {
      console.error('Error adding program:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل في إضافة البرنامج',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      nameAr: '',
      nameEn: '',
      price: '',
      description: '',
    });
    setErrors({});
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="Programs" />
        <Text style={styles.title}>إضافة برنامج تدريبي</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* اسم البرنامج بالعربية */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              اسم البرنامج بالعربية <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.nameAr && styles.errorInput]}>
              <Icon name="translate" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="أدخل اسم البرنامج بالعربية"
                placeholderTextColor="#9ca3af"
                value={formData.nameAr}
                onChangeText={(value) => handleInputChange('nameAr', value)}
                textAlign="right"
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            {errors.nameAr && <Text style={styles.errorText}>{errors.nameAr}</Text>}
          </View>

          {/* اسم البرنامج بالإنجليزية */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              اسم البرنامج بالإنجليزية <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.nameEn && styles.errorInput]}>
              <Icon name="translate" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter program name in English"
                placeholderTextColor="#9ca3af"
                value={formData.nameEn}
                onChangeText={(value) => handleInputChange('nameEn', value)}
                textAlign="left"
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            {errors.nameEn && <Text style={styles.errorText}>{errors.nameEn}</Text>}
          </View>

          {/* سعر البرنامج */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              سعر البرنامج (جنيه مصري) <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.price && styles.errorInput]}>
              <Icon name="attach-money" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="أدخل سعر البرنامج"
                placeholderTextColor="#9ca3af"
                value={formData.price}
                onChangeText={(value) => handleInputChange('price', value)}
                keyboardType="numeric"
                textAlign="right"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>

          {/* وصف البرنامج */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              وصف البرنامج <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, styles.multilineContainer, errors.description && styles.errorInput]}>
              <Icon name="description" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="أدخل وصف مفصل للبرنامج التدريبي"
                placeholderTextColor="#9ca3af"
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline
                numberOfLines={4}
                textAlign="right"
                textAlignVertical="top"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* معاينة البيانات */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>معاينة البرنامج</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewNameAr}>{formData.nameAr || 'اسم البرنامج بالعربية'}</Text>
                <Text style={styles.previewPrice}>
                  {formData.price ? `${formData.price} جنيه` : 'السعر'}
                </Text>
              </View>
              <Text style={styles.previewNameEn}>{formData.nameEn || 'Program name in English'}</Text>
              <Text style={styles.previewDescription}>
                {formData.description || 'وصف البرنامج سيظهر هنا...'}
              </Text>
            </View>
          </View>

          {/* أزرار التحكم */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              disabled={loading}
            >
              <Icon name="refresh" size={20} color="#6b7280" />
              <Text style={styles.resetButtonText}>إعادة تعيين</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.submitButtonText}>جاري الإضافة...</Text>
              ) : (
                <>
                  <Icon name="save" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>إضافة البرنامج</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#e53e3e',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  multilineContainer: {
    alignItems: 'flex-start',
    minHeight: 100,
    paddingVertical: 12,
  },
  errorInput: {
    borderColor: '#e53e3e',
    backgroundColor: '#fef2f2',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'System',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
  previewContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewNameAr: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  previewPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewNameEn: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a237e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddProgramScreen;