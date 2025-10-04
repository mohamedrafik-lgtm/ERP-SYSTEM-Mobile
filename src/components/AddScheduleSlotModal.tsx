import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SelectBox from '../components/SelectBox';
import ArabicTextInput from '../components/ArabicTextInput';
import AuthService from '../services/AuthService';
import { 
  ScheduleSlotRequest, 
  DAYS_OF_WEEK, 
  ATTENDANCE_TYPES, 
  START_TIMES, 
  END_TIMES 
} from '../types/schedule';

interface AddScheduleSlotModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classroomId?: number;
}

interface TrainingContent {
  id: number;
  code: string;
  name: string;
}

interface Classroom {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

const AddScheduleSlotModal = ({ 
  visible, 
  onClose, 
  onSuccess, 
  classroomId 
}: AddScheduleSlotModalProps) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<ScheduleSlotRequest>({
    contentId: 0,
    classroomId: classroomId || 0,
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    type: '',
    location: '',
    distributionRoomId: '',
  });

  // Options data
  const [trainingContents, setTrainingContents] = useState<TrainingContent[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  useEffect(() => {
    if (visible) {
      loadOptions();
    }
  }, [visible]);

  const loadOptions = async () => {
    try {
      setLoading(true);
      console.log('🔍 AddScheduleSlotModal - Loading options...');

      // Load training contents
      const contentsResponse = await AuthService.getTrainingContents();
      console.log('🔍 AddScheduleSlotModal - Contents response:', contentsResponse);
      
      let contents = [];
      if (contentsResponse.data) {
        contents = Array.isArray(contentsResponse.data) ? contentsResponse.data : contentsResponse.data.data || contentsResponse.data.contents || contentsResponse.data.items || [];
      }
      
      setTrainingContents(contents.map((content: any) => ({
        id: content.id,
        code: content.code || content.nameAr || 'غير محدد',
        name: content.nameAr || content.name || content.title || 'غير محدد'
      })));

      // Load classrooms (mock data for now)
      const mockClassrooms = [
        { id: 1, name: 'الفصل الأول - برمجة', startDate: '2025-01-15', endDate: '2025-06-15' },
        { id: 2, name: 'الفصل الثاني - تصميم', startDate: '2025-01-20', endDate: '2025-06-20' },
        { id: 3, name: 'الفصل الثالث - شبكات', startDate: '2025-01-25', endDate: '2025-06-25' },
      ];
      setClassrooms(mockClassrooms);

      console.log('🔍 AddScheduleSlotModal - Options loaded:', {
        contents: contents.length,
        classrooms: mockClassrooms.length
      });

    } catch (error) {
      console.error('🔍 AddScheduleSlotModal - Error loading options:', error);
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ScheduleSlotRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.contentId) {
      Alert.alert('خطأ', 'يرجى اختيار المحتوى التدريبي');
      return false;
    }
    if (!formData.classroomId) {
      Alert.alert('خطأ', 'يرجى اختيار الفصل الدراسي');
      return false;
    }
    if (!formData.dayOfWeek) {
      Alert.alert('خطأ', 'يرجى اختيار يوم الأسبوع');
      return false;
    }
    if (!formData.startTime) {
      Alert.alert('خطأ', 'يرجى اختيار وقت البداية');
      return false;
    }
    if (!formData.endTime) {
      Alert.alert('خطأ', 'يرجى اختيار وقت النهاية');
      return false;
    }
    if (!formData.type) {
      Alert.alert('خطأ', 'يرجى اختيار نوع الحضور');
      return false;
    }
    if (formData.startTime >= formData.endTime) {
      Alert.alert('خطأ', 'وقت البداية يجب أن يكون قبل وقت النهاية');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      console.log('🔍 AddScheduleSlotModal - Submitting:', formData);

      await AuthService.addScheduleSlot(formData);
      
      console.log('🔍 AddScheduleSlotModal - Success!');
      Alert.alert('نجح', 'تم إضافة الفترة الدراسية بنجاح', [
        {
          text: 'موافق',
          onPress: () => {
            onSuccess();
            onClose();
            resetForm();
          }
        }
      ]);

    } catch (error) {
      console.error('🔍 AddScheduleSlotModal - Error submitting:', error);
      Alert.alert('خطأ', 'فشل في إضافة الفترة الدراسية');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      contentId: 0,
      classroomId: classroomId || 0,
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      type: '',
      location: '',
      distributionRoomId: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>إضافة فترة دراسية</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a237e" />
              <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
            </View>
          ) : (
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* المحتوى التدريبي */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>المحتوى التدريبي *</Text>
                <SelectBox
                  items={trainingContents.map(content => ({
                    id: content.id,
                    label: `${content.code} - ${content.name}`,
                    value: content.id
                  }))}
                  selectedValue={formData.contentId}
                  onValueChange={(value) => handleInputChange('contentId', value)}
                  placeholder="اختر المحتوى التدريبي"
                />
              </View>

              {/* الفصل الدراسي */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الفصل الدراسي *</Text>
                <SelectBox
                  items={classrooms.map(classroom => ({
                    id: classroom.id,
                    label: classroom.name,
                    value: classroom.id
                  }))}
                  selectedValue={formData.classroomId}
                  onValueChange={(value) => handleInputChange('classroomId', value)}
                  placeholder="اختر الفصل الدراسي"
                />
              </View>

              {/* يوم الأسبوع */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>يوم الأسبوع *</Text>
                <SelectBox
                  items={DAYS_OF_WEEK.map(day => ({
                    id: day.value,
                    label: day.label,
                    value: day.value
                  }))}
                  selectedValue={formData.dayOfWeek}
                  onValueChange={(value) => handleInputChange('dayOfWeek', value)}
                  placeholder="اختر يوم الأسبوع"
                />
              </View>

              {/* وقت البداية */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>وقت البداية *</Text>
                <SelectBox
                  items={START_TIMES.map(time => ({
                    id: time,
                    label: time,
                    value: time
                  }))}
                  selectedValue={formData.startTime}
                  onValueChange={(value) => handleInputChange('startTime', value)}
                  placeholder="اختر وقت البداية"
                />
              </View>

              {/* وقت النهاية */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>وقت النهاية *</Text>
                <SelectBox
                  items={END_TIMES.map(time => ({
                    id: time,
                    label: time,
                    value: time
                  }))}
                  selectedValue={formData.endTime}
                  onValueChange={(value) => handleInputChange('endTime', value)}
                  placeholder="اختر وقت النهاية"
                />
              </View>

              {/* نوع الحضور */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>نوع الحضور *</Text>
                <SelectBox
                  items={ATTENDANCE_TYPES.map(type => ({
                    id: type.value,
                    label: type.label,
                    value: type.value
                  }))}
                  selectedValue={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                  placeholder="اختر نوع الحضور"
                />
              </View>

              {/* القاعة أو المكان */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>القاعة أو المكان</Text>
                <ArabicTextInput
                  value={formData.location || ''}
                  onChangeText={(value) => handleInputChange('location', value)}
                  placeholder="أدخل القاعة أو المكان (اختياري)"
                />
              </View>

              {/* معرف المجموعة */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>معرف المجموعة</Text>
                <ArabicTextInput
                  value={formData.distributionRoomId || ''}
                  onChangeText={(value) => handleInputChange('distributionRoomId', value)}
                  placeholder="أدخل معرف المجموعة (اختياري)"
                />
              </View>

              {/* أزرار العمل */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleClose}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="add" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>إضافة الفترة</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#1a237e',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default AddScheduleSlotModal;
