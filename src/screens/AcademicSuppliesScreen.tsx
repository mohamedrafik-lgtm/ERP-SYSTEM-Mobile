import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import ArabicSearchInput from '../components/ArabicSearchInput';
import StudyMaterialCard from '../components/StudyMaterialCard';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { useStudyMaterials, useStudyMaterialsStats, useDeleteStudyMaterial, useToggleStudyMaterialActive } from '../hooks/useStudyMaterials';
import { usePermissions } from '../hooks/usePermissions';
import { styles } from './AcademicSuppliesScreen.styles';

const AcademicSuppliesScreen = ({ navigation }: any) => {
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<any>(null);
  const { isSuperAdmin, isAdmin, isManager } = usePermissions();

  // Business Logic من Hooks
  const {
    materials,
    loading,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    searchText,
    refresh,
    handleSearch,
    handlePageChange,
  } = useStudyMaterials({ autoFetch: true });

  const { stats, loading: statsLoading } = useStudyMaterialsStats();
  const { deleteMaterial, deleting } = useDeleteStudyMaterial();
  const { toggleActive, toggling } = useToggleStudyMaterialActive();

  const canManage = isSuperAdmin || isAdmin || isManager;

  // Handlers
  const handleDelete = (material: any) => {
    setMaterialToDelete(material);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;

    const success = await deleteMaterial(materialToDelete.id);
    if (success) {
      setDeleteModalVisible(false);
      setMaterialToDelete(null);
      refresh();
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setMaterialToDelete(null);
  };

  const handleToggleActive = async (material: any) => {
    const updated = await toggleActive(material.id);
    if (updated) {
      refresh();
    }
  };

  const handleStatusFilter = (active: boolean | undefined) => {
    setStatusFilter(active);
    // سيتم تطبيق الفلتر في المستقبل
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.pageButton,
            i === currentPage && styles.activePageButton,
          ]}
          onPress={() => handlePageChange(i)}
        >
          <Text
            style={[
              styles.pageButtonText,
              i === currentPage && styles.activePageButtonText,
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
          onPress={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Icon name="chevron-left" size={20} color={currentPage === 1 ? '#9ca3af' : '#1a237e'} />
        </TouchableOpacity>

        {pages}

        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
          onPress={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Icon name="chevron-right" size={20} color={currentPage === totalPages ? '#9ca3af' : '#1a237e'} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="AcademicSupplies" />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>الأدوات الدراسية</Text>
            <Text style={styles.subtitle}>إدارة وتتبع الأدوات والمستلزمات الدراسية</Text>
          </View>
        </View>
        <View style={{ width: 50 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        {/* Statistics Cards */}
        <View style={styles.statsSection}>
          {statsLoading ? (
            <ActivityIndicator size="small" color="#1a237e" />
          ) : (
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardOrange]}>
                <View style={[styles.statIcon, { backgroundColor: '#fff3cd' }]}>
                  <Icon name="schedule" size={24} color="#f59e0b" />
                </View>
                <Text style={styles.statNumber}>{stats?.pendingDeliveries || 0}</Text>
                <Text style={styles.statLabel}>قيد الانتظار</Text>
              </View>

              <View style={[styles.statCard, styles.statCardPurple]}>
                <View style={[styles.statIcon, { backgroundColor: '#ede9fe' }]}>
                  <Icon name="local-shipping" size={24} color="#7c3aed" />
                </View>
                <Text style={styles.statNumber}>{stats?.totalDeliveries || 501}</Text>
                <Text style={styles.statLabel}>إجمالي التسليمات</Text>
              </View>

              <View style={[styles.statCard, styles.statCardGreen]}>
                <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                  <Icon name="check-circle" size={24} color="#10b981" />
                </View>
                <Text style={styles.statNumber}>{stats?.activeMaterials || materials.filter(m => m.isActive).length}</Text>
                <Text style={styles.statLabel}>الأدوات النشطة</Text>
              </View>

              <View style={[styles.statCard, styles.statCardBlue]}>
                <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                  <Icon name="inventory" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.statNumber}>{stats?.totalMaterials || totalItems}</Text>
                <Text style={styles.statLabel}>إجمالي الأدوات</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddStudyMaterial')}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>إضافة أداة جديدة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.printButton}
            onPress={() => {
              Alert.alert('قريباً', 'طباعة التقرير العام قيد التطوير');
            }}
          >
            <Icon name="print" size={20} color="#fff" />
            <Text style={styles.printButtonText}>طباعة التقرير العام</Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchSection}>
          <ArabicSearchInput
            placeholder="البحث في الأدوات الدراسية..."
            value={searchText}
            onChangeText={(text) => handleSearch(text)}
            onSearch={() => handleSearch(searchText)}
          />

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>الحالة:</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  statusFilter === undefined && styles.activeFilterButton,
                ]}
                onPress={() => handleStatusFilter(undefined)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === undefined && styles.activeFilterButtonText,
                  ]}
                >
                  جميع الأدوات
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  statusFilter === true && styles.activeFilterButton,
                ]}
                onPress={() => handleStatusFilter(true)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === true && styles.activeFilterButtonText,
                  ]}
                >
                  نشط
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  statusFilter === false && styles.activeFilterButton,
                ]}
                onPress={() => handleStatusFilter(false)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === false && styles.activeFilterButtonText,
                  ]}
                >
                  غير نشط
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Materials List */}
        {loading && materials.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل الأدوات...</Text>
          </View>
        ) : materials.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inventory" size={80} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا توجد أدوات دراسية</Text>
            <Text style={styles.emptySubtitle}>
              لم يتم العثور على أي أدوات تطابق معايير البحث
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={refresh}>
              <Icon name="refresh" size={20} color="#1a237e" />
              <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.materialsList}>
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                عرض {materials.length} من {totalItems} أداة
              </Text>
            </View>

            {materials.map((material) => (
              <StudyMaterialCard
                key={material.id}
                material={material}
                showActions={canManage}
                onEdit={() => navigation.navigate('AddStudyMaterial', {
                  material,
                  mode: 'edit'
                })}
                onDelete={() => handleDelete(material)}
                onToggleActive={() => handleToggleActive(material)}
                onViewRecipients={() => Alert.alert('قريباً', 'قائمة المستلمين قيد التطوير')}
                onViewNonRecipients={() => Alert.alert('قريباً', 'قائمة غير المستلمين قيد التطوير')}
              />
            ))}
          </View>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <Text style={styles.paginationInfo}>
              صفحة {currentPage} من {totalPages}
            </Text>
            {renderPagination()}
          </View>
        )}

        {/* Loading Overlay */}
        {(deleting || toggling) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        title="تأكيد الحذف"
        message="سيتم حذف هذه الأداة الدراسية من النظام بشكل نهائي"
        itemName={materialToDelete?.name || ''}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleting}
      />
    </View>
  );
};

export default AcademicSuppliesScreen;