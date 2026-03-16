import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import Toast from 'react-native-toast-message';
import StudyMaterialsService from '../services/StudyMaterialsService';
import AuthService from '../services/AuthService';

type DeliveryStatus = 'PENDING' | 'DELIVERED' | 'RETURNED' | 'LOST' | null;

type Trainee = {
  id: number;
  nameAr: string;
  nameEn?: string;
  nationalId: string;
  phone?: string;
  photoUrl?: string;
};

type PaymentInfo = {
  isPaid: boolean;
  amountPaid: number;
  remainingAmount: number;
};

type TraineeItem = Trainee & {
  deliveryStatus: DeliveryStatus;
  deliveryId?: string;
  deliveryDate?: string;
  quantity?: number;
  feePaymentStatus?: PaymentInfo | null;
};

const STATUS_META: Record<Exclude<DeliveryStatus, null>, { color: string; bg: string; label: string; icon: string }> = {
  PENDING: { color: '#92400e', bg: '#fef3c7', label: 'قيد الانتظار', icon: 'schedule' },
  DELIVERED: { color: '#065f46', bg: '#d1fae5', label: 'تم التسليم', icon: 'check-circle' },
  RETURNED: { color: '#1e40af', bg: '#dbeafe', label: 'تم الإرجاع', icon: 'autorenew' },
  LOST: { color: '#991b1b', bg: '#fee2e2', label: 'مفقود', icon: 'error-outline' },
};

const PAGE_SIZE = 20;

const DeliveryTrackingMaterialScreen = ({ route, navigation }: any) => {
  const materialId = String(route?.params?.materialId || '');

  const [loadingMaterial, setLoadingMaterial] = useState(true);
  const [loadingTrainees, setLoadingTrainees] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [material, setMaterial] = useState<any>(null);
  const [allTrainees, setAllTrainees] = useState<TraineeItem[]>([]);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(1);

  const paginatedTrainees = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return allTrainees.slice(start, start + PAGE_SIZE);
  }, [allTrainees, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(allTrainees.length / PAGE_SIZE)), [allTrainees.length]);

  const loadMaterial = useCallback(async () => {
    try {
      setLoadingMaterial(true);
      const data = await StudyMaterialsService.getStudyMaterialById(materialId);
      setMaterial(data);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'فشل تحميل بيانات الأداة', text2: error?.message, position: 'bottom' });
      setMaterial(null);
    } finally {
      setLoadingMaterial(false);
    }
  }, [materialId]);

  const loadTrainees = useCallback(async () => {
    if (!material?.programId) return;

    try {
      setLoadingTrainees(true);

      const authAny = AuthService as any;

      const traineesResponse = typeof authAny.getTraineesByProgram === 'function'
        ? await authAny.getTraineesByProgram(material.programId, searchQuery)
        : await authAny.getTrainees({
            programId: String(material.programId),
            search: searchQuery || undefined,
            limit: 1000,
          });
      const traineesRaw = Array.isArray(traineesResponse)
        ? traineesResponse
        : traineesResponse?.trainees || traineesResponse?.data || [];

      const deliveriesResponse = await StudyMaterialsService.getDeliveries({
        studyMaterialId: materialId,
        limit: 1000,
      });
      const deliveries: any[] = (deliveriesResponse?.deliveries || []) as any[];

      let paymentStatuses: any[] = [];
      if (material?.linkedFeeId) {
        const paymentsResponse = typeof authAny.getTraineePaymentsByFee === 'function'
          ? await authAny.getTraineePaymentsByFee(material.linkedFeeId)
          : await authAny.getTraineePayments({ feeId: material.linkedFeeId, limit: 1000 });
        paymentStatuses = Array.isArray(paymentsResponse)
          ? paymentsResponse
          : paymentsResponse?.payments || paymentsResponse?.data || [];
      }

      const mapped: TraineeItem[] = traineesRaw.map((t: any) => {
        const delivery = deliveries.find((d: any) => Number(d.traineeId) === Number(t.id));

        let feePaymentStatus: PaymentInfo | null = null;
        if (material?.linkedFee && material?.linkedFeeId) {
          const payment = paymentStatuses.find((p: any) => Number(p.traineeId) === Number(t.id));
          const amountPaid = Number(payment?.paidAmount || 0);
          const requiredAmount = Number(material.linkedFee.amount || 0);
          feePaymentStatus = {
            isPaid: amountPaid >= requiredAmount,
            amountPaid,
            remainingAmount: Math.max(0, requiredAmount - amountPaid),
          };
        }

        return {
          id: Number(t.id),
          nameAr: t.nameAr || t.name || `متدرب ${t.id}`,
          nameEn: t.nameEn || undefined,
          nationalId: t.nationalId || '-',
          phone: t.phone || '',
          photoUrl: t.photoUrl,
          deliveryStatus: (delivery?.status || null) as DeliveryStatus,
          deliveryId: delivery?.id,
          deliveryDate: delivery?.deliveryDate,
          quantity: delivery?.quantity,
          feePaymentStatus,
        };
      });

      setAllTrainees(mapped);
      setPage(1);
    } catch (error: any) {
      setAllTrainees([]);
      Toast.show({ type: 'error', text1: 'فشل تحميل المتدربين', text2: error?.message, position: 'bottom' });
    } finally {
      setLoadingTrainees(false);
      setRefreshing(false);
    }
  }, [material, materialId, searchQuery]);

  useEffect(() => {
    loadMaterial();
  }, [loadMaterial]);

  useEffect(() => {
    if (material) {
      loadTrainees();
    }
  }, [material, loadTrainees]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMaterial(), loadTrainees()]);
  };

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput.trim());
  };

  const canDeliverTo = (trainee: TraineeItem): { ok: boolean; reason?: string } => {
    if (!material) return { ok: false, reason: 'الأداة غير متاحة' };
    if (material.quantity <= 0) return { ok: false, reason: 'الكمية غير كافية' };

    if (trainee.deliveryStatus && trainee.deliveryStatus !== 'RETURNED') {
      if (trainee.deliveryStatus === 'PENDING') return { ok: false, reason: 'طلب التسليم مسجل بالفعل' };
      if (trainee.deliveryStatus === 'DELIVERED') return { ok: false, reason: 'تم التسليم مسبقًا' };
      if (trainee.deliveryStatus === 'LOST') return { ok: false, reason: 'تم تسجيل الأداة كمفقودة لهذا المتدرب' };
      return { ok: false, reason: 'لا يمكن التسليم الآن' };
    }

    if (trainee.feePaymentStatus && !trainee.feePaymentStatus.isPaid) {
      return { ok: false, reason: `متبقي ${trainee.feePaymentStatus.remainingAmount} ج.م` };
    }

    return { ok: true };
  };

  const askConfirm = (title: string, message: string, onConfirm: () => void) => {
    Alert.alert(title, message, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تأكيد', style: 'destructive', onPress: onConfirm },
    ]);
  };

  const handleDeliver = async (trainee: TraineeItem) => {
    const check = canDeliverTo(trainee);
    if (!check.ok) {
      Toast.show({ type: 'error', text1: check.reason || 'لا يمكن التسليم', position: 'bottom' });
      return;
    }

    askConfirm('تأكيد التسليم', `تأكيد تسليم ${material?.name} إلى ${trainee.nameAr}?`, async () => {
      try {
        setProcessingId(trainee.id);
        await StudyMaterialsService.createDelivery({
          studyMaterialId: materialId,
          traineeId: trainee.id,
          quantity: 1,
        });
        Toast.show({ type: 'success', text1: 'تم تسجيل التسليم بنجاح', position: 'bottom' });
        await Promise.all([loadMaterial(), loadTrainees()]);
      } catch (error: any) {
        Toast.show({ type: 'error', text1: 'فشل تسجيل التسليم', text2: error?.message, position: 'bottom' });
      } finally {
        setProcessingId(null);
      }
    });
  };

  const handleUpdateStatus = async (trainee: TraineeItem, status: 'RETURNED' | 'LOST') => {
    if (!trainee.deliveryId) return;

    const label = status === 'RETURNED' ? 'تأكيد الإرجاع' : 'تأكيد الفقدان';
    const message = status === 'RETURNED'
      ? `تأكيد استلام الأداة من ${trainee.nameAr}?`
      : `تأكيد تسجيل الأداة كمفقودة للمتدرب ${trainee.nameAr}?`;

    askConfirm(label, message, async () => {
      try {
        setProcessingId(trainee.id);
        await StudyMaterialsService.updateDelivery(trainee.deliveryId as string, { status });
        Toast.show({ type: 'success', text1: 'تم تحديث الحالة بنجاح', position: 'bottom' });
        await Promise.all([loadMaterial(), loadTrainees()]);
      } catch (error: any) {
        Toast.show({ type: 'error', text1: 'فشل تحديث الحالة', text2: error?.message, position: 'bottom' });
      } finally {
        setProcessingId(null);
      }
    });
  };

  const renderStatus = (status: DeliveryStatus) => {
    if (!status) {
      return (
        <View style={[styles.statusPill, { backgroundColor: '#f8fafc' }]}>
          <Text style={[styles.statusText, { color: '#64748b' }]}>لم يسلّم</Text>
        </View>
      );
    }

    const meta = STATUS_META[status];
    return (
      <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
        <Icon name={meta.icon} size={13} color={meta.color} />
        <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
      </View>
    );
  };

  const renderActions = (trainee: TraineeItem) => {
    const check = canDeliverTo(trainee);

    if (!trainee.deliveryStatus) {
      return (
        <TouchableOpacity
          style={[styles.actionBtn, styles.deliverBtn, !check.ok && styles.disabledBtn]}
          disabled={!check.ok || processingId === trainee.id}
          onPress={() => handleDeliver(trainee)}
        >
          {processingId === trainee.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="check-circle" size={15} color="#fff" />
              <Text style={styles.actionText}>تسليم</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    if (trainee.deliveryStatus === 'RETURNED') {
      return (
        <TouchableOpacity
          style={[styles.actionBtn, styles.deliverBtn]}
          disabled={processingId === trainee.id}
          onPress={() => handleDeliver(trainee)}
        >
          {processingId === trainee.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionText}>إعادة تسليم</Text>}
        </TouchableOpacity>
      );
    }

    return (
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {trainee.deliveryStatus === 'DELIVERED' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.returnBtn]}
            disabled={processingId === trainee.id}
            onPress={() => handleUpdateStatus(trainee, 'RETURNED')}
          >
            <Text style={styles.actionText}>إرجاع</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.lostBtn]}
          disabled={processingId === trainee.id}
          onPress={() => handleUpdateStatus(trainee, 'LOST')}
        >
          <Text style={styles.actionText}>مفقود</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTraineeCard = ({ item }: { item: TraineeItem }) => (
    <View style={styles.traineeCard}>
      <View style={styles.traineeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.traineeName}>{item.nameAr}</Text>
          <Text style={styles.traineeMeta}>الرقم القومي: {item.nationalId}</Text>
          {!!item.phone && <Text style={styles.traineeMeta}>الهاتف: {item.phone}</Text>}
        </View>
        {renderStatus(item.deliveryStatus)}
      </View>

      {!!material?.linkedFee && !!item.feePaymentStatus && (
        <View style={[styles.paymentBox, item.feePaymentStatus.isPaid ? styles.paymentPaid : styles.paymentUnpaid]}>
          <Icon
            name={item.feePaymentStatus.isPaid ? 'verified' : 'warning-amber'}
            size={14}
            color={item.feePaymentStatus.isPaid ? '#065f46' : '#991b1b'}
          />
          <Text style={[styles.paymentText, { color: item.feePaymentStatus.isPaid ? '#065f46' : '#991b1b' }]}>
            {item.feePaymentStatus.isPaid
              ? `مسدد بالكامل (${item.feePaymentStatus.amountPaid} ج.م)`
              : `غير مسدد - متبقي ${item.feePaymentStatus.remainingAmount} ج.م`}
          </Text>
        </View>
      )}

      <View style={styles.actionsWrap}>{renderActions(item)}</View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="DeliveryTracking" />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{material ? `تسليم: ${material.name}` : 'تفاصيل التسليم'}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Icon name="refresh" size={20} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.content}
        data={paginatedTrainees}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTraineeCard}
        contentContainerStyle={{ padding: 16, paddingBottom: 26 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <View style={styles.materialBox}>
              {loadingMaterial ? (
                <ActivityIndicator size="small" color="#1a237e" />
              ) : material ? (
                <>
                  <Text style={styles.materialName}>{material.name}</Text>
                  {!!material.program?.nameAr && <Text style={styles.materialProgram}>{material.program.nameAr}</Text>}
                  <View style={styles.materialStatsRow}>
                    <Text style={styles.materialStat}>الكمية المتاحة: {material.quantity}</Text>
                    <Text style={styles.materialStat}>إجمالي المتدربين: {allTrainees.length}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.materialName}>تعذر تحميل بيانات الأداة</Text>
              )}
            </View>

            <View style={styles.searchWrap}>
              <Icon name="search" size={20} color="#94a3b8" style={{ marginHorizontal: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="ابحث في المتدربين..."
                placeholderTextColor="#94a3b8"
                onSubmitEditing={handleSearchSubmit}
              />
              {!!searchQuery && (
                <TouchableOpacity onPress={() => { setSearchInput(''); setSearchQuery(''); }}>
                  <Icon name="close" size={20} color="#64748b" style={{ marginHorizontal: 8 }} />
                </TouchableOpacity>
              )}
            </View>

            {loadingTrainees && (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color="#1a237e" />
              </View>
            )}

            {!loadingTrainees && allTrainees.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="people-outline" size={72} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>لا يوجد متدربين</Text>
                <Text style={styles.emptySubtitle}>لا توجد نتائج مطابقة للبحث الحالي</Text>
              </View>
            )}
          </>
        }
        ListFooterComponent={
          !loadingTrainees && allTrainees.length > 0 ? (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageBtn, page <= 1 && styles.disabledBtn]}
                disabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                <Icon name="chevron-left" size={20} color="#1e3a8a" />
              </TouchableOpacity>
              <Text style={styles.pageText}>صفحة {page} من {totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageBtn, page >= totalPages && styles.disabledBtn]}
                disabled={page >= totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <Icon name="chevron-right" size={20} color="#1e3a8a" />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  refreshBtn: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: '84%',
  },
  content: {
    flex: 1,
  },
  materialBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  materialProgram: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  materialStatsRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  materialStat: {
    fontSize: 12,
    color: '#334155',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#1f2937',
    textAlign: 'right',
  },
  centerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  traineeCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  traineeHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  traineeName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  traineeMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  paymentBox: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  paymentPaid: {
    backgroundColor: '#ecfdf5',
  },
  paymentUnpaid: {
    backgroundColor: '#fef2f2',
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsWrap: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    minHeight: 34,
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  deliverBtn: {
    backgroundColor: '#059669',
  },
  returnBtn: {
    backgroundColor: '#1d4ed8',
  },
  lostBtn: {
    backgroundColor: '#dc2626',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  paginationRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  pageText: {
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 13,
  },
  disabledBtn: {
    opacity: 0.4,
  },
});

export default DeliveryTrackingMaterialScreen;
