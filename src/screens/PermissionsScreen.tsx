import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import type { RolesResponse, RoleWithRelations } from '../types/permissions';

const PermissionsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RolesResponse>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'system' | 'active' | 'inactive'>('all');

  const loadRoles = async () => {
    try {
      setError(null);
      const data = await AuthService.getRoles();
      // sort by priority ASC then displayName
      const sorted = [...data].sort((a: RoleWithRelations, b: RoleWithRelations) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.displayName.localeCompare(b.displayName, 'ar');
      });
      setRoles(sorted);
    } catch (e: any) {
      setError(e?.message || 'فشل تحميل الأدوار');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRoles();
  };

  const filtered = roles.filter((r) => {
    const matchSearch =
      !search ||
      r.displayName.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true : filter === 'system' ? r.isSystem : filter === 'active' ? r.isActive : !r.isActive;
    return matchSearch && matchFilter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="Permissions" />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الصلاحيات</Text>
        </View>
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
            <Text style={styles.loadingText}>جاري تحميل الأدوار...</Text>
          </View>
        ) : error ? (
          <View style={[styles.card, styles.errorCard]}>
            <Text style={styles.errorTitle}>حدث خطأ</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.headerIconWrap}>
                  <Icon name="lock" size={22} color="#1a237e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>الأدوار والصلاحيات</Text>
                  <Text style={styles.heroSubtitle}>إدارة وصول المستخدمين داخل النظام</Text>
                </View>
              </View>
              <View style={styles.heroStatsRow}>
                <View style={styles.statPill}>
                  <Icon name="layers" size={16} color="#1a237e" />
                  <Text style={styles.statPillText}>الأدوار: {roles.length}</Text>
                </View>
                <View style={styles.statPill}>
                  <Icon name="verified" size={16} color="#1a237e" />
                  <Text style={styles.statPillText}>النظامية: {roles.filter(r => r.isSystem).length}</Text>
                </View>
                <View style={styles.statPill}>
                  <Icon name="check-circle" size={16} color="#1a237e" />
                  <Text style={styles.statPillText}>المفعلة: {roles.filter(r => r.isActive).length}</Text>
                </View>
              </View>
              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <Icon name="search" size={18} color="#6b7280" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="ابحث بالاسم أو الكود..."
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>
                <View style={styles.filterGroup}>
                  {(['all','system','active','inactive'] as const).map((key) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setFilter(key)}
                      style={[styles.filterChip, filter === key && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}>
                        {key === 'all' ? 'الكل' : key === 'system' ? 'نظامي' : key === 'active' ? 'مُفعل' : 'غير مُفعل'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.roleGrid}>
              {filtered.map((role) => (
                <TouchableOpacity key={role.id} style={styles.roleCard} activeOpacity={0.9} onPress={() => navigation.navigate('RoleDetails', { id: role.id })}>
                  <View style={styles.roleHeader}>
                    <View style={[styles.roleAvatar, { backgroundColor: (role.color || '#e8eaf6') + '' }]}> 
                      <Icon name={(role.icon as any) || 'admin-panel-settings'} size={20} color="#1a237e" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roleName}>{role.displayName}</Text>
                      <Text style={styles.roleCode}>#{role.name}</Text>
                    </View>
                    <View style={styles.roleMeta}>
                      <View style={styles.metaChip}>
                        <Icon name="people" size={14} color="#374151" />
                        <Text style={styles.metaChipText}>{role._count?.userRoles ?? 0}</Text>
                      </View>
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
                  <View style={styles.roleFooter}>
                    <View style={styles.footerItem}>
                      <Icon name="key" size={16} color="#6b7280" />
                      <Text style={styles.footerText}>صلاحيات: {role.rolePermissions?.length ?? 0}</Text>
                    </View>
                    <View style={styles.footerItem}>
                      <Icon name="sort" size={16} color="#6b7280" />
                      <Text style={styles.footerText}>الأولوية: {role.priority}</Text>
                    </View>
                    <Text style={styles.link}>التفاصيل</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8eaf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  // Hero section + search/filter styles (previously missing)
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
    gap: 8,
    marginBottom: 12,
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
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
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
  roleGrid: {
    flexDirection: 'column',
    gap: 12,
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
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
  },
  metaChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
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
  link: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});


