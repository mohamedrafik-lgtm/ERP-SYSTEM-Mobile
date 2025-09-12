import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';

const StudentsScreen = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="Students" />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.title}>إدارة الطلاب</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('StudentsList')}
          >
            <Icon name="list" size={20} color="#1a237e" />
            <Text style={styles.viewAllButtonText}>عرض الكل</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton}>
            <Icon name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>إضافة طالب</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="school" size={32} color="#1a237e" />
            <Text style={styles.statNumber}>150</Text>
            <Text style={styles.statLabel}>إجمالي الطلاب</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="check-circle" size={32} color="#10b981" />
            <Text style={styles.statNumber}>120</Text>
            <Text style={styles.statLabel}>نشط</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="pause-circle" size={32} color="#f59e0b" />
            <Text style={styles.statNumber}>30</Text>
            <Text style={styles.statLabel}>معلق</Text>
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>الطلاب المضافة حديثاً</Text>
          <View style={styles.studentCard}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>أحمد محمد علي</Text>
              <Text style={styles.studentCourse}>دورة البرمجة</Text>
            </View>
            <View style={styles.studentStatus}>
              <Text style={styles.statusText}>نشط</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  viewAllButtonText: {
    color: '#1a237e',
    fontWeight: '600',
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  recentSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 16,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  studentCourse: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  studentStatus: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
  },
});

export default StudentsScreen;
