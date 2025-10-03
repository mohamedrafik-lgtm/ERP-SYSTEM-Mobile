import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import SelectBox from '../components/SelectBox';
import { LectureType, UpdateLectureRequest, LectureListItem } from '../types/lectures';
import AuthService from '../services/AuthService';
import DocumentPicker from 'react-native-document-picker';

const EditLectureScreen = ({ route, navigation }: any) => {
  const { lecture } = route.params as { lecture: LectureListItem };
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<UpdateLectureRequest>({
    title: lecture.title,
    description: lecture.description || undefined,
    type: lecture.type,
    chapter: lecture.chapter,
    youtubeUrl: lecture.youtubeUrl || undefined,
    pdfFile: lecture.pdfFile || undefined,
    order: lecture.order,
    contentId: lecture.contentId,
  });

  const setField = (k: keyof UpdateLectureRequest, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handlePickPdf = async () => {
    try {
      const res = await DocumentPicker.pick({ type: [DocumentPicker.types.pdf], allowMultiSelection: false, copyTo: 'cachesDirectory' });
      const file = Array.isArray(res) ? res[0] : (res as any);
      const pickedName = file?.name || 'selected.pdf';
      setField('pdfFile', pickedName);
      Toast.show({ type: 'success', text1: 'تم اختيار الملف', text2: pickedName });
    } catch (err: any) {
      if (DocumentPicker.isCancel(err)) return;
      Alert.alert('خطأ', 'فشل اختيار ملف PDF');
    }
  };

  const handleSave = async () => {
    if (!form.title?.trim()) {
      Toast.show({ type: 'error', text1: 'العنوان مطلوب' });
      return;
    }
    setLoading(true);
    try {
      const payload: UpdateLectureRequest = {
        title: form.title?.trim(),
        description: form.description?.trim() || undefined,
        type: form.type,
        chapter: Number(form.chapter),
        youtubeUrl: form.youtubeUrl?.trim() || undefined,
        pdfFile: form.pdfFile?.trim() || undefined,
        order: Number(form.order),
        contentId: Number(form.contentId),
      };
      await AuthService.updateLecture(lecture.id, payload);
      Toast.show({ type: 'success', text1: 'تم تحديث المحاضرة' });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'فشل تحديث المحاضرة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>تعديل محاضرة</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.row}>
            <Text style={styles.label}>العنوان</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={(t) => setField('title', t)} placeholder="عنوان المحاضرة" placeholderTextColor="#9CA3AF" />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>الوصف</Text>
            <TextInput style={styles.input} value={form.description} onChangeText={(t) => setField('description', t)} placeholder="وصف (اختياري)" placeholderTextColor="#9CA3AF" />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>النوع</Text>
            <SelectBox
              label="نوع المحاضرة"
              selectedValue={form.type as any}
              onValueChange={(v: any) => setField('type', v)}
              items={[
                { value: LectureType.VIDEO, label: 'فيديو' },
                { value: LectureType.PDF, label: 'PDF' },
                { value: LectureType.BOTH, label: 'كلاهما' },
              ]}
              placeholder="اختر النوع"
            />
          </View>
          <View style={styles.rowInline}>
            <View style={styles.inlineItem}>
              <Text style={styles.label}>الفصل</Text>
              <TextInput style={styles.input} value={String(form.chapter || '')} onChangeText={(t) => setField('chapter', Number(t) || 0)} placeholder="1" keyboardType="numeric" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.inlineItem}>
              <Text style={styles.label}>الترتيب</Text>
              <TextInput style={styles.input} value={String(form.order || '')} onChangeText={(t) => setField('order', Number(t) || 0)} placeholder="1" keyboardType="numeric" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          {(form.type === LectureType.VIDEO || form.type === LectureType.BOTH) && (
            <View style={styles.row}>
              <Text style={styles.label}>رابط يوتيوب</Text>
              <TextInput style={styles.input} value={form.youtubeUrl} onChangeText={(t) => setField('youtubeUrl', t)} placeholder="https://youtube.com/..." placeholderTextColor="#9CA3AF" />
            </View>
          )}

          {(form.type === LectureType.PDF || form.type === LectureType.BOTH) && (
            <View style={styles.row}>
              <Text style={styles.label}>ملف PDF</Text>
              <View style={styles.pdfRow}>
                <TouchableOpacity style={styles.pickButton} onPress={handlePickPdf}>
                  <Text style={styles.pickButtonText}>اختيار ملف</Text>
                </TouchableOpacity>
                <TextInput style={[styles.input, { flex: 1 }]} value={form.pdfFile} editable={false} onPressIn={handlePickPdf} placeholder="اضغط لاختيار ملف PDF" placeholderTextColor="#9CA3AF" />
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.submit, loading && styles.submitDisabled]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>حفظ</Text>}
          </TouchableOpacity>
        </View>
        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditLectureScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  backButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1a237e' },
  backText: { color: '#1a237e', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a237e' },
  body: { flexGrow: 1, padding: 20 },
  form: { marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  row: { marginBottom: 12 },
  rowInline: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inlineItem: { flex: 1 },
  label: { marginBottom: 6, color: '#374151', fontWeight: '600' },
  input: { height: 44, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 10, backgroundColor: '#fff', color: '#111827' },
  pdfRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickButton: { backgroundColor: '#1a237e', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginRight: 8 },
  pickButtonText: { color: '#fff', fontWeight: '700' },
  submit: { backgroundColor: '#1a237e', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});



