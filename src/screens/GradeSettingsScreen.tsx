import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const GradeSettingsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState({
    autoGradeCalculation: true,
    gradeNotifications: true,
    gradeVisibility: true,
    gradeExport: false,
    gradeBackup: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('🔍 GradeSettingsScreen - Fetching grade settings...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔍 GradeSettingsScreen - Settings loaded');
    } catch (error) {
      console.error('🔍 GradeSettingsScreen - Error fetching settings:', error);
      Alert.alert('خطأ', 'فشل في تحميل إعدادات التقييم');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSettings();
    setRefreshing(false);
  };

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    console.log(`🔍 GradeSettingsScreen - Setting ${key} changed to:`, value);
  };

  const saveSettings = async () => {
    try {
      console.log('🔍 GradeSettingsScreen - Saving settings:', settings);
      Alert.alert('نجح', 'تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('🔍 GradeSettingsScreen - Error saving settings:', error);
      Alert.alert('خطأ', 'فشل في حفظ الإعدادات');
    }
  };

  const settingItems = [
    {
      key: 'autoGradeCalculation',
      title: 'حساب الدرجات التلقائي',
      description: 'حساب الدرجات تلقائياً عند إدخال العلامات',
      icon: 'calculate',
      color: '#4CAF50',
    },
    {
      key: 'gradeNotifications',
      title: 'إشعارات الدرجات',
      description: 'إرسال إشعارات عند تحديث الدرجات',
      icon: 'notifications',
      color: '#FF9800',
    },
    {
      key: 'gradeVisibility',
      title: 'إظهار الدرجات للمتدربين',
      description: 'السماح للمتدربين بمشاهدة درجاتهم',
      icon: 'visibility',
      color: '#2196F3',
    },
    {
      key: 'gradeExport',
      title: 'تصدير الدرجات',
      description: 'السماح بتصدير الدرجات إلى ملفات Excel',
      icon: 'file-download',
      color: '#9C27B0',
    },
    {
      key: 'gradeBackup',
      title: 'نسخ احتياطي للدرجات',
      description: 'إنشاء نسخة احتياطية تلقائية للدرجات',
      icon: 'backup',
      color: '#607D8B',
    },
  ];

  const renderSettingItem = (item: any) => (
    <View key={item.key} style={styles.settingCard}>
      <View style={styles.settingHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
          <Icon name={item.icon} size={20} color="#fff" />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
        <Switch
          value={settings[item.key as keyof typeof settings]}
          onValueChange={(value) => handleSettingChange(item.key, value)}
          trackColor={{ false: '#767577', true: '#1a237e' }}
          thumbColor={settings[item.key as keyof typeof settings] ? '#fff' : '#f4f3f4'}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>جاري تحميل إعدادات التقييم...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إعدادات التقييم</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={saveSettings} style={styles.saveButton}>
            <Icon name="save" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Settings Overview */}
        <View style={styles.overviewContainer}>
          <View style={styles.overviewCard}>
            <Icon name="settings" size={32} color="#1a237e" />
            <Text style={styles.overviewTitle}>إعدادات نظام التقييم</Text>
            <Text style={styles.overviewDescription}>
              قم بتخصيص إعدادات نظام التقييم والدرجات حسب احتياجاتك
            </Text>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>الإعدادات العامة</Text>
          
          {settingItems.map(renderSettingItem)}
        </View>

        {/* Grade Scale Settings */}
        <View style={styles.scaleContainer}>
          <Text style={styles.sectionTitle}>مقياس الدرجات</Text>
          
          <View style={styles.scaleCard}>
            <View style={styles.scaleItem}>
              <View style={[styles.gradeBadge, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.gradeText}>ممتاز</Text>
              </View>
              <Text style={styles.gradeRange}>90 - 100</Text>
            </View>
            
            <View style={styles.scaleItem}>
              <View style={[styles.gradeBadge, { backgroundColor: '#8BC34A' }]}>
                <Text style={styles.gradeText}>جيد جداً</Text>
              </View>
              <Text style={styles.gradeRange}>80 - 89</Text>
            </View>
            
            <View style={styles.scaleItem}>
              <View style={[styles.gradeBadge, { backgroundColor: '#FFC107' }]}>
                <Text style={styles.gradeText}>جيد</Text>
              </View>
              <Text style={styles.gradeRange}>70 - 79</Text>
            </View>
            
            <View style={styles.scaleItem}>
              <View style={[styles.gradeBadge, { backgroundColor: '#FF9800' }]}>
                <Text style={styles.gradeText}>مقبول</Text>
              </View>
              <Text style={styles.gradeRange}>60 - 69</Text>
            </View>
            
            <View style={styles.scaleItem}>
              <View style={[styles.gradeBadge, { backgroundColor: '#F44336' }]}>
                <Text style={styles.gradeText}>ضعيف</Text>
              </View>
              <Text style={styles.gradeRange}>أقل من 60</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.resetButton}>
            <Icon name="refresh" size={20} color="#666" />
            <Text style={styles.resetButtonText}>إعادة تعيين الإعدادات</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.exportButton}>
            <Icon name="file-download" size={20} color="#fff" />
            <Text style={styles.exportButtonText}>تصدير الإعدادات</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  overviewContainer: {
    marginVertical: 16,
  },
  overviewCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  overviewDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  settingsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scaleContainer: {
    marginBottom: 24,
  },
  scaleCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scaleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  gradeRange: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exportButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default GradeSettingsScreen;
