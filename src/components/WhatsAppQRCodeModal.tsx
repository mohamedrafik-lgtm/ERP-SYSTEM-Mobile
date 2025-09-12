import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface WhatsAppQRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  qrCode?: string | null;
  isReady: boolean;
  isLoading: boolean;
  error?: string;
}

const WhatsAppQRCodeModal: React.FC<WhatsAppQRCodeModalProps> = ({
  visible,
  onClose,
  qrCode,
  isReady,
  isLoading,
  error,
}) => {
  const handleClose = () => {
    if (isLoading) {
      Alert.alert(
        'جاري التحميل',
        'يتم إنشاء رمز QR، هل تريد الإلغاء؟',
        [
          { text: 'متابعة التحميل', style: 'cancel' },
          { text: 'إلغاء', onPress: onClose, style: 'destructive' }
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>ربط حساب WhatsApp</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>جاري إنشاء رمز QR...</Text>
                <Text style={styles.loadingSubtext}>يرجى الانتظار</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={64} color="#ef4444" />
                <Text style={styles.errorTitle}>حدث خطأ</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={onClose}>
                  <Text style={styles.retryButtonText}>إغلاق</Text>
                </TouchableOpacity>
              </View>
            ) : isReady ? (
              <View style={styles.successContainer}>
                <Icon name="check-circle" size={64} color="#10b981" />
                <Text style={styles.successTitle}>متصل بنجاح!</Text>
                <Text style={styles.successText}>
                  تم ربط حساب WhatsApp بنجاح
                </Text>
                <TouchableOpacity style={styles.successButton} onPress={onClose}>
                  <Text style={styles.successButtonText}>ممتاز</Text>
                </TouchableOpacity>
              </View>
            ) : qrCode ? (
              <View style={styles.qrContainer}>
                <Text style={styles.qrTitle}>امسح رمز QR</Text>
                <Text style={styles.qrSubtitle}>
                  افتح WhatsApp على هاتفك وامسح هذا الرمز
                </Text>
                
                <View style={styles.qrCodeContainer}>
                  <Image
                    source={{ uri: qrCode }}
                    style={styles.qrCodeImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.instructions}>
                  <Text style={styles.instructionTitle}>خطوات الربط:</Text>
                  <View style={styles.instructionList}>
                    <View style={styles.instructionItem}>
                      <Text style={styles.instructionNumber}>1</Text>
                      <Text style={styles.instructionText}>افتح WhatsApp على هاتفك</Text>
                    </View>
                    <View style={styles.instructionItem}>
                      <Text style={styles.instructionNumber}>2</Text>
                      <Text style={styles.instructionText}>اضغط على النقاط الثلاث (⋮)</Text>
                    </View>
                    <View style={styles.instructionItem}>
                      <Text style={styles.instructionNumber}>3</Text>
                      <Text style={styles.instructionText}>اختر "الأجهزة المرتبطة"</Text>
                    </View>
                    <View style={styles.instructionItem}>
                      <Text style={styles.instructionNumber}>4</Text>
                      <Text style={styles.instructionText}>اضغط "ربط جهاز"</Text>
                    </View>
                    <View style={styles.instructionItem}>
                      <Text style={styles.instructionNumber}>5</Text>
                      <Text style={styles.instructionText}>امسح رمز QR</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.statusInfo}>
                  <Icon name="info" size={16} color="#6b7280" />
                  <Text style={styles.statusInfoText}>
                    سيتم إغلاق هذه النافذة تلقائياً عند نجاح الربط
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="qr-code" size={64} color="#6b7280" />
                <Text style={styles.emptyTitle}>لا يوجد رمز QR</Text>
                <Text style={styles.emptyText}>
                  لم يتم إنشاء رمز QR بعد
                </Text>
              </View>
            )}
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
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 16,
  },
  successText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  qrCodeContainer: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  instructions: {
    width: '100%',
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 12,
  },
  instructionList: {
    gap: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  statusInfoText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default WhatsAppQRCodeModal;
