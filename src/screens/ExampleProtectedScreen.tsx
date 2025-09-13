import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import PermissionGuard from '../components/PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ExampleProtectedScreenProps {
  navigation: any;
  route: any;
}

const ExampleProtectedScreen: React.FC<ExampleProtectedScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { userRoleInfo } = usePermissions();

  return (
    <PermissionGuard 
      screenId=\"Treasury\" 
      navigation={navigation}
      showAccessDenied={true}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Icon name=\"account-balance\" size={48} color=\"#1a237e\" />
          <Text style={styles.title}>الخزائن المالية</Text>
          <Text style={styles.subtitle}>
            مرحباً {userRoleInfo?.displayName || 'المستخدم'}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.contentText}>
            هذه صفحة محمية يمكن للمحاسبين والمدراء فقط الوصول إليها.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Icon name=\"check-circle\" size={20} color=\"#38a169\" />
              <Text style={styles.featureText}>عرض الخزائن المالية</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name=\"check-circle\" size={20} color=\"#38a169\" />
              <Text style={styles.featureText}>إدارة المعاملات المالية</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name=\"check-circle\" size={20} color=\"#38a169\" />
              <Text style={styles.featureText}>تقارير مالية مفصلة</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </PermissionGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 30,
  },
  featureList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});

export default ExampleProtectedScreen;
