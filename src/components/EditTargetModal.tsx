import React, { useState, useEffect } from 'react';
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
import { UpdateMarketingTargetRequest, MarketingTargetWithAchieved } from '../types/marketing';

interface EditTargetModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (targetId: number, targetData: UpdateMarketingTargetRequest) => void;
  target: MarketingTargetWithAchieved | null;
}

const EditTargetModal: React.FC<EditTargetModalProps> = ({
  visible,
  onClose,
  onSubmit,
  target,
}) => {
  const [formData, setFormData] = useState({
    targetAmount: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  // تحديث البيانات عند تغيير الـ target
  useEffect(() => {
    if (target) {
      setFormData({
        targetAmount: target.targetAmount.toString(),
        notes: target.notes || '',
      });
    }
  }, [target]);

  const handleSubmit = async () => {
    // التحقق من البيانات المطلوبة
    if (!formData.targetAmount || parseInt(formData.targetAmount) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال عدد صحيح للأهداف');
      return;
    }

    const targetAmount = parseInt(formData.targetAmount);
    if (targetAmount < 1 || targetAmount > 1000) {
      Alert.alert('خطأ', 'يجب أن يكون الهدف بين 1 و 1000 متدرب');
      return;
    }

    if (!target) {
      Alert.alert('خطأ', 'لم يتم العثور على الهدف');
      return;
    }

    setLoading(true);
    try {
      const targetData: UpdateMarketingTargetRequest = {
        targetAmount: targetAmount,
        notes: formData.notes.trim() || undefined,
      };

      await onSubmit(target.id, targetData);
      resetForm();
    } catch (error) {
      console.error('Error submitting target update:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      targetAmount: '',
      notes: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
              <Icon name="edit" size={24} color="#1a237e" />
              <Text style={styles.headerTitle}>تعديل الهدف</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Target Info Display */}
            {target && (
              <View style={styles.targetInfoSection}>
                <Text style={styles.sectionTitle}>معلومات الهدف</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>الموظف:</Text>
                  <Text style={styles.infoValue}>{target.employee.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>الشهر:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(target.year, target.month - 1).toLocaleDateString('ar-EG', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>المحقق حالياً:</Text>
                  <Text style={styles.infoValue}>{target.achievedAmount} متدرب</Text>
                </View>
              </View>
            )}

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
                {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
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
  targetInfoSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 12,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
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

export default EditTargetModal;
