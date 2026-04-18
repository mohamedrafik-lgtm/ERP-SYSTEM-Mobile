import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Image,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';
import { usePermissions } from '../hooks/usePermissions';

type Program = {
  id: number;
  nameAr?: string;
  nameEn?: string;
};

type TraineeAccount = {
  id: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  trainee: {
    id: number;
    nameAr: string;
    nationalId: string;
    phone: string;
    email: string | null;
    photoUrl: string | null;
    program: {
      id: number;
      nameAr: string;
      nameEn: string;
    };
  };
};

type AccountsResponse = {
  data: TraineeAccount[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

const TraineeAccountsScreen = ({ navigation }: any) => {
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<TraineeAccount[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('ALL');

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [sendTarget, setSendTarget] = useState<{ id: string; name: string } | null>(null);
  const [sendingCredentials, setSendingCredentials] = useState(false);

  const [busyAccountId, setBusyAccountId] = useState<string | null>(null);

  const canToggleStatus =
    hasPermission('dashboard.trainee-platform.accounts', 'activate') ||
    hasPermission('dashboard.trainee-platform.accounts', 'manage') ||
    hasPermission('dashboard.trainee-platform.accounts', 'edit');

  const canResetPassword =
    hasPermission('dashboard.trainee-platform.accounts', 'reset-password') ||
    hasPermission('dashboard.trainee-platform.accounts', 'manage') ||
    hasPermission('dashboard.trainee-platform.accounts', 'edit');

  const canSendCredentials = hasPermission('dashboard.trainee-platform.accounts', 'view');

  const normalizeSearchText = (value: string) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const normalizedDigits = value
      .split('')
      .map((char) => {
        const idx = arabicDigits.indexOf(char);
        return idx >= 0 ? String(idx) : char;
      })
      .join('');

    return normalizedDigits.replace(/\s+/g, ' ').trim();
  };

  const formatDate = (value?: string | null) => {
    if (!value) return 'غير متوفر';
    return new Date(value).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'لم يسجل دخول بعد';
    return new Date(value).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchPrograms = useCallback(async () => {
    try {
      const data = await AuthService.getAllPrograms();
      const list: Program[] = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
        ? (data as any).data
        : [];
      setPrograms(list);
    } catch (error) {
      console.error('Error loading programs:', error);
      setPrograms([]);
    }
  }, []);

  const fetchAccounts = useCallback(async (page: number, search: string, programId: string) => {
    try {
      setLoading(true);
      const response: AccountsResponse = await AuthService.getTraineeAccounts({
        page,
        limit: 10,
        search: search || undefined,
        programId: programId !== 'ALL' ? programId : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      const data = Array.isArray(response?.data) ? response.data : [];
      setAccounts(data);
      setCurrentPage(response?.meta?.page || page);
      setTotalPages(response?.meta?.totalPages || 1);
      setTotalAccounts(response?.meta?.total || data.length);
    } catch (error: any) {
      console.error('Error fetching trainee accounts:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل جلب حسابات المتدربين',
        text2: error?.message || 'حدث خطأ غير متوقع',
        position: 'bottom',
      });
      setAccounts([]);
      setTotalAccounts(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    fetchAccounts(currentPage, searchQuery, selectedProgram);
  }, [currentPage, searchQuery, selectedProgram, fetchAccounts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccounts(currentPage, searchQuery, selectedProgram);
  };

  const handleSearch = () => {
    const normalized = normalizeSearchText(searchInput);
    setSearchInput(normalized);
    setSearchQuery(normalized);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleProgramChange = (value: string) => {
    setSelectedProgram(value);
    setCurrentPage(1);
  };

  const handleToggleStatus = async (account: TraineeAccount) => {
    try {
      setBusyAccountId(account.id);
      await AuthService.toggleTraineeAccountStatus(account.id);
      Toast.show({
        type: 'success',
        text1: `تم ${account.isActive ? 'تعطيل' : 'تفعيل'} الحساب بنجاح`,
        text2: account.trainee.nameAr,
        position: 'bottom',
      });
      await fetchAccounts(currentPage, searchQuery, selectedProgram);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'فشل تغيير حالة الحساب',
        text2: error?.message || 'حدث خطأ غير متوقع',
        position: 'bottom',
      });
    } finally {
      setBusyAccountId(null);
    }
  };

  const openResetModal = (account: TraineeAccount) => {
    setResetTarget({ id: account.id, name: account.trainee.nameAr });
    setNewPassword('');
    setShowResetModal(true);
  };

  const submitResetPassword = async () => {
    if (!resetTarget) return;

    if (newPassword.trim().length < 6) {
      Alert.alert('تنبيه', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    try {
      setSubmittingReset(true);
      await AuthService.resetTraineeAccountPassword(resetTarget.id, newPassword.trim());
      Toast.show({
        type: 'success',
        text1: 'تم إعادة تعيين كلمة المرور بنجاح',
        text2: resetTarget.name,
        position: 'bottom',
      });
      setShowResetModal(false);
      setResetTarget(null);
      setNewPassword('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'فشل إعادة تعيين كلمة المرور',
        text2: error?.message || 'حدث خطأ غير متوقع',
        position: 'bottom',
      });
    } finally {
      setSubmittingReset(false);
    }
  };

  const openSendConfirm = (account: TraineeAccount) => {
    setSendTarget({ id: account.id, name: account.trainee.nameAr });
    setShowSendConfirmModal(true);
  };

  const confirmSendCredentials = async () => {
    if (!sendTarget) return;

    try {
      setSendingCredentials(true);
      const result = await AuthService.sendTraineeAccountCredentials(sendTarget.id);
      Toast.show({
        type: 'success',
        text1: result?.message || 'تم إرسال بيانات المنصة بنجاح',
        text2: sendTarget.name,
        position: 'bottom',
      });
      setShowSendConfirmModal(false);
      setSendTarget(null);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'فشل إرسال بيانات المنصة',
        text2: error?.message || 'حدث خطأ غير متوقع',
        position: 'bottom',
      });
    } finally {
      setSendingCredentials(false);
    }
  };

  const openPrintReport = async (type: 'all' | 'registered' | 'unregistered') => {
    try {
      const apiBase = await AuthService.getApiBaseUrl();
      const webBase = apiBase.replace(/\/api\/?$/, '');
      const url = `${webBase}/print/trainee-platform-report?type=${type}`;
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        throw new Error('تعذر فتح رابط الطباعة');
      }
      await Linking.openURL(url);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'تعذر فتح صفحة الطباعة',
        text2: error?.message || 'حدث خطأ غير متوقع',
        position: 'bottom',
      });
    }
  };

  const programItems = useMemo(
    () => [
      { value: 'ALL', label: 'جميع البرامج' },
      ...programs.map((p) => ({ value: String(p.id), label: p.nameAr || p.nameEn || `برنامج #${p.id}` })),
    ],
    [programs]
  );

  const activeCount = accounts.filter((acc) => acc.isActive).length;
  const inactiveCount = accounts.filter((acc) => !acc.isActive).length;
  const todayLoginCount = accounts.filter(
    (acc) => acc.lastLoginAt && new Date(acc.lastLoginAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="TraineeAccounts" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>إدارة حسابات المتدربين</Text>
          <Text style={styles.subtitle}>عرض وإدارة حسابات تسجيل الدخول للمتدربين</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a237e']} />}
      >
        <View style={styles.printRow}>
          <TouchableOpacity style={[styles.printBtn, styles.printBtnAll]} onPress={() => openPrintReport('all')}>
            <Icon name="print" size={16} color="#1a237e" />
            <Text style={styles.printBtnTextAll}>طباعة الكل</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.printBtn, styles.printBtnOk]} onPress={() => openPrintReport('registered')}>
            <Icon name="print" size={16} color="#166534" />
            <Text style={styles.printBtnTextOk}>المسجلين</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.printBtn, styles.printBtnWarn]} onPress={() => openPrintReport('unregistered')}>
            <Icon name="print" size={16} color="#991b1b" />
            <Text style={styles.printBtnTextWarn}>غير المسجلين</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="groups" size={20} color="#2563eb" />
            <Text style={styles.statValue}>{totalAccounts}</Text>
            <Text style={styles.statLabel}>إجمالي الحسابات</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="check-circle" size={20} color="#15803d" />
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>حسابات مفعلة</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="cancel" size={20} color="#dc2626" />
            <Text style={styles.statValue}>{inactiveCount}</Text>
            <Text style={styles.statLabel}>حسابات معطلة</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="today" size={20} color="#6b7280" />
            <Text style={styles.statValue}>{todayLoginCount}</Text>
            <Text style={styles.statLabel}>آخر دخول اليوم</Text>
          </View>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>بحث وتصفية</Text>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Icon name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="بحث بالاسم، الرقم القومي، الهاتف، البريد الإلكتروني..."
                placeholderTextColor="#94a3b8"
                onSubmitEditing={handleSearch}
              />
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
              <Text style={styles.searchBtnText}>بحث</Text>
            </TouchableOpacity>
            {searchQuery ? (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearSearch} disabled={loading}>
                <Text style={styles.clearBtnText}>مسح</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <SelectBox
            label="البرنامج"
            selectedValue={selectedProgram}
            onValueChange={handleProgramChange}
            items={programItems}
            placeholder="جميع البرامج"
          />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل الحسابات...</Text>
          </View>
        ) : accounts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="account-circle" size={40} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>لا توجد حسابات متدربين</Text>
            <Text style={styles.emptyText}>لم يتم العثور على حسابات تطابق معايير البحث الحالية</Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {accounts.map((account) => {
              const isBusy = busyAccountId === account.id;
              return (
                <View key={account.id} style={styles.accountCard}>
                  <View style={styles.topRow}>
                    <View style={styles.userInfoWrap}>
                      {account.trainee.photoUrl ? (
                        <Image source={{ uri: account.trainee.photoUrl }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Icon name="person" size={20} color="#64748b" />
                        </View>
                      )}

                      <View style={{ flex: 1 }}>
                        <Text style={styles.userName}>{account.trainee.nameAr}</Text>
                        <Text style={styles.userSub}>{account.trainee.nationalId}</Text>
                        <Text style={styles.userSub}>{account.trainee.program?.nameAr || '-'}</Text>
                      </View>
                    </View>

                    <View style={[styles.statusChip, account.isActive ? styles.statusOn : styles.statusOff]}>
                      <Text style={[styles.statusChipText, account.isActive ? styles.statusOnText : styles.statusOffText]}>
                        {account.isActive ? 'مفعل' : 'معطل'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.contactBox}>
                    <View style={styles.contactRow}>
                      <Icon name="phone" size={14} color="#64748b" />
                      <Text style={styles.contactText}>{account.trainee.phone || '-'}</Text>
                    </View>
                    {account.trainee.email ? (
                      <View style={styles.contactRow}>
                        <Icon name="email" size={14} color="#64748b" />
                        <Text style={styles.contactText}>{account.trainee.email}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.dateBox}>
                    <Text style={styles.dateText}>التسجيل: {formatDate(account.createdAt)}</Text>
                    <Text style={styles.dateText}>آخر دخول: {formatDateTime(account.lastLoginAt)}</Text>
                  </View>

                  <View style={styles.actionsWrap}>
                    <TouchableOpacity
                      style={[styles.actionBtn, account.isActive ? styles.actionDanger : styles.actionSuccess, (!canToggleStatus || isBusy) && styles.actionDisabled]}
                      onPress={() => handleToggleStatus(account)}
                      disabled={!canToggleStatus || isBusy}
                    >
                      <Icon name={account.isActive ? 'block' : 'check-circle'} size={14} color={account.isActive ? '#991b1b' : '#166534'} />
                      <Text style={[styles.actionBtnText, account.isActive ? styles.actionDangerText : styles.actionSuccessText]}>
                        {account.isActive ? 'تعطيل' : 'تفعيل'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionWarn, (!canResetPassword || isBusy) && styles.actionDisabled]}
                      onPress={() => openResetModal(account)}
                      disabled={!canResetPassword || isBusy}
                    >
                      <Icon name="lock-reset" size={14} color="#9a3412" />
                      <Text style={[styles.actionBtnText, styles.actionWarnText]}>إعادة تعيين</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionInfo, (!canSendCredentials || !account.isActive || isBusy) && styles.actionDisabled]}
                      onPress={() => openSendConfirm(account)}
                      disabled={!canSendCredentials || !account.isActive || isBusy}
                    >
                      <Icon name="send" size={14} color="#1d4ed8" />
                      <Text style={[styles.actionBtnText, styles.actionInfoText]}>إرسال البيانات</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionNeutral]}
                      onPress={() => navigation.navigate('TraineeAccountDetails', { accountId: account.id, accountName: account.trainee.nameAr })}
                    >
                      <Icon name="visibility" size={14} color="#334155" />
                      <Text style={[styles.actionBtnText, styles.actionNeutralText]}>عرض</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {totalPages > 1 ? (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[styles.pageBtn, currentPage <= 1 && styles.pageBtnDisabled]}
                  disabled={currentPage <= 1}
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <Text style={styles.pageBtnText}>السابق</Text>
                </TouchableOpacity>

                <Text style={styles.pageInfo}>صفحة {currentPage} من {totalPages}</Text>

                <TouchableOpacity
                  style={[styles.pageBtn, currentPage >= totalPages && styles.pageBtnDisabled]}
                  disabled={currentPage >= totalPages}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <Text style={styles.pageBtnText}>التالي</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={showResetModal} transparent animationType="fade" onRequestClose={() => setShowResetModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>إعادة تعيين كلمة المرور</Text>
            <Text style={styles.modalSubtitle}>المتدرب: {resetTarget?.name || '-'}</Text>

            <Text style={styles.inputLabel}>كلمة المرور الجديدة</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="6 أحرف على الأقل"
              placeholderTextColor="#9ca3af"
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowResetModal(false)} disabled={submittingReset}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={submitResetPassword} disabled={submittingReset}>
                {submittingReset ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmBtnText}>حفظ</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSendConfirmModal} transparent animationType="fade" onRequestClose={() => setShowSendConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>إرسال بيانات المنصة</Text>
            <Text style={styles.modalSubtitle}>سيتم إرسال بيانات الدخول للمتدرب: {sendTarget?.name || '-'}</Text>

            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>سيتم تحديث كلمة المرور إلى الرقم القومي تلقائيا قبل الإرسال.</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSendConfirmModal(false)} disabled={sendingCredentials}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmSendCredentials} disabled={sendingCredentials}>
                {sendingCredentials ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmBtnText}>إرسال الآن</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TraineeAccountsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: '#fff',
  },
  headerContent: { flex: 1 },
  title: { fontSize: 21, fontWeight: '800', color: '#1a237e' },
  subtitle: { marginTop: 4, color: '#6b7280', fontSize: 12 },
  content: { flex: 1, padding: 16 },
  printRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
  },
  printBtnAll: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  printBtnOk: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  printBtnWarn: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  printBtnTextAll: { color: '#1a237e', fontWeight: '700', fontSize: 11, marginLeft: 4 },
  printBtnTextOk: { color: '#166534', fontWeight: '700', fontSize: 11, marginLeft: 4 },
  printBtnTextWarn: { color: '#991b1b', fontWeight: '700', fontSize: 11, marginLeft: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: { marginTop: 4, fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel: { marginTop: 3, fontSize: 11, color: '#64748b' },
  filterCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  filterTitle: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#fff',
    height: 42,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, marginHorizontal: 6, color: '#111827', fontSize: 13 },
  searchBtn: {
    marginLeft: 8,
    backgroundColor: '#1a237e',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  clearBtn: {
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  clearBtnText: { color: '#475569', fontWeight: '700', fontSize: 12 },
  loadingBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 26,
    alignItems: 'center',
  },
  loadingText: { marginTop: 10, color: '#6b7280' },
  emptyCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: { marginTop: 8, fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyText: { marginTop: 4, color: '#6b7280', textAlign: 'center' },
  listWrap: { gap: 10 },
  accountCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfoWrap: { flexDirection: 'row', flex: 1, marginRight: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  userSub: { marginTop: 2, fontSize: 11, color: '#64748b' },
  statusChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  statusOn: { backgroundColor: '#dcfce7' },
  statusOff: { backgroundColor: '#fee2e2' },
  statusChipText: { fontSize: 11, fontWeight: '800' },
  statusOnText: { color: '#166534' },
  statusOffText: { color: '#991b1b' },
  contactBox: {
    marginTop: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 8,
    gap: 4,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactText: { marginLeft: 6, fontSize: 12, color: '#475569', flex: 1 },
  dateBox: { marginTop: 8, gap: 2 },
  dateText: { fontSize: 11, color: '#64748b' },
  actionsWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  actionBtnText: { marginLeft: 4, fontSize: 11, fontWeight: '700' },
  actionDanger: { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  actionDangerText: { color: '#991b1b' },
  actionSuccess: { borderColor: '#bbf7d0', backgroundColor: '#ecfdf5' },
  actionSuccessText: { color: '#166534' },
  actionWarn: { borderColor: '#fed7aa', backgroundColor: '#fff7ed' },
  actionWarnText: { color: '#9a3412' },
  actionInfo: { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
  actionInfoText: { color: '#1d4ed8' },
  actionNeutral: { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  actionNeutralText: { color: '#334155' },
  actionDisabled: { opacity: 0.45 },
  paginationRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 10,
  },
  pageBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pageBtnDisabled: { opacity: 0.45 },
  pageBtnText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  pageInfo: { color: '#334155', fontSize: 12, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827', textAlign: 'center' },
  modalSubtitle: { marginTop: 6, color: '#4b5563', textAlign: 'center', lineHeight: 19, fontSize: 12 },
  inputLabel: { marginTop: 12, marginBottom: 6, fontSize: 12, fontWeight: '700', color: '#374151' },
  modalInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    color: '#111827',
  },
  noticeBox: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
    padding: 10,
  },
  noticeText: { color: '#92400e', fontSize: 12, lineHeight: 18 },
  modalActions: { marginTop: 14, flexDirection: 'row', gap: 8 },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cancelBtnText: { color: '#4b5563', fontWeight: '700' },
  confirmBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
  },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
});
