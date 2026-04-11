import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import ArabicSearchInput from '../components/ArabicSearchInput';
import AuthService from '../services/AuthService';
import {usePermissions} from '../hooks/usePermissions';
import {IPaginatedTraineesResponse, ITrainee} from '../types/student';

type ProgramOption = {
  id: number;
  nameAr: string;
  nameEn?: string;
};

type SortBy = 'name' | 'id';
type SortOrder = 'asc' | 'desc';

const LIMIT_OPTIONS = [10, 20, 30, 50];

const GENDER_OPTIONS = [
  {value: 'ALL', label: 'الكل'},
  {value: 'MALE', label: 'ذكر'},
  {value: 'FEMALE', label: 'أنثى'},
];

const PROGRAM_TYPE_OPTIONS = [
  {value: 'ALL', label: 'الكل'},
  {value: 'SUMMER', label: 'صيفي'},
  {value: 'WINTER', label: 'شتوي'},
  {value: 'ANNUAL', label: 'سنوي'},
];

const StudentsListScreen = ({navigation}: any) => {
  const {hasPermission, hasAnyRole, hasScreenAction} = usePermissions();

  const canCreate = hasScreenAction('StudentsList', 'create');
  const canEdit = hasScreenAction('StudentsList', 'edit');
  const canDelete = hasScreenAction('StudentsList', 'delete');
  const canTransfer = hasScreenAction('StudentsList', 'transfer');
  const canViewPhone = hasPermission('dashboard.trainees', 'view_phone');
  const canManageTraineeFinances =
    hasPermission('dashboard.financial', 'manage') ||
    hasPermission('dashboard.financial', 'view') ||
    hasAnyRole(['super_admin', 'admin', 'manager', 'accountant']);

  const [trainees, setTrainees] = useState<ITrainee[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [filterProgram, setFilterProgram] = useState('ALL');
  const [filterGender, setFilterGender] = useState('ALL');
  const [filterProgramType, setFilterProgramType] = useState('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterGovernorate, setFilterGovernorate] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterBirthDateFrom, setFilterBirthDateFrom] = useState('');
  const [filterBirthDateTo, setFilterBirthDateTo] = useState('');

  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState<ITrainee | null>(null);

  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [photoViewerData, setPhotoViewerData] = useState<{
    uri: string;
    name: string;
    nationalId: string;
  } | null>(null);

  const getProgramTypeLabel = (programType?: string) => {
    if (programType === 'SUMMER') {
      return 'صيفي';
    }
    if (programType === 'WINTER') {
      return 'شتوي';
    }
    if (programType === 'ANNUAL') {
      return 'سنوي';
    }
    return 'غير محدد';
  };

  const getSelectedProgramLabel = () => {
    if (filterProgram === 'ALL') {
      return 'كل البرامج';
    }
    const selected = programs.find(p => String(p.id) === filterProgram);
    return selected?.nameAr || 'برنامج غير معروف';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'CURRENT':
        return '#0f766e';
      case 'NEW':
        return '#1d4ed8';
      case 'GRADUATE':
        return '#15803d';
      case 'WITHDRAWN':
        return '#dc2626';
      default:
        return '#475569';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'CURRENT':
        return 'حالي';
      case 'NEW':
        return 'جديد';
      case 'GRADUATE':
        return 'خريج';
      case 'WITHDRAWN':
        return 'منسحب';
      default:
        return 'غير محدد';
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await AuthService.getAllPrograms();
      setPrograms(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]);
    }
  };

  const fetchTrainees = async (
    page: number,
    options?: {
      limit?: number;
      search?: string;
      program?: string;
      showLoader?: boolean;
    },
  ) => {
    try {
      const effectiveLimit = options?.limit ?? pageSize;
      const effectiveSearch = options?.search ?? searchQuery;
      const effectiveProgram = options?.program ?? filterProgram;
      const showLoader = options?.showLoader ?? true;

      if (showLoader) {
        setLoading(true);
      }

      const params: {
        page: number;
        limit: number;
        search?: string;
        programId?: string;
        includeDetails?: boolean;
      } = {
        page,
        limit: effectiveLimit,
        includeDetails: true,
      };

      if (effectiveSearch) {
        params.search = effectiveSearch;
      }

      if (effectiveProgram !== 'ALL') {
        params.programId = effectiveProgram;
      }

      const result: IPaginatedTraineesResponse = await AuthService.getTrainees(params);
      const data = Array.isArray(result?.data) ? result.data : [];

      setTrainees(data);
      setCurrentPage(result?.pagination?.page ?? page);
      setTotalPages(result?.pagination?.totalPages ?? 1);
      setTotalItems(result?.pagination?.total ?? data.length);
      setPageSize(result?.pagination?.limit ?? effectiveLimit);
    } catch (error: any) {
      console.error('Error fetching trainees:', error);
      Alert.alert('خطأ', error?.message || 'فشل في تحميل بيانات المتدربين');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      await fetchPrograms();
      await fetchTrainees(1, {search: '', program: 'ALL'});
    };

    loadInitial();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrainees(currentPage, {showLoader: false});
  };

  const handleSearch = () => {
    const nextSearch = searchInput.trim();
    setSearchQuery(nextSearch);
    setCurrentPage(1);
    fetchTrainees(1, {search: nextSearch});
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
    fetchTrainees(1, {search: ''});
  };

  const handleProgramChange = (value: string) => {
    setFilterProgram(value);
    setShowProgramPicker(false);
    setCurrentPage(1);
    fetchTrainees(1, {program: value});
  };

  const handleLimitChange = (newLimit: number) => {
    setPageSize(newLimit);
    setCurrentPage(1);
    fetchTrainees(1, {limit: newLimit});
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    setCurrentPage(page);
    fetchTrainees(page, {showLoader: false});
  };

  const clearAdvancedFilters = () => {
    setFilterGovernorate('');
    setFilterCity('');
    setFilterBirthDateFrom('');
    setFilterBirthDateTo('');
  };

  const filteredTrainees = useMemo(() => {
    const normalizedGovernorate = filterGovernorate.trim().toLowerCase();
    const normalizedCity = filterCity.trim().toLowerCase();

    const fromDate = filterBirthDateFrom ? new Date(filterBirthDateFrom) : null;
    const toDate = filterBirthDateTo ? new Date(filterBirthDateTo) : null;

    if (fromDate) {
      fromDate.setHours(0, 0, 0, 0);
    }

    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    const result = trainees.filter(trainee => {
      const matchesGender = filterGender === 'ALL' || trainee.gender === filterGender;
      const matchesProgramType =
        filterProgramType === 'ALL' || trainee.programType === filterProgramType;

      const traineeGovernorate = (trainee.governorate || '').toLowerCase();
      const traineeCity = (trainee.city || '').toLowerCase();

      const matchesGovernorate =
        !normalizedGovernorate || traineeGovernorate.includes(normalizedGovernorate);
      const matchesCity = !normalizedCity || traineeCity.includes(normalizedCity);

      let matchesBirthDate = true;
      if (fromDate || toDate) {
        const birthDate = trainee.birthDate ? new Date(trainee.birthDate) : null;
        if (!birthDate || Number.isNaN(birthDate.getTime())) {
          matchesBirthDate = false;
        } else {
          if (fromDate && birthDate < fromDate) {
            matchesBirthDate = false;
          }
          if (toDate && birthDate > toDate) {
            matchesBirthDate = false;
          }
        }
      }

      return (
        matchesGender &&
        matchesProgramType &&
        matchesGovernorate &&
        matchesCity &&
        matchesBirthDate
      );
    });

    result.sort((a, b) => {
      if (sortBy === 'id') {
        return sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
      }

      const aName = a.nameAr || '';
      const bName = b.nameAr || '';
      const comparison = aName.localeCompare(bName, 'ar');
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [
    trainees,
    filterGender,
    filterProgramType,
    filterGovernorate,
    filterCity,
    filterBirthDateFrom,
    filterBirthDateTo,
    sortBy,
    sortOrder,
  ]);

  const totalCurrent = filteredTrainees.filter(t => t.traineeStatus === 'CURRENT').length;
  const totalGraduates = filteredTrainees.filter(t => t.traineeStatus === 'GRADUATE').length;

  const openActionsMenu = (trainee: ITrainee) => {
    setSelectedTrainee(trainee);
    setShowActionsModal(true);
  };

  const closeActionsMenu = () => {
    setShowActionsModal(false);
    setSelectedTrainee(null);
  };

  const openPhotoViewer = (trainee: ITrainee) => {
    if (!trainee.photoUrl) {
      return;
    }
    setPhotoViewerData({
      uri: trainee.photoUrl,
      name: trainee.nameAr,
      nationalId: trainee.nationalId,
    });
    setShowPhotoViewer(true);
  };

  const handleCall = async (phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert('تنبيه', 'رقم الهاتف غير متوفر');
      return;
    }

    const url = `tel:${phoneNumber}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('خطأ', 'لا يمكن فتح تطبيق الاتصال');
      return;
    }
    Linking.openURL(url);
  };

  const handleWhatsApp = async (phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert('تنبيه', 'رقم الهاتف غير متوفر');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`;
    const webUrl = `https://wa.me/${cleanPhone}`;

    const supported = await Linking.canOpenURL(whatsappUrl);
    Linking.openURL(supported ? whatsappUrl : webUrl);
  };

  const handleEdit = (trainee: ITrainee) => {
    closeActionsMenu();
    navigation.navigate('EditTrainee', {trainee});
  };

  const handleOpenPayments = (trainee: ITrainee) => {
    closeActionsMenu();
    navigation.navigate('TraineePaymentDetails', {
      traineeId: trainee.id,
      traineeName: trainee.nameAr,
    });
  };

  const handleOpenDocuments = (trainee: ITrainee) => {
    closeActionsMenu();
    navigation.navigate('TraineeDocuments', {
      trainee: {id: trainee.id, nameAr: trainee.nameAr},
    });
  };

  const handleOpenGrades = (trainee: ITrainee) => {
    closeActionsMenu();
    navigation.navigate('TraineeGradeDetails', {
      traineeId: trainee.id,
      traineeName: trainee.nameAr,
    });
  };

  const handleTransferGroups = () => {
    closeActionsMenu();
    navigation.navigate('TraineeTransfer');
  };

  const handleSendScheduleWhatsapp = async (trainee: ITrainee) => {
    closeActionsMenu();
    try {
      setProcessingAction(true);
      const response = await AuthService.sendTraineeScheduleWhatsApp(trainee.id);
      Alert.alert('تم بنجاح', response?.message || 'تم إرسال الجدول الدراسي عبر واتساب بنجاح');
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'حدث خطأ أثناء إرسال الجدول الدراسي');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleApplyTuitionFees = async (trainee: ITrainee) => {
    closeActionsMenu();
    try {
      setProcessingAction(true);
      const response = await AuthService.getAvailableTraineeFees(trainee.id);
      const unappliedFees = Array.isArray(response?.unappliedFees)
        ? response.unappliedFees
        : [];

      if (!unappliedFees.length) {
        Alert.alert('معلومة', 'جميع الرسوم الدراسية مطبقة بالفعل على هذا المتدرب');
        return;
      }

      const feeNames = unappliedFees.map((fee: any) => fee.name).join('، ');
      const feeIds = unappliedFees.map((fee: any) => fee.id);

      Alert.alert(
        'تطبيق الرسوم الدراسية',
        `سيتم تطبيق ${unappliedFees.length} رسوم: ${feeNames}`,
        [
          {text: 'إلغاء', style: 'cancel'},
          {
            text: 'تطبيق',
            onPress: async () => {
              try {
                setProcessingAction(true);
                const applyResponse = await AuthService.applyTraineeFees(trainee.id, feeIds);
                Alert.alert('تم', applyResponse?.message || 'تم تطبيق الرسوم الدراسية بنجاح');
                fetchTrainees(currentPage, {showLoader: false});
              } catch (error: any) {
                Alert.alert('خطأ', error?.message || 'فشل في تطبيق الرسوم الدراسية');
              } finally {
                setProcessingAction(false);
              }
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر تحميل الرسوم الدراسية المتاحة');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleApplyAdditionalFees = async (trainee: ITrainee) => {
    closeActionsMenu();
    try {
      setProcessingAction(true);
      const response = await AuthService.getAvailableAdditionalFees(trainee.id);
      const unappliedFees = Array.isArray(response?.unappliedFees)
        ? response.unappliedFees
        : [];

      if (!unappliedFees.length) {
        Alert.alert('معلومة', 'لا توجد رسوم إضافية متاحة للتطبيق');
        return;
      }

      const feeNames = unappliedFees.map((fee: any) => fee.name).join('، ');
      const feeIds = unappliedFees.map((fee: any) => fee.id);

      Alert.alert(
        'تطبيق رسوم إضافية',
        `سيتم تطبيق ${unappliedFees.length} رسوم إضافية: ${feeNames}`,
        [
          {text: 'إلغاء', style: 'cancel'},
          {
            text: 'تطبيق',
            onPress: async () => {
              try {
                setProcessingAction(true);
                const applyResponse = await AuthService.applyAdditionalFees(trainee.id, feeIds);
                Alert.alert('تم', applyResponse?.message || 'تم تطبيق الرسوم الإضافية بنجاح');
                fetchTrainees(currentPage, {showLoader: false});
              } catch (error: any) {
                Alert.alert('خطأ', error?.message || 'فشل في تطبيق الرسوم الإضافية');
              } finally {
                setProcessingAction(false);
              }
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر تحميل الرسوم الإضافية المتاحة');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCheckAndFixFees = async (trainee: ITrainee) => {
    closeActionsMenu();
    try {
      setProcessingAction(true);
      const response = await AuthService.checkAndFixTraineeFees(trainee.id);

      const summary = [
        `الرسوم الدراسية: ${response?.totalProgramFees ?? 0}`,
        `مطبقة مسبقاً: ${response?.appliedFees ?? 0}`,
        `كانت ناقصة: ${response?.missingFees ?? 0}`,
        `الحالة النهائية: ${response?.isComplete ? 'مكتملة' : 'تحتاج مراجعة'}`,
      ].join('\n');

      Alert.alert('تقرير فحص الرسوم', summary);
      fetchTrainees(currentPage, {showLoader: false});
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'حدث خطأ أثناء فحص الرسوم الدراسية');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeleteDebt = (trainee: ITrainee) => {
    closeActionsMenu();
    Alert.alert(
      'حذف مديونية المتدرب',
      `سيتم حذف الرسوم والمدفوعات الخاصة بالمتدرب ${trainee.nameAr}. هذا الإجراء لا يمكن التراجع عنه.`,
      [
        {text: 'إلغاء', style: 'cancel'},
        {
          text: 'حذف المديونية',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingAction(true);
              const response = await AuthService.deleteTraineeDebt(trainee.id);
              Alert.alert('تم', response?.message || 'تم حذف مديونية المتدرب بنجاح');
              fetchTrainees(currentPage, {showLoader: false});
            } catch (error: any) {
              Alert.alert('خطأ', error?.message || 'فشل في حذف مديونية المتدرب');
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteTrainee = (trainee: ITrainee) => {
    closeActionsMenu();
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف المتدرب "${trainee.nameAr}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`,
      [
        {text: 'إلغاء', style: 'cancel'},
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingAction(true);
              const response = await AuthService.deleteTrainee(trainee.id);
              Alert.alert('تم', response?.message || 'تم حذف المتدرب بنجاح');
              fetchTrainees(currentPage, {showLoader: false});
            } catch (error: any) {
              Alert.alert('خطأ', error?.message || 'حدث خطأ أثناء حذف المتدرب');
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ],
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) {
      return null;
    }

    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i += 1) {
      pages.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationInfo}>
          صفحة {currentPage} من {totalPages} ({totalItems} متدرب)
        </Text>

        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
            onPress={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}>
            <Icon name="chevron-left" size={20} color={currentPage === 1 ? '#94a3b8' : '#1e293b'} />
          </TouchableOpacity>

          {pages.map(page => (
            <TouchableOpacity
              key={page}
              style={[styles.pageButton, page === currentPage && styles.pageButtonActive]}
              onPress={() => handlePageChange(page)}>
              <Text style={[styles.pageButtonText, page === currentPage && styles.pageButtonTextActive]}>
                {page}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
            onPress={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}>
            <Icon
              name="chevron-right"
              size={20}
              color={currentPage === totalPages ? '#94a3b8' : '#1e293b'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTraineeCard = ({item}: {item: ITrainee}) => {
    const isMale = item.gender === 'MALE';
    const programTypeLabel = getProgramTypeLabel(item.programType);

    return (
      <View style={styles.traineeCard}>
        <View style={styles.traineeHeader}>
          <TouchableOpacity
            onPress={() => openPhotoViewer(item)}
            disabled={!item.photoUrl}
            style={styles.avatarWrap}>
            {item.photoUrl ? (
              <Image source={{uri: item.photoUrl}} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Icon name="person" size={28} color="#64748b" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.traineeMainInfo}>
            <Text style={styles.traineeName}>{item.nameAr}</Text>
            <Text style={styles.traineeSubInfo}>{item.nationalId || 'رقم قومي غير متوفر'}</Text>
            <Text style={styles.traineeSubInfo}>{item.program?.nameAr || 'برنامج غير محدد'}</Text>

            <View style={styles.badgesRow}>
              <View style={[styles.badge, isMale ? styles.badgePrimary : styles.badgePink]}>
                <Text style={[styles.badgeText, isMale ? styles.badgePrimaryText : styles.badgePinkText]}>
                  {isMale ? 'ذكر' : 'أنثى'}
                </Text>
              </View>

              <View style={styles.badgeNeutral}>
                <Text style={styles.badgeNeutralText}>{programTypeLabel}</Text>
              </View>

              <View style={styles.badgeIdWrap}>
                <Text style={styles.badgeIdText}>#{item.id}</Text>
              </View>
            </View>
          </View>

          <View style={styles.quickActionsCol}>
            {!!item.phone && (
              <>
                <TouchableOpacity style={styles.iconButtonWhatsapp} onPress={() => handleWhatsApp(item.phone)}>
                  <Icon name="chat" size={18} color="#16a34a" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButtonCall} onPress={() => handleCall(item.phone)}>
                  <Icon name="phone" size={18} color="#1d4ed8" />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.iconButtonMore} onPress={() => openActionsMenu(item)}>
              <Icon name="more-vert" size={18} color="#334155" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.traineeMetaRow}>
          <Text style={styles.metaText}>الحالة: </Text>
          <View style={[styles.metaStatusBadge, {backgroundColor: `${getStatusColor(item.traineeStatus)}22`}]}>
            <Text style={[styles.metaStatusText, {color: getStatusColor(item.traineeStatus)}]}>
              {getStatusLabel(item.traineeStatus)}
            </Text>
          </View>
          {!!item.academicYear && <Text style={styles.metaText}> • العام: {item.academicYear}</Text>}
        </View>

        {canViewPhone && (
          <View style={styles.traineeMetaRow}>
            <Icon name="phone-android" size={14} color="#64748b" />
            <Text style={styles.metaText}> {item.phone || 'غير متوفر'}</Text>
          </View>
        )}

        <View style={styles.primaryActionsRow}>
          {canEdit && (
            <TouchableOpacity style={styles.primaryActionButton} onPress={() => handleEdit(item)}>
              <Icon name="edit" size={16} color="#1d4ed8" />
              <Text style={styles.primaryActionText}>تعديل</Text>
            </TouchableOpacity>
          )}

          {canManageTraineeFinances && (
            <TouchableOpacity style={styles.primaryActionButton} onPress={() => handleOpenPayments(item)}>
              <Icon name="payments" size={16} color="#0f766e" />
              <Text style={styles.primaryActionText}>مدفوعات</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderActionItem = (
    label: string,
    iconName: string,
    onPress: () => void,
    variant: 'normal' | 'danger' = 'normal',
  ) => (
    <TouchableOpacity
      style={[styles.actionItem, variant === 'danger' && styles.actionItemDanger]}
      onPress={onPress}
      disabled={processingAction}>
      <Icon
        name={iconName}
        size={20}
        color={variant === 'danger' ? '#dc2626' : '#1e293b'}
      />
      <Text style={[styles.actionItemText, variant === 'danger' && styles.actionItemTextDanger]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const selectedProgramLabel = getSelectedProgramLabel();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <CustomMenu navigation={navigation} activeRouteName="StudentsList" />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#1e3a8a" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>المتدربين</Text>
          <Text style={styles.headerSubtitle}>نفس تدفق صفحة الويب للبحث والتصفية والإجراءات</Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.toolbarRow}>
          {canCreate && (
            <TouchableOpacity
              style={styles.toolbarPrimaryButton}
              onPress={() => navigation.navigate('AddStudent')}>
              <Icon name="person-add" size={18} color="#ffffff" />
              <Text style={styles.toolbarPrimaryButtonText}>إضافة متدرب</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.toolbarSecondaryButton}
            onPress={() => fetchTrainees(currentPage, {showLoader: true})}>
            <Icon name="refresh" size={18} color="#1e3a8a" />
            <Text style={styles.toolbarSecondaryButtonText}>تحديث</Text>
          </TouchableOpacity>
        </View>

        <ArabicSearchInput
          placeholder="ابحث بالاسم أو الرقم القومي أو الهاتف"
          value={searchInput}
          onChangeText={setSearchInput}
          onSearch={handleSearch}
        />

        {(searchInput || searchQuery) && (
          <View style={styles.activeSearchWrap}>
            <Text style={styles.activeSearchText}>
              البحث النشط: {searchQuery || searchInput}
            </Text>
            <TouchableOpacity onPress={handleClearSearch}>
              <Text style={styles.clearSearchText}>مسح</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.filterCard}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.programPickerButton}
              onPress={() => setShowProgramPicker(true)}>
              <Icon name="school" size={18} color="#1e293b" />
              <Text style={styles.programPickerText}>{selectedProgramLabel}</Text>
              <Icon name="expand-more" size={20} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortBy(prev => (prev === 'name' ? 'id' : 'name'))}>
              <Icon name="sort" size={18} color="#1e293b" />
              <Text style={styles.sortButtonText}>{sortBy === 'name' ? 'ترتيب: الاسم' : 'ترتيب: رقم الملف'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}>
              <Icon
                name={sortOrder === 'asc' ? 'south' : 'north'}
                size={18}
                color="#1e293b"
              />
              <Text style={styles.sortButtonText}>{sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>فلتر النوع</Text>
          <View style={styles.chipsRow}>
            {GENDER_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chipButton,
                  filterGender === option.value && styles.chipButtonActive,
                ]}
                onPress={() => setFilterGender(option.value)}>
                <Text
                  style={[
                    styles.chipButtonText,
                    filterGender === option.value && styles.chipButtonTextActive,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>فلتر نوع البرنامج</Text>
          <View style={styles.chipsRow}>
            {PROGRAM_TYPE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chipButton,
                  filterProgramType === option.value && styles.chipButtonActive,
                ]}
                onPress={() => setFilterProgramType(option.value)}>
                <Text
                  style={[
                    styles.chipButtonText,
                    filterProgramType === option.value && styles.chipButtonTextActive,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvancedFilters(prev => !prev)}>
            <Icon name="tune" size={18} color="#334155" />
            <Text style={styles.advancedToggleText}>
              {showAdvancedFilters ? 'إخفاء الفلاتر المتقدمة' : 'إظهار الفلاتر المتقدمة'}
            </Text>
          </TouchableOpacity>

          {showAdvancedFilters && (
            <View style={styles.advancedFiltersWrap}>
              <TextInput
                style={styles.advancedInput}
                placeholder="المحافظة"
                placeholderTextColor="#94a3b8"
                value={filterGovernorate}
                onChangeText={setFilterGovernorate}
                textAlign="right"
              />

              <TextInput
                style={styles.advancedInput}
                placeholder="المدينة"
                placeholderTextColor="#94a3b8"
                value={filterCity}
                onChangeText={setFilterCity}
                textAlign="right"
              />

              <TextInput
                style={styles.advancedInput}
                placeholder="تاريخ الميلاد من (YYYY-MM-DD)"
                placeholderTextColor="#94a3b8"
                value={filterBirthDateFrom}
                onChangeText={setFilterBirthDateFrom}
                textAlign="right"
              />

              <TextInput
                style={styles.advancedInput}
                placeholder="تاريخ الميلاد إلى (YYYY-MM-DD)"
                placeholderTextColor="#94a3b8"
                value={filterBirthDateTo}
                onChangeText={setFilterBirthDateTo}
                textAlign="right"
              />

              <TouchableOpacity style={styles.clearAdvancedButton} onPress={clearAdvancedFilters}>
                <Text style={styles.clearAdvancedButtonText}>مسح الفلاتر المتقدمة</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Icon name="groups" size={22} color="#1d4ed8" />
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>إجمالي المتدربين</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="check-circle" size={22} color="#0f766e" />
            <Text style={styles.statValue}>{totalCurrent}</Text>
            <Text style={styles.statLabel}>متدربين حاليين</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="workspace-premium" size={22} color="#15803d" />
            <Text style={styles.statValue}>{totalGraduates}</Text>
            <Text style={styles.statLabel}>خريجون</Text>
          </View>
        </View>

        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>عدد العناصر في الصفحة:</Text>
          <View style={styles.limitChipsRow}>
            {LIMIT_OPTIONS.map(limit => (
              <TouchableOpacity
                key={limit}
                style={[styles.limitChip, pageSize === limit && styles.limitChipActive]}
                onPress={() => handleLimitChange(limit)}>
                <Text style={[styles.limitChipText, pageSize === limit && styles.limitChipTextActive]}>
                  {limit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={styles.loadingText}>جاري تحميل المتدربين...</Text>
          </View>
        ) : filteredTrainees.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="people-outline" size={58} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>لا توجد نتائج مطابقة</Text>
            <Text style={styles.emptySubtitle}>
              جرّب تعديل شروط البحث أو الفلاتر المعروضة بالأعلى.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTrainees}
            keyExtractor={item => String(item.id)}
            renderItem={renderTraineeCard}
            scrollEnabled={false}
          />
        )}

        {renderPagination()}
      </ScrollView>

      <Modal visible={showProgramPicker} transparent animationType="fade" onRequestClose={() => setShowProgramPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <Text style={styles.pickerModalTitle}>اختر البرنامج</Text>

            <ScrollView style={styles.pickerModalList}>
              <TouchableOpacity
                style={[styles.pickerItem, filterProgram === 'ALL' && styles.pickerItemActive]}
                onPress={() => handleProgramChange('ALL')}>
                <Text style={[styles.pickerItemText, filterProgram === 'ALL' && styles.pickerItemTextActive]}>
                  كل البرامج
                </Text>
              </TouchableOpacity>

              {programs.map(program => {
                const selected = filterProgram === String(program.id);
                return (
                  <TouchableOpacity
                    key={program.id}
                    style={[styles.pickerItem, selected && styles.pickerItemActive]}
                    onPress={() => handleProgramChange(String(program.id))}>
                    <Text style={[styles.pickerItemText, selected && styles.pickerItemTextActive]}>
                      {program.nameAr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.pickerCloseButton} onPress={() => setShowProgramPicker(false)}>
              <Text style={styles.pickerCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showActionsModal} transparent animationType="slide" onRequestClose={closeActionsMenu}>
        <View style={styles.modalOverlayBottom}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeActionsMenu} />
          <View style={styles.actionsSheet}>
            <View style={styles.actionsHandle} />
            <Text style={styles.actionsTitle}>إجراءات المتدرب</Text>
            <Text style={styles.actionsSubtitle}>{selectedTrainee?.nameAr || ''}</Text>

            <ScrollView>
              {selectedTrainee && (
                <>
                  {renderActionItem('عرض المستندات', 'description', () => handleOpenDocuments(selectedTrainee))}
                  {renderActionItem('عرض الدرجات', 'bar-chart', () => handleOpenGrades(selectedTrainee))}

                  {canEdit &&
                    renderActionItem('تعديل المتدرب', 'edit', () => handleEdit(selectedTrainee))}

                  {canManageTraineeFinances &&
                    renderActionItem('مدفوعات المتدرب', 'payments', () => handleOpenPayments(selectedTrainee))}

                  {canTransfer &&
                    renderActionItem('تحويل المجموعات', 'swap-horiz', () => handleTransferGroups())}

                  {renderActionItem('إرسال الجدول عبر واتساب', 'calendar-month', () =>
                    handleSendScheduleWhatsapp(selectedTrainee),
                  )}

                  {canManageTraineeFinances &&
                    renderActionItem('تحميل رسوم دراسية', 'library-add', () =>
                      handleApplyTuitionFees(selectedTrainee),
                    )}

                  {canManageTraineeFinances &&
                    renderActionItem('تحميل رسوم إضافية', 'post-add', () =>
                      handleApplyAdditionalFees(selectedTrainee),
                    )}

                  {canManageTraineeFinances &&
                    renderActionItem('فحص الرسوم الدراسية', 'fact-check', () =>
                      handleCheckAndFixFees(selectedTrainee),
                    )}

                  {canManageTraineeFinances &&
                    renderActionItem('حذف مديونية المتدرب', 'delete-sweep', () =>
                      handleDeleteDebt(selectedTrainee),
                    )}

                  {canDelete &&
                    renderActionItem(
                      'حذف المتدرب',
                      'delete-forever',
                      () => handleDeleteTrainee(selectedTrainee),
                      'danger',
                    )}
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.actionsCloseButton} onPress={closeActionsMenu}>
              <Text style={styles.actionsCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPhotoViewer} transparent animationType="fade" onRequestClose={() => setShowPhotoViewer(false)}>
        <View style={styles.photoOverlay}>
          <TouchableOpacity style={styles.photoBackdrop} onPress={() => setShowPhotoViewer(false)} />
          <View style={styles.photoCard}>
            {photoViewerData?.uri ? (
              <Image source={{uri: photoViewerData.uri}} style={styles.photoLarge} resizeMode="contain" />
            ) : null}

            <Text style={styles.photoName}>{photoViewerData?.name || ''}</Text>
            <Text style={styles.photoNationalId}>{photoViewerData?.nationalId || ''}</Text>

            <TouchableOpacity style={styles.photoCloseButton} onPress={() => setShowPhotoViewer(false)}>
              <Text style={styles.photoCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {processingAction && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={styles.processingText}>جاري تنفيذ الإجراء...</Text>
          </View>
        </View>
      )}
    </View>
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
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginLeft: 8,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  headerRightSpacer: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  toolbarPrimaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  toolbarPrimaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  toolbarSecondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 12,
    gap: 8,
  },
  toolbarSecondaryButtonText: {
    color: '#1e3a8a',
    fontWeight: '700',
    fontSize: 14,
  },
  activeSearchWrap: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activeSearchText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  clearSearchText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 12,
  },
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 12,
  },
  filterRow: {
    gap: 8,
  },
  programPickerButton: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  programPickerText: {
    flex: 1,
    textAlign: 'right',
    color: '#0f172a',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  sortButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sortButtonText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
  },
  filterLabel: {
    marginTop: 10,
    marginBottom: 6,
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  chipButtonActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  chipButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  chipButtonTextActive: {
    color: '#ffffff',
  },
  advancedToggle: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  advancedToggleText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  advancedFiltersWrap: {
    marginTop: 10,
    gap: 8,
  },
  advancedInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    color: '#0f172a',
    fontSize: 13,
  },
  clearAdvancedButton: {
    marginTop: 4,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
  },
  clearAdvancedButtonText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  limitRow: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginBottom: 10,
  },
  limitLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 8,
  },
  limitChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  limitChip: {
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingVertical: 6,
  },
  limitChipActive: {
    borderColor: '#1e3a8a',
    backgroundColor: '#1e3a8a',
  },
  limitChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  limitChipTextActive: {
    color: '#ffffff',
  },
  loadingWrap: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 12,
    fontSize: 14,
  },
  emptyWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 34,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    color: '#334155',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  traineeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
  },
  traineeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    marginLeft: 10,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  traineeMainInfo: {
    flex: 1,
  },
  traineeName: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  traineeSubInfo: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgePrimary: {
    backgroundColor: '#dbeafe',
  },
  badgePrimaryText: {
    color: '#1d4ed8',
  },
  badgePink: {
    backgroundColor: '#fce7f3',
  },
  badgePinkText: {
    color: '#be185d',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeNeutral: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  badgeNeutralText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  badgeIdWrap: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  badgeIdText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  quickActionsCol: {
    gap: 6,
    marginRight: 8,
  },
  iconButtonWhatsapp: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  iconButtonCall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  iconButtonMore: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  traineeMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  metaText: {
    color: '#64748b',
    fontSize: 12,
  },
  metaStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  metaStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  primaryActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryActionText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationContainer: {
    paddingTop: 6,
    paddingBottom: 18,
    alignItems: 'center',
  },
  paginationInfo: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 8,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageButton: {
    minWidth: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pageButtonActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  pageButtonDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  pageButtonText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  pageButtonTextActive: {
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  pickerModalCard: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
  },
  pickerModalTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 8,
  },
  pickerModalList: {
    maxHeight: 360,
  },
  pickerItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  pickerItemActive: {
    borderColor: '#1e3a8a',
    backgroundColor: '#eff6ff',
  },
  pickerItemText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  pickerItemTextActive: {
    color: '#1e3a8a',
  },
  pickerCloseButton: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  pickerCloseButtonText: {
    color: '#334155',
    fontWeight: '700',
  },
  modalOverlayBottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  actionsSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingBottom: 20,
    maxHeight: '82%',
  },
  actionsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  actionsTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
  },
  actionsSubtitle: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  actionItemDanger: {
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  actionItemText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  actionItemTextDanger: {
    color: '#b91c1c',
  },
  actionsCloseButton: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  actionsCloseButtonText: {
    color: '#334155',
    fontWeight: '700',
  },
  photoOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  photoBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.85)',
  },
  photoCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  photoLarge: {
    width: '100%',
    height: 280,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  photoName: {
    marginTop: 10,
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  photoNationalId: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  },
  photoCloseButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  photoCloseButtonText: {
    color: '#334155',
    fontWeight: '700',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 180,
  },
  processingText: {
    marginTop: 10,
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default StudentsListScreen;
