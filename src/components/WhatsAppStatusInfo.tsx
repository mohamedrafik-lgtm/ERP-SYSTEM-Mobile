import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WhatsAppStatusResponse } from '../types/whatsapp';

interface WhatsAppStatusInfoProps {
  statusData: WhatsAppStatusResponse | null;
  isLoading: boolean;
}

const WhatsAppStatusInfo: React.FC<WhatsAppStatusInfoProps> = ({
  statusData,
  isLoading,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير متوفر';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'غير صحيح';
    }
  };

  const getStatusColor = (isConnected: boolean, isReady: boolean) => {
    if (isConnected && isReady) return '#10b981';
    if (isConnected && !isReady) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusText = (isConnected: boolean, isReady: boolean) => {
    if (isConnected && isReady) return 'متصل وجاهز';
    if (isConnected && !isReady) return 'متصل - غير جاهز';
    return 'غير متصل';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="info" size={24} color="#1a237e" />
          <Text style={styles.title}>معلومات الاتصال</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </View>
    );
  }

  if (!statusData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="info" size={24} color="#1a237e" />
          <Text style={styles.title}>معلومات الاتصال</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="info-outline" size={32} color="#6b7280" />
          <Text style={styles.emptyText}>لا توجد معلومات متاحة</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="info" size={24} color="#1a237e" />
        <Text style={styles.title}>معلومات الاتصال</Text>
      </View>

      <View style={styles.infoGrid}>
        {/* Connection Status */}
        <View style={styles.infoItem}>
          <View style={styles.infoHeader}>
            <Icon 
              name={statusData.isConnected ? 'wifi' : 'wifi-off'} 
              size={20} 
              color={getStatusColor(statusData.isConnected, statusData.isReady)} 
            />
            <Text style={styles.infoLabel}>حالة الاتصال</Text>
          </View>
          <Text style={[
            styles.infoValue,
            { color: getStatusColor(statusData.isConnected, statusData.isReady) }
          ]}>
            {getStatusText(statusData.isConnected, statusData.isReady)}
          </Text>
        </View>

        {/* Phone Number */}
        {statusData.phoneNumber && (
          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <Icon name="phone" size={20} color="#3b82f6" />
              <Text style={styles.infoLabel}>رقم الهاتف</Text>
            </View>
            <Text style={styles.infoValue}>{statusData.phoneNumber}</Text>
          </View>
        )}

        {/* Last Activity */}
        <View style={styles.infoItem}>
          <View style={styles.infoHeader}>
            <Icon name="schedule" size={20} color="#8b5cf6" />
            <Text style={styles.infoLabel}>آخر نشاط</Text>
          </View>
          <Text style={styles.infoValue}>{formatDate(statusData.lastActivity)}</Text>
        </View>

        {/* Restart Count */}
        {statusData.restartCount !== undefined && (
          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <Icon name="restart-alt" size={20} color="#f59e0b" />
              <Text style={styles.infoLabel}>مرات إعادة التشغيل</Text>
            </View>
            <Text style={styles.infoValue}>{statusData.restartCount}</Text>
          </View>
        )}

        {/* Last Error */}
        {statusData.lastError && (
          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <Icon name="error-outline" size={20} color="#ef4444" />
              <Text style={styles.infoLabel}>آخر خطأ</Text>
            </View>
            <Text style={[styles.infoValue, styles.errorText]}>
              {statusData.lastError}
            </Text>
          </View>
        )}

        {/* QR Code Available */}
        {statusData.qrCode && (
          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <Icon name="qr-code" size={20} color="#10b981" />
              <Text style={styles.infoLabel}>رمز QR</Text>
            </View>
            <Text style={[styles.infoValue, { color: '#10b981' }]}>
              متوفر للمسح
            </Text>
          </View>
        )}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
    textAlign: 'left',
    flex: 1,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
  },
});

export default WhatsAppStatusInfo;
