import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';

interface RequestsSettingsScreenProps {
  navigation: any;
}

const RequestsSettingsScreen = ({ navigation }: RequestsSettingsScreenProps) => {
  // Static state - سيتم ربطها بالـ API لاحقاً
  const [requestsEnabled, setRequestsEnabled] = useState(true);

  const handleToggleRequests = (enabled: boolean) => {
    setRequestsEnabled(enabled);
    // TODO: هنا سيتم إضافة الـ API call لاحقاً
    console.log('Requests status changed to:', enabled);
  };

  const handleSaveSettings = () => {
    // TODO: هنا سيتم إضافة الـ API call لحفظ الإعدادات
    console.log('Settings saved:', { requestsEnabled });
    // يمكن إضافة Toast notification هنا
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="RequestsSettings" />
        <View style={styles.headerCenter}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>إعدادات الطلبات</Text>
            <Text style={styles.headerSubtitle}>التحكم في استقبال طلبات تأجيل السداد</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="settings" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* استقبال الطلبات الجديدة */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>استقبال الطلبات الجديدة</Text>
          <Text style={styles.sectionDescription}>
            التحكم في إمكانية إنشاء طلبات جديدة من قبل المتدربين
          </Text>

          <View style={styles.toggleContainer}>
            {/* خيار التفعيل */}
            <TouchableOpacity
              style={[
                styles.toggleOption,
                requestsEnabled && styles.toggleOptionActive
              ]}
              onPress={() => handleToggleRequests(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleIcon, styles.toggleIconActive]}>
                <Icon name="check" size={28} color="#fff" />
              </View>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>مفعّل ✓</Text>
                <Text style={styles.toggleLabel}>قبول الطلبات</Text>
              </View>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleInfoText}>
                  ✓ يمكن للمتدربين تقديم طلبات جديدة
                </Text>
              </View>
            </TouchableOpacity>

            {/* خيار التعطيل */}
            <TouchableOpacity
              style={[
                styles.toggleOption,
                !requestsEnabled && styles.toggleOptionDisabled
              ]}
              onPress={() => handleToggleRequests(false)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.toggleIcon,
                !requestsEnabled ? styles.toggleIconDisabled : styles.toggleIconInactive
              ]}>
                <Icon name="close" size={28} color={!requestsEnabled ? "#fff" : "#64748b"} />
              </View>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>معطّل</Text>
                <Text style={styles.toggleLabel}>إيقاف الطلبات</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* حالة الطلبات */}
        <View style={[
          styles.statusCard,
          requestsEnabled ? styles.statusCardActive : styles.statusCardInactive
        ]}>
          <View style={styles.statusHeader}>
            <Icon 
              name={requestsEnabled ? "check-circle" : "cancel"} 
              size={24} 
              color={requestsEnabled ? "#059669" : "#dc2626"} 
            />
            <Text style={[
              styles.statusTitle,
              { color: requestsEnabled ? "#059669" : "#dc2626" }
            ]}>
              {requestsEnabled ? "الطلبات مفعّلة" : "الطلبات معطّلة"}
            </Text>
          </View>
          
          <View style={styles.statusContent}>
            {requestsEnabled ? (
              <>
                <View style={styles.statusItem}>
                  <Icon name="fiber-manual-record" size={8} color="#059669" />
                  <Text style={styles.statusText}>
                    يمكن للمتدربين إنشاء طلبات تأجيل جديدة
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Icon name="fiber-manual-record" size={8} color="#059669" />
                  <Text style={styles.statusText}>
                    ستصل الطلبات للمراجعة الإدارية
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Icon name="fiber-manual-record" size={8} color="#059669" />
                  <Text style={styles.statusText}>
                    يمكن قبول أو رفض الطلبات
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.statusItem}>
                  <Icon name="fiber-manual-record" size={8} color="#dc2626" />
                  <Text style={styles.statusText}>
                    لن يتمكن المتدربون من إنشاء طلبات جديدة
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Icon name="fiber-manual-record" size={8} color="#dc2626" />
                  <Text style={styles.statusText}>
                    الطلبات الموجودة يمكن مشاهدتها فقط
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* زر حفظ الإعدادات */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveSettings}
          activeOpacity={0.8}
        >
          <Icon name="save" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>حفظ الإعدادات</Text>
        </TouchableOpacity>

        {/* ملاحظة */}
        <View style={styles.noteCard}>
          <Icon name="info" size={24} color="#1a237e" />
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>ملاحظة:</Text>
            <Text style={styles.noteText}>
              عند تعطيل الطلبات، لن يتمكن المتدربون من إنشاء طلبات جديدة. لكن يمكنهم مشاهدة طلباتهم السابقة. الطلبات الموجودة يمكن للإدارة مراجعتها وقبولها أو رفضها في أي وقت.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 8,
    textAlign: 'right',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'right',
    lineHeight: 20,
  },
  toggleContainer: {
    gap: 16,
  },
  toggleOption: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  toggleOptionActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#059669',
  },
  toggleOptionDisabled: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  toggleOptionInactive: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
  },
  toggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  toggleIconActive: {
    backgroundColor: '#059669',
  },
  toggleIconDisabled: {
    backgroundColor: '#dc2626',
  },
  toggleIconInactive: {
    backgroundColor: '#f1f5f9',
  },
  toggleContent: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 4,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  toggleInfo: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  toggleInfoText: {
    fontSize: 13,
    color: '#059669',
    textAlign: 'right',
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
  },
  statusCardActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#059669',
  },
  statusCardInactive: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  statusHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusContent: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#1a237e',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
    elevation: 4,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  noteCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row-reverse',
    gap: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
    marginBottom: 20,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 8,
    textAlign: 'right',
  },
  noteText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    textAlign: 'right',
  },
});

export default RequestsSettingsScreen;