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
  
  const selectedItem = items.find(item => item.value === selectedValue);
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
          <ActivityIndicator size="small" color="#666" />
        ) : (
          <Icon name="arrow-drop-down" size={24} color="#666" />
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
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
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
                    <Icon name="check" size={20} color="#1a73e8" />
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
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectedValue: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  errorBorder: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
  disabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  option: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 16,
  },
});

export default SelectBox;
