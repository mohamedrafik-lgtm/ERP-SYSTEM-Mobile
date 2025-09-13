import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePermissions } from '../hooks/usePermissions';
import PermissionService from '../services/PermissionService';
import { SCREEN_PERMISSIONS } from '../types/permissions';

interface PermissionTestComponentProps {
  testRole?: string;
}

const PermissionTestComponent: React.FC<PermissionTestComponentProps> = ({ testRole }) => {
  const { allowedScreens, allowedMenuSections, userRoleInfo, isLoading } = usePermissions();
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading) {
      runPermissionTests();
    }
  }, [isLoading, allowedScreens]);

  const runPermissionTests = () => {
    const results = SCREEN_PERMISSIONS.map(screen => {
      const hasAccess = allowedScreens.some(allowed => allowed.id === screen.id);
      const shouldHaveAccess = screen.allowedRoles.includes(userRoleInfo?.name as any);
      
      return {
        screenId: screen.id,
        title: screen.title,
        category: screen.category,
        hasAccess,
        shouldHaveAccess,
        isCorrect: hasAccess === shouldHaveAccess,
        allowedRoles: screen.allowedRoles,
      };
    });
    
    setTestResults(results);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'home': return '#4a90e2';
      case 'academic': return '#7ed321';
      case 'marketing': return '#f5a623';
      case 'financial': return '#50e3c2';
      case 'automation': return '#bd10e0';
      case 'system': return '#e53e3e';
      default: return '#9b9b9b';
    }
  };

  const getResultIcon = (result: any) => {
    if (result.isCorrect) {
      return result.hasAccess ? 'check-circle' : 'cancel';
    } else {
      return 'error';
    }
  };

  const getResultColor = (result: any) => {
    if (result.isCorrect) {
      return result.hasAccess ? '#38a169' : '#666';
    } else {
      return '#e53e3e';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>جاري تحميل اختبار الصلاحيات...</Text>
      </View>
    );
  }

  const correctResults = testResults.filter(r => r.isCorrect).length;
  const totalResults = testResults.length;
  const accuracy = totalResults > 0 ? (correctResults / totalResults) * 100 : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>اختبار نظام الصلاحيات</Text>
        <View style={styles.userInfo}>
          <Text style={styles.roleText}>
            الدور الحالي: {userRoleInfo?.displayName || 'غير محدد'}
          </Text>
          <Text style={styles.statsText}>
            دقة النظام: {accuracy.toFixed(1)}% ({correctResults}/{totalResults})
          </Text>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>ملخص الصلاحيات</Text>
        <Text style={styles.summaryText}>
          عدد الصفحات المتاحة: {allowedScreens.length}
        </Text>
        <Text style={styles.summaryText}>
          عدد الأقسام المتاحة: {allowedMenuSections.length}
        </Text>
      </View>

      <View style={styles.results}>
        <Text style={styles.resultsTitle}>تفاصيل اختبار كل صفحة</Text>
        {testResults.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <View style={styles.resultTitleContainer}>
                <View 
                  style={[
                    styles.categoryIndicator, 
                    { backgroundColor: getCategoryColor(result.category) }
                  ]} 
                />
                <Text style={styles.resultTitle}>{result.title}</Text>
              </View>
              <Icon 
                name={getResultIcon(result)}
                size={24}
                color={getResultColor(result)}
              />
            </View>
            
            <View style={styles.resultDetails}>
              <Text style={styles.resultDetailText}>
                الفئة: {result.category}
              </Text>
              <Text style={styles.resultDetailText}>
                الحالة: {result.hasAccess ? 'متاح' : 'غير متاح'}
              </Text>
              <Text style={styles.resultDetailText}>
                الأدوار المسموحة: {result.allowedRoles.join(', ')}
              </Text>
              {!result.isCorrect && (
                <Text style={styles.errorText}>
                  ⚠️ خطأ: النتيجة لا تطابق الصلاحيات المحددة
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.menuSections}>
        <Text style={styles.menuTitle}>الأقسام المتاحة في القائمة</Text>
        {allowedMenuSections.map((section, index) => (
          <View key={index} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <Text style={styles.menuSectionItems}>
              العناصر: {section.items.length}
            </Text>
            {section.items.map((item: any, itemIndex: number) => (
              <Text key={itemIndex} style={styles.menuItem}>
                • {item.title}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loading: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  userInfo: {
    alignItems: 'center',
  },
  roleText: {
    fontSize: 16,
    color: '#1a237e',
    fontWeight: '600',
    marginBottom: 4,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  summary: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  results: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  resultDetails: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resultDetailText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 13,
    color: '#e53e3e',
    marginTop: 4,
    fontWeight: '500',
  },
  menuSections: {
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  menuSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  menuSectionItems: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  menuItem: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginBottom: 2,
  },
});

export default PermissionTestComponent;
