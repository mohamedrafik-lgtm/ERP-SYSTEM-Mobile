import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionIconProps {
  screenId: string;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const PermissionIcon: React.FC<PermissionIconProps> = ({
  screenId,
  showText = false,
  size = 'medium',
  style,
}) => {
  const { canAccessSync } = usePermissions();
  const hasAccess = canAccessSync(screenId);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { iconSize: 16, fontSize: 12 };
      case 'large':
        return { iconSize: 24, fontSize: 16 };
      default:
        return { iconSize: 20, fontSize: 14 };
    }
  };

  const { iconSize, fontSize } = getSizeConfig();

  if (!hasAccess) {
    return showText ? (
      <View style={[styles.container, style]}>
        <Icon 
          name=\"lock\" 
          size={iconSize} 
          color=\"#e53e3e\" 
        />
        <Text style={[styles.text, { fontSize }, styles.deniedText]}>
          غير مسموح
        </Text>
      </View>
    ) : (
      <Icon 
        name=\"lock\" 
        size={iconSize} 
        color=\"#e53e3e\" 
        style={style}
      />
    );
  }

  return showText ? (
    <View style={[styles.container, style]}>
      <Icon 
        name=\"check-circle\" 
        size={iconSize} 
        color=\"#38a169\" 
      />
      <Text style={[styles.text, { fontSize }, styles.allowedText]}>
        مسموح
      </Text>
    </View>
  ) : (
    <Icon 
      name=\"check-circle\" 
      size={iconSize} 
      color=\"#38a169\" 
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 4,
    fontWeight: '500',
  },
  allowedText: {
    color: '#38a169',
  },
  deniedText: {
    color: '#e53e3e',
  },
});

export default PermissionIcon;
