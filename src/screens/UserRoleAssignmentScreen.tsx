import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';

const UserRoleAssignmentScreen = ({ navigation, route }: any) => {
  const userId = route?.params?.userId;
  const userName = route?.params?.userName;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [expiresByRole, setExpiresByRole] = useState<Record<string, string>>({});

  const loadData = async () => {
    if (!userId) {
      Alert.alert('خطأ', 'لا يوجد مستخدم محدد');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const [rolesData, userRolesData] = await Promise.all([
        AuthService.getRoles(),
        AuthService.getUserRoles(userId),
      ]);

      setRoles(Array.isArray(rolesData) ? rolesData : []);
      const activeUserRoles = (Array.isArray(userRolesData) ? userRolesData : []).filter((ur: any) => ur.isActive !== false);
      setUserRoles(activeUserRoles);
      setSelectedRoleIds(activeUserRoles.map((ur: any) => ur.roleId));

      const expiresMap: Record<string, string> = {};
      activeUserRoles.forEach((ur: any) => {
        if (ur.expiresAt) {
          expiresMap[ur.roleId] = new Date(ur.expiresAt).toISOString().slice(0, 10);
        }
      });
      setExpiresByRole(expiresMap);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const currentRoleIds = useMemo(() => userRoles.map((ur: any) => ur.roleId), [userRoles]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const rolesToAdd = selectedRoleIds.filter((roleId) => !currentRoleIds.includes(roleId));
      const rolesToRemove = currentRoleIds.filter((roleId) => !selectedRoleIds.includes(roleId));

      for (const roleId of rolesToAdd) {
        const expiresAt = expiresByRole[roleId]?.trim();
        await AuthService.assignRoleToUser({
          userId,
          roleId,
          expiresAt: expiresAt ? `${expiresAt}T00:00:00.000Z` : undefined,
        });
      }

      for (const roleId of rolesToRemove) {
        await AuthService.removeUserRole(userId, roleId);
      }

      Toast.show({ type: 'success', text1: 'تم حفظ الأدوار بنجاح' });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'فشل حفظ الأدوار');
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
            <Text style={styles.headerTitle}>تعيين أدوار المستخدم</Text>
            <Text style={styles.headerSubtitle}>{userName || 'مستخدم'}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.saveHeaderButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="save" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل الأدوار...</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {roles.map((role) => {
              const selected = selectedRoleIds.includes(role.id);
              return (
                <TouchableOpacity
                  key={role.id}
                  style={[styles.roleCard, selected && styles.roleCardSelected]}
                  activeOpacity={0.8}
                  onPress={() => toggleRole(role.id)}
                >
                  <View style={styles.roleRow}>
                    <Icon name={selected ? 'check-box' : 'check-box-outline-blank'} size={20} color={selected ? '#1a237e' : '#6b7280'} />
                    <View style={[styles.roleAvatar, { backgroundColor: role.color || '#e8eaf6' }]}>
                      <Icon name={(role.icon as any) || 'admin-panel-settings'} size={18} color="#1a237e" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roleName}>{role.displayName}</Text>
                      <Text style={styles.roleCode}>#{role.name}</Text>
                    </View>
                    {role.isSystem ? (
                      <View style={styles.systemBadge}>
                        <Text style={styles.systemBadgeText}>نظامي</Text>
                      </View>
                    ) : null}
                  </View>

                  {selected ? (
                    <View style={styles.expireWrap}>
                      <Text style={styles.expireLabel}>تاريخ انتهاء الدور (اختياري) YYYY-MM-DD</Text>
                      <TextInput
                        style={styles.expireInput}
                        placeholder="2026-12-31"
                        placeholderTextColor="#9ca3af"
                        value={expiresByRole[role.id] || ''}
                        onChangeText={(v) => setExpiresByRole((prev) => ({ ...prev, [role.id]: v }))}
                        autoCapitalize="none"
                      />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
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

export default UserRoleAssignmentScreen;

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
  content: { flex: 1, padding: 16 },
  loadingBox: { paddingVertical: 50, alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: '#6b7280' },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  roleCardSelected: {
    borderColor: '#818cf8',
    backgroundColor: '#eef2ff',
  },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleName: { fontSize: 14, color: '#111827', fontWeight: '700' },
  roleCode: { fontSize: 12, color: '#6b7280' },
  systemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
  },
  systemBadgeText: { fontSize: 11, color: '#1d4ed8', fontWeight: '700' },
  expireWrap: { marginTop: 10 },
  expireLabel: { fontSize: 12, color: '#4b5563', marginBottom: 6 },
  expireInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#fff',
    color: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
  },
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
