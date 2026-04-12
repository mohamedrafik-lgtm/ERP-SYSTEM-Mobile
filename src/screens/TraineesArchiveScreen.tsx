import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import ArabicSearchInput from '../components/ArabicSearchInput';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {
  ArchiveCompletionStatusFilter,
  ArchiveProgramOption,
  TraineeArchiveStat,
  TraineeDocumentsCompletionStatsFilters,
  TraineeDocumentsCompletionStatsResponse,
  TraineeDocumentsDetailedReportResponse,
} from '../types/traineeArchive';

interface TraineesArchiveScreenProps {
  navigation: any;
}

const LIMIT_OPTIONS = [10, 20, 30, 50, 100];

const COMPLETION_FILTERS: Array<{ value: ArchiveCompletionStatusFilter | ''; label: string }> = [
  { value: '', label: 'جميع الحالات' },
  { value: 'complete', label: 'مكتمل (100%)' },
  { value: 'high', label: 'ممتاز (80%+)' },
  { value: 'medium', label: 'متوسط (50-79%)' },
  { value: 'low', label: 'ضعيف (<50%)' },
  { value: 'incomplete', label: 'غير مكتمل' },
];

const DEFAULT_RESPONSE: TraineeDocumentsCompletionStatsResponse = {
  overallStats: {
    totalTrainees: 0,
    completeTrainees: 0,
    incompleteTrainees: 0,
    averageCompletion: 0,
  },
  traineeStats: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
};

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusAppearance = (item: TraineeArchiveStat) => {
  if (item.isComplete) {
    return {
      label: 'مكتمل',
      backgroundColor: '#dcfce7',
      textColor: '#166534',
      progressColor: '#16a34a',
    };
  }

  if (item.completionPercentage >= 80) {
    return {
      label: 'ممتاز',
      backgroundColor: '#dbeafe',
      textColor: '#1d4ed8',
      progressColor: '#2563eb',
    };
  }

  if (item.completionPercentage >= 50) {
    return {
      label: 'متوسط',
      backgroundColor: '#fef3c7',
      textColor: '#b45309',
      progressColor: '#f59e0b',
    };
  }

  return {
    label: 'ضعيف',
    backgroundColor: '#fee2e2',
    textColor: '#b91c1c',
    progressColor: '#ef4444',
  };
};

const buildDetailedReportMessage = (
  report: TraineeDocumentsDetailedReportResponse,
  options: {
    programName: string;
    completionStatusLabel: string;
    searchQuery?: string;
  },
): string => {
  const lines: string[] = [];
  lines.push('تقرير أرشيف المتدربين');
  lines.push(`تاريخ التقرير: ${formatDateTime(new Date())}`);
  lines.push(`البرنامج: ${options.programName}`);
  lines.push(`حالة الإكمال: ${options.completionStatusLabel}`);
  lines.push(`البحث: ${options.searchQuery?.trim() ? options.searchQuery : 'بدون'}`);
  lines.push('');
  lines.push(`إجمالي المتدربين: ${report.overallStats.totalTrainees}`);
  lines.push(`مكتمل: ${report.overallStats.completeTrainees}`);
  lines.push(`غير مكتمل: ${report.overallStats.incompleteTrainees}`);
  lines.push(`متوسط الإكمال: ${report.overallStats.averageCompletion}%`);
  lines.push('');
  lines.push('تفاصيل المتدربين:');

  const maxRows = 400;
  const rows = report.traineeStats.slice(0, maxRows);

  rows.forEach((trainee, index) => {
    lines.push(
      `${index + 1}. ${trainee.traineeName} | ${trainee.programName} | ${trainee.completionPercentage}% | المطلوبة ${trainee.requiredDocuments}/4 | المحققة ${trainee.verifiedDocuments}`,
    );
  });

  if (report.traineeStats.length > maxRows) {
    lines.push('');
    lines.push(
      `تم اختصار التقرير إلى ${maxRows} متدرب من أصل ${report.traineeStats.length}. لاستخراج التقرير الكامل استخدم نسخة الويب.`,
    );
  }

  return lines.join('\n');
};

const TraineesArchiveScreen = ({ navigation }: TraineesArchiveScreenProps) => {
  const [programs, setPrograms] = useState<ArchiveProgramOption[]>([]);
  const [archiveData, setArchiveData] = useState<TraineeDocumentsCompletionStatsResponse>(DEFAULT_RESPONSE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ArchiveCompletionStatusFilter | ''>('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(20);

  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedProgramForPrint, setSelectedProgramForPrint] = useState('');

  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [preparingReport, setPreparingReport] = useState(false);

  const selectedProgramLabel = useMemo(() => {
    if (!selectedProgramId) {
      return 'كل البرامج';
    }

    return programs.find(program => String(program.id) === selectedProgramId)?.nameAr || 'برنامج غير محدد';
  }, [programs, selectedProgramId]);

  const selectedStatusLabel = useMemo(() => {
    return COMPLETION_FILTERS.find(option => option.value === selectedStatus)?.label || 'جميع الحالات';
  }, [selectedStatus]);

  const hasActiveFilters = Boolean(selectedProgramId || selectedStatus || searchQuery || searchInput);

  const fetchPrograms = useCallback(async () => {
    try {
      const response = await AuthService.getAllPrograms();
      const normalizedPrograms = Array.isArray(response)
        ? response
            .map(item => ({
              id: Number(item.id),
              nameAr: item.nameAr || item.name || `برنامج ${item.id}`,
            }))
            .filter(item => Number.isFinite(item.id))
        : [];

      setPrograms(normalizedPrograms);
    } catch (error: any) {
      setPrograms([]);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'تعذر تحميل البرامج التدريبية',
        position: 'top',
      });
    }
  }, []);

  const fetchArchiveStats = useCallback(
    async (
      page = 1,
      options?: {
        showLoader?: boolean;
        customLimit?: number;
      },
    ) => {
      const showLoader = options?.showLoader ?? true;
      const resolvedLimit = options?.customLimit ?? pageLimit;

      try {
        if (showLoader) {
          setLoading(true);
        }

        const params: TraineeDocumentsCompletionStatsFilters = {
          page,
          limit: resolvedLimit,
        };

        const trimmedSearch = searchQuery.trim();
        if (trimmedSearch) {
          params.search = trimmedSearch;
        }

        if (selectedProgramId) {
          params.programId = Number(selectedProgramId);
        }

        if (selectedStatus) {
          params.completionStatus = selectedStatus;
        }

        const response = await AuthService.getTraineeDocumentsCompletionStats(params);

        const normalizedResponse: TraineeDocumentsCompletionStatsResponse = {
          overallStats: response?.overallStats || DEFAULT_RESPONSE.overallStats,
          traineeStats: Array.isArray(response?.traineeStats) ? response.traineeStats : [],
          pagination: {
            ...DEFAULT_RESPONSE.pagination,
            ...(response?.pagination || {}),
            page: response?.pagination?.page || page,
            limit: response?.pagination?.limit || resolvedLimit,
          },
        };

        setArchiveData(normalizedResponse);
        setCurrentPage(normalizedResponse.pagination.page);
      } catch (error: any) {
        setArchiveData({
          overallStats: DEFAULT_RESPONSE.overallStats,
          traineeStats: [],
          pagination: {
            ...DEFAULT_RESPONSE.pagination,
            page,
            limit: resolvedLimit,
          },
        });

        Toast.show({
          type: 'error',
          text1: 'خطأ',
          text2: error?.message || 'فشل في تحميل أرشيف المتدربين',
          position: 'top',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pageLimit, searchQuery, selectedProgramId, selectedStatus],
  );

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    fetchArchiveStats(1);
  }, [fetchArchiveStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchArchiveStats(currentPage, { showLoader: false });
  };

  const handleSearch = () => {
    const nextQuery = searchInput.trim();
    if (nextQuery === searchQuery) {
      fetchArchiveStats(1);
      return;
    }

    setCurrentPage(1);
    setSearchQuery(nextQuery);
  };

  const clearSearch = () => {
    if (!searchInput && !searchQuery) {
      return;
    }

    setSearchInput('');
    if (searchQuery) {
      setCurrentPage(1);
      setSearchQuery('');
    } else {
      fetchArchiveStats(1);
    }
  };

  const clearAllFilters = () => {
    setSelectedProgramId('');
    setSelectedStatus('');
    setSearchInput('');

    if (searchQuery) {
      setCurrentPage(1);
      setSearchQuery('');
    } else {
      fetchArchiveStats(1);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    if (newLimit === pageLimit) {
      return;
    }

    setPageLimit(newLimit);
    setCurrentPage(1);
  };

  const handleOpenTraineeDetails = (trainee: TraineeArchiveStat) => {
    navigation.navigate('TraineeDocuments', {
      trainee: {
        id: trainee.traineeId,
        nameAr: trainee.traineeName,
      },
    });
  };

  const handleDownloadArchive = async (trainee: TraineeArchiveStat) => {
    if (downloadingIds.has(trainee.traineeId)) {
      return;
    }

    setDownloadingIds(prev => {
      const next = new Set(prev);
      next.add(trainee.traineeId);
      return next;
    });

    try {
      const result = await AuthService.downloadTraineeArchive(trainee.traineeId, trainee.traineeName);
      Toast.show({
        type: 'success',
        text1: 'تم التحميل',
        text2: `تم حفظ الأرشيف في: ${result.path}`,
        position: 'top',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'تعذر تحميل أرشيف المتدرب',
        position: 'top',
      });
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(trainee.traineeId);
        return next;
      });
    }
  };

  const executeBulkDownload = async () => {
    try {
      setBulkDownloading(true);

      const result = await AuthService.bulkDownloadTraineeArchives({
        programId: selectedProgramId ? Number(selectedProgramId) : undefined,
      });

      Toast.show({
        type: 'success',
        text1: 'تم التحميل الجماعي',
        text2: `تم حفظ الملف في: ${result.path}`,
        position: 'top',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'تعذر تنفيذ التحميل الجماعي',
        position: 'top',
      });
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleBulkDownloadPress = () => {
    Alert.alert(
      'تحميل جماعي للأرشيف',
      `سيتم تحميل أرشيفات المتدربين حسب الفلاتر الحالية (${selectedProgramLabel}).`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تحميل',
          onPress: () => {
            void executeBulkDownload();
          },
        },
      ],
    );
  };

  const handleOpenPrintModal = () => {
    setSelectedProgramForPrint(selectedProgramId);
    setShowPrintModal(true);
  };

  const handleShareReport = async () => {
    try {
      setPreparingReport(true);

      const reportFilters = {
        limit: 10000,
        programId: selectedProgramForPrint ? Number(selectedProgramForPrint) : undefined,
        completionStatus: selectedStatus || undefined,
        search: searchQuery.trim() || undefined,
      };

      const report = await AuthService.getTraineeDocumentsDetailedReport(reportFilters);
      const selectedProgramName = selectedProgramForPrint
        ? programs.find(program => String(program.id) === selectedProgramForPrint)?.nameAr || 'برنامج غير محدد'
        : 'كل البرامج';

      const message = buildDetailedReportMessage(report, {
        programName: selectedProgramName,
        completionStatusLabel: selectedStatusLabel,
        searchQuery,
      });

      await Share.share({
        title: 'تقرير أرشيف المتدربين',
        message,
      });

      setShowPrintModal(false);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'تعذر إنشاء تقرير الطباعة',
        position: 'top',
      });
    } finally {
      setPreparingReport(false);
    }
  };

  const renderStatCard = (
    label: string,
    value: string | number,
    icon: string,
    color: string,
    subtitle?: string,
  ) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={[styles.statIconWrap, { backgroundColor: `${color}20` }]}>
          <Icon name={icon} size={18} color={color} />
        </View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <CustomMenu navigation={navigation} activeRouteName="TraineesArchive" />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#1e3a8a" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>أرشيف المتدربين</Text>
          <Text style={styles.headerSubtitle}>متابعة الوثائق ونسب الإكمال</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchArchiveStats(currentPage)}
          disabled={loading}
        >
          <Icon name="refresh" size={20} color="#1e3a8a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.primaryActionButton, bulkDownloading && styles.disabledButton]}
            disabled={bulkDownloading}
            onPress={handleBulkDownloadPress}
          >
            {bulkDownloading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Icon name="download" size={18} color="#ffffff" />
            )}
            <Text style={styles.primaryActionButtonText}>
              {bulkDownloading ? 'جاري التحميل...' : 'تحميل جماعي'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryActionButton} onPress={handleOpenPrintModal}>
            <Icon name="print" size={18} color="#1e3a8a" />
            <Text style={styles.secondaryActionButtonText}>طباعة تقرير</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          {renderStatCard(
            'إجمالي المتدربين',
            archiveData.overallStats.totalTrainees,
            'groups',
            '#1d4ed8',
            hasActiveFilters ? 'حسب الفلاتر' : 'جميع المتدربين',
          )}
          {renderStatCard(
            'مكتملة الوثائق',
            archiveData.overallStats.completeTrainees,
            'check-circle',
            '#059669',
            'أكملوا جميع الوثائق',
          )}
          {renderStatCard(
            'ناقصة الوثائق',
            archiveData.overallStats.incompleteTrainees,
            'warning-amber',
            '#d97706',
            'وثائق مطلوبة غير مكتملة',
          )}
          {renderStatCard(
            'متوسط الإكمال',
            `${archiveData.overallStats.averageCompletion}%`,
            'trending-up',
            '#7c3aed',
          )}
        </ScrollView>

        <View style={styles.searchSection}>
          <ArabicSearchInput
            placeholder="ابحث في أسماء المتدربين"
            value={searchInput}
            onChangeText={setSearchInput}
            onSearch={handleSearch}
            style={{ marginBottom: 0 }}
          />

          {(searchInput || searchQuery) ? (
            <View style={styles.activeSearchWrap}>
              <Text style={styles.activeSearchText}>البحث النشط: {searchQuery || searchInput}</Text>
              <TouchableOpacity onPress={clearSearch}>
                <Text style={styles.clearSearchText}>مسح</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity style={styles.programPickerButton} onPress={() => setShowProgramPicker(true)}>
            <View style={styles.programPickerLeft}>
              <Icon name="school" size={18} color="#0f172a" />
              <Text style={styles.programPickerText}>{selectedProgramLabel}</Text>
            </View>
            <Icon name="expand-more" size={20} color="#64748b" />
          </TouchableOpacity>

          <Text style={styles.filterTitle}>حالة الإكمال</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusFiltersRow}>
            {COMPLETION_FILTERS.map(filter => {
              const isSelected = selectedStatus === filter.value;
              return (
                <TouchableOpacity
                  key={filter.label}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => setSelectedStatus(filter.value)}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {hasActiveFilters ? (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
              <Icon name="close" size={18} color="#475569" />
              <Text style={styles.clearFiltersText}>مسح كل الفلاتر</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={styles.loadingText}>جاري تحميل بيانات الأرشيف...</Text>
          </View>
        ) : archiveData.traineeStats.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon name="inbox" size={58} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>لا توجد بيانات مطابقة</Text>
            <Text style={styles.emptySubtitle}>جرّب تعديل شروط البحث أو الفلاتر لإظهار النتائج.</Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {archiveData.traineeStats.map(trainee => {
              const statusAppearance = getStatusAppearance(trainee);
              const isDownloading = downloadingIds.has(trainee.traineeId);

              return (
                <View key={trainee.traineeId} style={styles.traineeCard}>
                  <View style={styles.traineeCardHeader}>
                    <View style={styles.traineeInfoRow}>
                      {trainee.photoUrl ? (
                        <Image source={{ uri: trainee.photoUrl }} style={styles.traineePhoto} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Icon name="person" size={22} color="#94a3b8" />
                        </View>
                      )}

                      <View style={styles.traineeNameWrap}>
                        <Text style={styles.traineeName}>{trainee.traineeName}</Text>
                        <Text style={styles.traineeProgram}>{trainee.programName}</Text>
                      </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusAppearance.backgroundColor }]}>
                      <Text style={[styles.statusBadgeText, { color: statusAppearance.textColor }]}>
                        {statusAppearance.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.max(0, Math.min(100, trainee.completionPercentage))}%`,
                            backgroundColor: statusAppearance.progressColor,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressValue}>{trainee.completionPercentage}%</Text>
                  </View>

                  <View style={styles.metricsRow}>
                    <Text style={styles.metricText}>
                      المطلوبة: <Text style={styles.metricStrong}>{trainee.requiredDocuments}/4</Text>
                    </Text>
                    <Text style={styles.metricText}>
                      الإجمالي: <Text style={styles.metricStrong}>{trainee.totalDocuments}</Text>
                    </Text>
                    <Text style={styles.metricText}>
                      المحققة: <Text style={styles.metricVerified}>{trainee.verifiedDocuments}</Text>
                    </Text>
                  </View>

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={[styles.cardActionButton, styles.viewActionButton]}
                      onPress={() => handleOpenTraineeDetails(trainee)}
                    >
                      <Icon name="visibility" size={17} color="#1d4ed8" />
                      <Text style={styles.viewActionText}>عرض الأرشيف</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.cardActionButton,
                        styles.downloadActionButton,
                        isDownloading && styles.disabledButton,
                      ]}
                      disabled={isDownloading}
                      onPress={() => handleDownloadArchive(trainee)}
                    >
                      {isDownloading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Icon name="download" size={17} color="#ffffff" />
                      )}
                      <Text style={styles.downloadActionText}>
                        {isDownloading ? 'جاري التحميل...' : 'تحميل'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.paginationWrap}>
          <Text style={styles.paginationSummaryText}>
            الصفحة {archiveData.pagination.page} من {Math.max(archiveData.pagination.totalPages, 1)}
          </Text>
          <Text style={styles.paginationSummaryText}>إجمالي النتائج: {archiveData.pagination.total}</Text>

          <View style={styles.limitRow}>
            <Text style={styles.limitLabel}>عدد العناصر:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.limitOptionsRow}>
              {LIMIT_OPTIONS.map(limit => {
                const selected = pageLimit === limit;
                return (
                  <TouchableOpacity
                    key={limit}
                    style={[styles.limitChip, selected && styles.limitChipActive]}
                    onPress={() => handleLimitChange(limit)}
                  >
                    <Text style={[styles.limitChipText, selected && styles.limitChipTextActive]}>{limit}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.paginationButtonsRow}>
            <TouchableOpacity
              style={[styles.paginationButton, !archiveData.pagination.hasPrev && styles.disabledPaginationButton]}
              disabled={!archiveData.pagination.hasPrev || loading}
              onPress={() => fetchArchiveStats(currentPage - 1)}
            >
              <Icon name="chevron-left" size={22} color={archiveData.pagination.hasPrev ? '#1e3a8a' : '#94a3b8'} />
              <Text
                style={[
                  styles.paginationButtonText,
                  !archiveData.pagination.hasPrev && styles.disabledPaginationButtonText,
                ]}
              >
                السابق
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paginationButton, !archiveData.pagination.hasNext && styles.disabledPaginationButton]}
              disabled={!archiveData.pagination.hasNext || loading}
              onPress={() => fetchArchiveStats(currentPage + 1)}
            >
              <Text
                style={[
                  styles.paginationButtonText,
                  !archiveData.pagination.hasNext && styles.disabledPaginationButtonText,
                ]}
              >
                التالي
              </Text>
              <Icon name="chevron-right" size={22} color={archiveData.pagination.hasNext ? '#1e3a8a' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showProgramPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProgramPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>اختيار البرنامج</Text>

            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={[styles.modalItem, selectedProgramId === '' && styles.modalItemActive]}
                onPress={() => {
                  setSelectedProgramId('');
                  setShowProgramPicker(false);
                }}
              >
                <Text style={[styles.modalItemText, selectedProgramId === '' && styles.modalItemTextActive]}>
                  كل البرامج
                </Text>
              </TouchableOpacity>

              {programs.map(program => {
                const selected = selectedProgramId === String(program.id);
                return (
                  <TouchableOpacity
                    key={program.id}
                    style={[styles.modalItem, selected && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedProgramId(String(program.id));
                      setShowProgramPicker(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, selected && styles.modalItemTextActive]}>{program.nameAr}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowProgramPicker(false)}>
              <Text style={styles.modalCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPrintModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPrintModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>طباعة تقرير الأرشيف</Text>
            <Text style={styles.printModalSubtitle}>اختر البرنامج المطلوب تضمينه في التقرير</Text>

            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={[styles.modalItem, selectedProgramForPrint === '' && styles.modalItemActive]}
                onPress={() => setSelectedProgramForPrint('')}
              >
                <Text style={[styles.modalItemText, selectedProgramForPrint === '' && styles.modalItemTextActive]}>
                  كل البرامج
                </Text>
              </TouchableOpacity>

              {programs.map(program => {
                const selected = selectedProgramForPrint === String(program.id);
                return (
                  <TouchableOpacity
                    key={program.id}
                    style={[styles.modalItem, selected && styles.modalItemActive]}
                    onPress={() => setSelectedProgramForPrint(String(program.id))}
                  >
                    <Text style={[styles.modalItemText, selected && styles.modalItemTextActive]}>{program.nameAr}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.printModalButtonsRow}>
              <TouchableOpacity
                style={[styles.printConfirmButton, preparingReport && styles.disabledButton]}
                disabled={preparingReport}
                onPress={() => {
                  void handleShareReport();
                }}
              >
                {preparingReport ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Icon name="print" size={18} color="#ffffff" />
                )}
                <Text style={styles.printConfirmButtonText}>
                  {preparingReport ? 'جاري التجهيز...' : 'طباعة'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.printCancelButton}
                onPress={() => {
                  if (!preparingReport) {
                    setShowPrintModal(false);
                  }
                }}
              >
                <Text style={styles.printCancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 19,
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
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0f766e',
  },
  primaryActionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#ffffff',
  },
  secondaryActionButtonText: {
    color: '#1e3a8a',
    fontWeight: '700',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.65,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 12,
  },
  statCard: {
    width: 170,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'right',
  },
  statSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
  searchSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  activeSearchWrap: {
    marginTop: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeSearchText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '600',
  },
  clearSearchText: {
    color: '#1e3a8a',
    fontSize: 12,
    fontWeight: '700',
  },
  programPickerButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#f8fafc',
  },
  programPickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  programPickerText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  filterTitle: {
    marginTop: 14,
    marginBottom: 8,
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  statusFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  filterChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#60a5fa',
  },
  filterChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  clearFiltersButton: {
    marginTop: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearFiltersText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingWrap: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyWrap: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  emptyTitle: {
    marginTop: 12,
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  emptySubtitle: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  cardsList: {
    gap: 10,
  },
  traineeCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
  traineeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  traineeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  traineePhoto: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e2e8f0',
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  traineeNameWrap: {
    flex: 1,
  },
  traineeName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  traineeProgram: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressValue: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    width: 42,
    textAlign: 'left',
  },
  metricsRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  metricText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  metricStrong: {
    color: '#0f172a',
    fontWeight: '800',
  },
  metricVerified: {
    color: '#15803d',
    fontWeight: '800',
  },
  cardActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  cardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
  },
  viewActionButton: {
    borderWidth: 1,
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
  },
  downloadActionButton: {
    backgroundColor: '#059669',
  },
  viewActionText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700',
  },
  downloadActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  paginationWrap: {
    marginTop: 14,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  paginationSummaryText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  limitRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  limitLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'right',
  },
  limitOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  limitChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
  },
  limitChipActive: {
    borderColor: '#1d4ed8',
    backgroundColor: '#dbeafe',
  },
  limitChipText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  limitChipTextActive: {
    color: '#1d4ed8',
  },
  paginationButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  paginationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
  },
  paginationButtonText: {
    color: '#1e3a8a',
    fontWeight: '700',
    fontSize: 13,
  },
  disabledPaginationButton: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  disabledPaginationButtonText: {
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 8,
  },
  printModalSubtitle: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 10,
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  modalItemActive: {
    borderColor: '#60a5fa',
    backgroundColor: '#dbeafe',
  },
  modalItemText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  modalItemTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  modalCloseButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  printModalButtonsRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
  },
  printConfirmButton: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 11,
  },
  printConfirmButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  printCancelButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  printCancelButtonText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default TraineesArchiveScreen;
