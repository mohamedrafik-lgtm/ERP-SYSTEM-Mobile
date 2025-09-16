import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import BranchService from '../services/BranchService';

const HomeScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState({
    totalPrograms: 0,
    totalStudents: 0,
    totalFees: 0,
    totalSafes: 0,
    activeStudents: 0,
    appliedFees: 0,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [branchName, setBranchName] = useState('');

  useEffect(() => {
    fetchStats();
    fetchBranchInfo();
  }, []);

  const fetchBranchInfo = async () => {
    try {
      const branch = await BranchService.getSelectedBranch();
      if (branch) {
        setBranchName(branch.name);
      }
    } catch (error) {
      console.error('Error fetching branch info:', error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // جلب البرامج
      const programs = await AuthService.getAllPrograms().catch(() => []);
      
      // جلب الطلاب مع pagination
      const studentsResponse = await AuthService.getTrainees({ 
        page: 1, 
        limit: 1, 
        includeDetails: false 
      }).catch(() => ({ data: [], pagination: { total: 0 } }));
      
      // جلب الرسوم
      const fees = await AuthService.getAllTraineeFees().catch(() => []);
      
      // جلب الخزائن
      const safes = await AuthService.getAllSafes().catch(() => []);

      // حساب الطلاب النشطين
      const activeStudentsResponse = await AuthService.getTrainees({ 
        page: 1, 
        limit: 1, 
        includeDetails: false,
        status: 'ACTIVE'
      }).catch(() => ({ data: [], pagination: { total: 0 } }));

      // حساب الرسوم المطبقة
      const appliedFees = fees.filter(fee => fee.isApplied).length;

      // حساب إجمالي الرصيد من الخزائن
      const totalBalance = safes.reduce((sum, safe) => sum + safe.balance, 0);

      setStats({
        totalPrograms: programs.length,
        totalStudents: studentsResponse.pagination?.total || studentsResponse.data?.length || 0,
        totalFees: fees.length,
        totalSafes: safes.length,
        activeStudents: activeStudentsResponse.pagination?.total || activeStudentsResponse.data?.length || 0,
        appliedFees: appliedFees,
        totalBalance: totalBalance,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء الخير';
  };

  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="Home" />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>الرئيسية</Text>
          {branchName ? (
            <Text style={styles.branchIndicator}>{branchName}</Text>
          ) : null}
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Image
            source={require('../../img/502585454_122235753458244801_413190920156398012_n-removebg-preview.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.greeting}>{getCurrentTime()}</Text>
          <Text style={styles.title}>مرحباً بك في النظام الإداري</Text>
          <Text style={styles.subtitle}>مركز طيبة للتدريب</Text>
          <Text style={styles.date}>{getCurrentDate()}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>إحصائيات سريعة</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1a237e" />
              <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#e3f2fd' }]}>
                  <Icon name="book" size={24} color="#1a237e" />
                </View>
                <Text style={styles.statNumber}>{stats.totalPrograms}</Text>
                <Text style={styles.statLabel}>البرامج التدريبية</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#e8f5e8' }]}>
                  <Icon name="school" size={24} color="#059669" />
                </View>
                <Text style={styles.statNumber}>{stats.totalStudents}</Text>
                <Text style={styles.statLabel}>إجمالي الطلاب</Text>
                <Text style={styles.statSubtext}>{stats.activeStudents} نشط</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#fff3e0' }]}>
                  <Icon name="account-balance-wallet" size={24} color="#f57c00" />
                </View>
                <Text style={styles.statNumber}>{stats.totalFees}</Text>
                <Text style={styles.statLabel}>الرسوم المالية</Text>
                <Text style={styles.statSubtext}>{stats.appliedFees} مطبقة</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#f3e5f5' }]}>
                  <Icon name="account-balance" size={24} color="#7b1fa2" />
                </View>
                <Text style={styles.statNumber}>{stats.totalSafes}</Text>
                <Text style={styles.statLabel}>الخزائن المالية</Text>
                <Text style={styles.statSubtext}>{stats.totalBalance.toLocaleString()} ج.م</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>الوصول السريع</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#1a237e' }]}
              onPress={() => navigation.navigate('StudentsList')}
            >
              <Icon name="school" size={28} color="#fff" />
              <Text style={styles.actionText}>الطلاب</Text>
              <Text style={styles.actionSubtext}>إدارة الطلاب</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#059669' }]}
              onPress={() => navigation.navigate('Programs')}
            >
              <Icon name="book" size={28} color="#fff" />
              <Text style={styles.actionText}>البرامج</Text>
              <Text style={styles.actionSubtext}>البرامج التدريبية</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#dc2626' }]}
              onPress={() => navigation.navigate('Treasury')}
            >
              <Icon name="account-balance" size={28} color="#fff" />
              <Text style={styles.actionText}>الخزائن</Text>
              <Text style={styles.actionSubtext}>إدارة الخزائن</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#7c3aed' }]}
              onPress={() => navigation.navigate('Fees')}
            >
              <Icon name="account-balance-wallet" size={28} color="#fff" />
              <Text style={styles.actionText}>الرسوم</Text>
              <Text style={styles.actionSubtext}>إدارة الرسوم</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>النشاط الأخير</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#e3f2fd' }]}>
                <Icon name="add" size={20} color="#1a237e" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>مرحباً بك في النظام</Text>
                <Text style={styles.activityDescription}>
                  تم تسجيل الدخول بنجاح إلى النظام الإداري لمركز طيبة للتدريب
                </Text>
                <Text style={styles.activityTime}>الآن</Text>
              </View>
            </View>
          </View>
        </View>

        {/* System Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Icon name="info" size={24} color="#1a237e" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>معلومات النظام</Text>
              <Text style={styles.infoText}>
                نظام إداري متكامل لإدارة مركز طيبة للتدريب
              </Text>
              <Text style={styles.infoVersion}>الإصدار 1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
    paddingTop: 40,
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
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  branchIndicator: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 50,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greeting: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#3a4a63',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
    textAlign: 'right',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsSection: {
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    width: '48%',
    marginBottom: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  actionSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  activitySection: {
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  infoVersion: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
});

