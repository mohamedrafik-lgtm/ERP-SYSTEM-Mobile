import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ArabicSearchInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: () => void;
  style?: any;
}

const ArabicSearchInput: React.FC<ArabicSearchInputProps> = ({
  placeholder = "البحث...",
  value,
  onChangeText,
  onSearch,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChangeText}
          textAlign="right"
          textAlignVertical="center"
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        {onSearch && (
          <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
            <Icon name="search" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'System',
  },
  searchButton: {
    backgroundColor: '#1a237e',
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
});

export default ArabicSearchInput;
