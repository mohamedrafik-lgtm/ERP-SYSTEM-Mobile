import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import type { UsersResponse, UserItem } from '../types/users';

const UsersListScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UsersResponse>([]);
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState<'all' | 'active' | 'inactive'>('all');

  const loadUsers = async () => {
    try {
      setError(null);
      const data = await AuthService.getUsers();
      // Sort by recent login then by createdAt
      const sorted = [...data].sort((a: UserItem, b: UserItem) => {
        const aTime = a.lastLoginAt ? Date.parse(a.lastLoginAt) : 0;
        const bTime = b.lastLoginAt ? Date.parse(b.lastLoginAt) : 0;
        if (aTime !== bTime) return bTime - aTime;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
      setUsers(sorted);
    } catch (e: any) {
      setError(e?.message || 'فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').toLowerCase().includes(q);
    const matchActive = onlyActive === 'all' ? true : onlyActive === 'active' ? u.isActive : !u.isActive;
    return matchQ && matchActive;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="UsersList" />
        <Text style={styles.headerTitle}>المستخدمون</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل المستخدمين...</Text>
          </View>
        ) : error ? (
          <View style={[styles.card, styles.errorCard]}>
            <Text style={styles.errorTitle}>حدث خطأ</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.controlsCard}>
              <View style={styles.searchBox}>
                <Icon name="search" size={18} color="#6b7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="ابحث بالاسم أو البريد أو الهاتف..."
                  placeholderTextColor="#9ca3af"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <View style={styles.filterGroup}>
                {(['all','active','inactive'] as const).map((key) => (
                  <TouchableOpacity key={key} onPress={() => setOnlyActive(key)} style={[styles.filterChip, onlyActive === key && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, onlyActive === key && styles.filterChipTextActive]}>
                      {key === 'all' ? 'الكل' : key === 'active' ? 'نشط' : 'غير نشط'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ gap: 12 }}>
              {filtered.map((u) => (
                <View key={u.id} style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{u.name?.slice(0,1)?.toUpperCase() || '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{u.name}</Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                    </View>
                    <View style={styles.userMeta}>
                      <Text style={[styles.userBadge, u.isActive ? styles.userBadgeActive : styles.userBadgeInactive]}>
                        {u.isActive ? 'نشط' : 'غير نشط'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userFooter}>
                    <View style={styles.footerItem}>
                      <Icon name="schedule" size={16} color="#6b7280" />
                      <Text style={styles.footerText}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ar-EG') : 'لم يسجل بعد'}</Text>
                    </View>
                    <View style={styles.footerItem}>
                      <Icon name="security" size={16} color="#6b7280" />
                      <Text style={styles.footerText}>أدوار: {u.userRoles?.length ?? 0}</Text>
                    </View>
                    <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditUser', { user: u })}>
                      <Icon name="edit" size={16} color="#1a237e" />
                      <Text style={styles.editBtnText}>تعديل</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editBtn, { backgroundColor: '#fee2e2' }]}
                      onPress={() => {
                        Alert.alert(
                          'تأكيد الحذف',
                          `هل أنت متأكد من حذف المستخدم ${u.name}؟`,
                          [
                            { text: 'إلغاء', style: 'cancel' },
                            {
                              text: 'حذف',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await AuthService.deleteUser(u.id);
                                  setUsers((prev) => prev.filter((x) => x.id !== u.id));
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
                      <Icon name="delete" size={16} color="#dc2626" />
                      <Text style={[styles.editBtnText, { color: '#dc2626' }]}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default UsersListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a237e' },
  placeholder: { width: 44 },
  content: { flex: 1, padding: 16 },
  section: { gap: 12 },
  controlsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  filterGroup: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 10, height: 36, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
  filterChipText: { fontSize: 12, color: '#374151', fontWeight: '700' },
  filterChipTextActive: { color: '#fff' },
  loadingBox: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: '#6b7280' },
  errorCard: { borderLeftWidth: 4, borderLeftColor: '#dc2626' },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#dc2626', marginBottom: 6 },
  errorText: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  userCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: '#eef2ff' },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', marginRight: 12 },
  userAvatarText: { fontSize: 14, fontWeight: '800', color: '#111827' },
  userName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  userEmail: { fontSize: 12, color: '#6b7280' },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 12, fontWeight: '700' },
  userBadgeActive: { backgroundColor: '#eef2ff', color: '#1a237e' },
  userBadgeInactive: { backgroundColor: '#f3f4f6', color: '#6b7280' },
  userFooter: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#eef2ff' },
  editBtnText: { color: '#1a237e', fontSize: 12, fontWeight: '700' },
});


