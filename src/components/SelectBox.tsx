import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface SelectBoxProps<T> {
  label: string;
  selectedValue: T | undefined;
  onValueChange: (value: T) => void;
  items: { value: T; label: string }[];
  placeholder: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
}

function SelectBox<T>({
  label,
  selectedValue,
  onValueChange,
  items,
  placeholder,
  error,
  disabled = false,
  loading = false,
}: SelectBoxProps<T>) {
  const [modalVisible, setModalVisible] = React.useState(false);
  
  const selectedItem = items?.find(item => item.value === selectedValue);
  console.log('SelectBox: selectedValue:', selectedValue);
  console.log('SelectBox: selectedItem:', selectedItem);
  console.log('SelectBox: items:', items);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.selectContainer,
          error ? styles.errorBorder : {},
          (disabled || loading) ? styles.disabled : {}
        ]}
        onPress={() => !(disabled || loading) && setModalVisible(true)}
        disabled={disabled || loading}
      >
        <Text style={[styles.selectedValue, !selectedItem && !loading && styles.placeholder]}>
          {loading ? 'جاري التحميل...' : (selectedItem ? selectedItem.label : placeholder)}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="#1a237e" />
        ) : (
          <Icon name="keyboard-arrow-down" size={24} color="#6b7280" />
        )}
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items || []}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    console.log('SelectBox: Item selected:', item);
                    console.log('SelectBox: Value:', item.value);
                    console.log('SelectBox: Label:', item.label);
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {selectedValue === item.value && (
                    <Icon name="check-circle" size={24} color="#10b981" />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '600',
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedValue: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  placeholder: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  errorBorder: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  disabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
    borderColor: '#e5e7eb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fafafa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  option: {
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 18,
  },
});

export default SelectBox;
