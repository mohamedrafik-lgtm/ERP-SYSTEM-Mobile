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
import AuthService from '../services/AuthService';
import SelectBox from '../components/SelectBox';
import { 
  CreateQuestionPayload, 
  QuestionOption, 
  QuestionType, 
  QuestionSkill, 
  QuestionDifficulty 
} from '../types/student';

interface AddQuestionScreenProps {
  route: {
    params: {
      content: {
        id: number;
        name: string;
        code: string;
      };
    };
  };
  navigation: any;
}

const AddQuestionScreen = ({ route, navigation }: AddQuestionScreenProps) => {
  const { content } = route.params;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateQuestionPayload>({
    text: '',
    type: 'MULTIPLE_CHOICE',
    skill: 'RECALL',
    difficulty: 'EASY',
    chapter: 1,
    contentId: content.id,
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const questionTypeOptions = [
    { value: 'MULTIPLE_CHOICE' as QuestionType, label: 'اختيار من متعدد' },
    { value: 'TRUE_FALSE' as QuestionType, label: 'صح أو خطأ' },
  ];

  const skillOptions = [
    { value: 'RECALL' as QuestionSkill, label: 'استدعاء' },
    { value: 'COMPREHENSION' as QuestionSkill, label: 'فهم' },
    { value: 'DEDUCTION' as QuestionSkill, label: 'استنتاج' },
  ];

  const difficultyOptions = [
    { value: 'EASY' as QuestionDifficulty, label: 'سهل' },
    { value: 'MEDIUM' as QuestionDifficulty, label: 'متوسط' },
    { value: 'HARD' as QuestionDifficulty, label: 'صعب' },
    { value: 'VERY_HARD' as QuestionDifficulty, label: 'صعب جداً' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.text.trim()) {
      newErrors.text = 'نص السؤال مطلوب';
    }

    if (formData.chapter < 1) {
      newErrors.chapter = 'رقم الباب يجب أن يكون أكبر من 0';
    }

    if (formData.type === 'MULTIPLE_CHOICE') {
      const validOptions = formData.options.filter(option => option.text.trim());
      if (validOptions.length < 2) {
        newErrors.options = 'يجب إضافة خيارين على الأقل';
      }
      
      const correctOptions = validOptions.filter(option => option.isCorrect);
      if (correctOptions.length === 0) {
        newErrors.options = 'يجب تحديد إجابة صحيحة واحدة على الأقل';
      }
    } else if (formData.type === 'TRUE_FALSE') {
      // For true/false questions, we need exactly 2 options
      const validOptions = formData.options.filter(option => option.text.trim());
      if (validOptions.length !== 2) {
        newErrors.options = 'يجب إضافة خيارين فقط (صح/خطأ)';
      }
      
      const correctOptions = validOptions.filter(option => option.isCorrect);
      if (correctOptions.length !== 1) {
        newErrors.options = 'يجب تحديد إجابة صحيحة واحدة فقط';
      }
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

      // Filter out empty options
      const validOptions = formData.options.filter(option => option.text.trim());
      
      const questionData: CreateQuestionPayload = {
        ...formData,
        options: validOptions,
      };

      await AuthService.createQuestion(questionData);
      
      Alert.alert('نجح', 'تم إضافة السؤال بنجاح', [
        {
          text: 'حسناً',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating question:', error);
      Alert.alert('خطأ', 'فشل في إضافة السؤال');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({
        ...formData,
        options: [...formData.options, { text: '', isCorrect: false }],
      });
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions,
      });
    }
  };

  const updateOption = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({
      ...formData,
      options: newOptions,
    });
  };

  const handleInputChange = (field: keyof CreateQuestionPayload, value: any) => {
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
          <Text style={styles.headerTitle}>إضافة سؤال جديد</Text>
          <Text style={styles.headerSubtitle}>{content.name} ({content.code})</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Question Text */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>نص السؤال *</Text>
            <TextInput
              style={[styles.textArea, errors.text && styles.errorInput]}
              value={formData.text}
              onChangeText={(text) => handleInputChange('text', text)}
              placeholder="اكتب نص السؤال هنا..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlign="right"
            />
            {errors.text && <Text style={styles.errorText}>{errors.text}</Text>}
          </View>

          {/* Question Type */}
          <SelectBox
            label="نوع السؤال *"
            selectedValue={formData.type}
            onValueChange={(value) => handleInputChange('type', value)}
            items={questionTypeOptions}
            placeholder="اختر نوع السؤال"
          />

          {/* Skill */}
          <SelectBox
            label="المهارة *"
            selectedValue={formData.skill}
            onValueChange={(value) => handleInputChange('skill', value)}
            items={skillOptions}
            placeholder="اختر المهارة"
          />

          {/* Difficulty */}
          <SelectBox
            label="مستوى الصعوبة *"
            selectedValue={formData.difficulty}
            onValueChange={(value) => handleInputChange('difficulty', value)}
            items={difficultyOptions}
            placeholder="اختر مستوى الصعوبة"
          />

          {/* Chapter */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>رقم الباب *</Text>
            <TextInput
              style={[styles.input, errors.chapter && styles.errorInput]}
              value={formData.chapter.toString()}
              onChangeText={(text) => handleInputChange('chapter', parseInt(text) || 1)}
              placeholder="رقم الباب"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              textAlign="right"
            />
            {errors.chapter && <Text style={styles.errorText}>{errors.chapter}</Text>}
          </View>

          {/* Options */}
          <View style={styles.formGroup}>
            <View style={styles.optionsHeader}>
              <Text style={styles.label}>خيارات الإجابة *</Text>
              {formData.options.length < 6 && (
                <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
                  <Icon name="add" size={20} color="#1a237e" />
                  <Text style={styles.addOptionText}>إضافة خيار</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {formData.options.map((option, index) => (
              <View key={index} style={styles.optionContainer}>
                <View style={styles.optionInputContainer}>
                  <TextInput
                    style={styles.optionInput}
                    value={option.text}
                    onChangeText={(text) => updateOption(index, 'text', text)}
                    placeholder={`خيار ${index + 1}`}
                    placeholderTextColor="#9CA3AF"
                    textAlign="right"
                  />
                  <TouchableOpacity
                    style={[
                      styles.correctButton,
                      option.isCorrect && styles.correctButtonActive,
                    ]}
                    onPress={() => updateOption(index, 'isCorrect', !option.isCorrect)}
                  >
                    <Icon 
                      name={option.isCorrect ? "check" : "close"} 
                      size={16} 
                      color={option.isCorrect ? "#fff" : "#666"} 
                    />
                  </TouchableOpacity>
                  {formData.options.length > 2 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeOption(index)}
                    >
                      <Icon name="delete" size={16} color="#dc2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            
            {errors.options && <Text style={styles.errorText}>{errors.options}</Text>}
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
                <Text style={styles.submitButtonText}>إضافة السؤال</Text>
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
    paddingTop: 8,
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
    minHeight: 120,
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
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a237e',
    borderRadius: 8,
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  optionContainer: {
    marginBottom: 12,
  },
  optionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    textAlign: 'right',
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  correctButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  correctButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fecaca',
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

export default AddQuestionScreen;
