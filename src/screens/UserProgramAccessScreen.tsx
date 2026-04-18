import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';

const UserProgramAccessScreen = ({ navigation, route }: any) => {
  const userId = route?.params?.userId;
  const userName = route?.params?.userName;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);
  const [accessMode, setAccessMode] = useState<'all' | 'specific'>('all');

  const loadData = async () => {
    if (!userId) {
      Alert.alert('خطأ', 'لا يوجد مستخدم محدد');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const [allPrograms, allowedPrograms] = await Promise.all([
        AuthService.getAllPrograms(),
        AuthService.getUserAllowedPrograms(userId),
      ]);

      const normalizedPrograms = Array.isArray(allPrograms) ? allPrograms : [];
      setPrograms(normalizedPrograms);

      const ids = (Array.isArray(allowedPrograms) ? allowedPrograms : []).map((p: any) => Number(p.id)).filter((id: number) => !Number.isNaN(id));
      setSelectedProgramIds(ids);
      setAccessMode(ids.length > 0 ? 'specific' : 'all');
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'فشل تحميل البرامج');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const selectedSet = useMemo(() => new Set(selectedProgramIds), [selectedProgramIds]);

  const toggleProgram = (programId: number) => {
    setSelectedProgramIds((prev) =>
      prev.includes(programId) ? prev.filter((id) => id !== programId) : [...prev, programId],
    );
  };

  const onSave = async () => {
    if (accessMode === 'specific' && selectedProgramIds.length === 0) {
      Alert.alert('تنبيه', 'اختر برنامجاً واحداً على الأقل أو فعّل وضع كل البرامج');
      return;
    }

    try {
      setSaving(true);
      await AuthService.updateUserAllowedPrograms(userId, accessMode === 'all' ? [] : selectedProgramIds);
      Toast.show({ type: 'success', text1: 'تم حفظ وصول البرامج بنجاح' });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'فشل حفظ وصول البرامج');
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
            <Text style={styles.headerTitle}>وصول البرامج</Text>
            <Text style={styles.headerSubtitle}>{userName || 'مستخدم'}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.saveHeaderButton, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="save" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل البرامج...</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.title}>نوع الوصول</Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[styles.segmentBtn, accessMode === 'all' && styles.segmentBtnActive]}
                  onPress={() => {
                    setAccessMode('all');
                    setSelectedProgramIds([]);
                  }}
                >
                  <Text style={[styles.segmentText, accessMode === 'all' && styles.segmentTextActive]}>كل البرامج</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentBtn, accessMode === 'specific' && styles.segmentBtnActive]}
                  onPress={() => setAccessMode('specific')}
                >
                  <Text style={[styles.segmentText, accessMode === 'specific' && styles.segmentTextActive]}>برامج محددة</Text>
                </TouchableOpacity>
              </View>
            </View>

            {accessMode === 'specific' && (
              <View style={styles.card}>
                <View style={styles.programsHeader}>
                  <Text style={styles.title}>البرامج المسموحة ({selectedProgramIds.length} من {programs.length})</Text>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity onPress={() => setSelectedProgramIds(programs.map((p: any) => p.id))}>
                      <Text style={styles.linkText}>تحديد الكل</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedProgramIds([])}>
                      <Text style={[styles.linkText, { color: '#dc2626' }]}>إلغاء الكل</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ gap: 8 }}>
                  {programs.map((program: any) => {
                    const selected = selectedSet.has(program.id);
                    return (
                      <TouchableOpacity
                        key={program.id}
                        style={[styles.programRow, selected && styles.programRowSelected]}
                        onPress={() => toggleProgram(program.id)}
                      >
                        <Icon
                          name={selected ? 'check-box' : 'check-box-outline-blank'}
                          size={20}
                          color={selected ? '#1a237e' : '#6b7280'}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.programName}>{program.nameAr}</Text>
                          {!!program.nameEn && <Text style={styles.programEn}>{program.nameEn}</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>ملاحظة</Text>
              <Text style={styles.noteText}>عند اختيار "كل البرامج" سيتم منح المستخدم صلاحية عرض جميع بيانات البرامج.</Text>
              <Text style={styles.noteText}>عند اختيار برامج محددة سيقتصر الوصول على البرامج المختارة فقط.</Text>
            </View>
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {!loading && (
        <TouchableOpacity style={[styles.fab, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="save" size={20} color="#fff" />}
          <Text style={styles.fabText}>حفظ</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UserProgramAccessScreen;

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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 10,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segmentBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  segmentBtnActive: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  segmentText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  segmentTextActive: { color: '#fff' },
  programsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionsRow: { flexDirection: 'row', gap: 12 },
  linkText: { fontSize: 12, color: '#1a237e', fontWeight: '700' },
  programRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  programRowSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#818cf8',
  },
  programName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  programEn: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  noteBox: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 12,
  },
  noteTitle: { fontSize: 13, fontWeight: '800', color: '#1d4ed8', marginBottom: 6 },
  noteText: { fontSize: 12, color: '#1e40af', marginBottom: 4 },
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
