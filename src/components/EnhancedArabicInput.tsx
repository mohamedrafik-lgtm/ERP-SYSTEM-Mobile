import React, { useState, useRef } from 'react';
import { 
  TextInput, 
  TextInputProps, 
  StyleSheet, 
  View, 
  Text,
  TouchableOpacity 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface EnhancedArabicInputProps extends TextInputProps {
  isArabic?: boolean;
  label?: string;
  error?: string;
  required?: boolean;
  icon?: string;
}

const EnhancedArabicInput: React.FC<EnhancedArabicInputProps> = ({ 
  isArabic = true, 
  style, 
  label,
  error,
  required = false,
  icon,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (props.onBlur) {
      props.onBlur();
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.focusedContainer,
        error && styles.errorContainer,
        props.editable === false && styles.disabledContainer
      ]}>
        {icon && (
          <Icon 
            name={icon} 
            size={20} 
            color={isFocused ? '#1a237e' : '#6b7280'} 
            style={styles.icon} 
          />
        )}
        
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            isArabic && styles.arabicInput,
            style
          ]}
          textAlign={isArabic ? 'right' : 'left'}
          textAlignVertical={props.multiline ? 'top' : 'center'}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType={props.returnKeyType || 'next'}
          keyboardType={props.keyboardType || 'default'}
          multiline={props.multiline || false}
          numberOfLines={props.numberOfLines || 1}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {props.value && props.value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              if (props.onChangeText) {
                props.onChangeText('');
              }
              inputRef.current?.focus();
            }}
          >
            <Icon name="clear" size={16} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#e53e3e',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  focusedContainer: {
    borderColor: '#1a237e',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  errorContainer: {
    borderColor: '#e53e3e',
    backgroundColor: '#fef2f2',
  },
  disabledContainer: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'System',
    paddingVertical: 12,
  },
  arabicInput: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
});

export default EnhancedArabicInput;
