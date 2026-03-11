import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Switch, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {usePermissions} from '../hooks/usePermissions';
import type {
  StaffAttendanceEnrollment, StaffAttendanceZone, UpdateEnrollmentDto,
} from '../types/staffAttendance';

const DAYS_OF_WEEK = [
  {key: 'SUNDAY', label: 'الأحد'},
  {key: 'MONDAY', label: 'الإثنين'},
  {key: 'TUESDAY', label: 'الثلاثاء'},
  {key: 'WEDNESDAY', label: 'الأربعاء'},
  {key: 'THURSDAY', label: 'الخميس'},
  {key: 'FRIDAY', label: 'الجمعة'},
  {key: 'SATURDAY', label: 'السبت'},
];

const StaffAttendanceEmployeesScreen = ({navigation}: any) => {
  const {hasPermission} = usePermissions();
  const canManageEnrollments = hasPermission('staff-attendance.enrollments', 'manage');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollments, setEnrollments] = useState<StaffAttendanceEnrollment[]>([]);
  const [zones, setZones] = useState<StaffAttendanceZone[]>([]);
  const [search, setSearch] = useState('');

  // Bulk enroll modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Edit schedule modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<StaffAttendanceEnrollment | null>(null);
  const [editForm, setEditForm] = useState<UpdateEnrollmentDto>({});
  const [saving, setSaving] = useState(false);
  const [useCustomSchedule, setUseCustomSchedule] = useState(false);
  const [usePerDaySchedule, setUsePerDaySchedule] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [enrollData, zonesData] = await Promise.all([
        AuthService.getStaffEnrollments(true).catch(() => []),
        AuthService.getStaffZones().catch(() => []),
      ]);
      setEnrollments(Array.isArray(enrollData) ? enrollData : []);
      setZones(Array.isArray(zonesData) ? zonesData : []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ===== Bulk Enroll =====
  const openBulkEnroll = async () => {
    setShowBulkModal(true);
    setSelectedUserIds([]);
    setUserSearch('');
    if (allUsers.length === 0) {
      setLoadingUsers(true);
      try {
        const users = await AuthService.getUsers();
        setAllUsers(Array.isArray(users) ? users : []);
      } catch {
        setAllUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  const enrolledUserIds = new Set(enrollments.map(e => e.userId));

  const filteredUsers = allUsers.filter(u => {
    if (enrolledUserIds.has(u.id)) return false;
    if (!userSearch) return true;
    return u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
  });

  const toggleUserSelection = (id: string) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const handleBulkEnroll = async () => {
    if (selectedUserIds.length === 0) {
      Alert.alert('تنبيه', 'يرجى اختيار موظف واحد على الأقل');
      return;
    }
    setEnrolling(true);
    try {
      await AuthService.bulkEnrollStaff({userIds: selectedUserIds});
      Toast.show({type: 'success', text1: 'تم التسجيل', text2: `تم تسجيل ${selectedUserIds.length} موظف`});
      setShowBulkModal(false);
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل التسجيل');
    } finally {
      setEnrolling(false);
    }
  };

  // ===== Edit Schedule =====
  const openEditSchedule = (enr: StaffAttendanceEnrollment) => {
    setEditingEnrollment(enr);
    const hasCustomTime = !!(enr.customWorkStartTime || enr.customWorkEndTime);
    const hasPerDay = !!(enr.customDaySchedules && Object.keys(enr.customDaySchedules).length > 0);
    setUseCustomSchedule(hasCustomTime || hasPerDay);
    setUsePerDaySchedule(hasPerDay);
    setEditForm({
      isActive: enr.isActive,
      customWorkStartTime: enr.customWorkStartTime || '',
      customWorkEndTime: enr.customWorkEndTime || '',
      customWorkHoursPerDay: enr.customWorkHoursPerDay || 0,
      customLateThresholdMinutes: enr.customLateThresholdMinutes || 0,
      customEarlyLeaveThresholdMinutes: enr.customEarlyLeaveThresholdMinutes || 0,
      customDaySchedules: enr.customDaySchedules || {},
      allowGlobalZones: enr.allowGlobalZones ?? true,
      zoneIds: enr.zoneIds || [],
    });
    setShowEditModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!editingEnrollment) return;
    setSaving(true);
    try {
      const data: UpdateEnrollmentDto = {
        isActive: editForm.isActive,
        allowGlobalZones: editForm.allowGlobalZones,
        zoneIds: editForm.zoneIds,
      };
      if (useCustomSchedule) {
        if (usePerDaySchedule) {
          data.customDaySchedules = editForm.customDaySchedules;
        } else {
          data.customWorkStartTime = editForm.customWorkStartTime;
          data.customWorkEndTime = editForm.customWorkEndTime;
          data.customWorkHoursPerDay = editForm.customWorkHoursPerDay;
        }
        data.customLateThresholdMinutes = editForm.customLateThresholdMinutes;
        data.customEarlyLeaveThresholdMinutes = editForm.customEarlyLeaveThresholdMinutes;
      }
      await AuthService.updateEnrollment(editingEnrollment.userId, data);
      Toast.show({type: 'success', text1: 'تم الحفظ', text2: 'تم تحديث جدول الموظف'});
      setShowEditModal(false);
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (enr: StaffAttendanceEnrollment) => {
    try {
      await AuthService.updateEnrollment(enr.userId, {isActive: !enr.isActive});
      Toast.show({type: 'success', text1: enr.isActive ? 'تم التعطيل' : 'تم التفعيل'});
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل التحديث');
    }
  };

  const handleUnenroll = (enr: StaffAttendanceEnrollment) => {
    Alert.alert('تأكيد الإزالة', `هل تريد إزالة "${enr.user.name}" من نظام الحضور؟`, [
      {text: 'إلغاء', style: 'cancel'},
      {
        text: 'إزالة',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.unenrollStaff(enr.userId);
            Toast.show({type: 'success', text1: 'تم الإزالة'});
            loadData();
          } catch (e: any) {
            Alert.alert('خطأ', e.message || 'فشل الإزالة');
          }
        },
      },
    ]);
  };

  const toggleZoneId = (zoneId: string) => {
    const current = editForm.zoneIds || [];
    setEditForm({
      ...editForm,
      zoneIds: current.includes(zoneId) ? current.filter(z => z !== zoneId) : [...current, zoneId],
    });
  };

  const updateDaySchedule = (day: string, field: 'start' | 'end', val: string) => {
    const current = editForm.customDaySchedules || {};
    const dayVal = current[day] || {start: '', end: ''};
    setEditForm({
      ...editForm,
      customDaySchedules: {...current, [day]: {...dayVal, [field]: val}},
    });
  };

  const filtered = enrollments.filter(e => {
    if (!search) return true;
    return e.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.user.email?.toLowerCase().includes(search.toLowerCase());
  });

  const activeCount = enrollments.filter(e => e.isActive).length;
  const inactiveCount = enrollments.length - activeCount;

  if (loading) {
    return (
      <View style={st.container}>
        <View style={st.header}>
          <CustomMenu navigation={navigation} activeRouteName="StaffAttendanceEmployees" />
          <Text style={st.headerTitle}>الموظفين المسجلين</Text>
          <View style={{width: 44}} />
        </View>
        <View style={st.centerBox}>
          <ActivityIndicator size="large" color="#1a237e" />
        </View>
      </View>
    );
  }

  return (
    <View style={st.container}>
      <View style={st.header}>
        <CustomMenu navigation={navigation} activeRouteName="StaffAttendanceEmployees" />
        <Text style={st.headerTitle}>الموظفين المسجلين</Text>
        {canManageEnrollments && (
          <TouchableOpacity style={st.addBtn} onPress={openBulkEnroll}>
            <Icon name="person-add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={st.statsBar}>
        <View style={[st.statBox, {backgroundColor: '#ecfdf5'}]}>
          <Text style={[st.statNum, {color: '#059669'}]}>{activeCount}</Text>
          <Text style={st.statLabel}>نشط</Text>
        </View>
        <View style={[st.statBox, {backgroundColor: '#fef2f2'}]}>
          <Text style={[st.statNum, {color: '#dc2626'}]}>{inactiveCount}</Text>
          <Text style={st.statLabel}>غير نشط</Text>
        </View>
        <View style={[st.statBox, {backgroundColor: '#eff6ff'}]}>
          <Text style={[st.statNum, {color: '#3b82f6'}]}>{enrollments.length}</Text>
          <Text style={st.statLabel}>الإجمالي</Text>
        </View>
      </View>

      {/* Search */}
      <View style={st.searchContainer}>
        <View style={st.searchBox}>
          <Icon name="search" size={18} color="#6b7280" />
          <TextInput
            style={st.searchInput}
            placeholder="بحث بالاسم أو البريد..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        style={st.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 30}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filtered.length === 0 ? (
          <View style={st.emptyBox}>
            <Icon name="people-outline" size={48} color="#d1d5db" />
            <Text style={st.emptyText}>لا يوجد موظفين مسجلين</Text>
          </View>
        ) : (
          filtered.map(enr => (
            <View key={enr.userId} style={st.card}>
              <View style={st.cardRow}>
                <View style={st.avatar}>
                  <Text style={st.avatarText}>{enr.user.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
                <View style={{flex: 1}}>
                  <Text style={st.empName}>{enr.user.name}</Text>
                  <Text style={st.empEmail}>{enr.user.email}</Text>
                  {enr.customWorkStartTime && (
                    <View style={st.customBadge}>
                      <Icon name="schedule" size={12} color="#3b82f6" />
                      <Text style={st.customBadgeText}>
                        {enr.customWorkStartTime} - {enr.customWorkEndTime}
                      </Text>
                    </View>
                  )}
                  {enr.customDaySchedules && Object.keys(enr.customDaySchedules).length > 0 && (
                    <View style={st.customBadge}>
                      <Icon name="view-week" size={12} color="#7c3aed" />
                      <Text style={[st.customBadgeText, {color: '#7c3aed'}]}>جدول مخصص لكل يوم</Text>
                    </View>
                  )}
                </View>
                <View style={{alignItems: 'flex-end', gap: 6}}>
                  {canManageEnrollments ? (
                    <>
                      <Switch
                        value={enr.isActive}
                        onValueChange={() => handleToggleActive(enr)}
                        trackColor={{false: '#e5e7eb', true: '#a5b4fc'}}
                        thumbColor={enr.isActive ? '#059669' : '#dc2626'}
                        style={{transform: [{scaleX: 0.8}, {scaleY: 0.8}]}}
                      />
                      <Text style={{fontSize: 10, color: enr.isActive ? '#059669' : '#dc2626', fontWeight: '700'}}>
                        {enr.isActive ? 'نشط' : 'معطل'}
                      </Text>
                    </>
                  ) : (
                    <Text style={{fontSize: 10, color: enr.isActive ? '#059669' : '#dc2626', fontWeight: '700'}}>
                      {enr.isActive ? 'نشط' : 'معطل'}
                    </Text>
                  )}
                </View>
              </View>
              <View style={st.cardActions}>
                <TouchableOpacity
                  style={[st.actionBtn, {backgroundColor: '#f0f4ff'}]}
                  onPress={() => navigation.navigate('StaffAttendanceEmployeeDetail', {
                    userId: enr.userId,
                    userName: enr.user.name,
                    userEmail: enr.user.email,
                  })}>
                  <Icon name="person" size={16} color="#1a237e" />
                  <Text style={st.actionBtnText}>ملف الموظف</Text>
                </TouchableOpacity>
                {canManageEnrollments && (
                  <>
                    <TouchableOpacity style={st.actionBtn} onPress={() => openEditSchedule(enr)}>
                      <Icon name="edit-calendar" size={16} color="#1a237e" />
                      <Text style={st.actionBtnText}>تعديل الجدول</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[st.actionBtn, {backgroundColor: '#fef2f2'}]}
                      onPress={() => handleUnenroll(enr)}>
                      <Icon name="person-remove" size={16} color="#dc2626" />
                      <Text style={[st.actionBtnText, {color: '#dc2626'}]}>إزالة</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ===== BULK ENROLL MODAL ===== */}
      <Modal visible={showBulkModal} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>تسجيل موظفين</Text>
              <TouchableOpacity onPress={() => setShowBulkModal(false)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={st.searchBox}>
              <Icon name="search" size={16} color="#6b7280" />
              <TextInput
                style={st.searchInput}
                placeholder="بحث..."
                placeholderTextColor="#9ca3af"
                value={userSearch}
                onChangeText={setUserSearch}
              />
            </View>

            {selectedUserIds.length > 0 && (
              <Text style={st.selectedCount}>
                تم اختيار {selectedUserIds.length} موظف
              </Text>
            )}

            <ScrollView style={{maxHeight: 350, marginTop: 10}}>
              {loadingUsers ? (
                <ActivityIndicator style={{padding: 30}} color="#1a237e" />
              ) : filteredUsers.length === 0 ? (
                <Text style={st.noResults}>لا يوجد موظفين متاحين</Text>
              ) : (
                filteredUsers.map(user => {
                  const selected = selectedUserIds.includes(user.id);
                  return (
                    <TouchableOpacity
                      key={user.id}
                      style={[st.userRow, selected && st.userRowSelected]}
                      onPress={() => toggleUserSelection(user.id)}>
                      <View style={[st.checkbox, selected && st.checkboxActive]}>
                        {selected && <Icon name="check" size={14} color="#fff" />}
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={st.userName}>{user.name}</Text>
                        <Text style={st.userEmail}>{user.email}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={[st.enrollBtn, enrolling && {opacity: 0.6}]}
              onPress={handleBulkEnroll}
              disabled={enrolling || selectedUserIds.length === 0}>
              {enrolling ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="group-add" size={20} color="#fff" />
                  <Text style={st.enrollBtnText}>
                    تسجيل {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== EDIT SCHEDULE MODAL ===== */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={[st.modalContent, {maxHeight: '90%'}]}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>
                تعديل جدول {editingEnrollment?.user?.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  setEditingEnrollment(null);
                }}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Active toggle */}
              <View style={st.editSwitchRow}>
                <Text style={st.editLabel}>الحالة</Text>
                <Switch
                  value={editForm.isActive}
                  onValueChange={v => setEditForm({...editForm, isActive: v})}
                  trackColor={{false: '#e5e7eb', true: '#a5b4fc'}}
                  thumbColor={editForm.isActive ? '#059669' : '#dc2626'}
                />
              </View>

              {/* Custom schedule toggle */}
              <View style={st.editSwitchRow}>
                <View>
                  <Text style={st.editLabel}>جدول مخصص</Text>
                  <Text style={st.editSub}>تخصيص مواعيد عمل مختلفة عن الإعدادات العامة</Text>
                </View>
                <Switch
                  value={useCustomSchedule}
                  onValueChange={setUseCustomSchedule}
                  trackColor={{false: '#e5e7eb', true: '#a5b4fc'}}
                  thumbColor={useCustomSchedule ? '#1a237e' : '#9ca3af'}
                />
              </View>

              {useCustomSchedule && (
                <>
                  {/* Per-day toggle */}
                  <View style={st.editSwitchRow}>
                    <View>
                      <Text style={st.editLabel}>جدول لكل يوم</Text>
                      <Text style={st.editSub}>مواعيد مختلفة لكل يوم من أيام الأسبوع</Text>
                    </View>
                    <Switch
                      value={usePerDaySchedule}
                      onValueChange={setUsePerDaySchedule}
                      trackColor={{false: '#e5e7eb', true: '#a5b4fc'}}
                      thumbColor={usePerDaySchedule ? '#7c3aed' : '#9ca3af'}
                    />
                  </View>

                  {!usePerDaySchedule && (
                    <View style={st.editCard}>
                      <Text style={st.editCardTitle}>المواعيد الموحدة</Text>
                      <View style={st.editRow}>
                        <View style={{flex: 1}}>
                          <Text style={st.editFieldLabel}>البداية</Text>
                          <TextInput
                            style={st.editInput}
                            value={editForm.customWorkStartTime || ''}
                            onChangeText={v => setEditForm({...editForm, customWorkStartTime: v})}
                            placeholder="09:00"
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                        <View style={{flex: 1}}>
                          <Text style={st.editFieldLabel}>النهاية</Text>
                          <TextInput
                            style={st.editInput}
                            value={editForm.customWorkEndTime || ''}
                            onChangeText={v => setEditForm({...editForm, customWorkEndTime: v})}
                            placeholder="17:00"
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {usePerDaySchedule && (
                    <View style={st.editCard}>
                      <Text style={st.editCardTitle}>جدول كل يوم</Text>
                      {DAYS_OF_WEEK.map(day => (
                        <View key={day.key} style={st.dayRow}>
                          <Text style={st.dayLabel}>{day.label}</Text>
                          <TextInput
                            style={[st.editInput, {flex: 1}]}
                            value={editForm.customDaySchedules?.[day.key]?.start || ''}
                            onChangeText={v => updateDaySchedule(day.key, 'start', v)}
                            placeholder="09:00"
                            placeholderTextColor="#9ca3af"
                          />
                          <Text style={st.dayTo}>→</Text>
                          <TextInput
                            style={[st.editInput, {flex: 1}]}
                            value={editForm.customDaySchedules?.[day.key]?.end || ''}
                            onChangeText={v => updateDaySchedule(day.key, 'end', v)}
                            placeholder="17:00"
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Thresholds */}
                  <View style={st.editCard}>
                    <Text style={st.editCardTitle}>الحدود</Text>
                    <View style={st.editRow}>
                      <View style={{flex: 1}}>
                        <Text style={st.editFieldLabel}>حد التأخير (دقيقة)</Text>
                        <TextInput
                          style={st.editInput}
                          value={String(editForm.customLateThresholdMinutes || 0)}
                          onChangeText={v =>
                            setEditForm({...editForm, customLateThresholdMinutes: parseInt(v, 10) || 0})
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={st.editFieldLabel}>حد الانصراف المبكر (دقيقة)</Text>
                        <TextInput
                          style={st.editInput}
                          value={String(editForm.customEarlyLeaveThresholdMinutes || 0)}
                          onChangeText={v =>
                            setEditForm({...editForm, customEarlyLeaveThresholdMinutes: parseInt(v, 10) || 0})
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                </>
              )}

              {/* Zone assignment */}
              {zones.length > 0 && (
                <View style={st.editCard}>
                  <Text style={st.editCardTitle}>المناطق المتاحة</Text>
                  <View style={st.editSwitchRow}>
                    <Text style={st.editLabel}>السماح بالمناطق العامة</Text>
                    <Switch
                      value={editForm.allowGlobalZones}
                      onValueChange={v => setEditForm({...editForm, allowGlobalZones: v})}
                      trackColor={{false: '#e5e7eb', true: '#a5b4fc'}}
                      thumbColor={editForm.allowGlobalZones ? '#059669' : '#9ca3af'}
                    />
                  </View>
                  <Text style={st.editSub}>مناطق إضافية خاصة بهذا الموظف:</Text>
                  {zones
                    .filter(z => !z.isGlobal)
                    .map(zone => {
                      const selected = editForm.zoneIds?.includes(zone.id);
                      return (
                        <TouchableOpacity
                          key={zone.id}
                          style={[st.zoneItem, selected && st.zoneItemActive]}
                          onPress={() => toggleZoneId(zone.id)}>
                          <View style={[st.zoneColorDot, {backgroundColor: zone.color}]} />
                          <Text style={st.zoneItemText}>{zone.name}</Text>
                          {selected && <Icon name="check" size={16} color="#059669" />}
                        </TouchableOpacity>
                      );
                    })}
                  {zones.filter(z => !z.isGlobal).length === 0 && (
                    <Text style={st.editSub}>لا توجد مناطق خاصة</Text>
                  )}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[st.enrollBtn, saving && {opacity: 0.6}]}
              onPress={handleSaveSchedule}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="save" size={20} color="#fff" />
                  <Text style={st.enrollBtnText}>حفظ التغييرات</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StaffAttendanceEmployeesScreen;

const st = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerTitle: {fontSize: 18, fontWeight: '800', color: '#1a237e'},
  addBtn: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a237e', alignItems: 'center', justifyContent: 'center'},
  centerBox: {flex: 1, alignItems: 'center', justifyContent: 'center'},

  // Stats
  statsBar: {flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0, backgroundColor: '#fff'},
  statBox: {flex: 1, alignItems: 'center', padding: 10, borderRadius: 12},
  statNum: {fontSize: 20, fontWeight: '900'},
  statLabel: {fontSize: 10, fontWeight: '600', color: '#6b7280', marginTop: 2},

  // Search
  searchContainer: {paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6'},
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, height: 40,
  },
  searchInput: {flex: 1, fontSize: 13, color: '#111827', padding: 0},

  content: {flex: 1, padding: 16},
  emptyBox: {alignItems: 'center', padding: 50, gap: 12},
  emptyText: {fontSize: 14, color: '#6b7280', fontWeight: '600'},

  // Employee card
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  cardRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  avatar: {width: 42, height: 42, borderRadius: 21, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontSize: 16, fontWeight: '800', color: '#374151'},
  empName: {fontSize: 14, fontWeight: '700', color: '#111827'},
  empEmail: {fontSize: 12, color: '#6b7280'},
  customBadge: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3},
  customBadgeText: {fontSize: 11, color: '#3b82f6', fontWeight: '600'},
  cardActions: {flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6'},
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8, borderRadius: 8, backgroundColor: '#f0f4ff',
  },
  actionBtnText: {fontSize: 12, fontWeight: '700', color: '#1a237e'},

  // Modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  modalContent: {backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%'},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  modalTitle: {fontSize: 17, fontWeight: '800', color: '#1a237e'},
  selectedCount: {fontSize: 13, fontWeight: '700', color: '#1a237e', marginTop: 8},
  noResults: {textAlign: 'center', padding: 30, color: '#6b7280', fontSize: 14},
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  userRowSelected: {backgroundColor: '#f0f4ff'},
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: {backgroundColor: '#1a237e', borderColor: '#1a237e'},
  userName: {fontSize: 14, fontWeight: '600', color: '#111827'},
  userEmail: {fontSize: 12, color: '#6b7280'},
  enrollBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, marginTop: 14,
  },
  enrollBtnText: {fontSize: 16, fontWeight: '700', color: '#fff'},

  // Edit schedule
  editSwitchRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10},
  editLabel: {fontSize: 14, fontWeight: '600', color: '#374151'},
  editSub: {fontSize: 11, color: '#9ca3af', marginTop: 1},
  editCard: {
    backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, marginTop: 10,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  editCardTitle: {fontSize: 13, fontWeight: '800', color: '#1a237e', marginBottom: 8},
  editRow: {flexDirection: 'row', gap: 10},
  editFieldLabel: {fontSize: 11, fontWeight: '600', color: '#6b7280', marginBottom: 4},
  editInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: '#111827',
  },
  dayRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6},
  dayLabel: {width: 55, fontSize: 12, fontWeight: '600', color: '#374151'},
  dayTo: {fontSize: 14, color: '#9ca3af'},
  zoneItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  zoneItemActive: {backgroundColor: '#ecfdf5'},
  zoneColorDot: {width: 10, height: 10, borderRadius: 5},
  zoneItemText: {flex: 1, fontSize: 13, fontWeight: '500', color: '#374151'},
});
