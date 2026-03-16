import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AuthService from '../services/AuthService';
import { LectureListItem, LectureType } from '../types/lectures';

const LecturesScreen = ({ route, navigation }: any) => {
  const { content } = route.params || {};
  const [lectures, setLectures] = useState<LectureListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingLectureId, setDownloadingLectureId] = useState<number | null>(null);

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

  const resolveFileUrl = async (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrl = await AuthService.getCurrentApiBaseUrl();
    return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  };

  const openYoutube = async (url: string) => {
    if (!url) {
      Alert.alert('خطأ', 'رابط الفيديو غير متاح');
      return;
    }
    navigation.navigate('YouTubeViewer', { url, title: 'مشاهدة الفيديو' });
  };

  const openPdf = async (pdfPath: string) => {
    try {
      const url = await resolveFileUrl(pdfPath);
      if (!url) {
        Alert.alert('خطأ', 'ملف PDF غير متاح');
        return;
      }
      navigation.navigate('PdfViewer', { url, title: 'عرض ملف PDF' });
    } catch {
      Alert.alert('خطأ', 'تعذر فتح ملف PDF');
    }
  };

  const downloadPdf = async (lec: LectureListItem) => {
    if (!lec.pdfFile) return;

    try {
      setDownloadingLectureId(lec.id);
      const url = await resolveFileUrl(lec.pdfFile);
      if (!url) {
        Alert.alert('خطأ', 'ملف PDF غير متاح');
        return;
      }

      const token = await AuthService.getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const sanitizedTitle = (lec.title || 'lecture').replace(/[\\/:*?"<>|]/g, '-');
      const fileName = `${sanitizedTitle}.pdf`;

      if (Platform.OS === 'android') {
        await ReactNativeBlobUtil.config({
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: fileName,
            description: 'تحميل ملف PDF',
            mime: 'application/pdf',
            mediaScannable: true,
          },
        }).fetch('GET', url, headers);

        Alert.alert('تم', 'تم بدء تحميل الملف وسيظهر في التنبيهات/التنزيلات');
      } else {
        const targetPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`;
        const result = await ReactNativeBlobUtil.config({ path: targetPath }).fetch('GET', url, headers);
        Alert.alert('تم التحميل', `تم حفظ الملف في: ${result.path()}`);
      }
    } catch {
      Alert.alert('خطأ', 'تعذر تحميل ملف PDF');
    } finally {
      setDownloadingLectureId(null);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={18} color="#1a237e" />
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>المحاضرات</Text>
          <Text style={styles.headerHint}>{lectures.length} محاضرة</Text>
        </View>

        <TouchableOpacity style={styles.addMiniBtn} onPress={() => navigation.navigate('AddLecture', { content })}>
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {content?.name ? (
          <View style={styles.contentCard}>
            <Text style={styles.contentLabel}>المحتوى</Text>
            <Text style={styles.contentName} numberOfLines={1}>{content.name}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddLecture', { content })}>
          <Icon name="post-add" size={18} color="#fff" />
          <Text style={styles.addButtonText}>إضافة محاضرة جديدة</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل المحاضرات...</Text>
          </View>
        ) : lectures.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="menu-book" size={30} color="#94a3b8" />
            <Text style={styles.emptyTitle}>لا توجد محاضرات بعد</Text>
            <Text style={styles.emptyText}>ابدأ بإضافة أول محاضرة لهذا المحتوى</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {lectures
              .sort((a, b) => a.order - b.order)
              .map((lec) => (
                <View key={lec.id} style={styles.item}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{lec.title}</Text>
                    <View style={[styles.typeBadge, getTypeBadgeStyle(lec.type)]}>
                      <Text style={styles.typeBadgeText}>{getLectureTypeLabel(lec.type)}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Icon name="layers" size={14} color="#64748b" />
                    <Text style={styles.itemMeta}>فصل {lec.chapter}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Icon name="sort" size={14} color="#64748b" />
                    <Text style={styles.itemMeta}>ترتيب {lec.order}</Text>
                  </View>

                  {lec.description ? (
                    <Text style={styles.itemDesc} numberOfLines={3}>{lec.description}</Text>
                  ) : null}

                  {lec.youtubeUrl ? (
                    <TouchableOpacity style={styles.resourceActionBtn} onPress={() => openYoutube(lec.youtubeUrl!)}>
                      <Icon name="ondemand-video" size={15} color="#991b1b" />
                      <Text style={styles.resourceActionText}>مشاهدة الفيديو</Text>
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.itemFooter}>
                    <Text style={styles.itemFooterText}>كود المادة: {lec.content?.code || '-'}</Text>
                    <View style={styles.itemActions}>
                      {lec.pdfFile ? (
                        <TouchableOpacity style={styles.actionBtnPdf} onPress={() => openPdf(lec.pdfFile!)}>
                          <Text style={styles.actionBtnPdfText}>عرض PDF</Text>
                        </TouchableOpacity>
                      ) : null}
                      {lec.pdfFile ? (
                        <TouchableOpacity
                          style={[styles.downloadPdfBtn, downloadingLectureId === lec.id && styles.downloadPdfBtnDisabled]}
                          onPress={() => downloadPdf(lec)}
                          disabled={downloadingLectureId === lec.id}
                        >
                          <Text style={styles.downloadPdfText}>{downloadingLectureId === lec.id ? 'جاري التحميل...' : 'تحميل PDF'}</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('EditLecture', { lecture: lec })}
                      >
                        <Text style={styles.actionBtnText}>تعديل</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => onConfirmDelete(lec)}>
                        <Text style={styles.deleteBtnText}>حذف</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
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
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  backText: {
    color: '#1a237e',
    fontWeight: '700',
    fontSize: 13,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  headerHint: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  addMiniBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexGrow: 1,
    padding: 14,
    paddingBottom: 24,
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  contentLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  contentName: {
    marginTop: 4,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 6,
  },
  loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#64748b',
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 8,
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  },
  list: {
    marginTop: 2,
  },
  item: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    flex: 1,
    marginRight: 10,
    fontWeight: '700',
    color: '#0f172a',
    fontSize: 16,
  },
  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  itemMeta: {
    color: '#64748b',
    marginHorizontal: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    color: '#94a3b8',
    marginHorizontal: 3,
    fontSize: 12,
  },
  itemDesc: {
    color: '#334155',
    marginTop: 6,
    lineHeight: 20,
  },
  resourceActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  resourceActionText: {
    color: '#334155',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnPdf: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  actionBtnPdfText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 12,
  },
  downloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  downloadPdfBtnDisabled: {
    opacity: 0.7,
  },
  downloadPdfText: {
    color: '#065f46',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  itemFooterText: {
    color: '#64748b',
    fontSize: 12,
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  actionBtnText: {
    color: '#1a237e',
    fontWeight: '700',
    fontSize: 12,
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    paddingHorizontal: 12,
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

function getLectureTypeLabel(type: LectureType) {
  switch (type) {
    case LectureType.VIDEO:
      return 'فيديو';
    case LectureType.PDF:
      return 'PDF';
    case LectureType.BOTH:
      return 'فيديو + PDF';
    default:
      return String(type);
  }
}


