import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import EnhancedArabicInput from '../components/EnhancedArabicInput';

interface ProgramData {
  nameAr: string;
  nameEn: string;
  price: number;
  description: string;
}

const AddProgramScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState<ProgramData>({
    nameAr: '',
    nameEn: '',
    price: 0,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ProgramData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ProgramData> = {};

    if (!formData.nameAr.trim()) {
      newErrors.nameAr = 'اسم البرنامج بالعربية مطلوب';
    }

    if (!formData.nameEn.trim()) {
      newErrors.nameEn = 'اسم البرنامج بالإنجليزية مطلوب';
    }

    if (formData.price <= 0) {
      newErrors.price = 'السعر يجب أن يكون أكبر من صفر';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'وصف البرنامج مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProgramData, value: string | number) => {
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
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://10.0.2.2:4000/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في إضافة البرنامج');
      }

      Alert.alert(
        'نجح',
        'تم إضافة البرنامج التدريبي بنجاح',
        [
          {
            text: 'حسناً',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding program:', error);
      Alert.alert('خطأ', error instanceof Error ? error.message : 'فشل في إضافة البرنامج');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      nameAr: '',
      nameEn: '',
      price: 0,
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
          <EnhancedArabicInput
            label="اسم البرنامج بالعربية"
            placeholder="أدخل اسم البرنامج بالعربية"
            placeholderTextColor="#9ca3af"
            value={formData.nameAr}
            onChangeText={(value) => handleInputChange('nameAr', value)}
            isArabic={true}
            required={true}
            icon="translate"
            error={errors.nameAr}
          />

          {/* اسم البرنامج بالإنجليزية */}
          <EnhancedArabicInput
            label="اسم البرنامج بالإنجليزية"
            placeholder="Enter program name in English"
            placeholderTextColor="#9ca3af"
            value={formData.nameEn}
            onChangeText={(value) => handleInputChange('nameEn', value)}
            isArabic={false}
            required={true}
            icon="translate"
            error={errors.nameEn}
          />

          {/* سعر البرنامج */}
          <EnhancedArabicInput
            label="سعر البرنامج (جنيه مصري)"
            placeholder="أدخل سعر البرنامج"
            placeholderTextColor="#9ca3af"
            value={formData.price.toString()}
            onChangeText={(value) => {
              const numValue = parseFloat(value) || 0;
              handleInputChange('price', numValue);
            }}
            keyboardType="numeric"
            isArabic={true}
            required={true}
            icon="attach-money"
            error={errors.price}
          />

          {/* وصف البرنامج */}
          <EnhancedArabicInput
            label="وصف البرنامج"
            placeholder="أدخل وصف مفصل للبرنامج التدريبي"
            placeholderTextColor="#9ca3af"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline
            numberOfLines={4}
            isArabic={true}
            required={true}
            icon="description"
            error={errors.description}
            returnKeyType="done"
          />

          {/* معاينة البيانات */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>معاينة البرنامج</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewNameAr}>{formData.nameAr || 'اسم البرنامج بالعربية'}</Text>
                <Text style={styles.previewPrice}>
                  {formData.price > 0 ? `${formData.price} جنيه` : 'السعر'}
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
