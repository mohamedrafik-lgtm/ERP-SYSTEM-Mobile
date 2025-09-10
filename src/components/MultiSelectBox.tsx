import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './MultiSelectBox.styles';

interface Item {
  id: number | string;
  name: string;
}

interface MultiSelectBoxProps {
  label: string;
  items: Item[];
  selectedItems: (number | string)[];
  onSelectionChange: (selectedIds: (number | string)[]) => void;
  placeholder: string;
  error?: string;
  loading?: boolean;
}

const MultiSelectBox: React.FC<MultiSelectBoxProps> = ({
  label,
  items,
  selectedItems,
  onSelectionChange,
  placeholder,
  error,
  loading = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleToggleItem = (itemId: number | string) => {
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    onSelectionChange(newSelection);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const selectedItemsData = items.filter(item => selectedItems.includes(item.id));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
        disabled={loading}
      >
        <Text style={styles.selectButtonText}>
          {loading ? 'جاري التحميل...' : placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="#6B7280" />
        ) : (
          <Icon name="keyboard-arrow-down" size={24} color="#6B7280" />
        )}
      </TouchableOpacity>

      {selectedItemsData.length > 0 && (
        <View style={styles.selectedItemsContainer}>
          {selectedItemsData.map(item => (
            <View key={item.id} style={styles.selectedItem}>
              <Text style={styles.selectedItemText}>{item.name}</Text>
              <TouchableOpacity onPress={() => handleToggleItem(item.id)}>
                <Icon name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{label}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث..."
            value={searchText}
            onChangeText={setSearchText}
          />
          <FlatList
            data={filteredItems}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemContainer}
                onPress={() => handleToggleItem(item.id)}
              >
                <Icon
                  name={selectedItems.includes(item.id) ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={selectedItems.includes(item.id) ? '#3A86FF' : '#6B7280'}
                />
                <Text style={styles.itemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#6B7280' }}>لا توجد عناصر</Text>}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>إغلاق</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default MultiSelectBox;
