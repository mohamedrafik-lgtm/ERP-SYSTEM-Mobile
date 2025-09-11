import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SelectBox from './SelectBox';
import { CreateMarketingTargetRequest, MONTHS, YEARS } from '../types/marketing';

interface AddTargetModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (targetData: CreateMarketingTargetRequest) => void;
  marketingEmployees: any[];
  selectedMonth: number;
  selectedYear: number;
}

const AddTargetModal: React.FC<AddTargetModalProps> = ({
  visible,
  onClose,
  onSubmit,
  marketingEmployees,
  selectedMonth,
  selectedYear,
}) => {
  const [formData, setFormData] = useState({
    employeeId: 0,
    month: selectedMonth,
    year: selectedYear,
    targetAmount: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // التحقق من البيانات المطلوبة
    if (!formData.employeeId) {
      Alert.alert('خطأ', 'يرجى اختيار موظف التسويق');
      return;
    }

    if (!formData.targetAmount || parseInt(formData.targetAmount) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال عدد صحيح للأهداف');
      return;
    }

    const targetAmount = parseInt(formData.targetAmount);
    if (targetAmount < 1 || targetAmount > 1000) {
      Alert.alert('خطأ', 'يجب أن يكون الهدف بين 1 و 1000 متدرب');
      return;
    }

    if (formData.month < 1 || formData.month > 12) {
      Alert.alert('خطأ', 'يجب أن يكون الشهر بين 1 و 12');
      return;
    }

    if (formData.year < 2020 || formData.year > 2050) {
      Alert.alert('خطأ', 'يجب أن تكون السنة بين 2020 و 2050');
      return;
    }

    setLoading(true);
    try {
      const targetData: CreateMarketingTargetRequest = {
        employeeId: formData.employeeId,
        month: formData.month,
        year: formData.year,
        targetAmount: targetAmount,
        notes: formData.notes.trim() || undefined,
        setById: undefined, // سيتم تعيينه من Backend بناءً على المستخدم المسجل دخوله
      };

      await onSubmit(targetData);
      resetForm();
    } catch (error) {
      console.error('Error submitting target:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: 0,
      month: selectedMonth,
      year: selectedYear,
      targetAmount: '',
      notes: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const employeeOptions = marketingEmployees?.map(employee => ({
    value: employee.id,
    label: employee.name,
  })) || [];

  const monthOptions = MONTHS?.map(month => ({
    value: month.value,
    label: month.label,
  })) || [];

  const yearOptions = YEARS?.map(year => ({
    value: year.value,
    label: year.label,
  })) || [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon name="track-changes" size={24} color="#1a237e" />
              <Text style={styles.headerTitle}>تحديد هدف جديد</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Employee Selection */}
            <View style={styles.inputGroup}>
              <SelectBox
                label="موظف التسويق *"
                items={employeeOptions}
                selectedValue={formData.employeeId}
                onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                placeholder="اختر موظف التسويق"
              />
            </View>

            {/* Month and Year */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <SelectBox
                  label="الشهر *"
                  items={monthOptions}
                  selectedValue={formData.month}
                  onValueChange={(value) => setFormData({ ...formData, month: value })}
                  placeholder="اختر الشهر"
                />
              </View>
              <View style={styles.halfInput}>
                <SelectBox
                  label="السنة *"
                  items={yearOptions}
                  selectedValue={formData.year}
                  onValueChange={(value) => setFormData({ ...formData, year: value })}
                  placeholder="اختر السنة"
                />
              </View>
            </View>

            {/* Target Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>عدد المتدربين المطلوب *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={formData.targetAmount}
                  onChangeText={(text) => setFormData({ ...formData, targetAmount: text })}
                  placeholder="أدخل عدد المتدربين"
                  keyboardType="numeric"
                  textAlign="right"
                />
                <Icon name="people" size={20} color="#6b7280" style={styles.inputIcon} />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ملاحظات (اختياري)</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="أدخل أي ملاحظات إضافية..."
                  multiline
                  numberOfLines={4}
                  textAlign="right"
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'جاري الحفظ...' : 'حفظ الهدف'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  selectBox: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'right',
  },
  inputIcon: {
    marginLeft: 8,
  },
  textAreaContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  textArea: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'right',
    minHeight: 80,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#1a237e',
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AddTargetModal;
