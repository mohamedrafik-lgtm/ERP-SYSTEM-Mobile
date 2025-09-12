import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import WhatsAppAutoMessageService from '../services/WhatsAppAutoMessageService';
import { ITrainee, UpdateTraineePayload } from '../types/student';
import { 
  EnrollmentType, 
  MaritalStatus, 
  ProgramType, 
  Gender, 
  Religion, 
  EducationType, 
  TraineeStatus, 
  Year 
} from '../types/enums';

const EditTraineeScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { trainee } = route.params as { trainee: ITrainee };

  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [formData, setFormData] = useState<UpdateTraineePayload>({});
  const [updatedFields, setUpdatedFields] = useState<string[]>([]);

  useEffect(() => {
    // Initialize form data with current trainee data
    setFormData({
      nameAr: trainee.nameAr,
      nameEn: trainee.nameEn,
      enrollmentType: trainee.enrollmentType,
      maritalStatus: trainee.maritalStatus,
      nationalId: trainee.nationalId,
      idIssueDate: trainee.idIssueDate,
      idExpiryDate: trainee.idExpiryDate,
      programType: trainee.programType,
      nationality: trainee.nationality,
      gender: trainee.gender,
      birthDate: trainee.birthDate,
      residenceAddress: trainee.residenceAddress,
      religion: trainee.religion,
      programId: trainee.programId,
      country: trainee.country,
      governorate: trainee.governorate,
      city: trainee.city,
      address: trainee.address,
      phone: trainee.phone,
      email: trainee.email,
      guardianPhone: trainee.guardianPhone,
      guardianEmail: trainee.guardianEmail,
      guardianJob: trainee.guardianJob,
      guardianRelation: trainee.guardianRelation,
      guardianName: trainee.guardianName,
      landline: trainee.landline,
      whatsapp: trainee.whatsapp,
      facebook: trainee.facebook,
      educationType: trainee.educationType,
      schoolName: trainee.schoolName,
      graduationDate: trainee.graduationDate,
      totalGrade: trainee.totalGrade,
      gradePercentage: trainee.gradePercentage,
      sportsActivity: trainee.sportsActivity,
      culturalActivity: trainee.culturalActivity,
      educationalActivity: trainee.educationalActivity,
      notes: trainee.notes,
      traineeStatus: trainee.traineeStatus,
      classLevel: trainee.classLevel,
      academicYear: trainee.academicYear,
      marketingEmployeeId: trainee.marketingEmployeeId,
      firstContactEmployeeId: trainee.firstContactEmployeeId,
      secondContactEmployeeId: trainee.secondContactEmployeeId,
    });
  }, [trainee]);

  const handleInputChange = (field: keyof UpdateTraineePayload, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Track updated fields
    if (value !== trainee[field as keyof ITrainee]) {
      if (!updatedFields.includes(field)) {
        setUpdatedFields(prev => [...prev, field]);
      }
    } else {
      setUpdatedFields(prev => prev.filter(f => f !== field));
    }
  };

  const handleUpdate = async () => {
    if (updatedFields.length === 0) {
      Alert.alert('تنبيه', 'لم يتم تحديث أي حقل');
      return;
    }

    Alert.alert(
      'تأكيد التحديث',
      `هل تريد تحديث ${updatedFields.length} حقل؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تحديث', onPress: confirmUpdate },
      ]
    );
  };

  const confirmUpdate = async () => {
    try {
      setLoading(true);

      // Prepare update data with only changed fields
      const updateData: UpdateTraineePayload = {};
      updatedFields.forEach(field => {
        const value = formData[field];
        // Only include non-empty values
        if (value !== undefined && value !== null && value !== '') {
          // Handle date fields - ensure they're in ISO format
          if (field.includes('Date') && typeof value === 'string') {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                updateData[field] = date.toISOString().split('T')[0]; // YYYY-MM-DD format
              } else {
                updateData[field] = value;
              }
            } catch (e) {
              updateData[field] = value;
            }
          } 
          // Handle numeric fields
          else if (field === 'totalGrade' || field === 'gradePercentage' || field === 'programId' || field === 'marketingEmployeeId' || field === 'firstContactEmployeeId' || field === 'secondContactEmployeeId') {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              updateData[field] = numValue;
            } else {
              updateData[field] = value;
            }
          } 
          else {
            updateData[field] = value;
          }
        }
      });

      // Check if there's any data to update
      if (Object.keys(updateData).length === 0) {
        Alert.alert('تنبيه', 'لا توجد بيانات للتحديث');
        return;
      }

      // Update trainee
      console.log('Updating trainee with data:', updateData);
      const response = await AuthService.updateTrainee(trainee.id, updateData);
      console.log('Update response:', response);

      // Check if update was successful (API might return data directly or with success field)
      if (response.success !== false && (response.success === true || response.data || response)) {
        // Show success message
        if (Toast && Toast.show) {
          Toast.show({
            type: 'success',
            text1: 'تم التحديث بنجاح',
            text2: 'تم تحديث بيانات المتدرب',
          });
        } else {
          Alert.alert('نجح', 'تم تحديث بيانات المتدرب بنجاح');
        }

        // Send WhatsApp message if phone number is available
        if (trainee.phone) {
          setSendingMessage(true);
          try {
            await WhatsAppAutoMessageService.sendTraineeUpdateMessage(
              trainee.phone,
              trainee.nameAr,
              updatedFields.map(field => getFieldDisplayName(field)),
              'النظام', // You can get this from user context
              new Date().toISOString(),
              updateData
            );
            
            if (Toast && Toast.show) {
              Toast.show({
                type: 'success',
                text1: 'تم إرسال الإشعار',
                text2: 'تم إرسال رسالة WhatsApp للمتدرب',
              });
            } else {
              Alert.alert('نجح', 'تم إرسال رسالة WhatsApp للمتدرب');
            }
          } catch (messageError) {
            console.error('Error sending WhatsApp message:', messageError);
            if (Toast && Toast.show) {
              Toast.show({
                type: 'error',
                text1: 'خطأ في الإرسال',
                text2: 'تم التحديث ولكن فشل إرسال الرسالة',
              });
            } else {
              Alert.alert('تحذير', 'تم التحديث ولكن فشل إرسال الرسالة');
            }
          } finally {
            setSendingMessage(false);
          }
        }

        // Navigate back
        navigation.goBack();
      } else {
        throw new Error(response.message || response.error || 'فشل في تحديث المتدرب');
      }
    } catch (error: any) {
      console.error('Error updating trainee:', error);
      if (Toast && Toast.show) {
        Toast.show({
          type: 'error',
          text1: 'خطأ في التحديث',
          text2: error.message || 'حدث خطأ غير متوقع',
        });
      } else {
        Alert.alert('خطأ', error.message || 'حدث خطأ غير متوقع');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldDisplayName = (field: string): string => {
    const fieldNames: { [key: string]: string } = {
      nameAr: 'الاسم بالعربية',
      nameEn: 'الاسم بالإنجليزية',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      address: 'العنوان',
      city: 'المدينة',
      governorate: 'المحافظة',
      country: 'البلد',
      nationalId: 'الرقم القومي',
      guardianName: 'اسم ولي الأمر',
      guardianPhone: 'هاتف ولي الأمر',
      guardianEmail: 'بريد ولي الأمر',
      traineeStatus: 'حالة المتدرب',
      programId: 'البرنامج',
      notes: 'الملاحظات',
    };
    return fieldNames[field] || field;
  };

  const renderInput = (
    label: string,
    field: keyof UpdateTraineePayload,
    placeholder?: string,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          updatedFields.includes(field) && styles.updatedInput
        ]}
        value={formData[field]?.toString() || ''}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder || label}
        keyboardType={keyboardType}
        multiline={field === 'notes' || field === 'address'}
        numberOfLines={field === 'notes' || field === 'address' ? 3 : 1}
      />
    </View>
  );

  const renderSelect = (
    label: string,
    field: keyof UpdateTraineePayload,
    options: { value: any; label: string }[]
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.selectContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectOption,
              formData[field] === option.value && styles.selectedOption
            ]}
            onPress={() => handleInputChange(field, option.value)}
          >
            <Text style={[
              styles.selectOptionText,
              formData[field] === option.value && styles.selectedOptionText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تحديث بيانات المتدرب</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>
          
          {renderInput('الاسم بالعربية', 'nameAr', 'أدخل الاسم بالعربية')}
          {renderInput('الاسم بالإنجليزية', 'nameEn', 'أدخل الاسم بالإنجليزية')}
          {renderInput('الرقم القومي', 'nationalId', 'أدخل الرقم القومي', 'numeric')}
          {renderInput('رقم الهاتف', 'phone', 'أدخل رقم الهاتف', 'numeric')}
          {renderInput('البريد الإلكتروني', 'email', 'أدخل البريد الإلكتروني', 'email-address')}
          
          {renderSelect('الجنس', 'gender', [
            { value: Gender.MALE, label: 'ذكر' },
            { value: Gender.FEMALE, label: 'أنثى' },
          ])}
          
          {renderSelect('الحالة الاجتماعية', 'maritalStatus', [
            { value: MaritalStatus.SINGLE, label: 'أعزب' },
            { value: MaritalStatus.MARRIED, label: 'متزوج' },
            { value: MaritalStatus.DIVORCED, label: 'مطلق' },
            { value: MaritalStatus.WIDOWED, label: 'أرمل' },
          ])}
        </View>

        {/* Address Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات العنوان</Text>
          
          {renderInput('البلد', 'country', 'أدخل البلد')}
          {renderInput('المحافظة', 'governorate', 'أدخل المحافظة')}
          {renderInput('المدينة', 'city', 'أدخل المدينة')}
          {renderInput('العنوان', 'address', 'أدخل العنوان التفصيلي')}
          {renderInput('رقم الأرضي', 'landline', 'أدخل رقم الهاتف الأرضي', 'numeric')}
        </View>

        {/* Guardian Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات ولي الأمر</Text>
          
          {renderInput('اسم ولي الأمر', 'guardianName', 'أدخل اسم ولي الأمر')}
          {renderInput('هاتف ولي الأمر', 'guardianPhone', 'أدخل هاتف ولي الأمر', 'numeric')}
          {renderInput('بريد ولي الأمر', 'guardianEmail', 'أدخل بريد ولي الأمر', 'email-address')}
          {renderInput('عمل ولي الأمر', 'guardianJob', 'أدخل عمل ولي الأمر')}
          {renderInput('صلة القرابة', 'guardianRelation', 'أدخل صلة القرابة')}
        </View>

        {/* Academic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات الأكاديمية</Text>
          
          {renderSelect('نوع التعليم', 'educationType', [
            { value: EducationType.GENERAL, label: 'عام' },
            { value: EducationType.TECHNICAL, label: 'فني' },
            { value: EducationType.VOCATIONAL, label: 'مهني' },
          ])}
          
          {renderInput('اسم المدرسة', 'schoolName', 'أدخل اسم المدرسة')}
          {renderInput('تاريخ التخرج', 'graduationDate', 'YYYY-MM-DD')}
          {renderInput('المجموع', 'totalGrade', 'أدخل المجموع', 'numeric')}
          {renderInput('النسبة المئوية', 'gradePercentage', 'أدخل النسبة المئوية', 'numeric')}
          
          {renderSelect('حالة المتدرب', 'traineeStatus', [
            { value: TraineeStatus.NEW, label: 'مستجد' },
            { value: TraineeStatus.CURRENT, label: 'مستمر' },
            { value: TraineeStatus.GRADUATE, label: 'خريج' },
            { value: TraineeStatus.WITHDRAWN, label: 'منسحب' },
          ])}
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات إضافية</Text>
          
          {renderInput('النشاط الرياضي', 'sportsActivity', 'أدخل النشاط الرياضي')}
          {renderInput('النشاط الثقافي', 'culturalActivity', 'أدخل النشاط الثقافي')}
          {renderInput('النشاط التعليمي', 'educationalActivity', 'أدخل النشاط التعليمي')}
          {renderInput('الملاحظات', 'notes', 'أدخل أي ملاحظات إضافية')}
        </View>

        {/* Update Summary */}
        {updatedFields.length > 0 && (
          <View style={styles.updateSummary}>
            <Text style={styles.updateSummaryTitle}>
              الحقول المحدثة ({updatedFields.length})
            </Text>
            {updatedFields.map((field) => (
              <Text key={field} style={styles.updatedField}>
                • {getFieldDisplayName(field)}
              </Text>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>إلغاء</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.updateButton,
              (loading || updatedFields.length === 0) && styles.disabledButton
            ]}
            onPress={handleUpdate}
            disabled={loading || updatedFields.length === 0}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.updateButtonText}>
                تحديث البيانات
                {sendingMessage && ' وإرسال الإشعار...'}
              </Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2c3e50',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  updatedInput: {
    borderColor: '#3498db',
    backgroundColor: '#f8f9ff',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  selectOptionText: {
    fontSize: 12,
    color: '#666',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  updateSummary: {
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  updateSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 10,
  },
  updatedField: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  updateButton: {
    backgroundColor: '#3498db',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditTraineeScreen;
