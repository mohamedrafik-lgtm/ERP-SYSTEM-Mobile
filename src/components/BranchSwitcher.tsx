import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import BranchService, { Branch, BranchConfig } from '../services/BranchService';
import AuthService from '../services/AuthService';

interface BranchSwitcherProps {
  navigation?: any;
  onBranchChange?: (branch: Branch) => void;
}

const BranchSwitcher: React.FC<BranchSwitcherProps> = ({ navigation, onBranchChange }) => {
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<BranchConfig[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentBranch();
    loadAvailableBranches();
  }, []);

  const loadCurrentBranch = async () => {
    try {
      const branch = await BranchService.getSelectedBranch();
      setCurrentBranch(branch);
    } catch (error) {
      console.error('Error loading current branch:', error);
    }
  };

  const loadAvailableBranches = () => {
    const branches = BranchService.getAvailableBranches();
    setAvailableBranches(branches);
  };

  const handleBranchSwitch = async (branchId: string) => {
    if (currentBranch?.id === branchId) {
      setIsModalVisible(false);
      return;
    }

    Alert.alert(
      'تغيير الفرع',
      'سيتم تسجيل الخروج وإعادة توجيهك لتسجيل الدخول مرة أخرى. هل تريد المتابعة؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'متابعة',
          style: 'destructive',
          onPress: () => performBranchSwitch(branchId),
        },
      ]
    );
  };

  const performBranchSwitch = async (branchId: string) => {
    try {
      setLoading(true);
      setIsModalVisible(false);

      // تسجيل الخروج أولاً
      await AuthService.logout();

      // تغيير الفرع
      const newBranch = await BranchService.changeBranch(branchId);
      setCurrentBranch(newBranch);

      Toast.show({
        type: 'success',
        text1: 'تم تغيير الفرع',
        text2: `تم التبديل إلى ${newBranch.name}`,
        position: 'top',
      });

      // استدعاء callback إذا كان متاحاً
      if (onBranchChange) {
        onBranchChange(newBranch);
      }

      // إعادة توجيه إلى شاشة تسجيل الدخول
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }

    } catch (error) {
      console.error('Error switching branch:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'حدث خطأ في تغيير الفرع',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBranchItem = ({ item }: { item: BranchConfig }) => {
    const isSelected = currentBranch?.id === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.branchItem,
          isSelected && styles.branchItemSelected,
          { borderLeftColor: item.color }
        ]}
        onPress={() => handleBranchSwitch(item.id)}
        disabled={loading}
      >
        <View style={styles.branchItemContent}>
          <View style={[styles.branchIcon, { backgroundColor: item.color }]}>
            <Icon name={item.icon} size={20} color="#fff" />
          </View>
          
          <View style={styles.branchInfo}>
            <Text style={styles.branchName}>{item.name}</Text>
            <Text style={styles.branchCity}>{item.city}</Text>
          </View>

          {isSelected && (
            <View style={styles.selectedIcon}>
              <Icon name="check-circle" size={20} color={item.color} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!currentBranch) {
    return null;
  }

  const currentConfig = BranchService.getBranchConfig(currentBranch.id);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.branchButton}
        onPress={() => setIsModalVisible(true)}
        disabled={loading}
      >
        <View style={styles.buttonContent}>
          <View style={[styles.currentBranchIcon, { backgroundColor: currentConfig?.color || '#1a237e' }]}>
            <Icon name={currentConfig?.icon || 'location-city'} size={16} color="#fff" />
          </View>
          <Text style={styles.currentBranchText}>{currentBranch.name}</Text>
          <Icon name="expand-more" size={16} color="#6b7280" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختيار الفرع</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableBranches}
              renderItem={renderBranchItem}
              keyExtractor={(item) => item.id}
              style={styles.branchList}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.modalFooter}>
              <Text style={styles.footerNote}>
                ملاحظة: سيتم تسجيل الخروج عند تغيير الفرع
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  branchButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentBranchIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  currentBranchText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    maxHeight: '70%',
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  closeButton: {
    padding: 4,
  },
  branchList: {
    maxHeight: 300,
  },
  branchItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderLeftWidth: 4,
  },
  branchItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  branchItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  branchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  branchCity: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectedIcon: {
    marginLeft: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  footerNote: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default BranchSwitcher;
