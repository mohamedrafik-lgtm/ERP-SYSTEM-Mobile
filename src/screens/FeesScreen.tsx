import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import { ITraineeFee, FeeType, PaymentStatus } from '../types/student';

interface FeesScreenProps {
  navigation: any;
}

const FeesScreen = ({ navigation }: FeesScreenProps) => {
  const [fees, setFees] = useState<ITraineeFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFees();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFees = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getAllTraineeFees();
      setFees(data);
    } catch (error) {
      console.error('Error fetching fees:', error);
      Alert.alert('خطأ', 'فشل في جلب الرسوم. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFees();
    setRefreshing(false);
  };

  const handleApplyFee = async (fee: ITraineeFee) => {
    if (fee.isApplied) {
      Alert.alert('تنبيه', 'هذه الرسوم مطبقة بالفعل');
      return;
    }

    Alert.alert(
      'تأكيد التطبيق',
      `هل تريد تطبيق رسوم "${fee.name}"؟\n\nسيتم تطبيق هذه الرسوم على جميع الطلاب المسجلين في البرنامج.`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تطبيق',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              await AuthService.applyTraineeFee(fee.id);
              Alert.alert('نجح', 'تم تطبيق الرسوم بنجاح');
              // تحديث قائمة الرسوم
              await fetchFees();
            } catch (error) {
              console.error('Error applying fee:', error);
              Alert.alert('خطأ', 'فشل في تطبيق الرسوم. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getFeeTypeLabel = (type: FeeType) => {
    switch (type) {
      case 'TUITION':
        return 'رسوم دراسية';
      case 'SERVICES':
        return 'رسوم خدمات';
      case 'TRAINING':
        return 'رسوم تدريبية';
      case 'ADDITIONAL':
        return 'رسوم إضافية';
      default:
        return 'غير محدد';
    }
  };

  const getFeeTypeColor = (type: FeeType) => {
    switch (type) {
      case 'TUITION':
        return '#1a237e';
      case 'SERVICES':
        return '#059669';
      case 'TRAINING':
        return '#dc2626';
      case 'ADDITIONAL':
        return '#7c3aed';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (isApplied: boolean) => {
    return isApplied ? 'مطبقة' : 'غير مطبقة';
  };

  const getStatusColor = (isApplied: boolean) => {
    return isApplied ? '#059669' : '#dc2626';
  };

  const renderFeeCard = (fee: ITraineeFee) => (
    <TouchableOpacity key={fee.id} style={styles.feeCard}>
      <View style={styles.feeHeader}>
        <View style={styles.feeTitleContainer}>
          <Text style={styles.feeName}>{fee.name}</Text>
          <View style={[styles.feeTypeBadge, { backgroundColor: getFeeTypeColor(fee.type) }]}>
            <Text style={styles.feeTypeText}>{getFeeTypeLabel(fee.type)}</Text>
          </View>
        </View>
        <Text style={styles.feeAmount}>{fee.amount.toLocaleString()} {fee.safe.currency}</Text>
      </View>

      <View style={styles.feeDetails}>
        <View style={styles.feeDetailRow}>
          <Icon name="school" size={16} color="#6b7280" />
          <Text style={styles.feeDetailText}>{fee.program.nameAr}</Text>
        </View>
        <View style={styles.feeDetailRow}>
          <Icon name="account-balance" size={16} color="#6b7280" />
          <Text style={styles.feeDetailText}>{fee.safe.name}</Text>
        </View>
        <View style={styles.feeDetailRow}>
          <Icon name="calendar-today" size={16} color="#6b7280" />
          <Text style={styles.feeDetailText}>{fee.academicYear}</Text>
        </View>
      </View>

      <View style={styles.feeFooter}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fee.isApplied) }]}>
            <Text style={styles.statusText}>{getStatusLabel(fee.isApplied)}</Text>
          </View>
          {fee.allowMultipleApply && (
            <View style={styles.multipleBadge}>
              <Icon name="repeat" size={12} color="#1a237e" />
              <Text style={styles.multipleText}>متعددة</Text>
            </View>
          )}
        </View>
        <Text style={styles.feeDate}>
          {new Date(fee.createdAt).toLocaleDateString('ar-EG')}
        </Text>
      </View>

      {!fee.isApplied && (
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={() => handleApplyFee(fee)}
        >
          <Icon name="check-circle" size={16} color="#fff" />
          <Text style={styles.applyButtonText}>تطبيق الرسوم</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <Icon name="menu" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>الرسوم</Text>
            <Text style={styles.headerSubtitle}>إدارة الرسوم المالية</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل الرسوم...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Icon name="menu" size={24} color="#1a237e" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>الرسوم</Text>
          <Text style={styles.headerSubtitle}>إدارة الرسوم المالية</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddFeeScreen')}
        >
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1a237e']}
            tintColor="#1a237e"
          />
        }
      >
        {fees.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="account-balance-wallet" size={80} color="#e0e0e0" />
            <Text style={styles.emptyTitle}>لا توجد رسوم</Text>
            <Text style={styles.emptySubtitle}>
              لم يتم إنشاء أي رسوم بعد
            </Text>
            <Text style={styles.emptyDescription}>
              اضغط على زر الإضافة لإنشاء رسوم جديدة
            </Text>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('AddFeeScreen')}
            >
              <Icon name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>إضافة رسوم جديدة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.feesList}>
            {fees.map(renderFeeCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
    marginHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  feesList: {
    padding: 16,
  },
  feeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feeTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  feeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  feeTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  feeTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  feeDetails: {
    marginBottom: 12,
  },
  feeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  feeDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  feeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  multipleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  multipleText: {
    color: '#1a237e',
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  feeDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    shadowColor: '#059669',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default FeesScreen;
