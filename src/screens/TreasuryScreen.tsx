import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TreasuryScreenProps {
  navigation: any;
}

const TreasuryScreen = ({ navigation }: TreasuryScreenProps) => {
  const [activeTab, setActiveTab] = useState<'treasuries' | 'operations'>('treasuries');
  const [selectedTreasury, setSelectedTreasury] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for now - will be replaced with API calls
  const [treasuries] = useState([
    {
      id: 1,
      name: 'الخزينة الرئيسية',
      balance: 50000,
      currency: 'EGP',
      type: 'main',
      status: 'active',
    },
    {
      id: 2,
      name: 'خزينة الطوارئ',
      balance: 15000,
      currency: 'EGP',
      type: 'emergency',
      status: 'active',
    },
    {
      id: 3,
      name: 'خزينة المشتريات',
      balance: 25000,
      currency: 'EGP',
      type: 'purchases',
      status: 'active',
    },
  ]);

  const [operations] = useState([
    {
      id: 1,
      treasuryId: 1,
      type: 'deposit',
      amount: 10000,
      description: 'إيداع من بيع الكورسات',
      date: '2024-01-15',
      status: 'completed',
    },
    {
      id: 2,
      treasuryId: 1,
      type: 'withdrawal',
      amount: 5000,
      description: 'سحب لشراء مواد تدريبية',
      date: '2024-01-14',
      status: 'completed',
    },
    {
      id: 3,
      treasuryId: 2,
      type: 'deposit',
      amount: 3000,
      description: 'إيداع طوارئ',
      date: '2024-01-13',
      status: 'completed',
    },
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleTreasurySelect = (treasury: any) => {
    setSelectedTreasury(treasury);
    setActiveTab('operations');
  };

  const handleBackToTreasuries = () => {
    setSelectedTreasury(null);
    setActiveTab('treasuries');
  };

  // Filter operations by selected treasury
  const filteredOperations = selectedTreasury 
    ? operations.filter(op => op.treasuryId === selectedTreasury.id)
    : [];

  const getTreasuryTypeLabel = (type: string) => {
    switch (type) {
      case 'main':
        return 'رئيسية';
      case 'emergency':
        return 'طوارئ';
      case 'purchases':
        return 'مشتريات';
      default:
        return type;
    }
  };

  const getTreasuryTypeColor = (type: string) => {
    switch (type) {
      case 'main':
        return '#1a237e';
      case 'emergency':
        return '#dc2626';
      case 'purchases':
        return '#059669';
      default:
        return '#666';
    }
  };

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'إيداع';
      case 'withdrawal':
        return 'سحب';
      case 'transfer':
        return 'تحويل';
      default:
        return type;
    }
  };

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return '#059669';
      case 'withdrawal':
        return '#dc2626';
      case 'transfer':
        return '#1a237e';
      default:
        return '#666';
    }
  };

  const renderTreasuryCard = (treasury: any) => (
    <TouchableOpacity 
      key={treasury.id} 
      style={styles.treasuryCard}
      onPress={() => handleTreasurySelect(treasury)}
    >
      <View style={styles.treasuryHeader}>
        <View style={styles.treasuryInfo}>
          <Text style={styles.treasuryName}>{treasury.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: getTreasuryTypeColor(treasury.type) + '20' }]}>
            <Text style={[styles.typeText, { color: getTreasuryTypeColor(treasury.type) }]}>
              {getTreasuryTypeLabel(treasury.type)}
            </Text>
          </View>
        </View>
        <View style={styles.treasuryActions}>
          <Icon name="account-balance" size={32} color={getTreasuryTypeColor(treasury.type)} />
          <Icon name="arrow-forward" size={20} color="#666" style={styles.arrowIcon} />
        </View>
      </View>
      
      <View style={styles.treasuryDetails}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>الرصيد</Text>
          <Text style={styles.balanceAmount}>
            {treasury.balance.toLocaleString()} {treasury.currency}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: treasury.status === 'active' ? '#10b981' : '#dc2626' }]} />
          <Text style={styles.statusText}>
            {treasury.status === 'active' ? 'نشطة' : 'غير نشطة'}
          </Text>
        </View>
      </View>
      
      <View style={styles.treasuryFooter}>
        <Text style={styles.tapToViewText}>اضغط لعرض المعاملات</Text>
      </View>
    </TouchableOpacity>
  );

  const renderOperationCard = (operation: any) => (
    <View key={operation.id} style={styles.operationCard}>
      <View style={styles.operationHeader}>
        <View style={styles.operationInfo}>
          <Text style={styles.operationDescription}>{operation.description}</Text>
          <Text style={styles.operationDate}>
            {new Date(operation.date).toLocaleDateString('ar-EG')}
          </Text>
        </View>
        <View style={[styles.operationTypeBadge, { backgroundColor: getOperationTypeColor(operation.type) + '20' }]}>
          <Text style={[styles.operationTypeText, { color: getOperationTypeColor(operation.type) }]}>
            {getOperationTypeLabel(operation.type)}
          </Text>
        </View>
      </View>
      
      <View style={styles.operationDetails}>
        <Text style={[
          styles.operationAmount,
          { color: operation.type === 'deposit' ? '#059669' : '#dc2626' }
        ]}>
          {operation.type === 'deposit' ? '+' : '-'}{operation.amount.toLocaleString()} EGP
        </Text>
        <View style={[styles.statusDot, { backgroundColor: operation.status === 'completed' ? '#10b981' : '#f59e0b' }]} />
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
          <View style={[styles.selectedTreasuryTypeBadge, { backgroundColor: getTreasuryTypeColor(selectedTreasury.type) + '20' }]}>
            <Text style={[styles.selectedTreasuryTypeText, { color: getTreasuryTypeColor(selectedTreasury.type) }]}>
              {getTreasuryTypeLabel(selectedTreasury.type)}
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
        {!selectedTreasury ? (
          <View style={styles.treasuriesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>خزائنك</Text>
              <Text style={styles.sectionSubtitle}>إجمالي {treasuries.length} خزينة - اضغط على خزينة لعرض معاملاتها</Text>
            </View>
            
            {treasuries.map(renderTreasuryCard)}
          </View>
        ) : (
          <View style={styles.operationsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>معاملات {selectedTreasury.name}</Text>
              <Text style={styles.sectionSubtitle}>
                {filteredOperations.length} عملية - آخر {filteredOperations.length} معاملة
              </Text>
            </View>
            
            {filteredOperations.length > 0 ? (
              filteredOperations.map(renderOperationCard)
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
});

export default TreasuryScreen;
