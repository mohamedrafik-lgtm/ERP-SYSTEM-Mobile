import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

interface ArabicTextInputProps extends TextInputProps {
  isArabic?: boolean;
}

const ArabicTextInput: React.FC<ArabicTextInputProps> = ({ 
  isArabic = true, 
  style, 
  ...props 
}) => {
  return (
    <TextInput
      style={[styles.input, style]}
      textAlign={isArabic ? 'right' : 'left'}
      textAlignVertical="center"
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="next"
      keyboardType={props.keyboardType || 'default'}
      multiline={props.multiline || false}
      numberOfLines={props.numberOfLines || 1}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'System',
    writingDirection: 'rtl', // إضافة دعم RTL
  },
});

export default ArabicTextInput;
