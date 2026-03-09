import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import PermissionService from '../services/PermissionService';
import { PermissionAction } from '../types/permissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  /** اسم الشاشة في SCREEN_PERMISSIONS */
  screenName?: string;
  /** أو تحديد resource + action مباشرة */
  resource?: string;
  action?: PermissionAction;
  /** @deprecated استخدم screenName بدلاً من screenId */
  screenId?: string;
  fallbackComponent?: React.ComponentType<any>;
  showAccessDenied?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  screenName,
  resource,
  action = 'view',
  screenId,
  fallbackComponent: FallbackComponent,
  showAccessDenied = true,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  // دعم screenId القديم كـ fallback
  const resolvedScreenName = screenName || screenId;

  useEffect(() => {
    checkPermission();
  }, [resolvedScreenName, resource, action]);

  const checkPermission = async () => {
    try {
      setIsLoading(true);

      if (resource) {
        // فحص resource + action مباشرة
        const perms = await PermissionService.fetchUserPermissions();
        setHasPermission(PermissionService.hasPermission(perms, resource, action));
      } else if (resolvedScreenName) {
        // فحص بناءً على اسم الشاشة
        const canAccess = await PermissionService.canAccessScreen(resolvedScreenName);
        setHasPermission(canAccess);
      } else {
        setHasPermission(true); // لا صلاحية محددة = مسموح
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      (navigation as any).navigate('Home');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="hourglass-empty" size={48} color="#666" />
        <Text style={styles.loadingText}>جاري التحقق من الصلاحيات...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    if (!showAccessDenied) {
      return null;
    }

    return (
      <View style={styles.accessDeniedContainer}>
        <View style={styles.accessDeniedContent}>
          <Icon name="lock" size={80} color="#e53e3e" />
          <Text style={styles.accessDeniedTitle}>ممنوع الوصول</Text>
          <Text style={styles.accessDeniedMessage}>
            {PermissionService.getAccessDeniedMessage(resolvedScreenName)}
          </Text>
          <Text style={styles.accessDeniedSubMessage}>
            يرجى التواصل مع المدير للحصول على الصلاحيات المطلوبة
          </Text>
          
          <TouchableOpacity 
            style={styles.goBackButton}
            onPress={handleGoBack}
          >
            <Icon name="arrow-back" size={20} color="#fff" />
            <Text style={styles.goBackText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  accessDeniedContent: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 350,
    width: '100%',
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  accessDeniedMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  accessDeniedSubMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  goBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a237e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  goBackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PermissionGuard;
