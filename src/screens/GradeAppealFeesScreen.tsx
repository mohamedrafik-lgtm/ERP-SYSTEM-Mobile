import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';

type Program = {
  id: number;
  nameAr: string;
};

type Fee = {
  id: number;
  name: string;
  amount: number;
  type: string;
  programId: number;
  program?: { id: number; nameAr: string };
};

type FeeConfig = {
  id: string;
  programId: number;
  feeId: number;
  program?: { id: number; nameAr: string };
  fee?: { id: number; name: string; amount: number; type: string };
};

const GradeAppealFeesScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingProgramId, setSavingProgramId] = useState<number | null>(null);
  const [deletingProgramId, setDeletingProgramId] = useState<number | null>(null);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [configs, setConfigs] = useState<FeeConfig[]>([]);
  const [selectedFees, setSelectedFees] = useState<Record<number, number | ''>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [programsRes, feesRes, configsRes] = await Promise.all([
        AuthService.getGradeAppealFeeConfigPrograms(),
        AuthService.getGradeAppealFeeConfigFees(),
        AuthService.getGradeAppealFeeConfigs(),
      ]);

      const normalizedPrograms: Program[] = Array.isArray(programsRes)
        ? programsRes.map((p: any) => ({ id: Number(p.id), nameAr: p.nameAr || p.name || `برنامج ${p.id}` }))
        : [];

      const normalizedFees: Fee[] = Array.isArray(feesRes)
        ? feesRes.map((f: any) => ({
            id: Number(f.id),
            name: f.name || `قيد ${f.id}`,
            amount: Number(f.amount || 0),
            type: f.type || 'OTHER',
            programId: Number(f.programId),
            program: f.program,
          }))
        : [];

      const normalizedConfigs: FeeConfig[] = Array.isArray(configsRes)
        ? configsRes.map((c: any) => ({
            id: String(c.id),
            programId: Number(c.programId),
            feeId: Number(c.feeId),
            program: c.program,
            fee: c.fee,
          }))
        : [];

      const currentSelections: Record<number, number | ''> = {};
      normalizedPrograms.forEach((program) => {
        const existing = normalizedConfigs.find((c) => c.programId === program.id);
        currentSelections[program.id] = existing ? existing.feeId : '';
      });

      setPrograms(normalizedPrograms);
      setFees(normalizedFees);
      setConfigs(normalizedConfigs);
      setSelectedFees(currentSelections);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل بيانات رسوم التظلمات',
        text2: error?.message || 'تحقق من الاتصال ثم حاول مرة أخرى',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const getFeeTypeLabel = (type: string) => {
    switch (type) {
      case 'TUITION':
        return 'دراسية';
      case 'SERVICES':
        return 'خدمات';
      case 'TRAINING':
        return 'تدريب';
      case 'ADDITIONAL':
        return 'إضافية';
      default:
        return type;
    }
  };

  const configMap = useMemo(() => {
    const map: Record<number, FeeConfig> = {};
    configs.forEach((c) => {
      map[c.programId] = c;
    });
    return map;
  }, [configs]);

  const handleSave = async (programId: number) => {
    const feeId = selectedFees[programId];
    if (!feeId) {
      Toast.show({ type: 'info', text1: 'اختر القيد المالي أولاً', position: 'bottom' });
      return;
    }

    try {
      setSavingProgramId(programId);
      await AuthService.upsertGradeAppealFeeConfig(programId, Number(feeId));
      Toast.show({ type: 'success', text1: 'تم حفظ الإعدادات بنجاح', position: 'bottom' });
      await loadData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'فشل حفظ الإعدادات',
        text2: error?.message || 'حدث خطأ أثناء الحفظ',
        position: 'bottom',
      });
    } finally {
      setSavingProgramId(null);
    }
  };

  const handleDelete = async (programId: number) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف إعدادات رسوم التظلمات لهذا البرنامج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingProgramId(programId);
              await AuthService.deleteGradeAppealFeeConfig(programId);
              Toast.show({ type: 'success', text1: 'تم حذف الإعدادات بنجاح', position: 'bottom' });
              await loadData();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'فشل حذف الإعدادات',
                text2: error?.message || 'حدث خطأ أثناء الحذف',
                position: 'bottom',
              });
            } finally {
              setDeletingProgramId(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="GradeAppealFees" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>رسوم التظلمات</Text>
            <Text style={styles.subtitle}>إعدادات رسوم رفض التظلم</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل الإعدادات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="GradeAppealFees" />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>رسوم التظلمات</Text>
            <Text style={styles.subtitle}>اختيار القيد المالي لكل برنامج عند رفض التظلم</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Icon name="refresh" size={22} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>آلية التطبيق</Text>
          <Text style={styles.infoText}>عند رفض تظلم متدرب، يتم تطبيق القيد المالي المحدد لكل برنامج على كل مادة مرفوضة.</Text>
          <Text style={styles.infoText}>مثال: 50 جنيه × 3 مواد مرفوضة = 150 جنيه.</Text>
        </View>

        {programs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="school" size={44} color="#cbd5e1" />
            <Text style={styles.emptyText}>لا توجد برامج متاحة</Text>
          </View>
        ) : (
          programs.map((program) => {
            const programFees = fees.filter((fee) => fee.programId === program.id);
            const existingConfig = configMap[program.id];
            const currentValue = selectedFees[program.id];
            const hasChanged = existingConfig
              ? Number(currentValue || 0) !== Number(existingConfig.feeId)
              : currentValue !== '';

            return (
              <View key={program.id} style={[styles.programCard, existingConfig && styles.programCardConfigured]}>
                <View style={styles.programHeader}>
                  <View>
                    <Text style={styles.programName}>{program.nameAr}</Text>
                    <Text style={styles.programMeta}>{programFees.length} قيد مالي متاح</Text>
                  </View>
                  {existingConfig ? (
                    <View style={styles.configuredBadge}>
                      <Icon name="check-circle" size={14} color="#047857" />
                      <Text style={styles.configuredText}>مُعد</Text>
                    </View>
                  ) : null}
                </View>

                {programFees.length === 0 ? (
                  <Text style={styles.noFeesText}>لا توجد قيود مالية لهذا البرنامج. أنشئ قيدًا ماليًا أولاً من شاشة الرسوم.</Text>
                ) : (
                  <>
                    <SelectBox<string>
                      label="القيد المالي لرسوم التظلم"
                      selectedValue={currentValue ? String(currentValue) : ''}
                      onValueChange={(value) => {
                        setSelectedFees((prev) => ({ ...prev, [program.id]: value ? Number(value) : '' }));
                      }}
                      items={programFees.map((fee) => ({
                        value: String(fee.id),
                        label: `${fee.name} - ${fee.amount} جنيه (${getFeeTypeLabel(fee.type)})`,
                      }))}
                      placeholder="اختر القيد المالي"
                    />

                    {existingConfig?.fee ? (
                      <View style={styles.currentConfigBox}>
                        <Text style={styles.currentConfigText}>
                          القيد الحالي: {existingConfig.fee.name} - {existingConfig.fee.amount} جنيه لكل مادة مرفوضة
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.saveButton,
                          (!currentValue || !hasChanged || savingProgramId === program.id) && styles.disabledButton,
                        ]}
                        disabled={!currentValue || !hasChanged || savingProgramId === program.id}
                        onPress={() => handleSave(program.id)}
                      >
                        {savingProgramId === program.id ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.saveButtonText}>حفظ</Text>
                        )}
                      </TouchableOpacity>

                      {existingConfig ? (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          disabled={deletingProgramId === program.id}
                          onPress={() => handleDelete(program.id)}
                        >
                          {deletingProgramId === program.id ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Text style={styles.deleteButtonText}>حذف</Text>
                          )}
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'right',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 14,
    gap: 12,
    paddingBottom: 30,
  },
  infoCard: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 12,
    padding: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3730a3',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#4338ca',
    lineHeight: 18,
    marginBottom: 4,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 30,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  programCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  programCardConfigured: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  programName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'right',
  },
  programMeta: {
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
    textAlign: 'right',
  },
  configuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  configuredText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  noFeesText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  currentConfigBox: {
    marginBottom: 10,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 10,
  },
  currentConfigText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  deleteButton: {
    minWidth: 84,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
});

export default GradeAppealFeesScreen;
