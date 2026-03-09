import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput, Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import type { RoleByIdResponse, PermissionItem } from '../types/permissions';

const ManageRolePermissionsScreen = ({ navigation, route }: any) => {
  const { roleId, roleName } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState<RoleByIdResponse | null>(null);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [grantedMap, setGrantedMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadData = async () => {
    try {
      const [roleData, permsData] = await Promise.all([
        AuthService.getRoleById(roleId),
        AuthService.getAllPermissions(),
      ]);
      setRole(roleData);
      setAllPermissions(permsData);

      // Build granted map from role's current permissions
      const map: Record<string, boolean> = {};
      (roleData.rolePermissions || []).forEach((rp) => {
        map[rp.permissionId] = rp.granted;
      });
      setGrantedMap(map);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [roleId]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  // Group permissions by category
  const categories = useMemo(() => {
    const catSet = new Set<string>();
    allPermissions.forEach((p) => { if (p.category) catSet.add(p.category); });
    return ['all', ...Array.from(catSet).sort()];
  }, [allPermissions]);

  const filteredPermissions = useMemo(() => {
    return allPermissions.filter((p) => {
      const matchSearch = !search ||
        p.displayName.toLowerCase().includes(search.toLowerCase()) ||
        p.resource.toLowerCase().includes(search.toLowerCase()) ||
        p.action.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [allPermissions, search, selectedCategory]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {};
    filteredPermissions.forEach((p) => {
      const cat = p.category || 'أخرى';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [filteredPermissions]);

  const togglePermission = (permId: string) => {
    setGrantedMap((prev) => ({ ...prev, [permId]: !prev[permId] }));
  };

  const selectAllInCategory = (perms: PermissionItem[], grant: boolean) => {
    setGrantedMap((prev) => {
      const next = { ...prev };
      perms.forEach((p) => { next[p.id] = grant; });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const permissions = Object.entries(grantedMap)
        .filter(([_, granted]) => granted)
        .map(([permissionId]) => ({ permissionId, granted: true }));

      // Also include explicitly revoked ones
      allPermissions.forEach((p) => {
        if (!grantedMap[p.id]) {
          // Only include if it was previously granted (to revoke it)
          const wasGranted = role?.rolePermissions?.some(rp => rp.permissionId === p.id && rp.granted);
          if (wasGranted) {
            permissions.push({ permissionId: p.id, granted: false });
          }
        }
      });

      await AuthService.assignPermissionsToRole(roleId, { permissions });
      Toast.show({ type: 'success', text1: 'نجح', text2: 'تم تحديث صلاحيات الدور بنجاح' });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في حفظ الصلاحيات');
    } finally {
      setSaving(false);
    }
  };

  const grantedCount = Object.values(grantedMap).filter(Boolean).length;

  const getActionIcon = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('view') || a === 'read') return 'visibility';
    if (a.includes('create') || a === 'add') return 'add-circle';
    if (a.includes('edit') || a === 'update') return 'edit';
    if (a.includes('delete') || a === 'remove') return 'delete';
    if (a.includes('manage')) return 'settings';
    if (a.includes('export')) return 'file-download';
    if (a.includes('transfer')) return 'swap-horiz';
    return 'key';
  };

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('view')) return '#3b82f6';
    if (a.includes('create')) return '#10b981';
    if (a.includes('edit')) return '#f59e0b';
    if (a.includes('delete')) return '#ef4444';
    if (a.includes('manage')) return '#8b5cf6';
    if (a.includes('export')) return '#06b6d4';
    return '#6b7280';
  };

  const categoryLabels: Record<string, string> = {
    all: 'الكل',
    dashboard: 'لوحة التحكم',
    academic: 'أكاديمي',
    financial: 'مالي',
    marketing: 'تسويق',
    system: 'النظام',
    attendance: 'الحضور',
    exams: 'الامتحانات',
    general: 'عام',
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="ManageRolePermissions" />
          <Text style={styles.headerTitle}>إدارة صلاحيات الدور</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل الصلاحيات...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="ManageRolePermissions" />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>إدارة الصلاحيات</Text>
            <Text style={styles.headerSubtitle}>{roleName || role?.displayName}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.saveHeaderButton, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="save" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Icon name="check-circle" size={16} color="#059669" />
          <Text style={styles.statText}>ممنوحة: {grantedCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="layers" size={16} color="#6b7280" />
          <Text style={styles.statText}>إجمالي: {allPermissions.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث في الصلاحيات..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
              {categoryLabels[cat] || cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedPermissions).map(([category, perms]) => (
          <View key={category} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{categoryLabels[category] || category}</Text>
              <View style={styles.groupActions}>
                <TouchableOpacity
                  style={styles.groupActionButton}
                  onPress={() => selectAllInCategory(perms, true)}
                >
                  <Text style={styles.groupActionText}>تحديد الكل</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.groupActionButton}
                  onPress={() => selectAllInCategory(perms, false)}
                >
                  <Text style={[styles.groupActionText, { color: '#dc2626' }]}>إلغاء الكل</Text>
                </TouchableOpacity>
              </View>
            </View>
            {perms.map((perm) => (
              <TouchableOpacity
                key={perm.id}
                style={[styles.permRow, grantedMap[perm.id] && styles.permRowGranted]}
                onPress={() => togglePermission(perm.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.permIcon, { backgroundColor: getActionColor(perm.action) + '20' }]}>
                  <Icon name={getActionIcon(perm.action)} size={18} color={getActionColor(perm.action)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.permName}>
                    {perm.displayName || `${perm.resource}.${perm.action}`}
                  </Text>
                  <Text style={styles.permMeta}>{perm.resource} · {perm.action}</Text>
                </View>
                <Switch
                  value={!!grantedMap[perm.id]}
                  onValueChange={() => togglePermission(perm.id)}
                  trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
                  thumbColor={grantedMap[perm.id] ? '#1a237e' : '#9ca3af'}
                />
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Save Button */}
      <TouchableOpacity
        style={[styles.fab, saving && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? <ActivityIndicator size="small" color="#fff" /> : (
          <>
            <Icon name="save" size={22} color="#fff" />
            <Text style={styles.fabText}>حفظ ({grantedCount})</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ManageRolePermissionsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backButton: {
    padding: 8, marginRight: 12, borderRadius: 8,
    backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#1a237e',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a237e' },
  headerSubtitle: { fontSize: 13, color: '#6b7280' },
  placeholder: { width: 44 },
  saveHeaderButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a237e',
    alignItems: 'center', justifyContent: 'center',
  },
  statsBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 16,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  categoryScroll: { maxHeight: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  categoryContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  categoryChipActive: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
  categoryChipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  categoryChipTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 14, color: '#6b7280' },
  groupCard: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  groupTitle: { fontSize: 14, fontWeight: '700', color: '#1a237e' },
  groupActions: { flexDirection: 'row', gap: 12 },
  groupActionButton: { paddingVertical: 2 },
  groupActionText: { fontSize: 12, color: '#1a237e', fontWeight: '600' },
  permRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12,
  },
  permRowGranted: { backgroundColor: '#f0fdf4' },
  permIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  permName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  permMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  fab: {
    position: 'absolute', bottom: 24, right: 20, left: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1a237e', borderRadius: 14, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
  fabText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
