import React, { useState, useEffect } from 'react';
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
import { Program } from './ProgramsScreen'; // Import the Program interface

interface ProgramData {
  nameAr: string;
  nameEn: string;
  price: string;
  description: string;
}

const EditProgramScreen = ({ route, navigation }: any) => {
  const { program } = route.params as { program: Program };

  const [formData, setFormData] = useState<ProgramData>({
    nameAr: '',
    nameEn: '',
    price: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ProgramData>>({});

  useEffect(() => {
    if (program) {
      setFormData({
        nameAr: program.nameAr,
        nameEn: program.nameEn,
        price: program.price.toString(),
        description: program.description,
      });
    }
  }, [program]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ProgramData> = {};

    if (!formData.nameAr.trim()) {
      newErrors.nameAr = 'اسم البرنامج بالعربية مطلوب';
    } else if (formData.nameAr.trim().length < 3) {
      newErrors.nameAr = 'اسم البرنامج بالعربية يجب أن يكون 3 أحرف على الأقل';
    }

    if (!formData.nameEn.trim()) {
      newErrors.nameEn = 'اسم البرنامج بالإنجليزية مطلوب';
    } else if (formData.nameEn.trim().length < 3) {
      newErrors.nameEn = 'اسم البرنامج بالإنجليزية يجب أن يكون 3 أحرف على الأقل';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'السعر مطلوب';
    } else if (isNaN(Number(formData.price))) {
      newErrors.price = 'السعر يجب أن يكون رقم صحيح';
    } else if (Number(formData.price) <= 0) {
      newErrors.price = 'السعر يجب أن يكون أكبر من صفر';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'وصف البرنامج مطلوب';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'وصف البرنامج يجب أن يكون 10 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProgramData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
      const payload = {
        nameAr: formData.nameAr.trim(),
        nameEn: formData.nameEn.trim(),
        price: Number(formData.price),
        description: formData.description.trim(),
      };

      await AuthService.updateProgram(program.id, payload);

      Toast.show({
        type: 'success',
        text1: 'تم بنجاح!',
        text2: 'تم تحديث البرنامج التدريبي بنجاح',
      });

      setTimeout(() => {
        navigation.navigate('Programs', { refresh: true });
      }, 1000);

    } catch (error) {
      console.error('Error updating program:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحديث البرنامج';
      Toast.show({ type: 'error', text1: 'خطأ', text2: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-forward-ios" size={24} color="#1a237e" />
        </TouchableOpacity>
        <Text style={styles.title}>تعديل برنامج تدريبي</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Form fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>اسم البرنامج بالعربية <Text style={styles.required}>*</Text></Text>
            <View style={[styles.inputContainer, errors.nameAr && styles.errorInput]}>
              <Icon name="translate" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="أدخل اسم البرنامج بالعربية"
                value={formData.nameAr}
                onChangeText={(value) => handleInputChange('nameAr', value)}
                textAlign="right"
              />
            </View>
            {errors.nameAr && <Text style={styles.errorText}>{errors.nameAr}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>اسم البرنامج بالإنجليزية <Text style={styles.required}>*</Text></Text>
            <View style={[styles.inputContainer, errors.nameEn && styles.errorInput]}>
              <Icon name="translate" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter program name in English"
                value={formData.nameEn}
                onChangeText={(value) => handleInputChange('nameEn', value)}
                textAlign="left"
              />
            </View>
            {errors.nameEn && <Text style={styles.errorText}>{errors.nameEn}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>سعر البرنامج (جنيه مصري) <Text style={styles.required}>*</Text></Text>
            <View style={[styles.inputContainer, errors.price && styles.errorInput]}>
              <Icon name="attach-money" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="أدخل سعر البرنامج"
                value={formData.price}
                onChangeText={(value) => handleInputChange('price', value)}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>وصف البرنامج <Text style={styles.required}>*</Text></Text>
            <View style={[styles.inputContainer, styles.multilineContainer, errors.description && styles.errorInput]}>
              <Icon name="description" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="أدخل وصف مفصل للبرنامج التدريبي"
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline
                numberOfLines={4}
                textAlign="right"
              />
            </View>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.submitButtonText}>جاري التحديث...</Text>
              ) : (
                <>
                  <Icon name="save" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>حفظ التعديلات</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  backButton: {
    padding: 10,
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
  },
  multilineContainer: {
    minHeight: 100,
  },
  errorInput: {
    borderColor: '#e53e3e',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 12,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
});

export default EditProgramScreen;
