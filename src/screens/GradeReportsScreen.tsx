import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const GradeReportsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      console.log('🔍 GradeReportsScreen - Fetching grade reports...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔍 GradeReportsScreen - Reports loaded');
    } catch (error) {
      console.error('🔍 GradeReportsScreen - Error fetching reports:', error);
      Alert.alert('خطأ', 'فشل في تحميل تقارير الدرجات');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const reportTypes = [
    {
      id: 1,
      title: 'تقرير الدرجات الشامل',
      description: 'تقرير شامل بجميع درجات المتدربين',
      icon: 'assessment',
      color: '#1a237e',
    },
    {
      id: 2,
      title: 'تقرير الأداء الأكاديمي',
      description: 'تحليل أداء المتدربين أكاديمياً',
      icon: 'trending-up',
      color: '#4CAF50',
    },
    {
      id: 3,
      title: 'تقرير المقارنة',
      description: 'مقارنة أداء المتدربين',
      icon: 'compare',
      color: '#FF9800',
    },
    {
      id: 4,
      title: 'تقرير الإحصائيات',
      description: 'إحصائيات مفصلة للدرجات',
      icon: 'bar-chart',
      color: '#9C27B0',
    },
  ];

  const renderReportCard = (report: any) => (
    <TouchableOpacity key={report.id} style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={[styles.iconContainer, { backgroundColor: report.color }]}>
          <Icon name={report.icon} size={24} color="#fff" />
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportDescription}>{report.description}</Text>
        </View>
        <Icon name="chevron-right" size={24} color="#666" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>جاري تحميل تقارير الدرجات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تقارير الدرجات</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter-list" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>إجمالي التقارير</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>89%</Text>
            <Text style={styles.statLabel}>متوسط النجاح</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>23</Text>
            <Text style={styles.statLabel}>المتدربين المتميزين</Text>
          </View>
        </View>

        {/* Report Types */}
        <View style={styles.reportsContainer}>
          <Text style={styles.sectionTitle}>أنواع التقارير</Text>
          
          {reportTypes.map(renderReportCard)}
        </View>

        {/* Recent Reports */}
        <View style={styles.recentContainer}>
          <Text style={styles.sectionTitle}>التقارير الأخيرة</Text>
          
          <View style={styles.recentCard}>
            <View style={styles.recentHeader}>
              <Icon name="description" size={20} color="#1a237e" />
              <Text style={styles.recentTitle}>تقرير الفصل الأول 2024</Text>
              <Text style={styles.recentDate}>15 يناير 2024</Text>
            </View>
            <Text style={styles.recentDescription}>
              تقرير شامل بدرجات جميع المتدربين للفصل الدراسي الأول
            </Text>
          </View>

          <View style={styles.recentCard}>
            <View style={styles.recentHeader}>
              <Icon name="assessment" size={20} color="#4CAF50" />
              <Text style={styles.recentTitle}>تقرير الأداء الشهري</Text>
              <Text style={styles.recentDate}>10 يناير 2024</Text>
            </View>
            <Text style={styles.recentDescription}>
              تحليل أداء المتدربين للشهر الماضي
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  reportsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  recentContainer: {
    marginBottom: 16,
  },
  recentCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  recentDate: {
    fontSize: 12,
    color: '#666',
  },
  recentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default GradeReportsScreen;
