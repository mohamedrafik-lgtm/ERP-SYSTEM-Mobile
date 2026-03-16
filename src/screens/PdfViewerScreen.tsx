import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Linking } from 'react-native';

const PdfViewerScreen = ({ route, navigation }: any) => {
  const { url, title } = route.params || {};

  const sourceUrl = useMemo(() => {
    if (!url) return '';
    if (Platform.OS === 'android') {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    }
    return url;
  }, [url]);

  let WebViewComponent: any = null;
  let webViewLoadError = false;
  try {
    // Lazy-load to avoid crashing app startup if native module is not linked yet.
    WebViewComponent = require('react-native-webview').WebView;
  } catch {
    webViewLoadError = true;
  }

  if (!sourceUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={18} color="#1a237e" />
            <Text style={styles.backText}>رجوع</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>عرض PDF</Text>
          <View style={{ width: 56 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>الرابط غير متاح</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (webViewLoadError || !WebViewComponent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={18} color="#1a237e" />
            <Text style={styles.backText}>رجوع</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>عرض PDF</Text>
          <View style={{ width: 56 }} />
        </View>

        <View style={styles.centered}>
          <Text style={styles.errorText}>عارض PDF غير جاهز حاليًا</Text>
          <Text style={styles.helpText}>قم بإعادة بناء التطبيق ثم حاول مرة أخرى</Text>
          <TouchableOpacity
            style={styles.openExternalBtn}
            onPress={async () => {
              try {
                await Linking.openURL(sourceUrl);
              } catch {
                // no-op
              }
            }}
          >
            <Text style={styles.openExternalText}>فتح الملف مؤقتًا</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={18} color="#1a237e" />
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'عرض PDF'}</Text>
        <View style={{ width: 56 }} />
      </View>

      <WebViewComponent
        source={{ uri: sourceUrl }}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        style={styles.webView}
        renderLoading={() => (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل الملف...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default PdfViewerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
  },
  backText: {
    marginLeft: 4,
    color: '#1a237e',
    fontWeight: '700',
    fontSize: 13,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  webView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  errorText: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  helpText: {
    marginTop: 6,
    color: '#64748b',
    fontWeight: '600',
  },
  openExternalBtn: {
    marginTop: 14,
    backgroundColor: '#1a237e',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  openExternalText: {
    color: '#fff',
    fontWeight: '700',
  },
});
