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
  START_TIMES, 
  END_TIMES 
} from '../types/schedule';
import { ClassroomScheduleResponse, SLOT_TYPES } from '../types/scheduleManagement';

interface AddScheduleSlotModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classroomId?: number;
  slotToEdit?: ClassroomScheduleResponse | null;
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

interface DistributionRoomOption {
  id: string;
  roomName: string;
  _count?: {
    assignments?: number;
  };
}

const AddScheduleSlotModal = ({ 
  visible, 
  onClose, 
  onSuccess, 
  classroomId,
  slotToEdit,
}: AddScheduleSlotModalProps) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = Boolean(slotToEdit?.id);

  const getInitialFormData = (): ScheduleSlotRequest => ({
    contentId: slotToEdit?.contentId || 0,
    classroomId: classroomId || slotToEdit?.classroomId || 0,
    dayOfWeek: slotToEdit?.dayOfWeek || 'SUNDAY',
    startTime: slotToEdit?.startTime || '09:00',
    endTime: slotToEdit?.endTime || '10:00',
    type: slotToEdit?.type || 'THEORY',
    location: slotToEdit?.location || '',
    distributionRoomId: slotToEdit?.distributionRoomId || '',
  });
  
  // Form data
  const [formData, setFormData] = useState<ScheduleSlotRequest>(getInitialFormData());

  // Options data
  const [trainingContents, setTrainingContents] = useState<TrainingContent[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [availableRooms, setAvailableRooms] = useState<DistributionRoomOption[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (visible) {
      setFormData(getInitialFormData());
      loadOptions();
    }
  }, [visible, classroomId, slotToEdit]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (!formData.contentId || !formData.type || !['THEORY', 'PRACTICAL'].includes(formData.type)) {
      setAvailableRooms([]);
      return;
    }

    loadDistributionRooms(formData.contentId, formData.type as 'THEORY' | 'PRACTICAL');
  }, [visible, formData.contentId, formData.type]);

  const loadDistributionRooms = async (contentId: number, type: 'THEORY' | 'PRACTICAL') => {
    try {
      setLoadingRooms(true);
      const rooms = await AuthService.getScheduleDistributionRooms(contentId, type);
      setAvailableRooms(Array.isArray(rooms) ? rooms : []);
    } catch {
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadOptions = async () => {
    try {
      setLoading(true);
      const targetClassroomId = classroomId || slotToEdit?.classroomId || formData.classroomId;

      if (targetClassroomId) {
        const contents = await AuthService.getTrainingContentsByClassroom(targetClassroomId);
        setTrainingContents(
          (Array.isArray(contents) ? contents : []).map((content: any) => ({
            id: Number(content.id),
            code: content.code || content.nameAr || 'غير محدد',
            name: content.nameAr || content.name || content.title || 'غير محدد',
          })),
        );

        setClassrooms([]);
      } else {
        const programs = await AuthService.getAllPrograms();
        const normalizedPrograms = Array.isArray(programs) ? programs : [];
        const flattenedClassrooms = normalizedPrograms.flatMap((program: any) =>
          (Array.isArray(program?.classrooms) ? program.classrooms : []).map((item: any) => ({
            id: Number(item.id),
            name: item.name || `فصل ${item.classNumber || item.id}`,
            startDate: item.startDate || '',
            endDate: item.endDate || '',
          })),
        );

        const contents = await AuthService.getTrainingContents({ limit: 300 });
        const normalizedContents = Array.isArray(contents)
          ? contents
          : Array.isArray((contents as any)?.data)
            ? (contents as any).data
            : [];

        setClassrooms(flattenedClassrooms);
        setTrainingContents(
          normalizedContents.map((content: any) => ({
            id: Number(content.id),
            code: content.code || content.nameAr || 'غير محدد',
            name: content.nameAr || content.name || content.title || 'غير محدد',
          })),
        );
      }

    } catch (error) {
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
      Alert.alert('خطأ', 'يرجى اختيار نوع الفترة');
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

      const payload = {
        contentId: Number(formData.contentId),
        classroomId: Number(formData.classroomId),
        dayOfWeek: formData.dayOfWeek as any,
        startTime: formData.startTime,
        endTime: formData.endTime,
        type: formData.type as any,
        location: formData.location?.trim() || undefined,
        distributionRoomId: formData.distributionRoomId?.trim() || undefined,
      };

      if (isEditMode && slotToEdit?.id) {
        await AuthService.updateScheduleSlot(slotToEdit.id, payload);
      } else {
        await AuthService.createScheduleSlot(payload);
      }

      Alert.alert('نجح', isEditMode ? 'تم تعديل الفترة الدراسية بنجاح' : 'تم إضافة الفترة الدراسية بنجاح', [
        {
          text: 'موافق',
          onPress: () => {
            onSuccess();
            resetForm();
            onClose();
          }
        }
      ]);

    } catch (error) {
      Alert.alert('خطأ', isEditMode ? 'فشل في تعديل الفترة الدراسية' : 'فشل في إضافة الفترة الدراسية');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
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
            <Text style={styles.modalTitle}>{isEditMode ? 'تعديل فترة دراسية' : 'إضافة فترة دراسية'}</Text>
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
                  label="المحتوى التدريبي"
                  items={trainingContents.map(content => ({
                    label: `${content.code} - ${content.name}`,
                    value: content.id
                  }))}
                  selectedValue={formData.contentId}
                  onValueChange={(value) => {
                    handleInputChange('contentId', value);
                    handleInputChange('distributionRoomId', '');
                  }}
                  placeholder="اختر المحتوى التدريبي"
                />
              </View>

              {/* الفصل الدراسي */}
              {!classroomId && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>الفصل الدراسي *</Text>
                  <SelectBox
                    label="الفصل الدراسي"
                    items={classrooms.map(classroom => ({
                      label: classroom.name,
                      value: classroom.id
                    }))}
                    selectedValue={formData.classroomId}
                    onValueChange={(value) => handleInputChange('classroomId', value)}
                    placeholder="اختر الفصل الدراسي"
                  />
                </View>
              )}

              {/* يوم الأسبوع */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>يوم الأسبوع *</Text>
                <SelectBox
                  label="يوم الأسبوع"
                  items={DAYS_OF_WEEK.map(day => ({
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
                  label="وقت البداية"
                  items={START_TIMES.map(time => ({
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
                  label="وقت النهاية"
                  items={END_TIMES.map(time => ({
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
                <Text style={styles.inputLabel}>نوع الفترة *</Text>
                <SelectBox
                  label="نوع الفترة"
                  items={SLOT_TYPES.map(type => ({
                    label: type.label,
                    value: type.value
                  }))}
                  selectedValue={formData.type}
                  onValueChange={(value) => {
                    handleInputChange('type', value);
                    handleInputChange('distributionRoomId', '');
                  }}
                  placeholder="اختر نوع الحضور"
                />
              </View>

              {/* المجموعة */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>المجموعة</Text>
                <SelectBox
                  label="المجموعة"
                  items={[
                    { label: 'الكل', value: '' },
                    ...availableRooms.map((room) => ({
                      label: `${room.roomName} (${room?._count?.assignments || 0})`,
                      value: String(room.id),
                    })),
                  ]}
                  selectedValue={formData.distributionRoomId || ''}
                  onValueChange={(value) => handleInputChange('distributionRoomId', value)}
                  placeholder="اختر المجموعة"
                  disabled={availableRooms.length === 0}
                  loading={loadingRooms}
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
                      <Text style={styles.submitButtonText}>{isEditMode ? 'حفظ التعديل' : 'إضافة الفترة'}</Text>
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
