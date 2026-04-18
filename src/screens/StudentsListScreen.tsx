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
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import CustomMenu from '../components/CustomMenu';
import ArabicSearchInput from '../components/ArabicSearchInput';
import AuthService from '../services/AuthService';
import { mapApiBaseToFrontendBaseUrl } from '../config/api';
import {usePermissions} from '../hooks/usePermissions';
import {IPaginatedTraineesResponse, ITrainee} from '../types/student';

type ProgramOption = {
  id: number;
  nameAr: string;
  nameEn?: string;
};

type TraineeNote = {
  id: string;
  content: string;
  createdAt?: string;
  createdBy?: {
    nameAr?: string;
    username?: string;
  };
};

type FeeWithSchedule = {
  id: number;
  name: string;
  paymentDueDate?: string;
  gracePeriodDays?: number;
};

type TraineePaymentException = {
  id: string;
  reason: string;
  notes?: string;
  customPaymentEndDate?: string;
  customGracePeriodDays?: number;
  createdAt?: string;
  fee?: {
    id: number;
    name?: string;
  };
  createdBy?: {
    nameAr?: string;
    username?: string;
  };
};

type DisciplinaryAction = {
  id: string;
  actionType: string;
  status: string;
  reason: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
};

type MinistryDeclarationUpload = {
  url: string;
  cloudinaryId?: string;
  fileName: string;
  mimeType: string;
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

const DISCIPLINARY_ACTION_OPTIONS = [
  {value: 'WARNING', label: 'إنذار'},
  {value: 'GUARDIAN_SUMMON', label: 'استدعاء ولي الأمر'},
  {value: 'REPORT_FILING', label: 'تحرير محضر'},
  {value: 'TEMPORARY_SUSPENSION', label: 'إيقاف مؤقت'},
  {value: 'PERMANENT_EXPULSION', label: 'فصل نهائي'},
];

const StudentsListScreen = ({navigation}: any) => {
  const {hasPermission, hasAnyRole, hasScreenAction} = usePermissions();

  const canCreate = hasScreenAction('StudentsList', 'create');
  const canEdit = hasScreenAction('StudentsList', 'edit');
  const canDelete = hasScreenAction('StudentsList', 'delete');
  const canTransfer = hasScreenAction('StudentsList', 'transfer');
  const canViewPhone = hasPermission('dashboard.trainees', 'view_phone');
  const canManagePaymentExceptions = hasPermission(
    'dashboard.trainees.payment-exceptions',
    'manage',
  );
  const canManageDisciplinaryActions = hasPermission(
    'dashboard.trainees.disciplinary-actions',
    'manage',
  );
  const canViewMinistryDeclaration =
    hasPermission('dashboard.ministry-exam-declarations', 'view') ||
    hasAnyRole(['super_admin', 'admin', 'manager']);
  const canConfirmMinistryDeclarationDelivery =
    hasPermission('dashboard.ministry-exam-declarations', 'confirm-delivery') ||
    hasAnyRole(['super_admin', 'admin', 'manager']);
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

  const [showStatisticsModal, setShowStatisticsModal] = useState(false);

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notes, setNotes] = useState<TraineeNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  const [showMinistryDeliveryModal, setShowMinistryDeliveryModal] = useState(false);
  const [ministryDeliveryNotes, setMinistryDeliveryNotes] = useState('');
  const [ministryDeclarationPreviewUri, setMinistryDeclarationPreviewUri] = useState('');
  const [ministryDeclarationUpload, setMinistryDeclarationUpload] =
    useState<MinistryDeclarationUpload | null>(null);
  const [ministryUploadLoading, setMinistryUploadLoading] = useState(false);
  const [ministryDeliverySubmitting, setMinistryDeliverySubmitting] = useState(false);

  const [showPaymentExceptionModal, setShowPaymentExceptionModal] = useState(false);
  const [exceptionFees, setExceptionFees] = useState<FeeWithSchedule[]>([]);
  const [exceptionFeeId, setExceptionFeeId] = useState('ALL');
  const [exceptionEndDate, setExceptionEndDate] = useState('');
  const [exceptionGraceDays, setExceptionGraceDays] = useState('0');
  const [exceptionReason, setExceptionReason] = useState('');
  const [exceptionNotes, setExceptionNotes] = useState('');

  const [showExceptionsListModal, setShowExceptionsListModal] = useState(false);
  const [exceptionsLoading, setExceptionsLoading] = useState(false);
  const [paymentExceptions, setPaymentExceptions] = useState<TraineePaymentException[]>([]);

  const [showDisciplinaryModal, setShowDisciplinaryModal] = useState(false);
  const [disciplinaryActionType, setDisciplinaryActionType] = useState('WARNING');
  const [disciplinaryReason, setDisciplinaryReason] = useState('');
  const [disciplinaryNotes, setDisciplinaryNotes] = useState('');
  const [disciplinaryStartDate, setDisciplinaryStartDate] = useState('');
  const [disciplinaryEndDate, setDisciplinaryEndDate] = useState('');

  const [showDisciplinaryListModal, setShowDisciplinaryListModal] = useState(false);
  const [disciplinaryLoading, setDisciplinaryLoading] = useState(false);
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryAction[]>([]);

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

  const getDisciplinaryActionLabel = (actionType?: string) => {
    switch (actionType) {
      case 'WARNING':
        return 'إنذار';
      case 'GUARDIAN_SUMMON':
        return 'استدعاء ولي الأمر';
      case 'REPORT_FILING':
        return 'تحرير محضر';
      case 'TEMPORARY_SUSPENSION':
        return 'إيقاف مؤقت';
      case 'PERMANENT_EXPULSION':
        return 'فصل نهائي';
      default:
        return actionType || 'غير محدد';
    }
  };

  const getDisciplinaryStatusLabel = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'نشط';
      case 'COMPLETED':
        return 'مكتمل';
      case 'CANCELLED':
        return 'ملغي';
      default:
        return status || 'غير محدد';
    }
  };

  const formatDateAr = (value?: string) => {
    if (!value) {
      return 'غير متوفر';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTimeAr = (value?: string) => {
    if (!value) {
      return 'غير متوفر';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const programStats = useMemo(() => {
    const map = new Map<string, number>();
    filteredTrainees.forEach(trainee => {
      const label = trainee.program?.nameAr || 'غير محدد';
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredTrainees]);

  const governorateStats = useMemo(() => {
    const map = new Map<string, number>();
    filteredTrainees.forEach(trainee => {
      const label = trainee.governorate?.trim() || 'غير محدد';
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredTrainees]);

  const cityStats = useMemo(() => {
    const map = new Map<string, number>();
    filteredTrainees.forEach(trainee => {
      const label = trainee.city?.trim() || 'غير محدد';
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredTrainees]);

  const openActionsMenu = (trainee: ITrainee) => {
    setSelectedTrainee(trainee);
    setShowActionsModal(true);
  };

  const closeActionsMenu = (keepSelectedTrainee = false) => {
    setShowActionsModal(false);
    if (!keepSelectedTrainee) {
      setSelectedTrainee(null);
    }
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

  const handleEdit = async (trainee: ITrainee) => {
    closeActionsMenu();
    try {
      setProcessingAction(true);
      const response = await AuthService.getTraineeById(trainee.id);
      const fullTrainee = (response?.data || response || trainee) as ITrainee;
      navigation.navigate('EditTrainee', {trainee: fullTrainee});
    } catch (error) {
      console.error('Failed to fetch full trainee before edit, using list payload:', error);
      navigation.navigate('EditTrainee', {trainee});
    } finally {
      setProcessingAction(false);
    }
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

  const handleOpenTraineeArchive = (trainee: ITrainee) => {
    closeActionsMenu();
    navigation.navigate('TraineeDocuments', {
      trainee: {id: trainee.id, nameAr: trainee.nameAr},
    });
  };

  const handleOpenApplicationFormInApp = async (trainee: ITrainee) => {
    closeActionsMenu();
    try {
      setProcessingAction(true);
      const apiBaseUrl = await AuthService.getCurrentApiBaseUrl();
      const authToken = await AuthService.getToken();
      const webBaseUrl = mapApiBaseToFrontendBaseUrl(apiBaseUrl);

      const printUrl = `${webBaseUrl}/print/application-form/${trainee.id}`;

      navigation.navigate('PrintWebView', {
        url: printUrl,
        title: `استمارة ${trainee.nameAr}`,
        authToken,
      });
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر فتح استمارة المتدرب');
    } finally {
      setProcessingAction(false);
    }
  };

  const getMinistryPolicyBlockingMessage = (payload: any): string | null => {
    const policy = payload?.submissionPolicy;

    if (!policy || typeof policy !== 'object') {
      return null;
    }

    const hasLinkedFee = !!policy?.fee;
    const isRequestsOpen = policy?.isRequestsOpen === true;
    const isFullyPaid = policy?.payment?.isFullyPaid === true;

    if (hasLinkedFee && isRequestsOpen && !isFullyPaid) {
      const feeName = policy?.fee?.name || 'رسم اختبار وزارة العمل';
      const feeAmountValue = Number(policy?.fee?.amount ?? policy?.payment?.requiredAmount ?? 0);
      const feeAmount =
        feeAmountValue > 0 ? ` (${feeAmountValue.toLocaleString('ar-EG')} ج.م)` : '';

      return `لا يمكن طباعة أو تسليم إقرار وزارة العمل لهذا المتدرب قبل سداد الرسم المرتبط بالكامل. الرسم المطلوب: ${feeName}${feeAmount}.`;
    }

    if (policy?.isBlocked === true) {
      return policy?.blockReason || 'لا يمكن تنفيذ الإجراء على إقرار وزارة العمل في الوقت الحالي.';
    }

    return null;
  };

  const resolveMinistryDeclarationPrintUrl = (payload: any, webBaseUrl: string) => {
    const rawPath = typeof payload?.path === 'string' ? payload.path.trim() : '';
    const normalizedPath = rawPath
      ? rawPath.startsWith('/')
        ? rawPath
        : `/${rawPath}`
      : '';

    const urlFromPath = normalizedPath ? `${webBaseUrl}${normalizedPath}` : '';
    const urlFromPayload = typeof payload?.url === 'string' ? payload.url.trim() : '';
    const tokenFromPayload = typeof payload?.token === 'string' ? payload.token.trim() : '';
    const urlFromToken = tokenFromPayload
      ? `${webBaseUrl}/print/ministry-exam-declaration/${encodeURIComponent(tokenFromPayload)}`
      : '';

    return urlFromPath || urlFromPayload || urlFromToken;
  };

  const handleOpenMinistryDeclarationPrint = async (trainee: ITrainee) => {
    closeActionsMenu();
    try {
      setProcessingAction(true);

      const statusPayload = await AuthService.getMinistryDeclarationDeliveryStatus(trainee.id);
      const blockingMessage = getMinistryPolicyBlockingMessage(statusPayload);
      if (blockingMessage) {
        Alert.alert('تنبيه', blockingMessage);
        return;
      }

      const apiBaseUrl = await AuthService.getCurrentApiBaseUrl();
      const authToken = await AuthService.getToken();
      const webBaseUrl = mapApiBaseToFrontendBaseUrl(apiBaseUrl);

      const linkPayload = await AuthService.getMinistryDeclarationPublicLink(trainee.id);
      const printUrl = resolveMinistryDeclarationPrintUrl(linkPayload, webBaseUrl);

      if (!printUrl) {
        Alert.alert('خطأ', 'تعذر إنشاء رابط طباعة الإقرار لهذا المتدرب');
        return;
      }

      navigation.navigate('PrintWebView', {
        url: printUrl,
        title: `إقرار وزارة العمل - ${trainee.nameAr}`,
        authToken,
      });
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر فتح نموذج إقرار وزارة العمل');
    } finally {
      setProcessingAction(false);
    }
  };

  const resetMinistryDeliveryState = () => {
    setMinistryDeliveryNotes('');
    setMinistryDeclarationPreviewUri('');
    setMinistryDeclarationUpload(null);
    setMinistryUploadLoading(false);
    setMinistryDeliverySubmitting(false);
  };

  const closeMinistryDeliveryModal = () => {
    setShowMinistryDeliveryModal(false);
    resetMinistryDeliveryState();
    setSelectedTrainee(null);
  };

  const handleOpenMinistryDeliveryModal = async (trainee: ITrainee) => {
    closeActionsMenu(true);
    try {
      setProcessingAction(true);

      const statusPayload = await AuthService.getMinistryDeclarationDeliveryStatus(trainee.id);
      const blockingMessage = getMinistryPolicyBlockingMessage(statusPayload);
      if (blockingMessage) {
        Alert.alert('تنبيه', blockingMessage);
        return;
      }

      if (statusPayload?.canDeliver === false) {
        Alert.alert('تنبيه', statusPayload?.message || 'تم استلام الإقرار مسبقاً');
        return;
      }

      setSelectedTrainee(trainee);
      resetMinistryDeliveryState();
      setShowMinistryDeliveryModal(true);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر التحقق من حالة التسليم');
    } finally {
      setProcessingAction(false);
    }
  };

  const buildMinistryDeclarationFileMeta = (asset: {
    uri?: string;
    fileName?: string;
    type?: string;
  }) => {
    const uri = asset?.uri;
    if (!uri) {
      throw new Error('بيانات صورة الإقرار غير مكتملة');
    }

    const fallbackName = `ministry-declaration-${Date.now()}.jpg`;
    const fileName = asset.fileName || uri.split('/').pop() || fallbackName;
    const fileType = asset.type || 'image/jpeg';

    return {
      uri,
      name: fileName,
      type: fileType,
    };
  };

  const handleUploadMinistryDeclarationFile = async (asset: {
    uri?: string;
    fileName?: string;
    type?: string;
  }) => {
    const previousPreview = ministryDeclarationPreviewUri;
    const previousUpload = ministryDeclarationUpload;

    try {
      const uploadFile = buildMinistryDeclarationFileMeta(asset);

      setMinistryDeclarationPreviewUri(uploadFile.uri);
      setMinistryUploadLoading(true);

      const uploaded = await AuthService.uploadFile(uploadFile, 'ministry-declarations');
      const uploadedUrl = String(uploaded?.url || '').trim();

      if (!uploadedUrl) {
        throw new Error('تم رفع الصورة لكن لم يتم استلام الرابط');
      }

      setMinistryDeclarationPreviewUri(uploadedUrl);
      setMinistryDeclarationUpload({
        url: uploadedUrl,
        cloudinaryId: String(uploaded?.public_id || '').trim() || undefined,
        fileName: String(uploaded?.originalname || uploadFile.name || `declaration-${Date.now()}.jpg`),
        mimeType: String(uploaded?.mimetype || uploadFile.type || 'image/jpeg'),
      });
    } catch (error: any) {
      setMinistryDeclarationPreviewUri(previousPreview);
      setMinistryDeclarationUpload(previousUpload);
      Alert.alert('خطأ', error?.message || 'فشل في رفع صورة إقرار وزارة العمل');
    } finally {
      setMinistryUploadLoading(false);
    }
  };

  const handlePickMinistryDeclarationFile = () => {
    if (ministryUploadLoading || ministryDeliverySubmitting) {
      return;
    }

    Alert.alert('رفع صورة الإقرار', 'اختر الطريقة المناسبة', [
      {
        text: 'التقاط صورة بالكاميرا',
        onPress: () => {
          launchCamera({mediaType: 'photo', quality: 0.7, saveToPhotos: true}, response => {
            if (response.didCancel) {
              return;
            }
            if (response.errorCode) {
              Alert.alert('خطأ', 'حدث خطأ أثناء استخدام الكاميرا');
              return;
            }
            const asset = response.assets?.[0];
            if (asset) {
              handleUploadMinistryDeclarationFile(asset);
            }
          });
        },
      },
      {
        text: 'اختيار صورة من المعرض',
        onPress: () => {
          launchImageLibrary({mediaType: 'photo', quality: 0.7}, response => {
            if (response.didCancel) {
              return;
            }
            if (response.errorCode) {
              Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة');
              return;
            }
            const asset = response.assets?.[0];
            if (asset) {
              handleUploadMinistryDeclarationFile(asset);
            }
          });
        },
      },
      {text: 'إلغاء', style: 'cancel'},
    ]);
  };

  const handleSubmitMinistryDelivery = async () => {
    if (!selectedTrainee) {
      return;
    }

    if (ministryUploadLoading) {
      Alert.alert('تنبيه', 'جاري رفع صورة الإقرار، يرجى الانتظار');
      return;
    }

    if (!ministryDeclarationUpload?.url) {
      Alert.alert('تنبيه', 'رفع صورة واضحة للإقرار إلزامي قبل الحفظ');
      return;
    }

    try {
      setMinistryDeliverySubmitting(true);

      const statusPayload = await AuthService.getMinistryDeclarationDeliveryStatus(selectedTrainee.id);
      const blockingMessage = getMinistryPolicyBlockingMessage(statusPayload);
      if (blockingMessage) {
        Alert.alert('تنبيه', blockingMessage);
        return;
      }

      if (statusPayload?.canDeliver === false) {
        Alert.alert('تنبيه', statusPayload?.message || 'تم استلام الإقرار مسبقاً');
        return;
      }

      await AuthService.deliverMinistryDeclaration(selectedTrainee.id, {
        deliveryMode: 'PAPER_ONLY',
        submissionNotes: ministryDeliveryNotes.trim() || undefined,
        declarationFileUrl: ministryDeclarationUpload.url,
        declarationFileCloudinaryId: ministryDeclarationUpload.cloudinaryId,
        declarationFileName: ministryDeclarationUpload.fileName,
        declarationFileMimeType: ministryDeclarationUpload.mimeType,
      });

      Alert.alert('تم', 'تم تسجيل تسليم إقرار وزارة العمل واعتماده تلقائياً');
      closeMinistryDeliveryModal();
      fetchTrainees(currentPage, {showLoader: false});
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر تسجيل تسليم إقرار وزارة العمل');
    } finally {
      setMinistryDeliverySubmitting(false);
    }
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

  const closeNotesModal = () => {
    setShowNotesModal(false);
    setNotes([]);
    setNewNoteContent('');
    setEditingNoteId(null);
    setEditingNoteContent('');
    setSelectedTrainee(null);
  };

  const loadTraineeNotes = async (traineeId: number) => {
    try {
      setNotesLoading(true);
      const response = await AuthService.getTraineeNotes(traineeId);
      setNotes(Array.isArray(response) ? response : []);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر تحميل ملاحظات المتدرب');
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleOpenNotesModal = async (trainee: ITrainee) => {
    closeActionsMenu(true);
    setSelectedTrainee(trainee);
    setShowNotesModal(true);
    await loadTraineeNotes(trainee.id);
  };

  const handleAddTraineeNote = async () => {
    if (!selectedTrainee) {
      return;
    }

    const content = newNoteContent.trim();
    if (!content) {
      Alert.alert('تنبيه', 'يرجى إدخال محتوى الملاحظة');
      return;
    }

    try {
      setProcessingAction(true);
      await AuthService.createTraineeNote(selectedTrainee.id, {content});
      setNewNoteContent('');
      await loadTraineeNotes(selectedTrainee.id);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر إضافة الملاحظة');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleStartEditTraineeNote = (note: TraineeNote) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content || '');
  };

  const handleCancelEditTraineeNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleUpdateTraineeNote = async () => {
    if (!selectedTrainee || !editingNoteId) {
      return;
    }

    const content = editingNoteContent.trim();
    if (!content) {
      Alert.alert('تنبيه', 'يرجى إدخال محتوى الملاحظة');
      return;
    }

    try {
      setProcessingAction(true);
      await AuthService.updateTraineeNote(editingNoteId, {content});
      setEditingNoteId(null);
      setEditingNoteContent('');
      await loadTraineeNotes(selectedTrainee.id);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر تحديث الملاحظة');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeleteTraineeNote = (noteId: string) => {
    if (!selectedTrainee) {
      return;
    }

    Alert.alert('حذف الملاحظة', 'هل تريد حذف هذه الملاحظة؟', [
      {text: 'إلغاء', style: 'cancel'},
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            setProcessingAction(true);
            await AuthService.deleteTraineeNote(noteId);
            await loadTraineeNotes(selectedTrainee.id);
          } catch (error: any) {
            Alert.alert('خطأ', error?.message || 'تعذر حذف الملاحظة');
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
  };

  const resetPaymentExceptionForm = () => {
    setExceptionFeeId('ALL');
    setExceptionEndDate('');
    setExceptionGraceDays('0');
    setExceptionReason('');
    setExceptionNotes('');
  };

  const closePaymentExceptionModal = () => {
    setShowPaymentExceptionModal(false);
    setExceptionFees([]);
    resetPaymentExceptionForm();
    setSelectedTrainee(null);
  };

  const handleOpenPaymentExceptionModal = async (trainee: ITrainee) => {
    closeActionsMenu(true);
    setSelectedTrainee(trainee);
    setShowPaymentExceptionModal(true);

    try {
      setProcessingAction(true);
      const response = await AuthService.getFeesWithSchedules(trainee.id);
      const fees = (Array.isArray(response) ? response : []).map((fee: any) => ({
        id: Number(fee.id),
        name: fee.name || fee.feeName || `رسوم ${fee.id}`,
        paymentDueDate: fee.paymentDueDate,
        gracePeriodDays: fee.gracePeriodDays,
      }));
      setExceptionFees(fees);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر تحميل الرسوم المتاحة');
      setExceptionFees([]);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCreatePaymentException = async () => {
    if (!selectedTrainee) {
      return;
    }

    const reason = exceptionReason.trim();
    if (!reason) {
      Alert.alert('تنبيه', 'سبب الاستثناء مطلوب');
      return;
    }

    const payload: {
      feeId?: number;
      customPaymentEndDate?: string;
      customGracePeriodDays?: number;
      reason: string;
      notes?: string;
    } = {
      reason,
    };

    if (exceptionFeeId !== 'ALL') {
      payload.feeId = Number(exceptionFeeId);
    }

    if (exceptionEndDate.trim()) {
      payload.customPaymentEndDate = exceptionEndDate.trim();
    }

    const graceDays = Number(exceptionGraceDays);
    if (!Number.isNaN(graceDays) && graceDays >= 0) {
      payload.customGracePeriodDays = graceDays;
    }

    if (exceptionNotes.trim()) {
      payload.notes = exceptionNotes.trim();
    }

    try {
      setProcessingAction(true);
      const response = await AuthService.createPaymentException(selectedTrainee.id, payload);
      Alert.alert('تم', response?.message || 'تم إنشاء استثناء السداد بنجاح');
      closePaymentExceptionModal();
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر إنشاء استثناء السداد');
    } finally {
      setProcessingAction(false);
    }
  };

  const loadPaymentExceptions = async (traineeId: number) => {
    try {
      setExceptionsLoading(true);
      const response = await AuthService.getTraineePaymentExceptions(traineeId);
      setPaymentExceptions(Array.isArray(response) ? response : []);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر تحميل الاستثناءات');
      setPaymentExceptions([]);
    } finally {
      setExceptionsLoading(false);
    }
  };

  const closePaymentExceptionsListModal = () => {
    setShowExceptionsListModal(false);
    setPaymentExceptions([]);
    setSelectedTrainee(null);
  };

  const handleOpenPaymentExceptionsListModal = async (trainee: ITrainee) => {
    closeActionsMenu(true);
    setSelectedTrainee(trainee);
    setShowExceptionsListModal(true);
    await loadPaymentExceptions(trainee.id);
  };

  const handleDeletePaymentException = (exceptionId: string) => {
    if (!selectedTrainee) {
      return;
    }

    Alert.alert('حذف الاستثناء', 'هل أنت متأكد من حذف الاستثناء؟', [
      {text: 'إلغاء', style: 'cancel'},
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            setProcessingAction(true);
            await AuthService.deletePaymentException(selectedTrainee.id, exceptionId);
            await loadPaymentExceptions(selectedTrainee.id);
          } catch (error: any) {
            Alert.alert('خطأ', error?.message || 'تعذر حذف الاستثناء');
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
  };

  const resetDisciplinaryForm = () => {
    setDisciplinaryActionType('WARNING');
    setDisciplinaryReason('');
    setDisciplinaryNotes('');
    setDisciplinaryStartDate('');
    setDisciplinaryEndDate('');
  };

  const closeDisciplinaryModal = () => {
    setShowDisciplinaryModal(false);
    resetDisciplinaryForm();
    setSelectedTrainee(null);
  };

  const handleOpenDisciplinaryModal = (trainee: ITrainee) => {
    closeActionsMenu(true);
    setSelectedTrainee(trainee);
    resetDisciplinaryForm();
    setShowDisciplinaryModal(true);
  };

  const handleCreateDisciplinaryAction = async () => {
    if (!selectedTrainee) {
      return;
    }

    const reason = disciplinaryReason.trim();
    if (!reason || reason.length < 10) {
      Alert.alert('تنبيه', 'يرجى إدخال سبب واضح لا يقل عن 10 أحرف');
      return;
    }

    if (disciplinaryActionType === 'TEMPORARY_SUSPENSION') {
      if (!disciplinaryStartDate.trim() || !disciplinaryEndDate.trim()) {
        Alert.alert('تنبيه', 'يجب إدخال تاريخ البداية والنهاية للإيقاف المؤقت');
        return;
      }
    }

    try {
      setProcessingAction(true);
      const response = await AuthService.createDisciplinaryAction({
        traineeId: selectedTrainee.id,
        actionType: disciplinaryActionType as
          | 'WARNING'
          | 'GUARDIAN_SUMMON'
          | 'REPORT_FILING'
          | 'TEMPORARY_SUSPENSION'
          | 'PERMANENT_EXPULSION',
        reason,
        startDate: disciplinaryStartDate.trim() || undefined,
        endDate: disciplinaryEndDate.trim() || undefined,
        notes: disciplinaryNotes.trim() || undefined,
      });

      Alert.alert('تم', response?.message || 'تم تسجيل الإجراء العقابي بنجاح');
      closeDisciplinaryModal();
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر تسجيل الإجراء العقابي');
    } finally {
      setProcessingAction(false);
    }
  };

  const loadDisciplinaryActions = async (traineeId: number) => {
    try {
      setDisciplinaryLoading(true);
      const response = await AuthService.getDisciplinaryActions({traineeId});
      setDisciplinaryActions(Array.isArray(response) ? response : []);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر تحميل الإجراءات العقابية');
      setDisciplinaryActions([]);
    } finally {
      setDisciplinaryLoading(false);
    }
  };

  const closeDisciplinaryListModal = () => {
    setShowDisciplinaryListModal(false);
    setDisciplinaryActions([]);
    setSelectedTrainee(null);
  };

  const handleOpenDisciplinaryListModal = async (trainee: ITrainee) => {
    closeActionsMenu(true);
    setSelectedTrainee(trainee);
    setShowDisciplinaryListModal(true);
    await loadDisciplinaryActions(trainee.id);
  };

  const handleUpdateDisciplinaryStatus = async (
    actionId: string,
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
  ) => {
    if (!selectedTrainee) {
      return;
    }

    try {
      setProcessingAction(true);
      await AuthService.updateDisciplinaryAction(actionId, {status});
      await loadDisciplinaryActions(selectedTrainee.id);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر تحديث حالة الإجراء');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeleteDisciplinaryAction = (actionId: string) => {
    if (!selectedTrainee) {
      return;
    }

    Alert.alert('حذف الإجراء', 'هل أنت متأكد من حذف الإجراء العقابي؟', [
      {text: 'إلغاء', style: 'cancel'},
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            setProcessingAction(true);
            await AuthService.deleteDisciplinaryAction(actionId);
            await loadDisciplinaryActions(selectedTrainee.id);
          } catch (error: any) {
            Alert.alert('خطأ', error?.message || 'تعذر حذف الإجراء');
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
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

          <TouchableOpacity
            style={styles.toolbarSecondaryButton}
            onPress={() => setShowStatisticsModal(true)}>
            <Icon name="analytics" size={18} color="#1e3a8a" />
            <Text style={styles.toolbarSecondaryButtonText}>إحصائيات</Text>
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
                  {renderActionItem('أرشيف المتدرب', 'folder', () =>
                    handleOpenTraineeArchive(selectedTrainee),
                  )}
                  {renderActionItem('استمارة المتدرب (طباعة)', 'print', () =>
                    handleOpenApplicationFormInApp(selectedTrainee),
                  )}
                  {canViewMinistryDeclaration &&
                    renderActionItem('إقرار وزارة العمل (طباعة)', 'article', () =>
                      handleOpenMinistryDeclarationPrint(selectedTrainee),
                    )}
                  {canConfirmMinistryDeclarationDelivery &&
                    renderActionItem('تسليم إقرار وزارة العمل', 'verified', () =>
                      handleOpenMinistryDeliveryModal(selectedTrainee),
                    )}
                  {renderActionItem('عرض المستندات', 'description', () => handleOpenDocuments(selectedTrainee))}
                  {renderActionItem('عرض الدرجات', 'bar-chart', () => handleOpenGrades(selectedTrainee))}
                  {renderActionItem('ملاحظات المتدرب', 'sticky-note-2', () =>
                    handleOpenNotesModal(selectedTrainee),
                  )}

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

                  {canManagePaymentExceptions &&
                    renderActionItem('إنشاء استثناء سداد', 'event-busy', () =>
                      handleOpenPaymentExceptionModal(selectedTrainee),
                    )}

                  {canManagePaymentExceptions &&
                    renderActionItem('عرض استثناءات السداد', 'event-note', () =>
                      handleOpenPaymentExceptionsListModal(selectedTrainee),
                    )}

                  {canManageDisciplinaryActions &&
                    renderActionItem('تسجيل إجراء عقابي', 'gavel', () =>
                      handleOpenDisciplinaryModal(selectedTrainee),
                    )}

                  {canManageDisciplinaryActions &&
                    renderActionItem('عرض الإجراءات العقابية', 'rule', () =>
                      handleOpenDisciplinaryListModal(selectedTrainee),
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

      <Modal
        visible={showMinistryDeliveryModal}
        transparent
        animationType="slide"
        onRequestClose={closeMinistryDeliveryModal}>
        <View style={styles.modalOverlayBottom}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeMinistryDeliveryModal} />
          <View style={styles.detailSheet}>
            <View style={styles.actionsHandle} />
            <Text style={styles.actionsTitle}>تسليم إقرار وزارة العمل</Text>
            <Text style={styles.actionsSubtitle}>{selectedTrainee?.nameAr || ''}</Text>

            <Text style={styles.modalHelperText}>رفع صورة واضحة للإقرار إلزامي قبل الحفظ.</Text>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={handlePickMinistryDeclarationFile}
              disabled={ministryUploadLoading || ministryDeliverySubmitting}>
              <Icon name="upload-file" size={18} color="#ffffff" />
              <Text style={styles.modalPrimaryButtonText}>
                {ministryDeclarationUpload ? 'تغيير صورة الإقرار' : 'رفع صورة الإقرار'}
              </Text>
            </TouchableOpacity>

            {ministryUploadLoading && (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" color="#1e3a8a" />
                <Text style={styles.modalHelperText}>جاري رفع الصورة...</Text>
              </View>
            )}

            {ministryDeclarationPreviewUri ? (
              <View style={styles.ministryPreviewCard}>
                <Image
                  source={{uri: ministryDeclarationPreviewUri}}
                  style={styles.ministryPreviewImage}
                  resizeMode="cover"
                />
                <Text style={styles.ministryPreviewName} numberOfLines={1}>
                  {ministryDeclarationUpload?.fileName || 'تم رفع صورة الإقرار'}
                </Text>
              </View>
            ) : (
              <Text style={styles.modalWarningText}>لم يتم رفع صورة الإقرار بعد</Text>
            )}

            <TextInput
              style={styles.modalMultilineInput}
              placeholder="ملاحظات التسليم (اختياري)"
              placeholderTextColor="#94a3b8"
              value={ministryDeliveryNotes}
              onChangeText={setMinistryDeliveryNotes}
              multiline
              textAlign="right"
              editable={!ministryDeliverySubmitting}
            />

            <TouchableOpacity
              style={[
                styles.modalPrimaryButton,
                (ministryUploadLoading || ministryDeliverySubmitting) && styles.modalPrimaryButtonDisabled,
              ]}
              onPress={handleSubmitMinistryDelivery}
              disabled={ministryUploadLoading || ministryDeliverySubmitting}>
              {ministryDeliverySubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Icon name="verified" size={18} color="#ffffff" />
              )}
              <Text style={styles.modalPrimaryButtonText}>
                {ministryDeliverySubmitting ? 'جاري حفظ التسليم...' : 'تأكيد تسليم الإقرار'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionsCloseButton} onPress={closeMinistryDeliveryModal}>
              <Text style={styles.actionsCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showNotesModal} transparent animationType="slide" onRequestClose={closeNotesModal}>
        <View style={styles.modalOverlayBottom}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeNotesModal} />
          <View style={styles.detailSheet}>
            <View style={styles.actionsHandle} />
            <Text style={styles.actionsTitle}>ملاحظات المتدرب</Text>
            <Text style={styles.actionsSubtitle}>{selectedTrainee?.nameAr || ''}</Text>

            <TextInput
              style={styles.modalMultilineInput}
              placeholder="أضف ملاحظة جديدة..."
              placeholderTextColor="#94a3b8"
              value={newNoteContent}
              onChangeText={setNewNoteContent}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.modalPrimaryButton} onPress={handleAddTraineeNote}>
              <Icon name="add-comment" size={18} color="#ffffff" />
              <Text style={styles.modalPrimaryButtonText}>إضافة ملاحظة</Text>
            </TouchableOpacity>

            {notesLoading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" color="#1d4ed8" />
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {notes.length === 0 ? (
                  <Text style={styles.modalEmptyText}>لا توجد ملاحظات حالياً</Text>
                ) : (
                  notes.map(note => (
                    <View key={note.id} style={styles.modalListCard}>
                      {editingNoteId === note.id ? (
                        <TextInput
                          style={styles.modalMultilineInput}
                          placeholder="تعديل الملاحظة"
                          placeholderTextColor="#94a3b8"
                          value={editingNoteContent}
                          onChangeText={setEditingNoteContent}
                          multiline
                          textAlign="right"
                          textAlignVertical="top"
                        />
                      ) : (
                        <Text style={styles.modalListCardTitle}>{note.content}</Text>
                      )}
                      <Text style={styles.modalListCardMeta}>
                        {formatDateTimeAr(note.createdAt)}
                      </Text>
                      <Text style={styles.modalListCardMeta}>
                        بواسطة: {note.createdBy?.nameAr || note.createdBy?.username || 'غير محدد'}
                      </Text>

                      {editingNoteId === note.id ? (
                        <View style={styles.modalCardActionsRow}>
                          <TouchableOpacity
                            style={styles.modalCardActionButton}
                            onPress={handleUpdateTraineeNote}>
                            <Text style={styles.modalCardActionText}>حفظ التعديل</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.modalCardActionButton}
                            onPress={handleCancelEditTraineeNote}>
                            <Text style={styles.modalCardActionText}>إلغاء</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.modalCardActionButton}
                          onPress={() => handleStartEditTraineeNote(note)}>
                          <Text style={styles.modalCardActionText}>تعديل</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.modalCardDeleteButton}
                        onPress={() => handleDeleteTraineeNote(note.id)}>
                        <Icon name="delete" size={16} color="#dc2626" />
                        <Text style={styles.modalCardDeleteText}>حذف</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.actionsCloseButton} onPress={closeNotesModal}>
              <Text style={styles.actionsCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPaymentExceptionModal}
        transparent
        animationType="slide"
        onRequestClose={closePaymentExceptionModal}>
        <View style={styles.modalOverlayBottom}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closePaymentExceptionModal} />
          <View style={styles.detailSheet}>
            <View style={styles.actionsHandle} />
            <Text style={styles.actionsTitle}>إنشاء استثناء سداد</Text>
            <Text style={styles.actionsSubtitle}>{selectedTrainee?.nameAr || ''}</Text>

            <Text style={styles.filterLabel}>اختر الرسوم</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalHorizontalChips}>
              <TouchableOpacity
                style={[
                  styles.chipButton,
                  exceptionFeeId === 'ALL' && styles.chipButtonActive,
                ]}
                onPress={() => setExceptionFeeId('ALL')}>
                <Text
                  style={[
                    styles.chipButtonText,
                    exceptionFeeId === 'ALL' && styles.chipButtonTextActive,
                  ]}>
                  كل الرسوم
                </Text>
              </TouchableOpacity>

              {exceptionFees.map(fee => {
                const selected = exceptionFeeId === String(fee.id);
                return (
                  <TouchableOpacity
                    key={fee.id}
                    style={[styles.chipButton, selected && styles.chipButtonActive]}
                    onPress={() => setExceptionFeeId(String(fee.id))}>
                    <Text style={[styles.chipButtonText, selected && styles.chipButtonTextActive]}>
                      {fee.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TextInput
              style={styles.modalInput}
              placeholder="تاريخ السداد الجديد (YYYY-MM-DD)"
              placeholderTextColor="#94a3b8"
              value={exceptionEndDate}
              onChangeText={setExceptionEndDate}
              textAlign="right"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="فترة السماح بالأيام"
              placeholderTextColor="#94a3b8"
              value={exceptionGraceDays}
              onChangeText={setExceptionGraceDays}
              keyboardType="numeric"
              textAlign="right"
            />

            <TextInput
              style={styles.modalMultilineInput}
              placeholder="سبب الاستثناء"
              placeholderTextColor="#94a3b8"
              value={exceptionReason}
              onChangeText={setExceptionReason}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />

            <TextInput
              style={styles.modalMultilineInput}
              placeholder="ملاحظات إضافية (اختياري)"
              placeholderTextColor="#94a3b8"
              value={exceptionNotes}
              onChangeText={setExceptionNotes}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.modalPrimaryButton} onPress={handleCreatePaymentException}>
              <Icon name="save" size={18} color="#ffffff" />
              <Text style={styles.modalPrimaryButtonText}>حفظ الاستثناء</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionsCloseButton} onPress={closePaymentExceptionModal}>
              <Text style={styles.actionsCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showExceptionsListModal}
        transparent
        animationType="slide"
        onRequestClose={closePaymentExceptionsListModal}>
        <View style={styles.modalOverlayBottom}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closePaymentExceptionsListModal} />
          <View style={styles.detailSheet}>
            <View style={styles.actionsHandle} />
            <Text style={styles.actionsTitle}>استثناءات السداد</Text>
            <Text style={styles.actionsSubtitle}>{selectedTrainee?.nameAr || ''}</Text>

            {exceptionsLoading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" color="#1d4ed8" />
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {paymentExceptions.length === 0 ? (
                  <Text style={styles.modalEmptyText}>لا توجد استثناءات حالياً</Text>
                ) : (
                  paymentExceptions.map(exception => (
                    <View key={exception.id} style={styles.modalListCard}>
                      <Text style={styles.modalListCardTitle}>{exception.reason}</Text>
                      <Text style={styles.modalListCardMeta}>
                        الرسوم: {exception.fee?.name || 'كل الرسوم'}
                      </Text>
                      <Text style={styles.modalListCardMeta}>
                        آخر موعد سداد: {formatDateAr(exception.customPaymentEndDate)}
                      </Text>
                      <Text style={styles.modalListCardMeta}>
                        فترة السماح: {exception.customGracePeriodDays ?? 0} يوم
                      </Text>
                      <Text style={styles.modalListCardMeta}>
                        تاريخ الإنشاء: {formatDateTimeAr(exception.createdAt)}
                      </Text>
                      {!!exception.notes && (
                        <Text style={styles.modalListCardBody}>{exception.notes}</Text>
                      )}

                      <TouchableOpacity
                        style={styles.modalCardDeleteButton}
                        onPress={() => handleDeletePaymentException(exception.id)}>
                        <Icon name="delete" size={16} color="#dc2626" />
                        <Text style={styles.modalCardDeleteText}>حذف</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.actionsCloseButton} onPress={closePaymentExceptionsListModal}>
              <Text style={styles.actionsCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDisciplinaryModal}
        transparent
        animationType="slide"
        onRequestClose={closeDisciplinaryModal}>
        <View style={styles.modalOverlayBottom}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeDisciplinaryModal} />
          <View style={styles.detailSheet}>
            <View style={styles.actionsHandle} />
            <Text style={styles.actionsTitle}>تسجيل إجراء عقابي</Text>
            <Text style={styles.actionsSubtitle}>{selectedTrainee?.nameAr || ''}</Text>

            <Text style={styles.filterLabel}>نوع الإجراء</Text>
            <View style={styles.chipsRow}>
              {DISCIPLINARY_ACTION_OPTIONS.map(option => {
                const selected = disciplinaryActionType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chipButton, selected && styles.chipButtonActive]}
                    onPress={() => setDisciplinaryActionType(option.value)}>
                    <Text style={[styles.chipButtonText, selected && styles.chipButtonTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {disciplinaryActionType === 'TEMPORARY_SUSPENSION' && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="تاريخ البداية (YYYY-MM-DD)"
                  placeholderTextColor="#94a3b8"
                  value={disciplinaryStartDate}
                  onChangeText={setDisciplinaryStartDate}
                  textAlign="right"
                />

                <TextInput
                  style={styles.modalInput}
                  placeholder="تاريخ النهاية (YYYY-MM-DD)"
                  placeholderTextColor="#94a3b8"
                  value={disciplinaryEndDate}
                  onChangeText={setDisciplinaryEndDate}
                  textAlign="right"
                />
              </>
            )}

            <TextInput
              style={styles.modalMultilineInput}
              placeholder="سبب الإجراء"
              placeholderTextColor="#94a3b8"
              value={disciplinaryReason}
              onChangeText={setDisciplinaryReason}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />

            <TextInput
              style={styles.modalMultilineInput}
              placeholder="ملاحظات إضافية (اختياري)"
              placeholderTextColor="#94a3b8"
              value={disciplinaryNotes}
              onChangeText={setDisciplinaryNotes}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.modalPrimaryButton} onPress={handleCreateDisciplinaryAction}>
              <Icon name="save" size={18} color="#ffffff" />
              <Text style={styles.modalPrimaryButtonText}>حفظ الإجراء</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionsCloseButton} onPress={closeDisciplinaryModal}>
              <Text style={styles.actionsCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDisciplinaryListModal}
        transparent
        animationType="slide"
        onRequestClose={closeDisciplinaryListModal}>
        <View style={styles.modalOverlayBottom}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeDisciplinaryListModal} />
          <View style={styles.detailSheet}>
            <View style={styles.actionsHandle} />
            <Text style={styles.actionsTitle}>الإجراءات العقابية</Text>
            <Text style={styles.actionsSubtitle}>{selectedTrainee?.nameAr || ''}</Text>

            {disciplinaryLoading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" color="#1d4ed8" />
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {disciplinaryActions.length === 0 ? (
                  <Text style={styles.modalEmptyText}>لا توجد إجراءات عقابية</Text>
                ) : (
                  disciplinaryActions.map(action => (
                    <View key={action.id} style={styles.modalListCard}>
                      <Text style={styles.modalListCardTitle}>
                        {getDisciplinaryActionLabel(action.actionType)}
                      </Text>
                      <Text style={styles.modalListCardMeta}>
                        الحالة: {getDisciplinaryStatusLabel(action.status)}
                      </Text>
                      <Text style={styles.modalListCardBody}>{action.reason}</Text>

                      {!!action.startDate && (
                        <Text style={styles.modalListCardMeta}>
                          من: {formatDateAr(action.startDate)}
                        </Text>
                      )}
                      {!!action.endDate && (
                        <Text style={styles.modalListCardMeta}>
                          إلى: {formatDateAr(action.endDate)}
                        </Text>
                      )}
                      {!!action.notes && (
                        <Text style={styles.modalListCardMeta}>{action.notes}</Text>
                      )}

                      <Text style={styles.modalListCardMeta}>
                        تاريخ الإنشاء: {formatDateTimeAr(action.createdAt)}
                      </Text>

                      <View style={styles.modalCardActionsRow}>
                        {action.status === 'ACTIVE' && (
                          <TouchableOpacity
                            style={styles.modalCardActionButton}
                            onPress={() => handleUpdateDisciplinaryStatus(action.id, 'COMPLETED')}>
                            <Text style={styles.modalCardActionText}>إنهاء</Text>
                          </TouchableOpacity>
                        )}

                        {action.status === 'ACTIVE' && (
                          <TouchableOpacity
                            style={styles.modalCardActionButton}
                            onPress={() => handleUpdateDisciplinaryStatus(action.id, 'CANCELLED')}>
                            <Text style={styles.modalCardActionText}>إلغاء</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.modalCardDeleteButton}
                          onPress={() => handleDeleteDisciplinaryAction(action.id)}>
                          <Icon name="delete" size={16} color="#dc2626" />
                          <Text style={styles.modalCardDeleteText}>حذف</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.actionsCloseButton} onPress={closeDisciplinaryListModal}>
              <Text style={styles.actionsCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showStatisticsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatisticsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.statisticsCard}>
            <Text style={styles.pickerModalTitle}>إحصائيات المتدربين</Text>

            <ScrollView style={styles.statisticsBody}>
              <View style={styles.statisticsSection}>
                <Text style={styles.statisticsSectionTitle}>ملخص عام</Text>
                <Text style={styles.statisticsItem}>إجمالي: {filteredTrainees.length}</Text>
                <Text style={styles.statisticsItem}>حالي: {totalCurrent}</Text>
                <Text style={styles.statisticsItem}>خريج: {totalGraduates}</Text>
              </View>

              <View style={styles.statisticsSection}>
                <Text style={styles.statisticsSectionTitle}>حسب البرنامج</Text>
                {programStats.length === 0 ? (
                  <Text style={styles.modalEmptyText}>لا توجد بيانات</Text>
                ) : (
                  programStats.map(([label, count]) => (
                    <Text key={`program-${label}`} style={styles.statisticsItem}>
                      {label}: {count}
                    </Text>
                  ))
                )}
              </View>

              <View style={styles.statisticsSection}>
                <Text style={styles.statisticsSectionTitle}>حسب المحافظة</Text>
                {governorateStats.length === 0 ? (
                  <Text style={styles.modalEmptyText}>لا توجد بيانات</Text>
                ) : (
                  governorateStats.map(([label, count]) => (
                    <Text key={`gov-${label}`} style={styles.statisticsItem}>
                      {label}: {count}
                    </Text>
                  ))
                )}
              </View>

              <View style={styles.statisticsSection}>
                <Text style={styles.statisticsSectionTitle}>حسب المدينة</Text>
                {cityStats.length === 0 ? (
                  <Text style={styles.modalEmptyText}>لا توجد بيانات</Text>
                ) : (
                  cityStats.map(([label, count]) => (
                    <Text key={`city-${label}`} style={styles.statisticsItem}>
                      {label}: {count}
                    </Text>
                  ))
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.pickerCloseButton}
              onPress={() => setShowStatisticsModal(false)}>
              <Text style={styles.pickerCloseButtonText}>إغلاق</Text>
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
  detailSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingBottom: 20,
    maxHeight: '90%',
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
  modalInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    color: '#0f172a',
    fontSize: 13,
    marginBottom: 8,
  },
  modalMultilineInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
    fontSize: 13,
    marginBottom: 8,
  },
  modalHelperText: {
    color: '#334155',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 8,
  },
  modalWarningText: {
    color: '#b91c1c',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 8,
  },
  modalPrimaryButton: {
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#1e3a8a',
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalPrimaryButtonDisabled: {
    opacity: 0.7,
  },
  modalPrimaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalLoadingWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalList: {
    maxHeight: 320,
    marginBottom: 8,
  },
  modalEmptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 18,
  },
  modalListCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  modalListCardTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  modalListCardMeta: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 12,
    textAlign: 'right',
  },
  modalListCardBody: {
    marginTop: 6,
    color: '#334155',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
  },
  ministryPreviewCard: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    padding: 8,
    marginBottom: 8,
  },
  ministryPreviewImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  ministryPreviewName: {
    marginTop: 6,
    color: '#1e3a8a',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  modalCardDeleteButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff1f2',
  },
  modalCardDeleteText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  modalHorizontalChips: {
    paddingBottom: 8,
    gap: 8,
    alignItems: 'center',
  },
  modalCardActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalCardActionButton: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
  },
  modalCardActionText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '700',
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
  statisticsCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
  },
  statisticsBody: {
    maxHeight: 460,
  },
  statisticsSection: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    marginBottom: 8,
  },
  statisticsSectionTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 4,
  },
  statisticsItem: {
    color: '#334155',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 3,
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
