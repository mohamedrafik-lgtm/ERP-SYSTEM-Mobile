import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import type { RoleWithRelations, RolesResponse } from '../types/permissions';

type TabKey = 'overview' | 'roles' | 'permissions' | 'users' | 'logs';

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'overview', label: 'نظرة عامة', icon: 'dashboard' },
  { key: 'roles', label: 'الأدوار', icon: 'admin-panel-settings' },
  { key: 'permissions', label: 'الصلاحيات', icon: 'vpn-key' },
  { key: 'users', label: 'المستخدمون', icon: 'group' },
  { key: 'logs', label: 'السجل', icon: 'history' },
];

const PermissionsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [roles, setRoles] = useState<RolesResponse>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  const [roleSearch, setRoleSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'system' | 'active' | 'inactive'>('all');

  const [permissionSearch, setPermissionSearch] = useState('');
  const [permissionCategory, setPermissionCategory] = useState('all');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  const loadData = async () => {
    try {
      setError(null);

      const [rolesData, permissionsData, usersData, statsData] = await Promise.all([
        AuthService.getRoles(),
        AuthService.getAllPermissions(),
        AuthService.getUsers(),
        AuthService.getPermissionStats(),
      ]);

      const sortedRoles = [...rolesData].sort((a: RoleWithRelations, b: RoleWithRelations) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.displayName.localeCompare(b.displayName, 'ar');
      });

      setRoles(sortedRoles);
      setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setStats(statsData || null);

      try {
        const logsData = await AuthService.getPermissionLogs({ limit: 50, offset: 0 });
        setLogs(Array.isArray(logsData) ? logsData : []);
      } catch {
        setLogs([]);
      }
    } catch (e: any) {
      setError(e?.message || 'فشل تحميل بيانات الصلاحيات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredRoles = useMemo(
    () =>
      roles.filter((r) => {
        const text = roleSearch.trim().toLowerCase();
        const matchSearch =
          !text ||
          r.displayName.toLowerCase().includes(text) ||
          r.name.toLowerCase().includes(text);

        const matchFilter =
          roleFilter === 'all'
            ? true
            : roleFilter === 'system'
              ? r.isSystem
              : roleFilter === 'active'
                ? r.isActive
                : !r.isActive;

        return matchSearch && matchFilter;
      }),
    [roles, roleSearch, roleFilter],
  );

  const permissionCategories = useMemo(
    () => ['all', ...Array.from(new Set(permissions.map((p: any) => p.category).filter(Boolean))).sort()],
    [permissions],
  );

  const filteredPermissions = useMemo(
    () =>
      permissions.filter((p: any) => {
        const text = permissionSearch.trim().toLowerCase();
        const matchSearch =
          !text ||
          (p.displayName || '').toLowerCase().includes(text) ||
          (p.resource || '').toLowerCase().includes(text) ||
          (p.action || '').toLowerCase().includes(text);

        const matchCategory = permissionCategory === 'all' || p.category === permissionCategory;

        return matchSearch && matchCategory;
      }),
    [permissions, permissionSearch, permissionCategory],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter((u: any) => {
        const text = userSearch.trim().toLowerCase();
        const matchSearch =
          !text ||
          (u.name || '').toLowerCase().includes(text) ||
          (u.email || '').toLowerCase().includes(text) ||
          (u.phone || '').includes(text);

        const matchRole =
          userRoleFilter === 'all' ||
          (u.userRoles || []).some((ur: any) => ur.role?.name === userRoleFilter);

        return matchSearch && matchRole;
      }),
    [users, userSearch, userRoleFilter],
  );

  const userRoleOptions = useMemo(() => ['all', ...roles.map((r) => r.name)], [roles]);

  const removeRole = (role: RoleWithRelations) => {
    if (role.isSystem) {
      Alert.alert('تنبيه', 'لا يمكن حذف الأدوار النظامية');
      return;
    }

    Alert.alert('تأكيد', `هل تريد حذف الدور "${role.displayName}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.deleteRole(role.id);
            onRefresh();
          } catch (e: any) {
            Alert.alert('خطأ', e?.message || 'فشل حذف الدور');
          }
        },
      },
    ]);
  };

  const removePermission = (permission: any) => {
    if (permission?.isSystem) {
      Alert.alert('تنبيه', 'لا يمكن حذف صلاحية نظامية');
      return;
    }

    Alert.alert('تأكيد', `هل تريد حذف الصلاحية "${permission.displayName}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.deletePermission(permission.id);
            onRefresh();
          } catch (e: any) {
            Alert.alert('خطأ', e?.message || 'فشل حذف الصلاحية');
          }
        },
      },
    ]);
  };

  const renderOverview = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.headerIconWrap}>
            <Icon name="dashboard" size={22} color="#1a237e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>نظرة عامة</Text>
            <Text style={styles.heroSubtitle}>ملخص شامل لإدارة الأدوار والصلاحيات</Text>
          </View>
        </View>

        <View style={styles.heroStatsRow}>
          <View style={styles.statPill}>
            <Icon name="admin-panel-settings" size={16} color="#1a237e" />
            <Text style={styles.statPillText}>الأدوار: {roles.length}</Text>
          </View>
          <View style={styles.statPill}>
            <Icon name="vpn-key" size={16} color="#1a237e" />
            <Text style={styles.statPillText}>الصلاحيات: {permissions.length}</Text>
          </View>
          <View style={styles.statPill}>
            <Icon name="group" size={16} color="#1a237e" />
            <Text style={styles.statPillText}>المستخدمون: {users.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>إجمالي الأدوار</Text>
          <Text style={styles.overviewValue}>{stats?.totalRoles ?? roles.length}</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>الأدوار النشطة</Text>
          <Text style={styles.overviewValue}>{stats?.activeRoles ?? roles.filter((r) => r.isActive).length}</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>إجمالي الصلاحيات</Text>
          <Text style={styles.overviewValue}>{stats?.totalPermissions ?? permissions.length}</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>إجمالي المستخدمين</Text>
          <Text style={styles.overviewValue}>{stats?.totalUsers ?? users.length}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>مؤشرات سريعة</Text>
        <Text style={styles.overviewInfoLine}>الأدوار النظامية: {roles.filter((r) => r.isSystem).length}</Text>
        <Text style={styles.overviewInfoLine}>الأدوار غير المفعلة: {roles.filter((r) => !r.isActive).length}</Text>
        <Text style={styles.overviewInfoLine}>الصلاحيات المصنفة: {Math.max(0, permissionCategories.length - 1)}</Text>
      </View>
    </>
  );

  const renderRoles = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.headerIconWrap}>
            <Icon name="admin-panel-settings" size={22} color="#1a237e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>الأدوار</Text>
            <Text style={styles.heroSubtitle}>إدارة أدوار المستخدمين</Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('CreateEditRole')}>
            <Icon name="add" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>دور جديد</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث بالاسم أو الكود..."
              placeholderTextColor="#9ca3af"
              value={roleSearch}
              onChangeText={setRoleSearch}
            />
          </View>
        </View>

        <View style={styles.filterGroup}>
          {(['all', 'system', 'active', 'inactive'] as const).map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => setRoleFilter(key)}
              style={[styles.filterChip, roleFilter === key && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, roleFilter === key && styles.filterChipTextActive]}>
                {key === 'all' ? 'الكل' : key === 'system' ? 'نظامي' : key === 'active' ? 'مُفعل' : 'غير مُفعل'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.roleGrid}>
        {filteredRoles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={styles.roleCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('RoleDetails', { id: role.id })}
          >
            <View style={styles.roleHeader}>
              <View style={[styles.roleAvatar, { backgroundColor: role.color || '#e8eaf6' }]}>
                <Icon name={(role.icon as any) || 'admin-panel-settings'} size={20} color="#1a237e" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleName}>{role.displayName}</Text>
                <Text style={styles.roleCode}>#{role.name}</Text>
              </View>
              <View style={styles.roleMeta}>
                {role.isSystem ? (
                  <View style={[styles.tagChip, styles.systemTagChip]}>
                    <Icon name="verified" size={14} color="#1d4ed8" />
                    <Text style={[styles.tagChipText, { color: '#1d4ed8' }]}>نظامي</Text>
                  </View>
                ) : null}
                {!role.isActive ? (
                  <View style={[styles.tagChip, styles.inactiveTagChip]}>
                    <Icon name="pause-circle" size={14} color="#dc2626" />
                    <Text style={[styles.tagChipText, { color: '#dc2626' }]}>غير مُفعل</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {!!role.description && <Text style={styles.roleDescription}>{role.description}</Text>}

            <View style={styles.roleFooter}>
              <View style={styles.footerItem}>
                <Icon name="people" size={16} color="#6b7280" />
                <Text style={styles.footerText}>{role._count?.userRoles ?? 0}</Text>
              </View>
              <View style={styles.footerItem}>
                <Icon name="key" size={16} color="#6b7280" />
                <Text style={styles.footerText}>{role.rolePermissions?.length ?? 0}</Text>
              </View>
              <View style={styles.footerActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('CreateEditRole', { role })}>
                  <Icon name="edit" size={16} color="#1a237e" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() =>
                    navigation.navigate('ManageRolePermissions', {
                      roleId: role.id,
                      roleName: role.displayName,
                    })
                  }
                >
                  <Icon name="vpn-key" size={16} color="#1a237e" />
                </TouchableOpacity>
                {!role.isSystem && (
                  <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => removeRole(role)}>
                    <Icon name="delete" size={16} color="#dc2626" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {filteredRoles.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا توجد أدوار مطابقة لمرشحات البحث</Text>
        </View>
      )}
    </>
  );

  const renderPermissions = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.headerIconWrap}>
            <Icon name="vpn-key" size={22} color="#1a237e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>الصلاحيات</Text>
            <Text style={styles.heroSubtitle}>إدارة صلاحيات النظام</Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('AddPermission')}>
            <Icon name="add" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>صلاحية جديدة</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث في الصلاحيات..."
              placeholderTextColor="#9ca3af"
              value={permissionSearch}
              onChangeText={setPermissionSearch}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterGroup}>
          {permissionCategories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setPermissionCategory(category)}
              style={[styles.filterChip, permissionCategory === category && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, permissionCategory === category && styles.filterChipTextActive]}>
                {category === 'all' ? 'الكل' : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.permissionList}>
        {filteredPermissions.map((permission) => (
          <View key={permission.id} style={styles.permissionItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionName}>{permission.displayName || `${permission.resource}.${permission.action}`}</Text>
              <Text style={styles.permissionMeta}>{permission.resource}.{permission.action}</Text>
              {!!permission.description && <Text style={styles.permissionDesc}>{permission.description}</Text>}
            </View>
            <View style={styles.footerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddPermission', { permission })}>
                <Icon name="edit" size={16} color="#1a237e" />
              </TouchableOpacity>
              {!permission.isSystem && (
                <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => removePermission(permission)}>
                  <Icon name="delete" size={16} color="#dc2626" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {filteredPermissions.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا توجد صلاحيات مطابقة</Text>
        </View>
      )}
    </>
  );

  const renderUsers = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.headerIconWrap}>
            <Icon name="group" size={22} color="#1a237e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>المستخدمون</Text>
            <Text style={styles.heroSubtitle}>تعيين الأدوار والصلاحيات والوصول للبرامج</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث في المستخدمين..."
              placeholderTextColor="#9ca3af"
              value={userSearch}
              onChangeText={setUserSearch}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterGroup}>
          {userRoleOptions.map((roleName) => (
            <TouchableOpacity
              key={roleName}
              onPress={() => setUserRoleFilter(roleName)}
              style={[styles.filterChip, userRoleFilter === roleName && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, userRoleFilter === roleName && styles.filterChipTextActive]}>
                {roleName === 'all' ? 'كل الأدوار' : roles.find((r) => r.name === roleName)?.displayName || roleName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.usersList}>
        {filteredUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{user.name?.slice(0, 1)?.toUpperCase() || '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{user.name || 'بدون اسم'}</Text>
                <Text style={styles.userEmail}>{user.email || '-'}</Text>
              </View>
              <Text style={[styles.userBadge, user.isActive ? styles.userBadgeActive : styles.userBadgeInactive]}>
                {user.isActive ? 'نشط' : 'غير نشط'}
              </Text>
            </View>

            <View style={styles.userRoleWrap}>
              {(user.userRoles || []).length > 0 ? (
                (user.userRoles || []).slice(0, 3).map((ur: any) => (
                  <View key={`${user.id}-${ur.roleId}`} style={styles.userRoleChip}>
                    <Text style={styles.userRoleChipText}>{ur.role?.displayName || ur.role?.name || 'دور'}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.userNoRole}>لا توجد أدوار</Text>
              )}
            </View>

            <View style={styles.userActionsRow}>
              <TouchableOpacity
                style={styles.userActionBtn}
                onPress={() => navigation.navigate('UserRoleAssignment', { userId: user.id, userName: user.name })}
              >
                <Icon name="admin-panel-settings" size={16} color="#1a237e" />
                <Text style={styles.userActionText}>الأدوار</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.userActionBtn}
                onPress={() => navigation.navigate('UserDirectPermissions', { userId: user.id, userName: user.name })}
              >
                <Icon name="vpn-key" size={16} color="#1a237e" />
                <Text style={styles.userActionText}>الصلاحيات</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.userActionBtn}
                onPress={() => navigation.navigate('UserProgramAccess', { userId: user.id, userName: user.name })}
              >
                <Icon name="school" size={16} color="#1a237e" />
                <Text style={styles.userActionText}>البرامج</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {filteredUsers.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا توجد نتائج مستخدمين</Text>
        </View>
      )}
    </>
  );

  const renderLogs = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.headerIconWrap}>
            <Icon name="history" size={22} color="#1a237e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>سجل الأنشطة</Text>
            <Text style={styles.heroSubtitle}>آخر التغييرات المرتبطة بالأدوار والصلاحيات</Text>
          </View>
        </View>
      </View>

      <View style={styles.logsList}>
        {logs.map((log, idx) => (
          <View key={log.id || idx} style={styles.logItem}>
            <View style={styles.logIconWrap}>
              <Icon name="event-note" size={16} color="#1a237e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>{log.action || log.event || 'نشاط'}</Text>
              <Text style={styles.logDetails}>{log.details || log.description || '-'}</Text>
              <Text style={styles.logMeta}>
                {(log.user?.name || log.actorName || log.userName || 'النظام')} ·{' '}
                {new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString('ar-SA')}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {logs.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا توجد سجلات متاحة حاليا</Text>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="Permissions" />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة الأدوار والصلاحيات</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Icon name={tab.icon} size={16} color={activeTab === tab.key ? '#fff' : '#1a237e'} />
              <Text style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل بيانات الصلاحيات...</Text>
          </View>
        ) : error ? (
          <View style={[styles.card, styles.errorCard]}>
            <Text style={styles.errorTitle}>حدث خطأ</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.section}>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'roles' && renderRoles()}
            {activeTab === 'permissions' && renderPermissions()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'logs' && renderLogs()}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default PermissionsScreen;

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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  placeholder: {
    width: 44,
  },
  tabsWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ff',
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tabButtonActive: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a237e',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#6b7280',
  },
  errorCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8eaf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  statPillText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '700',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  overviewValue: {
    fontSize: 21,
    color: '#111827',
    fontWeight: '800',
    marginTop: 4,
  },
  overviewInfoLine: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a237e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  searchRow: {
    marginTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  filterChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  roleGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eef2ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  roleCode: {
    fontSize: 12,
    color: '#6b7280',
  },
  roleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  systemTagChip: {
    backgroundColor: '#dbeafe',
  },
  inactiveTagChip: {
    backgroundColor: '#fee2e2',
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  roleDescription: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  roleFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },
  iconBtnDanger: {
    backgroundColor: '#fee2e2',
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 18,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
  },
  permissionList: {
    gap: 10,
  },
  permissionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  permissionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  permissionMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  permissionDesc: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 4,
  },
  usersList: {
    gap: 10,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3730a3',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  userBadge: {
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  userBadgeActive: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  userBadgeInactive: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  userRoleWrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  userRoleChip: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  userRoleChipText: {
    fontSize: 11,
    color: '#3730a3',
    fontWeight: '700',
  },
  userNoRole: {
    fontSize: 12,
    color: '#6b7280',
  },
  userActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  userActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 10,
    paddingVertical: 8,
  },
  userActionText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '700',
  },
  logsList: {
    gap: 10,
  },
  logItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  logIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  logDetails: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
  },
  logMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
});
