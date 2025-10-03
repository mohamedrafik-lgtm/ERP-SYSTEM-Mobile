import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import Toast from 'react-native-toast-message';
import { TraineeDistributionsResponse } from '../types/distribution';

const DistributionManagementScreen = ({ navigation }: any) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [programStats, setProgramStats] = useState<Record<number, { totalTrainees: number; totalRooms: number }>>({});

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getAllPrograms();
      setPrograms(Array.isArray(data) ? data : []);
      
      // جلب إحصائيات كل برنامج
      await loadProgramStats(data);
    } catch (error) {
      console.error('Error loading programs:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ في تحميل البرامج',
        text2: 'تعذر الاتصال بالخادم',
        position: 'bottom'
      });
      setPrograms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadProgramStats = async (programsData: any[]) => {
    const stats: Record<number, { totalTrainees: number; totalRooms: number }> = {};
    
    for (const program of programsData) {
      try {
        // جلب توزيعات البرنامج
        const distributions = await AuthService.getTraineeDistributions({ programId: program.id });
        
        // حساب إجمالي المتدربين والقاعات
        let totalTrainees = 0;
        let totalRooms = 0;
        
        distributions.forEach((distribution: any) => {
          totalRooms += distribution.numberOfRooms;
          distribution.rooms.forEach((room: any) => {
            totalTrainees += room._count.assignments;
          });
        });
        
        stats[program.id] = { totalTrainees, totalRooms };
      } catch (error) {
        console.error(`Error loading stats for program ${program.id}:`, error);
        stats[program.id] = { totalTrainees: 0, totalRooms: 0 };
      }
    }
    
    setProgramStats(stats);
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPrograms();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="DistributionManagement" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>توزيع المتدربين على القاعات</Text>
          <Text style={styles.subtitle}>إدارة توزيع المتدربين على القاعات الدراسية والمعامل</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1a237e']}
            tintColor="#1a237e"
          />
        }
      >
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => navigation.navigate('AddDistribution')}
          >
            <Text style={styles.primaryText}>توزيع جديد</Text>
          </TouchableOpacity>
          <View style={styles.rightTools}>
            <TouchableOpacity 
              style={styles.ghostBtn} 
              onPress={handleRefresh}
            >
              <Text style={styles.ghostText}>تحديث ↻</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل البرامج...</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {programs.map((program) => (
              <View key={program.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.badgesRow}>
                    <View style={[styles.badge, { backgroundColor: '#e8f5e9', borderColor: '#a5d6a7' }]}>
                      <Text style={[styles.badgeText, { color: '#059669' }]}>عملي</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: '#e3f2fd', borderColor: '#90caf9' }]}>
                      <Text style={[styles.badgeText, { color: '#1976d2' }]}>نظري</Text>
                    </View>
                  </View>
                  <Text style={styles.programName}>{program.nameAr}</Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>إجمالي المتدربين</Text>
                    <Text style={styles.statValue}>
                      {programStats[program.id]?.totalTrainees || 0}
                    </Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>عدد القاعات</Text>
                    <Text style={styles.statValue}>
                      {programStats[program.id]?.totalRooms || 0}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.ghostBtn} 
                    onPress={() => navigation.navigate('ProgramDistributions', { 
                      programId: program.id, 
                      programName: program.nameAr 
                    })}
                  >
                    <Text style={styles.ghostText}>عرض وطباعة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dangerBtn} onPress={() => {}}>
                    <Text style={styles.dangerText}>حذف</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.primaryBtn} 
                    onPress={() => navigation.navigate('DistributionDetails', { distributionId: program.id })}
                  >
                    <Text style={styles.primaryText}>إدارة التوزيع</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <Toast />
    </View>
  );
};

export default DistributionManagementScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a237e' },
  subtitle: { marginTop: 4, color: '#6b7280' },
  content: { flex: 1, padding: 20 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  rightTools: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: '#6b7280' },
  grid: { flexDirection: 'column', gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    width: '100%'
  },
  cardHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  programName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  statBox: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginHorizontal: 4 },
  statLabel: { color: '#6b7280', fontSize: 12 },
  statValue: { color: '#1a237e', fontWeight: '800', fontSize: 18, marginTop: 4, textAlign: 'center' },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  ghostBtn: { backgroundColor: '#eef2ff', borderColor: '#1a237e', borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  ghostText: { color: '#1a237e', fontWeight: '700' },
  dangerBtn: { backgroundColor: '#fef2f2', borderColor: '#dc2626', borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  dangerText: { color: '#dc2626', fontWeight: '700' },
  primaryBtn: { backgroundColor: '#1a237e', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  primaryText: { color: '#fff', fontWeight: '700' },
});


