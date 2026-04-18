import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import type { RoleWithRelations } from '../types/permissions';
import type { AccountType, CreateUserRequest } from '../types/users';
import type { DistributionSummary } from '../types/distribution';
import Toast from 'react-native-toast-message';

interface ProgramItem {
  id: number;
  nameAr: string;
  nameEn: string;
}

type AccessMode = 'all' | 'specific';

const AddUserScreen = ({ navigation }: any) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    accountType: 'STAFF' as AccountType,
  });
  const [hasCrmAccess, setHasCrmAccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [rolesLoading, setRolesLoading] = useState(false);
  const [roles, setRoles] = useState<RoleWithRelations[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const [programsLoading, setProgramsLoading] = useState(false);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [programAccessMode, setProgramAccessMode] = useState<AccessMode>('all');
  const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);

  const [distributionsLoading, setDistributionsLoading] = useState(false);
  const [distributions, setDistributions] = useState<DistributionSummary[]>([]);
  const [distributionAccessMode, setDistributionAccessMode] = useState<AccessMode>('all');
  const [selectedDistributionIds, setSelectedDistributionIds] = useState<string[]>([]);
  const [distributionRoomMode, setDistributionRoomMode] = useState<Record<string, AccessMode>>({});
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setRolesLoading(true);
        setProgramsLoading(true);
        const [rolesData, programsData] = await Promise.all([AuthService.getRoles(), AuthService.getAllPrograms()]);
        setRoles((rolesData || []).filter((r) => r.isActive));
        setPrograms(Array.isArray(programsData) ? programsData : []);
      } catch (e: any) {
        Toast.show({ type: 'error', text1: 'تعذر تحميل البيانات', text2: e?.message || 'حدث خطأ' });
      } finally {
        setRolesLoading(false);
        setProgramsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const activeProgramIds = useMemo(() => {
    if (programAccessMode === 'all') {
      return programs.map((p) => p.id);
    }
    return selectedProgramIds;
  }, [programAccessMode, programs, selectedProgramIds]);

  useEffect(() => {
    const loadDistributions = async () => {
      if (activeProgramIds.length === 0) {
        setDistributions([]);
        return;
      }

      try {
        setDistributionsLoading(true);
        const responses = await Promise.all(
          activeProgramIds.map((programId) => AuthService.getTraineeDistributions({ programId }))
        );
        const flat = responses.flat();
        const unique = flat.filter((d, index, arr) => arr.findIndex((x) => x.id === d.id) === index);
        setDistributions(unique);
      } catch (e: any) {
        Toast.show({ type: 'error', text1: 'تعذر تحميل التوزيعات', text2: e?.message || 'حدث خطأ' });
      } finally {
        setDistributionsLoading(false);
      }
    };

    loadDistributions();
  }, [activeProgramIds]);

  const groupedDistributions = useMemo(() => {
    const map = new Map<number, DistributionSummary[]>();
    for (const dist of distributions) {
      const existing = map.get(dist.programId) || [];
      existing.push(dist);
      map.set(dist.programId, existing);
    }
    return map;
  }, [distributions]);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  };

  const toggleProgram = (programId: number) => {
    setSelectedProgramIds((prev) => {
      const next = prev.includes(programId) ? prev.filter((id) => id !== programId) : [...prev, programId];
      if (!next.includes(programId)) {
        setSelectedDistributionIds((previous) =>
          previous.filter((distributionId) => {
            const distribution = distributions.find((d) => d.id === distributionId);
            return distribution ? next.includes(distribution.programId) : false;
          })
        );
      }
      return next;
    });
  };

  const toggleDistribution = (distributionId: string) => {
    setSelectedDistributionIds((prev) => {
      if (prev.includes(distributionId)) {
        const distribution = distributions.find((d) => d.id === distributionId);
        if (distribution) {
          const roomIds = distribution.rooms.map((room) => room.id);
          setSelectedRoomIds((current) => current.filter((roomId) => !roomIds.includes(roomId)));
        }
        setDistributionRoomMode((current) => {
          const copy = { ...current };
          delete copy[distributionId];
          return copy;
        });
        return prev.filter((id) => id !== distributionId);
      }
      return [...prev, distributionId];
    });
  };

  const setRoomModeForDistribution = (distributionId: string, mode: AccessMode) => {
    setDistributionRoomMode((prev) => ({ ...prev, [distributionId]: mode }));
    if (mode === 'all') {
      const distribution = distributions.find((d) => d.id === distributionId);
      if (!distribution) return;
      const roomIds = distribution.rooms.map((room) => room.id);
      setSelectedRoomIds((current) => current.filter((roomId) => !roomIds.includes(roomId)));
    }
  };

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds((prev) => (prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]));
  };

  const validate = (): string | null => {
    if (!form.name.trim() || form.name.trim().length < 3) return 'الاسم يجب أن يكون 3 أحرف على الأقل';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'البريد الإلكتروني غير صالح';
    if (!form.phone.trim() || !/^[0-9+\-\s()]{10,15}$/.test(form.phone.trim())) return 'رقم الهاتف غير صالح';
    if (!form.password || form.password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (form.password !== form.confirmPassword) return 'كلمة المرور غير متطابقة';
    if (selectedRoleIds.length === 0) return 'يجب اختيار دور واحد على الأقل';
    if (programAccessMode === 'specific' && selectedProgramIds.length === 0) return 'اختر برنامجاً واحداً على الأقل أو فعّل كل البرامج';
    return null;
  };

  const onSubmit = async () => {
    const error = validate();
    if (error) {
      Toast.show({ type: 'error', text1: 'تحقق من البيانات', text2: error });
      return;
    }

    const payload: CreateUserRequest = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password,
      accountType: form.accountType,
      hasCrmAccess,
      allowedProgramIds: programAccessMode === 'all' ? [] : selectedProgramIds,
      allowedDistributionIds: distributionAccessMode === 'all' ? [] : selectedDistributionIds,
      allowedRoomIds: distributionAccessMode === 'all' ? [] : selectedRoomIds,
    };

    try {
      setSubmitting(true);
      const createdUser = await AuthService.createUser(payload);
      const userId = createdUser?.id;

      if (userId) {
        const roleResults = await Promise.allSettled(
          selectedRoleIds.map((roleId) => AuthService.assignUserRole(userId, roleId))
        );

        const failed = roleResults.filter((r) => r.status === 'rejected').length;
        if (failed > 0) {
          Toast.show({ type: 'error', text1: 'تم إنشاء المستخدم', text2: `لكن فشل تعيين ${failed} دور.` });
        } else {
          Toast.show({ type: 'success', text1: 'تم إضافة المستخدم بنجاح', text2: form.name });
        }
      } else {
        Toast.show({ type: 'success', text1: 'تم إضافة المستخدم', text2: form.name });
      }

      navigation.navigate('UsersList');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'فشل الإضافة', text2: e?.message || 'حدث خطأ' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="AddUser" />
        <Text style={styles.headerTitle}>إضافة مستخدم</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-forward" size={20} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>البيانات الأساسية</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>الاسم</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(t) => setField('name', t)} placeholder="الاسم الكامل" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <TextInput style={styles.input} keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(t) => setField('email', t)} placeholder="name@example.com" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>رقم الهاتف</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" value={form.phone} onChangeText={(t) => setField('phone', t)} placeholder="01XXXXXXXXX" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>نوع الحساب</Text>
            <View style={styles.segmentRow}>
              <TouchableOpacity style={[styles.segmentBtn, form.accountType === 'STAFF' && styles.segmentBtnActive]} onPress={() => setField('accountType', 'STAFF')}>
                <Text style={[styles.segmentText, form.accountType === 'STAFF' && styles.segmentTextActive]}>موظف إداري</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.segmentBtn, form.accountType === 'INSTRUCTOR' && styles.segmentBtnActive]} onPress={() => setField('accountType', 'INSTRUCTOR')}>
                <Text style={[styles.segmentText, form.accountType === 'INSTRUCTOR' && styles.segmentTextActive]}>محاضر</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>الوصول إلى CRM</Text>
              <Text style={styles.hint}>السماح بالدخول إلى نظام CRM</Text>
            </View>
            <TouchableOpacity style={[styles.toggle, hasCrmAccess && styles.toggleActive]} onPress={() => setHasCrmAccess((v) => !v)}>
              <View style={[styles.toggleDot, hasCrmAccess && styles.toggleDotActive]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>الصلاحيات</Text>
          {rolesLoading ? (
            <ActivityIndicator color="#1a237e" />
          ) : (
            <View style={styles.multiList}>
              {roles.map((role) => {
                const selected = selectedRoleIds.includes(role.id);
                return (
                  <TouchableOpacity key={role.id} style={[styles.multiItem, selected && styles.multiItemSelected]} onPress={() => toggleRole(role.id)}>
                    <Icon name={selected ? 'check-box' : 'check-box-outline-blank'} size={18} color={selected ? '#1a237e' : '#6b7280'} />
                    <Text style={styles.multiItemText}>{role.displayName}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <Text style={styles.hint}>يمكن اختيار أكثر من دور</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>البرامج التدريبية</Text>
          {programsLoading ? <ActivityIndicator color="#1a237e" /> : null}
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[styles.segmentBtn, programAccessMode === 'all' && styles.segmentBtnActive]}
              onPress={() => {
                setProgramAccessMode('all');
                setSelectedProgramIds([]);
              }}
            >
              <Text style={[styles.segmentText, programAccessMode === 'all' && styles.segmentTextActive]}>كل البرامج</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentBtn, programAccessMode === 'specific' && styles.segmentBtnActive]} onPress={() => setProgramAccessMode('specific')}>
              <Text style={[styles.segmentText, programAccessMode === 'specific' && styles.segmentTextActive]}>برامج محددة</Text>
            </TouchableOpacity>
          </View>

          {programAccessMode === 'specific' && (
            <View style={styles.multiList}>
              {programs.map((program) => {
                const selected = selectedProgramIds.includes(program.id);
                return (
                  <TouchableOpacity key={program.id} style={[styles.multiItem, selected && styles.multiItemSelected]} onPress={() => toggleProgram(program.id)}>
                    <Icon name={selected ? 'check-box' : 'check-box-outline-blank'} size={18} color={selected ? '#1a237e' : '#6b7280'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.multiItemText}>{program.nameAr}</Text>
                      <Text style={styles.subItemText}>{program.nameEn}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {distributions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.title}>التوزيعات والمجموعات</Text>
            <View style={styles.segmentRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, distributionAccessMode === 'all' && styles.segmentBtnActive]}
                onPress={() => {
                  setDistributionAccessMode('all');
                  setSelectedDistributionIds([]);
                  setSelectedRoomIds([]);
                  setDistributionRoomMode({});
                }}
              >
                <Text style={[styles.segmentText, distributionAccessMode === 'all' && styles.segmentTextActive]}>كل التوزيعات</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.segmentBtn, distributionAccessMode === 'specific' && styles.segmentBtnActive]} onPress={() => setDistributionAccessMode('specific')}>
                <Text style={[styles.segmentText, distributionAccessMode === 'specific' && styles.segmentTextActive]}>توزيعات محددة</Text>
              </TouchableOpacity>
            </View>

            {distributionAccessMode === 'specific' && (
              <View style={styles.multiList}>
                {distributionsLoading ? (
                  <ActivityIndicator color="#1a237e" />
                ) : (
                  Array.from(groupedDistributions.entries()).map(([programId, items]) => {
                    const programName = programs.find((p) => p.id === programId)?.nameAr || 'برنامج';
                    return (
                      <View key={programId} style={styles.groupBlock}>
                        <Text style={styles.groupTitle}>{programName}</Text>
                        {items.map((distribution) => {
                          const selected = selectedDistributionIds.includes(distribution.id);
                          const roomMode = distributionRoomMode[distribution.id] || 'all';
                          const totalTrainees = distribution.rooms.reduce((sum, room) => sum + (room._count?.assignments || 0), 0);
                          return (
                            <View key={distribution.id} style={styles.distributionBlock}>
                              <TouchableOpacity style={[styles.multiItem, selected && styles.multiItemSelected]} onPress={() => toggleDistribution(distribution.id)}>
                                <Icon name={selected ? 'check-box' : 'check-box-outline-blank'} size={18} color={selected ? '#1a237e' : '#6b7280'} />
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.multiItemText}>{distribution.type === 'THEORY' ? 'نظري' : 'عملي'} ({distribution.numberOfRooms} مجموعة)</Text>
                                  <Text style={styles.subItemText}>{totalTrainees} متدرب</Text>
                                </View>
                              </TouchableOpacity>

                              {selected && distribution.rooms.length > 0 && (
                                <View style={styles.roomsPanel}>
                                  <View style={styles.segmentRow}>
                                    <TouchableOpacity style={[styles.segmentBtn, roomMode === 'all' && styles.segmentBtnActive]} onPress={() => setRoomModeForDistribution(distribution.id, 'all')}>
                                      <Text style={[styles.segmentText, roomMode === 'all' && styles.segmentTextActive]}>كل المجموعات</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.segmentBtn, roomMode === 'specific' && styles.segmentBtnActive]} onPress={() => setRoomModeForDistribution(distribution.id, 'specific')}>
                                      <Text style={[styles.segmentText, roomMode === 'specific' && styles.segmentTextActive]}>مجموعات محددة</Text>
                                    </TouchableOpacity>
                                  </View>

                                  {roomMode === 'specific' && (
                                    <View style={styles.multiList}>
                                      {distribution.rooms.map((room) => {
                                        const roomSelected = selectedRoomIds.includes(room.id);
                                        return (
                                          <TouchableOpacity key={room.id} style={[styles.multiItem, roomSelected && styles.multiItemSelected]} onPress={() => toggleRoom(room.id)}>
                                            <Icon name={roomSelected ? 'check-box' : 'check-box-outline-blank'} size={18} color={roomSelected ? '#1a237e' : '#6b7280'} />
                                            <Text style={styles.multiItemText}>{room.roomName} ({room._count?.assignments || 0})</Text>
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>
                                  )}
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.title}>كلمة المرور</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>كلمة المرور</Text>
            <TextInput style={styles.input} secureTextEntry value={form.password} onChangeText={(t) => setField('password', t)} placeholder="6 أحرف على الأقل" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>تأكيد كلمة المرور</Text>
            <TextInput style={styles.input} secureTextEntry value={form.confirmPassword} onChangeText={(t) => setField('confirmPassword', t)} placeholder="أعد إدخال كلمة المرور" />
          </View>
        </View>

        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitDisabled]} onPress={onSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>إنشاء المستخدم</Text>}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

export default AddUserScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a237e' },
  backButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#c7d2fe', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff' },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  title: { fontSize: 17, fontWeight: '700', color: '#1a237e', marginBottom: 8 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 6, fontWeight: '600' },
  input: { height: 46, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  segmentRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 6 },
  segmentBtn: { flex: 1, minHeight: 36, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: 10 },
  segmentBtnActive: { backgroundColor: '#eef2ff', borderColor: '#1a237e' },
  segmentText: { fontSize: 12, color: '#4b5563', fontWeight: '700' },
  segmentTextActive: { color: '#1a237e' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  toggle: { width: 46, height: 26, borderRadius: 20, backgroundColor: '#d1d5db', justifyContent: 'center', paddingHorizontal: 3 },
  toggleActive: { backgroundColor: '#22c55e' },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleDotActive: { alignSelf: 'flex-end' },
  multiList: { gap: 8 },
  multiItem: { minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  multiItemSelected: { borderColor: '#1a237e', backgroundColor: '#eef2ff' },
  multiItemText: { fontSize: 13, color: '#111827', marginLeft: 8, fontWeight: '600' },
  subItemText: { fontSize: 11, color: '#6b7280', marginLeft: 8, marginTop: 2 },
  groupBlock: { marginTop: 6, marginBottom: 6 },
  groupTitle: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  distributionBlock: { marginBottom: 8 },
  roomsPanel: { marginTop: 6, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#f8fbff' },
  submitBtn: { height: 48, backgroundColor: '#1a237e', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});


