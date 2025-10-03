import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import AuthService from '../services/AuthService';
import { LectureListItem, LectureType } from '../types/lectures';

const LecturesScreen = ({ route, navigation }: any) => {
  const { content } = route.params || {};
  const [lectures, setLectures] = useState<LectureListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLectures = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getLectures(content?.id ? { contentId: content.id } : undefined);
      setLectures(Array.isArray(data) ? data : []);
    } catch (e) {
      setLectures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLectures();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Reload whenever screen gains focus (e.g., after adding a lecture)
      loadLectures();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLectures();
    setRefreshing(false);
  };

  const onConfirmDelete = (lec: LectureListItem) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف المحاضرة "${lec.title}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await AuthService.deleteLecture(lec.id);
              await loadLectures();
            } catch (e: any) {
              Alert.alert('خطأ', e?.message || 'فشل حذف المحاضرة');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>المحاضرات</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {content?.name ? (
          <Text style={styles.subtitle}>المحتوى: {content.name}</Text>
        ) : null}

        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddLecture', { content })}>
          <Text style={styles.addButtonText}>إضافة محاضرة</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل المحاضرات...</Text>
          </View>
        ) : lectures.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>لا توجد محاضرات بعد</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {lectures
              .sort((a, b) => a.order - b.order)
              .map((lec) => (
                <TouchableOpacity key={lec.id} style={styles.item} activeOpacity={0.9} onPress={() => navigation.navigate('EditLecture', { lecture: lec })}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{lec.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.typeBadge, getTypeBadgeStyle(lec.type)]}>
                        <Text style={styles.typeBadgeText}>{lec.type}</Text>
                      </View>
                      <TouchableOpacity style={styles.headerTextBtn} onPress={() => navigation.navigate('EditLecture', { lecture: lec })}>
                        <Text style={styles.headerTextBtnText}>تعديل</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.headerDeleteBtn} onPress={() => onConfirmDelete(lec)}>
                        <Text style={styles.headerDeleteBtnText}>حذف</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.itemMeta}>فصل: {lec.chapter} • ترتيب: {lec.order}</Text>
                  {lec.description ? <Text style={styles.itemDesc} numberOfLines={2}>{lec.description}</Text> : null}
                  {lec.youtubeUrl ? <Text style={styles.itemLink}>يوتيوب: {lec.youtubeUrl}</Text> : null}
                  {lec.pdfFile ? <Text style={styles.itemLink}>PDF: {lec.pdfFile}</Text> : null}
                  <View style={styles.itemFooter}> 
                    <Text style={styles.itemFooterText}>كود المادة: {lec.content?.code}</Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('EditLecture', { lecture: lec })}>
                        <Text style={styles.actionBtnText}>تعديل</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => onConfirmDelete(lec)}>
                        <Text style={styles.deleteBtnText}>حذف</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LecturesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  backText: {
    color: '#1a237e',
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  body: {
    flexGrow: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
  },
  addButton: {
    backgroundColor: '#1a237e',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6b7280',
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
  },
  emptyText: {
    color: '#6b7280',
  },
  list: {
    marginTop: 12,
    gap: 8,
  },
  item: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 16,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemMeta: {
    color: '#6b7280',
    marginTop: 4,
  },
  itemDesc: {
    color: '#374151',
    marginTop: 6,
  },
  itemLink: {
    color: '#374151',
    marginTop: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  itemFooterText: {
    color: '#6b7280',
    fontSize: 12,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#1a237e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionBtnText: {
    color: '#1a237e',
    fontWeight: '700',
    fontSize: 12,
  },
  headerEditBtn: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#1a237e',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerTextBtn: {
    marginLeft: 8,
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#1a237e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerTextBtnText: {
    color: '#1a237e',
    fontWeight: '700',
    fontSize: 12,
  },
  headerDeleteBtn: {
    marginLeft: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerDeleteBtnText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 12,
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteBtnText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 12,
  },
});

// Helper for badge color per type
function getTypeBadgeStyle(type: LectureType) {
  switch (type) {
    case LectureType.VIDEO:
      return { backgroundColor: '#e3f2fd', borderWidth: 1, borderColor: '#90caf9' };
    case LectureType.PDF:
      return { backgroundColor: '#f3e5f5', borderWidth: 1, borderColor: '#ce93d8' };
    case LectureType.BOTH:
      return { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#a5d6a7' };
    default:
      return { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' };
  }
}


