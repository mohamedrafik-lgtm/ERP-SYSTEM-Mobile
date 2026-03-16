import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';

const extractYouTubeVideoId = (url: string): string => {
  if (!url) return '';

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?&/]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return '';
};

const YouTubeViewerScreen = ({ route, navigation }: any) => {
  const { url, title } = route.params || {};
  const originalUrl = String(url || '');

  const watchUrl = useMemo(() => {
    const videoId = extractYouTubeVideoId(originalUrl);
    if (!videoId) return '';
    // Using mobile watch page avoids YouTube embed restrictions (Error 153) in many WebView setups.
    return `https://m.youtube.com/watch?v=${videoId}`;
  }, [originalUrl]);

  if (!watchUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={18} color="#1a237e" />
            <Text style={styles.backText}>رجوع</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>عرض الفيديو</Text>
          <View style={{ width: 56 }} />
        </View>

        <View style={styles.centered}>
          <Text style={styles.errorText}>رابط الفيديو غير صالح</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'عرض الفيديو'}</Text>
        <View style={{ width: 56 }} />
      </View>

      <WebView
        source={{ uri: watchUrl }}
        style={styles.webView}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
        startInLoadingState
        onHttpError={() => {
          // Keep page visible, fallback button below helps user continue.
        }}
        renderLoading={() => (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل الفيديو...</Text>
          </View>
        )}
      />

      <View style={styles.footerBar}>
        <TouchableOpacity
          style={styles.fallbackBtn}
          onPress={async () => {
            try {
              const target = originalUrl.startsWith('http://') || originalUrl.startsWith('https://')
                ? originalUrl
                : `https://${originalUrl}`;
              await Linking.openURL(target);
            } catch {
              // ignore
            }
          }}
        >
          <Text style={styles.fallbackText}>فتح على يوتيوب</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default YouTubeViewerScreen;

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
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  footerBar: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fallbackBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#fff',
    fontWeight: '700',
  },
});
