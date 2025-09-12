import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import AuthService from '../services/AuthService';
import { WhatsAppSendMessageRequest } from '../types/whatsapp';

const WhatsAppTestMessage: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('رسالة تجريبية');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid phone number (8-15 digits)
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      return false;
    }
    
    // Check if it starts with valid prefixes
    const validPrefixes = ['966', '20', '971', '965', '973', '974', '975', '976', '977', '978', '979'];
    const hasValidPrefix = validPrefixes.some(prefix => cleanPhone.startsWith(prefix));
    
    return hasValidPrefix || cleanPhone.length >= 10;
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // If it doesn't start with country code, add Saudi Arabia code
    if (!cleanPhone.startsWith('966') && cleanPhone.length === 9) {
      return `966${cleanPhone}`;
    }
    
    return cleanPhone;
  };

  const handleSendMessage = async () => {
    // Validation
    if (!phoneNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'خطأ في الإدخال',
        text2: 'يرجى إدخال رقم الهاتف',
      });
      return;
    }

    if (!message.trim()) {
      Toast.show({
        type: 'error',
        text1: 'خطأ في الإدخال',
        text2: 'يرجى إدخال محتوى الرسالة',
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Toast.show({
        type: 'error',
        text1: 'رقم هاتف غير صحيح',
        text2: 'يرجى إدخال رقم هاتف صحيح',
      });
      return;
    }

    setIsLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const messageData: WhatsAppSendMessageRequest = {
        phoneNumber: formattedPhone,
        message: message.trim(),
      };

      console.log('Sending WhatsApp message:', messageData);
      
      const response = await AuthService.sendWhatsAppMessage(messageData);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'تم الإرسال بنجاح',
          text2: `تم إرسال الرسالة إلى ${formattedPhone}`,
        });
        
        // Clear the form
        setPhoneNumber('');
        setMessage('رسالة تجريبية');
      } else {
        Toast.show({
          type: 'error',
          text1: 'فشل في الإرسال',
          text2: response.error || 'حدث خطأ في إرسال الرسالة',
        });
      }
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ في الإرسال',
        text2: error.message || 'حدث خطأ في إرسال الرسالة',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearForm = () => {
    Alert.alert(
      'مسح النموذج',
      'هل تريد مسح جميع البيانات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'مسح', 
          style: 'destructive',
          onPress: () => {
            setPhoneNumber('');
            setMessage('رسالة تجريبية');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="send" size={24} color="#3b82f6" />
        <Text style={styles.title}>اختبار إرسال الرسائل</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.formContainer}>
        <View style={styles.inputRow}>
          {/* Phone Number Input */}
          <View style={styles.inputSection}>
            <View style={styles.inputHeader}>
              <Icon name="dialpad" size={16} color="#1a237e" />
              <Text style={styles.inputLabel}>رقم الهاتف</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="ادخل رقم الهاتف"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              maxLength={20}
              editable={!isLoading}
            />
          </View>

          {/* Message Input */}
          <View style={styles.inputSection}>
            <View style={styles.inputHeader}>
              <Icon name="chat-bubble-outline" size={16} color="#8b5cf6" />
              <Text style={styles.inputLabel}>محتوى الرسالة</Text>
            </View>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="اكتب محتوى الرسالة"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.clearButton, { opacity: isLoading ? 0.5 : 1 }]}
            onPress={handleClearForm}
            disabled={isLoading}
          >
            <Icon name="clear" size={16} color="#6b7280" />
            <Text style={styles.clearButtonText}>مسح</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendButton, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleSendMessage}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={16} color="#fff" />
            )}
            <Text style={styles.sendButtonText}>
              {isLoading ? 'جاري الإرسال...' : 'إرسال رسالة تجريبية'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Help Text */}
      <View style={styles.helpContainer}>
        <Icon name="info" size={14} color="#6b7280" />
        <Text style={styles.helpText}>
          يمكنك إدخال رقم الهاتف مع أو بدون رمز الدولة. سيتم تنسيق الرقم تلقائياً.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 20,
  },
  formContainer: {
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputSection: {
    flex: 1,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
    marginLeft: 6,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1a237e',
    backgroundColor: '#f9fafb',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1a237e',
    backgroundColor: '#f9fafb',
    minHeight: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    minWidth: 180,
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
});

export default WhatsAppTestMessage;
