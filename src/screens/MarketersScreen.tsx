import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import type { MarketingEmployeesResponse } from '../types/marketing';

const MarketersScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<MarketingEmployeesResponse>([]);

  const loadEmployees = async () => {
    try {
      setError(null);
      const data = await AuthService.getMarketingEmployees();
      setEmployees(data);
    } catch (e: any) {
      setError(e?.message || 'فشل تحميل المسوقين');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadEmployees();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="Marketers" />
        <Text style={styles.headerTitle}>المسوقون</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {loading ? (
          <View style={styles.card}> 
            <ActivityIndicator size="small" color="#1a237e" />
            <Text style={styles.subtitle}>جاري تحميل البيانات...</Text>
          </View>
        ) : error ? (
          <View style={[styles.card, styles.errorCard]}>
            <Text style={styles.title}>حدث خطأ</Text>
            <Text style={styles.subtitle}>{error}</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={[styles.card, styles.controlsRow]}>
              <Text style={[styles.title, { marginBottom: 0 }]}>قائمة المسوقين</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddMarketer')}>
                <Text style={styles.addBtnText}>إضافة مسوّق</Text>
              </TouchableOpacity>
            </View>
            {employees.map(emp => (
              <View key={emp.id} style={styles.empCard}>
                <View style={styles.empHeader}>
                  <View style={styles.empAvatar}>
                    <Text style={styles.empAvatarText}>{emp.name?.slice(0,1)?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.empName}>{emp.name}</Text>
                    <Text style={styles.empMeta}>{emp.phone}{emp.email ? ` · ${emp.email}` : ''}</Text>
                  </View>
                  <Text style={[styles.empBadge, emp.isActive ? styles.badgeActive : styles.badgeInactive]}>{emp.isActive ? 'نشط' : 'غير نشط'}</Text>
                </View>
                <View style={styles.empFooter}>
                  <Text style={styles.footerItem}>طلبات: {emp.totalApplications}</Text>
                  <Text style={styles.footerItem}>متدربون: {emp._count?.trainees ?? 0}</Text>
                  <Text style={styles.footerItem}>مُعيّنون إجمالاً: {emp.totalAssignedTrainees}</Text>
                  <TouchableOpacity 
                    style={[styles.editBtn, { backgroundColor: '#dbeafe' }]} 
                    onPress={() => navigation.navigate('EmployeeTrainees', { 
                      employeeId: emp.id, 
                      employeeName: emp.name 
                    })}
                  >
                    <Text style={[styles.editBtnText, { color: '#1e40af' }]}>المتدربين</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditMarketer', { employee: emp })}>
                    <Text style={styles.editBtnText}>تعديل</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editBtn, { backgroundColor: '#fee2e2' }]}
                    onPress={() => {
                      Alert.alert(
                        'تأكيد الحذف',
                        `هل أنت متأكد من حذف المسوّق ${emp.name}؟`,
                        [
                          { text: 'إلغاء', style: 'cancel' },
                          {
                            text: 'حذف',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await AuthService.deleteMarketingEmployee(emp.id);
                                setEmployees((prev) => prev.filter((x) => x.id !== emp.id));
                              } catch (e: any) {
                                Alert.alert('تعذر الحذف', e?.message || 'حدث خطأ');
                              }
                            },
                          },
                        ],
                        { cancelable: true }
                      );
                    }}
                  >
                    <Text style={[styles.editBtnText, { color: '#dc2626' }]}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
    </View>
  );
};

export default MarketersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a237e' },
  placeholder: { width: 44 },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a237e', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  errorCard: { borderLeftWidth: 4, borderLeftColor: '#dc2626' },
  empCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#eef2ff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 },
  empHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  empAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', marginRight: 12 },
  empAvatarText: { fontSize: 14, fontWeight: '800', color: '#111827' },
  empName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  empMeta: { fontSize: 12, color: '#6b7280' },
  empBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 12, fontWeight: '700' },
  badgeActive: { backgroundColor: '#eef2ff', color: '#1a237e' },
  badgeInactive: { backgroundColor: '#f3f4f6', color: '#6b7280' },
  empFooter: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerItem: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  editBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { color: '#1a237e', fontSize: 12, fontWeight: '700' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addBtn: { backgroundColor: '#1a237e', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});


