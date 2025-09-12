import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import type { RoleByIdResponse } from '../types/permissions';

const RoleDetailsScreen = ({ navigation, route }: any) => {
  const { id } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<RoleByIdResponse | null>(null);

  const loadRole = async () => {
    try {
      setError(null);
      const data = await AuthService.getRoleById(id);
      setRole(data);
    } catch (e: any) {
      setError(e?.message || 'فشل تحميل بيانات الدور');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRole();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRole();
  };

  const handleAssignRole = async (userId: string) => {
    try {
      await AuthService.assignUserRole(userId, id);
      Alert.alert('نجح', 'تم تعيين الدور للمستخدم بنجاح');
      loadRole(); // إعادة تحميل البيانات
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في تعيين الدور');
    }
  };

  const handleRemoveRole = async (userId: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الدور من المستخدم؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.removeUserRole(userId, id);
              Alert.alert('نجح', 'تم حذف الدور من المستخدم بنجاح');
              loadRole(); // إعادة تحميل البيانات
            } catch (error: any) {
              Alert.alert('خطأ', error.message || 'فشل في حذف الدور');
            }
          }
        }
      ]
    );
  };

  const handleToggleRoleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await AuthService.toggleUserRoleStatus(userId, id, !currentStatus);
      Alert.alert('نجح', `تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} الدور بنجاح`);
      loadRole(); // إعادة تحميل البيانات
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في تغيير حالة الدور');
    }
  };

  const getPermissionVisuals = (action: string, resource?: string) => {
    const a = (action || '').toLowerCase();
    if (a.includes('view') || a === 'read' || a === 'list') {
      return { icon: 'visibility' };
    }
    if (a.includes('create') || a === 'add') {
      return { icon: 'add-circle' };
    }
    if (a.includes('update') || a === 'edit') {
      return { icon: 'edit' };
    }
    if (a.includes('delete') || a === 'remove') {
      return { icon: 'delete' };
    }
    if (a.includes('assign') || a.includes('grant')) {
      return { icon: 'person-add' };
    }
    if (a.includes('manage') || a.includes('admin')) {
      return { icon: 'settings' };
    }
    return { icon: 'key' };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="RoleDetails" />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تفاصيل الدور</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
          </View>
        ) : error ? (
          <View style={[styles.card, styles.errorCard]}>
            <Text style={styles.errorTitle}>حدث خطأ</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : role ? (
          <View style={{ gap: 12 }}>
            <View style={[styles.card, styles.heroCard]}>
              <View style={styles.roleHeader}>
                <View style={[styles.roleAvatar, { backgroundColor: (role.color || '#e8eaf6') + '' }]}>
                  <Icon name={(role.icon as any) || 'shield'} size={22} color="#1a237e" />
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
              {role.description ? (
                <Text style={styles.roleDescription}>{role.description}</Text>
              ) : null}
              <View style={styles.heroFooter}>
                <View style={styles.footerItem}>
                  <Icon name="people" size={16} color="#6b7280" />
                  <Text style={styles.footerText}>المستخدمون: {role._count?.userRoles ?? 0}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Icon name="sort" size={16} color="#6b7280" />
                  <Text style={styles.footerText}>الأولوية: {role.priority}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>الصلاحيات</Text>
              <View style={{ gap: 10 }}>
                {role.rolePermissions.map((rp) => {
                  const visuals = getPermissionVisuals(rp.permission.action, rp.permission.resource);
                  return (
                    <View key={rp.permissionId} style={styles.permissionRow}>
                      <View style={styles.permissionIcon}> 
                        <Icon name={visuals.icon as any} size={18} color="#1a237e" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.permissionTitle}>{rp.permission.displayName || `${rp.permission.resource}.${rp.permission.action}`}</Text>
                        <Text style={styles.permissionSubtitle}>#{rp.permission.resource} · {rp.permission.action}</Text>
                      </View>
                      <Text style={[styles.permissionBadge, rp.granted ? styles.badgeGranted : styles.badgeDenied]}>
                        {rp.granted ? 'مسموح' : 'مرفوض'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>المستخدمون الذين لديهم هذا الدور</Text>
              <View style={{ gap: 10 }}>
                {role.userRoles.map((ur) => (
                  <View key={ur.userId} style={styles.userRow}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{ur.user.name?.slice(0,1)?.toUpperCase() || '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{ur.user.name}</Text>
                      <Text style={styles.userEmail}>{ur.user.email}</Text>
                    </View>
                    <View style={styles.userActions}>
                      <Text style={[styles.userBadge, ur.isActive ? styles.userBadgeActive : styles.userBadgeInactive]}>
                        {ur.isActive ? 'نشط' : 'غير نشط'}
                      </Text>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.toggleButton]}
                          onPress={() => handleToggleRoleStatus(ur.userId, ur.isActive)}
                        >
                          <Icon 
                            name={ur.isActive ? 'pause' : 'play-arrow'} 
                            size={16} 
                            color={ur.isActive ? '#f59e0b' : '#10b981'} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.removeButton]}
                          onPress={() => handleRemoveRole(ur.userId)}
                        >
                          <Icon name="remove" size={16} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default RoleDetailsScreen;

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
  content: {
    flex: 1,
    padding: 16,
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
  heroCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  roleCode: {
    fontSize: 12,
    color: '#6b7280',
  },
  roleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  systemTagChip: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  inactiveTagChip: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
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
  heroFooter: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 10,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  permissionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  permissionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  permissionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeGranted: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
  },
  badgeDenied: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  userBadgeActive: {
    backgroundColor: '#eef2ff',
    color: '#1a237e',
  },
  userBadgeInactive: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  userActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  toggleButton: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
  },
  removeButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
  },
});


