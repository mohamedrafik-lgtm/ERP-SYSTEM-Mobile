import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';

const CoursesScreen = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="Courses" />
        <Text style={styles.title}>إدارة البرامج التدريبية</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>إضافة برنامج</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="book" size={32} color="#1a237e" />
            <Text style={styles.statNumber}>25</Text>
            <Text style={styles.statLabel}>إجمالي البرامج</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="play-circle" size={32} color="#10b981" />
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statLabel}>نشطة</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="schedule" size={32} color="#f59e0b" />
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statLabel}>قادمة</Text>
          </View>
        </View>

        <View style={styles.coursesSection}>
          <Text style={styles.sectionTitle}>البرامج المتاحة</Text>
          
          <View style={styles.courseCard}>
            <View style={styles.courseHeader}>
              <Text style={styles.courseTitle}>برنامج البرمجة المتقدمة</Text>
              <View style={styles.courseStatus}>
                <Text style={styles.statusText}>نشطة</Text>
              </View>
            </View>
              <Text style={styles.courseDescription}>
                برنامج شامل لتعلم البرمجة من الأساسيات إلى المستوى المتقدم
              </Text>
            <View style={styles.courseInfo}>
              <View style={styles.infoItem}>
                <Icon name="schedule" size={16} color="#6b7280" />
                <Text style={styles.infoText}>3 أشهر</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="people" size={16} color="#6b7280" />
                <Text style={styles.infoText}>25 طالب</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="star" size={16} color="#fbbf24" />
                <Text style={styles.infoText}>4.8</Text>
              </View>
            </View>
          </View>

          <View style={styles.courseCard}>
            <View style={styles.courseHeader}>
              <Text style={styles.courseTitle}>برنامج التصميم الجرافيكي</Text>
              <View style={[styles.courseStatus, styles.upcomingStatus]}>
                <Text style={[styles.statusText, styles.upcomingStatusText]}>قادمة</Text>
              </View>
            </View>
            <Text style={styles.courseDescription}>
              تعلم أساسيات التصميم الجرافيكي باستخدام أحدث البرامج
            </Text>
            <View style={styles.courseInfo}>
              <View style={styles.infoItem}>
                <Icon name="schedule" size={16} color="#6b7280" />
                <Text style={styles.infoText}>2 شهر</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="people" size={16} color="#6b7280" />
                <Text style={styles.infoText}>15 طالب</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="star" size={16} color="#fbbf24" />
                <Text style={styles.infoText}>4.6</Text>
              </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
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
  coursesSection: {
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
  courseCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  courseStatus: {
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
  upcomingStatus: {
    backgroundColor: '#fef3c7',
  },
  upcomingStatusText: {
    color: '#d97706',
  },
  courseDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  courseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
});

export default CoursesScreen;