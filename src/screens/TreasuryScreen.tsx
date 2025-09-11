import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import { ISafe, SafeCategory, ITransaction, TransactionType } from '../types/student';

interface TreasuryScreenProps {
  navigation: any;
}

const TreasuryScreen = ({ navigation }: TreasuryScreenProps) => {
  const [activeTab, setActiveTab] = useState<'treasuries' | 'operations'>('treasuries');
  const [selectedTreasury, setSelectedTreasury] = useState<ISafe | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [treasuries, setTreasuries] = useState<ISafe[]>([]);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  useEffect(() => {
    fetchTreasuries();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTreasuries = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getAllSafes();
      setTreasuries(data);
    } catch (error) {
      console.error('Error fetching treasuries:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل الخزائن';
      
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
        Alert.alert('خطأ في المصادقة', 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.');
        AuthService.clearAuthData().then(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        });
      } else {
        Alert.alert('خطأ', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTreasuries();
    
    // إذا كان هناك خزينة محددة، قم بتحديث معاملاتها أيضاً
    if (selectedTreasury) {
      await fetchTransactions(selectedTreasury.id);
    }
  };

  const fetchTransactions = async (safeId: string) => {
    try {
      setTransactionsLoading(true);
      const data = await AuthService.getSafeTransactions(safeId);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل المعاملات';
      
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
        Alert.alert('خطأ في المصادقة', 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.');
        AuthService.clearAuthData().then(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        });
      } else {
        Alert.alert('خطأ', errorMessage);
      }
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleTreasurySelect = async (treasury: ISafe) => {
    setSelectedTreasury(treasury);
    setActiveTab('operations');
    await fetchTransactions(treasury.id);
  };

  const handleBackToTreasuries = () => {
    setSelectedTreasury(null);
    setActiveTab('treasuries');
    setTransactions([]);
  };

  const getTreasuryCategoryLabel = (category: SafeCategory) => {
    switch (category) {
      case 'DEBT':
        return 'ديون';
      case 'INCOME':
        return 'إيرادات';
      case 'EXPENSE':
        return 'مصروفات';
      case 'ASSETS':
        return 'أصول';
      case 'UNSPECIFIED':
        return 'غير محدد';
      default:
        return category;
    }
  };

  const getTreasuryCategoryColor = (category: SafeCategory) => {
    switch (category) {
      case 'DEBT':
        return '#dc2626';
      case 'INCOME':
        return '#059669';
      case 'EXPENSE':
        return '#f59e0b';
      case 'ASSETS':
        return '#1a237e';
      case 'UNSPECIFIED':
        return '#6b7280';
      default:
        return '#666';
    }
  };

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return 'إيداع';
      case 'WITHDRAW':
        return 'سحب';
      case 'TRANSFER':
        return 'تحويل';
      case 'FEE':
        return 'رسوم';
      case 'PAYMENT':
        return 'دفع';
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return '#059669';
      case 'WITHDRAW':
        return '#dc2626';
      case 'TRANSFER':
        return '#1a237e';
      case 'FEE':
        return '#f59e0b';
      case 'PAYMENT':
        return '#3b82f6';
      default:
        return '#666';
    }
  };

  const renderTreasuryCard = (treasury: ISafe) => (
    <TouchableOpacity 
      key={treasury.id} 
      style={styles.treasuryCard}
      onPress={() => handleTreasurySelect(treasury)}
    >
      <View style={styles.treasuryHeader}>
        <View style={styles.treasuryInfo}>
          <Text style={styles.treasuryName}>{treasury.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: getTreasuryCategoryColor(treasury.category) + '20' }]}>
            <Text style={[styles.typeText, { color: getTreasuryCategoryColor(treasury.category) }]}>
              {getTreasuryCategoryLabel(treasury.category)}
            </Text>
          </View>
        </View>
        <View style={styles.treasuryActions}>
          <Icon name="account-balance" size={32} color={getTreasuryCategoryColor(treasury.category)} />
          <Icon name="arrow-forward" size={20} color="#666" style={styles.arrowIcon} />
        </View>
      </View>
      
      {treasury.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{treasury.description}</Text>
        </View>
      )}
      
      <View style={styles.treasuryDetails}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>الرصيد</Text>
          <Text style={styles.balanceAmount}>
            {treasury.balance.toLocaleString()} {treasury.currency}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: treasury.isActive ? '#10b981' : '#dc2626' }]} />
          <Text style={styles.statusText}>
            {treasury.isActive ? 'نشطة' : 'غير نشطة'}
          </Text>
        </View>
      </View>
      
      <View style={styles.treasuryFooter}>
        <TouchableOpacity 
          style={styles.addTransactionButton}
          onPress={() => navigation.navigate('AddTransactionScreen', { safe: treasury })}
        >
          <Icon name="add" size={16} color="#1a237e" />
          <Text style={styles.addTransactionButtonText}>إنشاء معاملة</Text>
        </TouchableOpacity>
        <Text style={styles.tapToViewText}>اضغط لعرض المعاملات</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTransactionCard = (transaction: ITransaction) => (
    <View key={transaction.id} style={styles.operationCard}>
      <View style={styles.operationHeader}>
        <View style={styles.operationInfo}>
          <Text style={styles.operationDescription}>
            {transaction.description || 'معاملة مالية'}
          </Text>
          <Text style={styles.operationDate}>
            {new Date(transaction.createdAt).toLocaleDateString('ar-EG')}
          </Text>
          {transaction.reference && (
            <Text style={styles.operationReference}>
              المرجع: {transaction.reference}
            </Text>
          )}
        </View>
        <View style={[styles.operationTypeBadge, { backgroundColor: getTransactionTypeColor(transaction.type) + '20' }]}>
          <Text style={[styles.operationTypeText, { color: getTransactionTypeColor(transaction.type) }]}>
            {getTransactionTypeLabel(transaction.type)}
          </Text>
        </View>
      </View>
      
      <View style={styles.operationDetails}>
        <Text style={[
          styles.operationAmount,
          { color: ['DEPOSIT', 'PAYMENT'].includes(transaction.type) ? '#059669' : '#dc2626' }
        ]}>
          {['DEPOSIT', 'PAYMENT'].includes(transaction.type) ? '+' : '-'}{transaction.amount.toLocaleString()} {selectedTreasury?.currency || 'EGP'}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>الخزائن</Text>
          <Text style={styles.headerSubtitle}>إدارة الخزائن والعمليات المالية</Text>
        </View>
        {!selectedTreasury && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddTreasuryScreen')}
          >
            <Icon name="add" size={24} color="#1a237e" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation - Only show if no treasury selected */}
      {!selectedTreasury && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'treasuries' && styles.activeTab]}
            onPress={() => setActiveTab('treasuries')}
          >
            <Icon 
              name="account-balance" 
              size={20} 
              color={activeTab === 'treasuries' ? '#fff' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'treasuries' && styles.activeTabText]}>
              الخزائن
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'operations' && styles.activeTab]}
            onPress={() => setActiveTab('operations')}
            disabled={true}
          >
            <Icon 
              name="history" 
              size={20} 
              color="#ccc" 
            />
            <Text style={[styles.tabText, { color: '#ccc' }]}>
              العمليات
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Selected Treasury Header */}
      {selectedTreasury && (
        <View style={styles.selectedTreasuryHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToTreasuries}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.selectedTreasuryInfo}>
            <Text style={styles.selectedTreasuryName}>{selectedTreasury.name}</Text>
            <Text style={styles.selectedTreasuryBalance}>
              {selectedTreasury.balance.toLocaleString()} {selectedTreasury.currency}
            </Text>
          </View>
          <View style={[styles.selectedTreasuryTypeBadge, { backgroundColor: getTreasuryCategoryColor(selectedTreasury.category) + '20' }]}>
            <Text style={[styles.selectedTreasuryTypeText, { color: getTreasuryCategoryColor(selectedTreasury.category) }]}>
              {getTreasuryCategoryLabel(selectedTreasury.category)}
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1a237e']}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل الخزائن...</Text>
          </View>
        ) : !selectedTreasury ? (
          <View style={styles.treasuriesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>خزائنك</Text>
              <Text style={styles.sectionSubtitle}>إجمالي {treasuries.length} خزينة - اضغط على خزينة لعرض معاملاتها</Text>
            </View>
            
            {treasuries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="account-balance" size={64} color="#d1d5db" />
                <Text style={styles.emptyTitle}>لا توجد خزائن</Text>
                <Text style={styles.emptySubtitle}>لم يتم العثور على أي خزائن في النظام</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchTreasuries}
                >
                  <Icon name="refresh" size={20} color="#1a237e" />
                  <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
                </TouchableOpacity>
              </View>
            ) : (
              treasuries.map(renderTreasuryCard)
            )}
          </View>
        ) : (
          <View style={styles.operationsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>معاملات {selectedTreasury.name}</Text>
              <Text style={styles.sectionSubtitle}>
                {transactions.length} معاملة - آخر المعاملات
              </Text>
            </View>
            
            {transactionsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a237e" />
                <Text style={styles.loadingText}>جاري تحميل المعاملات...</Text>
              </View>
            ) : transactions.length > 0 ? (
              transactions.map(renderTransactionCard)
            ) : (
              <View style={styles.emptyOperationsContainer}>
                <Icon name="history" size={64} color="#ccc" />
                <Text style={styles.emptyOperationsTitle}>لا توجد معاملات</Text>
                <Text style={styles.emptyOperationsSubtitle}>
                  لم يتم تسجيل أي معاملات على هذه الخزينة بعد
                </Text>
              </View>
            )}
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
  headerContent: {
    flex: 1,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 8,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#1a237e',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  treasuriesContainer: {
    paddingBottom: 16,
  },
  treasuryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  treasuryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  treasuryFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  tapToViewText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '500',
  },
  treasuryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  treasuryInfo: {
    flex: 1,
  },
  treasuryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  treasuryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceContainer: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  operationsContainer: {
    paddingBottom: 16,
  },
  operationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  operationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  operationInfo: {
    flex: 1,
    marginRight: 12,
  },
  operationDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a237e',
    marginBottom: 4,
  },
  operationDate: {
    fontSize: 14,
    color: '#666',
  },
  operationTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  operationTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  operationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  operationAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedTreasuryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 8,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  selectedTreasuryInfo: {
    flex: 1,
  },
  selectedTreasuryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  selectedTreasuryBalance: {
    fontSize: 16,
    color: '#666',
  },
  selectedTreasuryTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedTreasuryTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyOperationsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyOperationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyOperationsSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  retryButtonText: {
    color: '#1a237e',
    fontWeight: '600',
    marginLeft: 8,
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  operationReference: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  addTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
    marginBottom: 8,
    alignSelf: 'center',
  },
  addTransactionButtonText: {
    color: '#1a237e',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default TreasuryScreen;
