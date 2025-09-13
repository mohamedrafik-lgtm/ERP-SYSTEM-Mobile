import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PermissionService from '../services/PermissionService';

interface PermissionGuardProps {
  children: React.ReactNode;
  screenId: string;
  fallbackComponent?: React.ComponentType<any>;
  showAccessDenied?: boolean;
  navigation?: any;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  screenId,
  fallbackComponent: FallbackComponent,
  showAccessDenied = true,
  navigation,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [screenId]);

  const checkPermission = async () => {
    try {
      setIsLoading(true);
      const canAccess = await PermissionService.canAccessScreen(screenId);
      setHasPermission(canAccess);
    } catch (error) {
      console.error('Error checking permission:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (navigation) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Home');
      }
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
            {PermissionService.getAccessDeniedMessage()}
          </Text>
          <Text style={styles.accessDeniedSubMessage}>
            يرجى التواصل مع المدير للحصول على الصلاحيات المطلوبة
          </Text>
          
          {navigation && (
            <TouchableOpacity 
              style={styles.goBackButton}
              onPress={handleGoBack}
            >
              <Icon name="arrow-back" size={20} color="#fff" />
              <Text style={styles.goBackText}>العودة</Text>
            </TouchableOpacity>
          )}
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
