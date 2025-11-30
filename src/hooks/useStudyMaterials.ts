import { useState, useEffect, useCallback } from 'react';
import StudyMaterialsService from '../services/StudyMaterialsService';
import {
  StudyMaterial,
  GetStudyMaterialsParams,
  StudyMaterialsStats,
} from '../types/studyMaterials';
import Toast from 'react-native-toast-message';

/**
 * Custom Hook for managing study materials
 * Following Single Responsibility Principle - Business Logic only
 */
interface UseStudyMaterialsOptions {
  programId?: number;
  isActive?: boolean;
  autoFetch?: boolean;
}

export const useStudyMaterials = (options: UseStudyMaterialsOptions = {}) => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchText, setSearchText] = useState('');

  const fetchMaterials = useCallback(async (
    page: number = 1,
    search: string = '',
    params?: GetStudyMaterialsParams
  ) => {
    try {
      setLoading(true);
      setError(null);

      const requestParams: GetStudyMaterialsParams = {
        page,
        limit: 20,
        search: search || undefined,
        programId: options.programId || params?.programId,
        isActive: options.isActive !== undefined ? options.isActive : params?.isActive,
      };

      console.log('[useStudyMaterials] Fetching with params:', requestParams);

      const response = await StudyMaterialsService.getStudyMaterials(requestParams);

      setMaterials(response.materials);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);

      console.log('[useStudyMaterials] Loaded:', response.materials.length, 'materials');
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('[useStudyMaterials] Error:', error);

      Toast.show({
        type: 'error',
        text1: 'خطأ في تحميل البيانات',
        text2: error.message || 'فشل في تحميل الأدوات الدراسية',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [options.programId, options.isActive]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMaterials(currentPage, searchText);
  }, [fetchMaterials, currentPage, searchText]);

  const handleSearch = useCallback(async (search: string) => {
    setSearchText(search);
    setCurrentPage(1);
    await fetchMaterials(1, search);
  }, [fetchMaterials]);

  const handlePageChange = useCallback(async (page: number) => {
    setCurrentPage(page);
    await fetchMaterials(page, searchText);
  }, [fetchMaterials, searchText]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchMaterials();
    }
  }, [fetchMaterials, options.autoFetch]);

  return {
    materials,
    loading,
    refreshing,
    error,
    currentPage,
    totalPages,
    totalItems,
    searchText,
    fetchMaterials,
    refresh,
    handleSearch,
    handlePageChange,
  };
};

/**
 * Hook for study materials statistics
 */
export const useStudyMaterialsStats = () => {
  const [stats, setStats] = useState<StudyMaterialsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await StudyMaterialsService.getStats();
      setStats(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('[useStudyMaterialsStats] Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
};

/**
 * Hook for deleting study material
 */
export const useDeleteStudyMaterial = () => {
  const [deleting, setDeleting] = useState(false);

  const deleteMaterial = useCallback(async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);

      await StudyMaterialsService.deleteStudyMaterial(id);

      Toast.show({
        type: 'success',
        text1: 'تم الحذف',
        text2: 'تم حذف الأداة الدراسية بنجاح',
      });

      return true;
    } catch (error) {
      console.error('[useDeleteStudyMaterial] Error:', error);

      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: (error as Error).message || 'فشل في حذف الأداة',
      });

      return false;
    } finally {
      setDeleting(false);
    }
  }, []);

  return {
    deleteMaterial,
    deleting,
  };
};

/**
 * Hook for toggling study material active status
 */
export const useToggleStudyMaterialActive = () => {
  const [toggling, setToggling] = useState(false);

  const toggleActive = useCallback(async (id: string): Promise<StudyMaterial | null> => {
    try {
      setToggling(true);

      const updated = await StudyMaterialsService.toggleStudyMaterialActive(id);

      Toast.show({
        type: 'success',
        text1: 'تم التحديث',
        text2: `تم ${updated.isActive ? 'تفعيل' : 'تعطيل'} الأداة بنجاح`,
      });

      return updated;
    } catch (error) {
      console.error('[useToggleStudyMaterialActive] Error:', error);

      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: (error as Error).message || 'فشل في تحديث حالة الأداة',
      });

      return null;
    } finally {
      setToggling(false);
    }
  }, []);

  return {
    toggleActive,
    toggling,
  };
};