import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';

type PermissionState = {
  granted: boolean;
  reason?: string;
  expiresAt?: string;
};

const UserDirectPermissionsScreen = ({ navigation, route }: any) => {
  const userId = route?.params?.userId;
  const userName = route?.params?.userName;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [directPermissions, setDirectPermissions] = useState<any[]>([]);
  const [permissionStates, setPermissionStates] = useState<Record<string, PermissionState>>({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const loadData = async () => {
    if (!userId) {
      Alert.alert('خطأ', 'لا يوجد مستخدم محدد');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const [permissionsData, directData, roleData] = await Promise.all([
        AuthService.getAllPermissions(),
        AuthService.getUserDirectPermissions(userId),
        AuthService.getUserRoles(userId),
      ]);

      const permissionsList = Array.isArray(permissionsData) ? permissionsData : [];
      const directList = Array.isArray(directData) ? directData : [];
      const rolesList = Array.isArray(roleData) ? roleData : [];

      setAllPermissions(permissionsList);
      setDirectPermissions(directList);
      setUserRoles(rolesList);

      const initial: Record<string, PermissionState> = {};
      directList.forEach((dp: any) => {
        const id = dp.permission?.id || dp.permissionId;
        if (!id) return;
        initial[id] = {
          granted: !!dp.granted,
          reason: dp.reason || '',
          expiresAt: dp.expiresAt ? new Date(dp.expiresAt).toISOString().slice(0, 10) : '',
        };
      });
      setPermissionStates(initial);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'فشل تحميل الصلاحيات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const rolePermissionIds = useMemo(() => {
    const ids = new Set<string>();
    userRoles.forEach((ur: any) => {
      (ur.role?.rolePermissions || []).forEach((rp: any) => {
        if (rp?.granted && rp?.permission?.id) ids.add(rp.permission.id);
      });
    });
    return ids;
  }, [userRoles]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(allPermissions.map((p: any) => p.category).filter(Boolean))).sort()],
    [allPermissions],
  );

  const filteredPermissions = useMemo(
    () => allPermissions.filter((p: any) => {
      const matchSearch = !search ||
        (p.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.resource || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.action || '').toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'all' || p.category === category;
      return matchSearch && matchCategory;
    }),
    [allPermissions, search, category],
  );

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredPermissions.forEach((p: any) => {
      const key = p.category || 'أخرى';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filteredPermissions]);

  const togglePermission = (permissionId: string) => {
    if (rolePermissionIds.has(permissionId)) return;
    setPermissionStates((prev) => {
      const current = prev[permissionId] || { granted: false, reason: '', expiresAt: '' };
      return {
        ...prev,
        [permissionId]: {
          granted: !current.granted,
          reason: current.reason || '',
          expiresAt: current.expiresAt || '',
        },
      };
    });
  };

  const updateState = (permissionId: string, patch: Partial<PermissionState>) => {
    setPermissionStates((prev) => ({
      ...prev,
      [permissionId]: {
        granted: prev[permissionId]?.granted ?? false,
        reason: prev[permissionId]?.reason || '',
        expiresAt: prev[permissionId]?.expiresAt || '',
        ...patch,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const currentMap = new Map(directPermissions.map((dp: any) => [dp.permission?.id || dp.permissionId, dp]));

      for (const permission of allPermissions) {
        if (rolePermissionIds.has(permission.id)) continue;

        const current = currentMap.get(permission.id);
        const state = permissionStates[permission.id] || { granted: false, reason: '', expiresAt: '' };

        if (state.granted && !current) {
          await AuthService.assignPermissionToUser({
            userId,
            permissionId: permission.id,
            granted: true,
            reason: state.reason?.trim() || undefined,
            expiresAt: state.expiresAt ? `${state.expiresAt}T00:00:00.000Z` : undefined,
          });
          continue;
        }

        if (!state.granted && current) {
          await AuthService.revokePermissionFromUser(userId, permission.id);
          continue;
        }

        if (state.granted && current) {
          const currentReason = current.reason || '';
          const currentDate = current.expiresAt ? new Date(current.expiresAt).toISOString().slice(0, 10) : '';
          if (currentReason !== (state.reason || '') || currentDate !== (state.expiresAt || '')) {
            await AuthService.revokePermissionFromUser(userId, permission.id);
            await AuthService.assignPermissionToUser({
              userId,
              permissionId: permission.id,
              granted: true,
              reason: state.reason?.trim() || undefined,
              expiresAt: state.expiresAt ? `${state.expiresAt}T00:00:00.000Z` : undefined,
            });
          }
        }
      }

      Toast.show({ type: 'success', text1: 'تم حفظ الصلاحيات بنجاح' });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'فشل حفظ الصلاحيات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="Permissions" />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#1a237e" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>الصلاحيات المباشرة</Text>
            <Text style={styles.headerSubtitle}>{userName || 'مستخدم'}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.saveHeaderButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="save" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      <View style={styles.toolsWrap}>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterWrap}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, category === cat && styles.filterChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.filterChipText, category === cat && styles.filterChipTextActive]}>
                {cat === 'all' ? 'الكل' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل الصلاحيات...</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {Object.entries(groupedPermissions).map(([group, perms]) => (
              <View key={group} style={styles.groupCard}>
                <Text style={styles.groupTitle}>{group}</Text>
                <View style={{ gap: 8 }}>
                  {(perms as any[]).map((permission) => {
                    const isFromRole = rolePermissionIds.has(permission.id);
                    const state = permissionStates[permission.id] || { granted: false, reason: '', expiresAt: '' };
                    const granted = isFromRole || state.granted;

                    return (
                      <View
                        key={permission.id}
                        style={[
                          styles.permissionRow,
                          granted && !isFromRole ? styles.permissionRowGranted : null,
                          isFromRole ? styles.permissionRowFromRole : null,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.permissionToggleRow}
                          onPress={() => togglePermission(permission.id)}
                          activeOpacity={0.75}
                        >
                          <Icon
                            name={granted ? 'check-box' : 'check-box-outline-blank'}
                            size={20}
                            color={isFromRole ? '#16a34a' : granted ? '#1a237e' : '#6b7280'}
                          />
                          <View style={{ flex: 1 }}>
                            <View style={styles.permissionNameRow}>
                              <Text style={styles.permissionName}>{permission.displayName || `${permission.resource}.${permission.action}`}</Text>
                              {isFromRole ? (
                                <View style={styles.roleBadge}>
                                  <Text style={styles.roleBadgeText}>من الدور</Text>
                                </View>
                              ) : null}
                            </View>
                            <Text style={styles.permissionMeta}>{permission.resource}.{permission.action}</Text>
                            {!!permission.description && <Text style={styles.permissionDesc}>{permission.description}</Text>}
                          </View>
                        </TouchableOpacity>

                        {!isFromRole && state.granted ? (
                          <View style={styles.extraFieldsWrap}>
                            <TextInput
                              style={styles.extraInput}
                              placeholder="سبب التعيين (اختياري)"
                              placeholderTextColor="#9ca3af"
                              value={state.reason || ''}
                              onChangeText={(v) => updateState(permission.id, { reason: v })}
                            />
                            <TextInput
                              style={styles.extraInput}
                              placeholder="تاريخ الانتهاء YYYY-MM-DD"
                              placeholderTextColor="#9ca3af"
                              value={state.expiresAt || ''}
                              onChangeText={(v) => updateState(permission.id, { expiresAt: v })}
                              autoCapitalize="none"
                            />
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}

            {filteredPermissions.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>لا توجد صلاحيات مطابقة</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {!loading && (
        <TouchableOpacity style={[styles.fab, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="save" size={20} color="#fff" />}
          <Text style={styles.fabText}>حفظ</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UserDirectPermissionsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1a237e' },
  headerSubtitle: { fontSize: 12, color: '#6b7280' },
  saveHeaderButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 10 },
  filterWrap: { gap: 8 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  filterChipActive: { borderColor: '#1a237e', backgroundColor: '#1a237e' },
  filterChipText: { fontSize: 12, color: '#374151', fontWeight: '700' },
  filterChipTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  loadingBox: { paddingVertical: 50, alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: '#6b7280' },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  groupTitle: { fontSize: 14, color: '#1a237e', fontWeight: '800', marginBottom: 8 },
  permissionRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 10,
  },
  permissionRowGranted: { borderColor: '#818cf8', backgroundColor: '#eef2ff' },
  permissionRowFromRole: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  permissionToggleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  permissionNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  permissionName: { fontSize: 13, color: '#111827', fontWeight: '700', flexShrink: 1 },
  roleBadge: {
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeText: { fontSize: 10, color: '#166534', fontWeight: '800' },
  permissionMeta: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  permissionDesc: { fontSize: 12, color: '#4b5563', marginTop: 3 },
  extraFieldsWrap: { marginTop: 10, gap: 8 },
  extraInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#fff',
    color: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, color: '#6b7280' },
  fab: {
    position: 'absolute',
    right: 16,
    left: 16,
    bottom: 20,
    borderRadius: 12,
    backgroundColor: '#1a237e',
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fabText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
