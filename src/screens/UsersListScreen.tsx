import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import type { AccountType, UserItem, UsersResponse } from '../types/users';

type FilterType = 'all' | 'active' | 'archived' | 'staff' | 'instructor';

const UsersListScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UsersResponse>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const isArchivedUser = (user: UserItem) => !!user.isArchived || user.isActive === false;
  const isActiveUser = (user: UserItem) => !isArchivedUser(user);
  const accountTypeOf = (user: UserItem): AccountType => user.accountType || 'STAFF';

  const loadUsers = async () => {
    try {
      setError(null);
      const data = await AuthService.getUsers();
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

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => isActiveUser(u)).length;
    const archived = users.filter((u) => isArchivedUser(u)).length;
    const staff = users.filter((u) => isActiveUser(u) && accountTypeOf(u) === 'STAFF').length;
    const instructor = users.filter((u) => isActiveUser(u) && accountTypeOf(u) === 'INSTRUCTOR').length;
    return { total, active, archived, staff, instructor };
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchQ = !q
        || u.name.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q)
        || (u.phone || '').toLowerCase().includes(q);

      if (!matchQ) return false;
      if (filter === 'active') return isActiveUser(u);
      if (filter === 'archived') return isArchivedUser(u);
      if (filter === 'staff') return isActiveUser(u) && accountTypeOf(u) === 'STAFF';
      if (filter === 'instructor') return isActiveUser(u) && accountTypeOf(u) === 'INSTRUCTOR';
      return true;
    });
  }, [users, filter, search]);

  const getPrimaryRoleName = (user: UserItem): string | null => {
    const activeRoles = (user.userRoles || []).filter((r) => r.isActive);
    if (activeRoles.length === 0) return null;
    const primary = [...activeRoles].sort((a, b) => (b.role?.priority || 0) - (a.role?.priority || 0))[0];
    return primary.role?.displayName || primary.role?.name || null;
  };

  const confirmDeleteUser = (user: UserItem) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف المستخدم ${user.name}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.deleteUser(user.id);
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
            } catch (e: any) {
              Alert.alert('تعذر الحذف', e?.message || 'حدث خطأ');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const confirmArchiveToggle = (user: UserItem) => {
    const nextArchived = !isArchivedUser(user);
    Alert.alert(
      nextArchived ? 'أرشفة المستخدم' : 'إلغاء أرشفة المستخدم',
      nextArchived
        ? `سيتم أرشفة حساب ${user.name} وإخفاؤه من النشطين.`
        : `سيتم إعادة تفعيل حساب ${user.name} ضمن النشطين.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: nextArchived ? 'أرشفة' : 'إلغاء الأرشفة',
          onPress: async () => {
            try {
              await AuthService.updateUser(user.id, { isArchived: nextArchived, isActive: !nextArchived });
              setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isArchived: nextArchived, isActive: !nextArchived } : u)));
            } catch (e: any) {
              Alert.alert('تعذر تحديث الحالة', e?.message || 'حدث خطأ');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="UsersList" />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة المستخدمين</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddUser')}>
          <Icon name="person-add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>الإجمالي</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{stats.active}</Text><Text style={styles.statLabel}>نشط</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{stats.staff}</Text><Text style={styles.statLabel}>إداري</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{stats.instructor}</Text><Text style={styles.statLabel}>محاضر</Text></View>
        </View>

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
                {[
                  { key: 'all' as FilterType, label: `الكل (${stats.total})` },
                  { key: 'active' as FilterType, label: `نشط (${stats.active})` },
                  { key: 'staff' as FilterType, label: `إداري (${stats.staff})` },
                  { key: 'instructor' as FilterType, label: `محاضر (${stats.instructor})` },
                  ...(stats.archived > 0 ? [{ key: 'archived' as FilterType, label: `مؤرشف (${stats.archived})` }] : []),
                ].map((item) => (
                  <TouchableOpacity key={item.key} onPress={() => setFilter(item.key)} style={[styles.filterChip, filter === item.key && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {filtered.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="group" size={28} color="#9ca3af" />
                <Text style={styles.emptyTitle}>لا يوجد مستخدمون</Text>
                <Text style={styles.emptyText}>{search ? 'لا توجد نتائج مطابقة للبحث الحالي' : 'لم يتم إضافة مستخدمين بعد'}</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {filtered.map((u) => {
                  const archived = isArchivedUser(u);
                  const primaryRole = getPrimaryRoleName(u);
                  return (
                    <View key={u.id} style={[styles.userCard, archived && styles.userCardArchived]}>
                      <View style={styles.userHeader}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>{u.name?.slice(0, 1)?.toUpperCase() || '?'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.userName}>{u.name}</Text>
                          <Text style={styles.userEmail}>{u.email}</Text>
                          {!!u.phone && <Text style={styles.userPhone}>{u.phone}</Text>}
                        </View>
                      </View>

                      <View style={styles.badgesRow}>
                        <Text style={[styles.userBadge, archived ? styles.userBadgeArchived : styles.userBadgeActive]}>
                          {archived ? 'مؤرشف' : 'نشط'}
                        </Text>
                        <Text style={[styles.userBadge, accountTypeOf(u) === 'INSTRUCTOR' ? styles.accountInstructor : styles.accountStaff]}>
                          {accountTypeOf(u) === 'INSTRUCTOR' ? 'محاضر' : 'إداري'}
                        </Text>
                        {u.hasCrmAccess ? <Text style={[styles.userBadge, styles.crmBadge]}>CRM</Text> : null}
                      </View>

                      <View style={styles.metaRow}>
                        <View style={styles.footerItem}>
                          <Icon name="security" size={16} color="#6b7280" />
                          <Text style={styles.footerText}>{primaryRole || 'بدون دور'} ({u.userRoles?.filter((r) => r.isActive).length ?? 0})</Text>
                        </View>
                      </View>
                      <View style={styles.metaRow}>
                        <View style={styles.footerItem}>
                          <Icon name="event" size={16} color="#6b7280" />
                          <Text style={styles.footerText}>إنشاء: {new Date(u.createdAt).toLocaleDateString('ar-EG')}</Text>
                        </View>
                        <View style={styles.footerItem}>
                          <Icon name="schedule" size={16} color="#6b7280" />
                          <Text style={styles.footerText}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ar-EG') : 'لم يسجل بعد'}</Text>
                        </View>
                      </View>

                      <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditUser', { userId: u.id, user: u })}>
                          <Icon name="edit" size={16} color="#1a237e" />
                          <Text style={styles.editBtnText}>تعديل</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.editBtn, styles.archiveBtn]} onPress={() => confirmArchiveToggle(u)}>
                          <Icon name={archived ? 'unarchive' : 'archive'} size={16} color={archived ? '#0f766e' : '#b45309'} />
                          <Text style={[styles.editBtnText, { color: archived ? '#0f766e' : '#b45309' }]}>{archived ? 'إلغاء الأرشفة' : 'أرشفة'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.editBtn, styles.deleteBtn]} onPress={() => confirmDeleteUser(u)}>
                          <Icon name="delete" size={16} color="#dc2626" />
                          <Text style={[styles.editBtnText, { color: '#dc2626' }]}>حذف</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
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
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 8, marginRight: 12, borderRadius: 8, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#1a237e' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a237e' },
  addButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1a237e', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: 16 },
  section: { gap: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1a237e' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  controlsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', marginLeft: 8 },
  filterGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 10, minHeight: 32, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
  filterChipText: { fontSize: 11, color: '#374151', fontWeight: '700' },
  filterChipTextActive: { color: '#fff' },
  loadingBox: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: '#6b7280' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  errorCard: { borderLeftWidth: 4, borderLeftColor: '#dc2626' },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#dc2626', marginBottom: 6 },
  errorText: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 },
  emptyText: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  userCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: '#eef2ff' },
  userCardArchived: { opacity: 0.85, borderColor: '#fde68a' },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  userAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', marginRight: 12 },
  userAvatarText: { fontSize: 14, fontWeight: '800', color: '#111827' },
  userName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  userEmail: { fontSize: 12, color: '#6b7280' },
  userPhone: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  userBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 11, fontWeight: '700' },
  userBadgeActive: { backgroundColor: '#dcfce7', color: '#166534' },
  userBadgeArchived: { backgroundColor: '#fef3c7', color: '#92400e' },
  accountStaff: { backgroundColor: '#eef2ff', color: '#1e40af' },
  accountInstructor: { backgroundColor: '#ecfeff', color: '#0f766e' },
  crmBadge: { backgroundColor: '#ede9fe', color: '#6d28d9' },
  metaRow: { marginTop: 4 },
  footerItem: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginLeft: 6 },
  actionsRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', gap: 8 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8, backgroundColor: '#eef2ff' },
  archiveBtn: { backgroundColor: '#fffbeb' },
  deleteBtn: { backgroundColor: '#fee2e2' },
  editBtnText: { color: '#1a237e', fontSize: 12, fontWeight: '700' },
});


