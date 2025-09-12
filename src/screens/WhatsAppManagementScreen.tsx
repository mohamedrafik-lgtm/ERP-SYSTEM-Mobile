import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import WhatsAppBanner from '../components/WhatsAppBanner';
import WhatsAppFeatureCard from '../components/WhatsAppFeatureCard';
import WhatsAppStatusCard from '../components/WhatsAppStatusCard';
import WhatsAppQRCodeModal from '../components/WhatsAppQRCodeModal';
import WhatsAppStatusInfo from '../components/WhatsAppStatusInfo';
import WhatsAppTestMessage from '../components/WhatsAppTestMessage';
import AuthService from '../services/AuthService';
import { WhatsAppQRCodeResponse, WhatsAppStatusResponse } from '../types/whatsapp';

const WhatsAppManagementScreen = ({ navigation }: any) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'pending'>('disconnected');
  const [sendReadiness, setSendReadiness] = useState<'ready' | 'pending' | 'error'>('pending');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrData, setQrData] = useState<WhatsAppQRCodeResponse | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<WhatsAppStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load initial connection status and setup auto-refresh
  useEffect(() => {
    loadConnectionStatus();
    
    // Setup auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadConnectionStatus();
    }, 30000);
    
    setAutoRefreshInterval(interval);
    
    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const loadConnectionStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const response = await AuthService.getWhatsAppStatus();
      setStatusData(response);
      
      // Update connection status based on isConnected and isReady
      if (response.isConnected && response.isReady) {
        setConnectionStatus('connected');
        setSendReadiness('ready');
      } else if (response.isConnected && !response.isReady) {
        setConnectionStatus('pending');
        setSendReadiness('pending');
      } else {
        setConnectionStatus('disconnected');
        setSendReadiness('pending');
      }
      
      // If there's a QR code available, update QR data
      if (response.qrCode) {
        setQrData({
          qrCode: response.qrCode,
          isReady: response.isReady,
          error: response.lastError
        });
      }
      
      console.log('WhatsApp status updated:', response);
    } catch (error) {
      console.error('Error loading connection status:', error);
      setConnectionStatus('disconnected');
      setSendReadiness('error');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleGenerateQR = async () => {
    setIsLoadingQR(true);
    setQrError(null);
    setQrModalVisible(true);

    try {
      // First try to get QR code
      const qrResponse = await AuthService.getWhatsAppQRCode();
      setQrData(qrResponse);
      
      if (qrResponse.error) {
        setQrError(qrResponse.error);
      } else if (qrResponse.isReady) {
        setConnectionStatus('connected');
        setSendReadiness('ready');
        Toast.show({
          type: 'success',
          text1: 'متصل بنجاح',
          text2: 'تم ربط حساب WhatsApp بنجاح',
        });
      } else if (qrResponse.qrCode) {
        setConnectionStatus('pending');
        setSendReadiness('pending');
        Toast.show({
          type: 'info',
          text1: 'امسح رمز QR',
          text2: 'استخدم WhatsApp لمسح الرمز',
        });
      }
      
      // Also update status for more detailed info
      await loadConnectionStatus();
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      setQrError(error.message || 'حدث خطأ في إنشاء رمز QR');
      Toast.show({
        type: 'error',
        text1: 'خطأ في الاتصال',
        text2: error.message || 'حدث خطأ في إنشاء رمز QR',
      });
    } finally {
      setIsLoadingQR(false);
    }
  };

  const handleCloseQRModal = () => {
    setQrModalVisible(false);
    setQrError(null);
    // Refresh connection status after closing modal
    loadConnectionStatus();
  };

  const handleUpdateData = async () => {
    try {
      await loadConnectionStatus();
      Toast.show({
        type: 'success',
        text1: 'تم التحديث',
        text2: 'تم تحديث حالة الاتصال بنجاح',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ في التحديث',
        text2: error.message || 'حدث خطأ في تحديث البيانات',
      });
    }
  };

  const handleWhatsAppLogout = async () => {
    Alert.alert(
      'تسجيل الخروج من WhatsApp',
      'هل أنت متأكد من تسجيل الخروج من WhatsApp؟ سيتم قطع الاتصال وسيحتاج إعادة ربط.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الخروج', style: 'destructive', onPress: async () => {
          setIsLoggingOut(true);
          try {
            const response = await AuthService.logoutWhatsApp();
            
            if (response.success) {
              Toast.show({
                type: 'success',
                text1: 'تم تسجيل الخروج',
                text2: response.message || 'تم قطع الاتصال من WhatsApp بنجاح',
              });
              
              // Update connection status
              setConnectionStatus('disconnected');
              setSendReadiness('pending');
              setStatusData(null);
              
              // Refresh status after logout
              setTimeout(() => {
                loadConnectionStatus();
              }, 1000);
            } else {
              Toast.show({
                type: 'error',
                text1: 'فشل في تسجيل الخروج',
                text2: response.error || 'حدث خطأ في تسجيل الخروج',
              });
            }
          } catch (error: any) {
            console.error('Error logging out from WhatsApp:', error);
            Toast.show({
              type: 'error',
              text1: 'خطأ في تسجيل الخروج',
              text2: error.message || 'حدث خطأ في تسجيل الخروج من WhatsApp',
            });
          } finally {
            setIsLoggingOut(false);
          }
        }}
      ]
    );
  };

  const handleSystemAction = async (action: string) => {
    if (action === 'خروج') {
      await handleWhatsAppLogout();
      return;
    }

    Alert.alert(
      'تأكيد الإجراء',
      `هل أنت متأكد من ${action}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تأكيد', onPress: async () => {
          try {
            // For now, just refresh the connection status
            await loadConnectionStatus();
            Toast.show({
              type: 'success',
              text1: 'تم تنفيذ الإجراء',
              text2: `تم ${action} بنجاح`,
            });
          } catch (error: any) {
            Toast.show({
              type: 'error',
              text1: 'خطأ في التنفيذ',
              text2: error.message || `حدث خطأ في ${action}`,
            });
          }
        }}
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'disconnected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'متصل';
      case 'disconnected': return 'غير متصل';
      case 'pending': return 'في الانتظار';
      default: return 'غير معروف';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="WhatsAppManagement" />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة WhatsApp</Text>
        </View>
        <View style={styles.headerActions}>
          {isLoadingStatus && (
            <ActivityIndicator size="small" color="#3b82f6" style={styles.refreshIndicator} />
          )}
          <TouchableOpacity onPress={loadConnectionStatus} style={styles.refreshButton}>
            <Icon name="refresh" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Smart WhatsApp System Banner */}
        <WhatsAppBanner
          title="نظام WhatsApp الذكي"
          subtitle="منصة التواصل التلقائي مع المتدربين والمسوقين"
          features={[
            'رسائل ترحيب تلقائية',
            'إشعارات المسوقين',
            'فواتير تلقائية للسداد'
          ]}
          status={connectionStatus}
          statusText={getStatusText(connectionStatus)}
        />

        {/* Smart Assistant Section */}
        <View style={styles.assistantCard}>
          <View style={styles.assistantContent}>
            <View style={styles.assistantText}>
              <Text style={styles.assistantTitle}>مرحباً! أنا مساعدك الذكي</Text>
              <Text style={styles.assistantDescription}>
                سأقوم بتغيير طريقة عملك لتكون أسهل وأكثر كفاءة
              </Text>
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>... البوت يكتب....</Text>
              </View>
            </View>
            <View style={styles.assistantIllustration}>
              <Icon name="psychology" size={60} color="#8b5cf6" />
            </View>
          </View>
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresGrid}>
          <WhatsAppFeatureCard
            title="تقارير ذكية للمسوقين"
            description="إشعارات فورية مع إحصائيات الأداء"
            icon="bar-chart"
            backgroundColor="#10b981"
          />
          <WhatsAppFeatureCard
            title="ترحيب تلقائي للمتدربين"
            description="رسالة ترحيب فورية مع كل التفاصيل المهمة"
            icon="smart-toy"
            backgroundColor="#3b82f6"
          />
          <WhatsAppFeatureCard
            title="بيانات حساب الموظف"
            description="إرسال بيانات تسجيل الدخول فور إنشاء الحساب"
            icon="group"
            backgroundColor="#f59e0b"
          />
          <WhatsAppFeatureCard
            title="فواتير تلقائية للسداد"
            description="إرسال فوري لفاتورة PDF مع تأكيد الدفع"
            icon="account-balance-wallet"
            backgroundColor="#8b5cf6"
          />
        </View>

        {/* Result Section */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Icon name="rocket-launch" size={24} color="#f59e0b" />
            <Text style={styles.resultTitle}>النتيجة؟</Text>
          </View>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>توفير الوقت</Text>
            <Text style={styles.benefitSeparator}>•</Text>
            <Text style={styles.benefitItem}>زيادة الكفاءة</Text>
            <Text style={styles.benefitSeparator}>•</Text>
            <Text style={styles.benefitItem}>تحسين التواصل</Text>
            <Text style={styles.benefitSeparator}>•</Text>
            <Text style={styles.benefitItem}>سعادة العملاء</Text>
          </View>
        </View>

        {/* System Connection Status */}
        <WhatsAppStatusCard
          title="حالة اتصال النظام"
          icon="flash-on"
          statusBoxes={[
            {
              title: 'حالة الاتصال',
              status: getStatusText(connectionStatus),
              description: connectionStatus === 'connected' ? 'متصل وجاهز' : 
                          connectionStatus === 'pending' ? 'في انتظار المسح' : 'يحتاج إعادة ربط',
              icon: connectionStatus === 'connected' ? 'check' : 
                    connectionStatus === 'pending' ? 'hourglass-empty' : 'close',
              color: getStatusColor(connectionStatus),
              backgroundColor: connectionStatus === 'connected' ? '#f0fdf4' : 
                              connectionStatus === 'pending' ? '#fffbeb' : '#fef2f2',
              borderColor: connectionStatus === 'connected' ? '#bbf7d0' : 
                          connectionStatus === 'pending' ? '#fed7aa' : '#fecaca',
            },
            {
              title: 'جاهزية الإرسال',
              status: getStatusText(sendReadiness),
              description: sendReadiness === 'ready' ? 'جاهز للإرسال' : 
                          sendReadiness === 'pending' ? 'ينتظر اكتمال الإعداد' : 'خطأ في الإعداد',
              icon: sendReadiness === 'ready' ? 'check' : 
                    sendReadiness === 'pending' ? 'hourglass-empty' : 'error',
              color: getStatusColor(sendReadiness),
              backgroundColor: sendReadiness === 'ready' ? '#f0fdf4' : 
                              sendReadiness === 'pending' ? '#fffbeb' : '#fef2f2',
              borderColor: sendReadiness === 'ready' ? '#bbf7d0' : 
                          sendReadiness === 'pending' ? '#fed7aa' : '#fecaca',
            },
          ]}
          actionButtons={[
            {
              title: 'تحديث',
              color: '#fff',
              backgroundColor: '#3b82f6',
              onPress: () => handleSystemAction('تحديث'),
            },
            {
              title: 'إعادة تشغيل',
              color: '#fff',
              backgroundColor: '#f59e0b',
              onPress: () => handleSystemAction('إعادة تشغيل'),
            },
            {
              title: isLoggingOut ? 'جاري الخروج...' : 'خروج',
              color: '#fff',
              backgroundColor: isLoggingOut ? '#9ca3af' : '#ef4444',
              onPress: () => handleSystemAction('خروج'),
            },
            {
              title: 'إعادة تعيين',
              color: '#fff',
              backgroundColor: '#8b5cf6',
              onPress: () => handleSystemAction('إعادة تعيين'),
            },
          ]}
        />

        {/* Link WhatsApp Account */}
        <View style={styles.linkCard}>
          <View style={styles.linkHeader}>
            <Icon name="chat" size={24} color="#1a237e" />
            <Text style={styles.linkCardTitle}>ربط حساب WhatsApp</Text>
          </View>
          <View style={styles.linkStatus}>
            <Icon 
              name={connectionStatus === 'connected' ? 'link' : 'link-off'} 
              size={20} 
              color={connectionStatus === 'connected' ? '#10b981' : '#6b7280'} 
            />
            <Text style={[
              styles.linkStatusText,
              { color: connectionStatus === 'connected' ? '#10b981' : '#6b7280' }
            ]}>
              {connectionStatus === 'connected' ? 'متصل' : 'في انتظار الاتصال'}
            </Text>
          </View>
          <Text style={styles.linkInstruction}>
            {connectionStatus === 'connected' 
              ? 'حساب WhatsApp مربوط بنجاح' 
              : 'اضغط لإنشاء رمز QR للربط'
            }
          </Text>
          <View style={styles.linkButtons}>
            <TouchableOpacity 
              style={[
                styles.qrButton,
                { backgroundColor: connectionStatus === 'connected' ? '#10b981' : '#3b82f6' }
              ]} 
              onPress={handleGenerateQR}
            >
              <Icon 
                name={connectionStatus === 'connected' ? 'refresh' : 'qr-code'} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.qrButtonText}>
                {connectionStatus === 'connected' ? 'تحديث الحالة' : 'إنشاء QR Code'}
              </Text>
            </TouchableOpacity>

            {connectionStatus === 'connected' && (
              <TouchableOpacity 
                style={[
                  styles.logoutButton,
                  { opacity: isLoggingOut ? 0.7 : 1 }
                ]} 
                onPress={handleWhatsAppLogout}
                disabled={isLoggingOut}
              >
                <Icon 
                  name="logout" 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.logoutButtonText}>
                  {isLoggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Management */}
        <View style={styles.quickCard}>
          <View style={styles.quickHeader}>
            <Icon name="settings" size={24} color="#1a237e" />
            <Text style={styles.quickCardTitle}>إدارة سريعة</Text>
          </View>
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateData}>
            <Icon name="refresh" size={20} color="#10b981" />
            <Text style={styles.updateButtonText}>تحديث البيانات</Text>
          </TouchableOpacity>
        </View>

        {/* Technical Specifications */}
        <View style={styles.techCard}>
          <View style={styles.techHeader}>
            <Icon name="security" size={24} color="#1a237e" />
            <Text style={styles.techCardTitle}>المواصفات التقنية</Text>
          </View>
          
          <View style={styles.techSpecs}>
            <View style={styles.techSpec}>
              <Icon name="flash-on" size={20} color="#3b82f6" />
              <View style={styles.techSpecContent}>
                <Text style={styles.techSpecTitle}>تقنية Baileys</Text>
                <Text style={styles.techSpecDescription}>اتصال مباشر بـ WhatsApp</Text>
              </View>
            </View>

            <View style={styles.techSpec}>
              <Icon name="trending-up" size={20} color="#10b981" />
              <View style={styles.techSpecContent}>
                <Text style={styles.techSpecTitle}>WebSocket</Text>
                <Text style={styles.techSpecDescription}>إرسال فوري وسريع</Text>
              </View>
            </View>

            <View style={styles.techSpec}>
              <Icon name="lock" size={20} color="#8b5cf6" />
              <View style={styles.techSpecContent}>
                <Text style={styles.techSpecTitle}>التشفير الأمن</Text>
                <Text style={styles.techSpecDescription}>end-to-end encryption</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status Information */}
        <WhatsAppStatusInfo
          statusData={statusData}
          isLoading={isLoadingStatus}
        />

        {/* Test Message Sending */}
        <WhatsAppTestMessage />
      </ScrollView>

      {/* QR Code Modal */}
      <WhatsAppQRCodeModal
        visible={qrModalVisible}
        onClose={handleCloseQRModal}
        qrCode={qrData?.qrCode}
        isReady={qrData?.isReady || false}
        isLoading={isLoadingQR}
        error={qrError || undefined}
      />
    </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  placeholder: {
    width: 44,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  refreshIndicator: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  assistantCard: {
    backgroundColor: '#8b5cf6',
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,
  },
  assistantContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assistantText: {
    flex: 1,
  },
  assistantTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  assistantDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  typingIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 14,
    color: '#fff',
    fontStyle: 'italic',
  },
  assistantIllustration: {
    marginLeft: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  benefitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  benefitItem: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  benefitSeparator: {
    fontSize: 16,
    color: '#fff',
    marginHorizontal: 8,
  },
  linkCard: {
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
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 8,
  },
  linkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkStatusText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
  },
  linkInstruction: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  qrButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  linkButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickCard: {
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
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 8,
  },
  updateButton: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  updateButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  techCard: {
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
  techHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  techCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 8,
  },
  techSpecs: {
    gap: 12,
  },
  techSpec: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  techSpecContent: {
    marginLeft: 12,
    flex: 1,
  },
  techSpecTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 4,
  },
  techSpecDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default WhatsAppManagementScreen;
