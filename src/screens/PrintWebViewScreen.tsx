import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const escapeHtmlAttribute = (value: string) => value.replace(/"/g, '&quot;');

const buildPrintableHtml = (html: string, baseUrl: string) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const normalizedBase = String(baseUrl || '').trim();
  const baseTag = normalizedBase
    ? `<base href="${escapeHtmlAttribute(normalizedBase)}" />`
    : '';

  if (!baseTag) {
    return html;
  }

  if (/<base\s+href=/i.test(html)) {
    return html;
  }

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  }

  return `<head>${baseTag}</head>${html}`;
};

const resolveNativePrintModule = () => {
  const candidates: any[] = [];

  try {
    const nativePrintModule = require('react-native-print');
    candidates.push(
      nativePrintModule,
      nativePrintModule?.default,
      nativePrintModule?.default?.default,
      nativePrintModule?.RNPrint,
    );
  } catch {
    // ignore require errors, fallback to NativeModules below
  }

  candidates.push(NativeModules?.RNPrint);

  return (
    candidates.find(candidate => candidate && typeof candidate.print === 'function') || null
  );
};

const PrintWebViewScreen = ({ route, navigation }: any) => {
  const { url, title, headers, authToken } = route.params || {};
  const webViewRef = useRef<any>(null);
  const lastPrintRequestAtRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNativePrinting, setIsNativePrinting] = useState(false);

  const sourceUrl = useMemo(() => {
    if (!url || typeof url !== 'string') {
      return '';
    }
    return url;
  }, [url]);

  const authBootstrapScript = useMemo(() => {
    const tokenLiteral =
      authToken && typeof authToken === 'string' ? JSON.stringify(authToken) : 'null';

    return `
      (function() {
        try {
          var token = ${tokenLiteral};
          if (token) {
            localStorage.setItem('token', token);
            localStorage.setItem('auth_token', token);
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('auth_token', token);
            document.cookie = 'auth_token=' + encodeURIComponent(token) + '; path=/; SameSite=Lax';
          }
        } catch (error) {
          // ignore bootstrap errors
        }

        try {
          if (!window.__RN_NATIVE_PRINT_PATCHED__) {
            window.__RN_NATIVE_PRINT_PATCHED__ = true;

            var notifyNative = function(payload) {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify(payload));
              }
            };

            window.__RN_ORIGINAL_PRINT__ = window.print ? window.print.bind(window) : null;
            window.print = function() {
              notifyNative({ type: 'REQUEST_NATIVE_PRINT' });
              return true;
            };
          }
        } catch (error) {
          // ignore print patch errors
        }
      })();
      true;
    `;
  }, [authToken]);

  let WebViewComponent: any = null;
  let webViewLoadError = false;
  try {
    WebViewComponent = require('react-native-webview').WebView;
  } catch {
    webViewLoadError = true;
  }

  const requestNativePrintPayload = () => {
    webViewRef.current?.injectJavaScript(`
      (function() {
        try {
          var html = document.documentElement ? document.documentElement.outerHTML : '';
          var payload = {
            type: 'NATIVE_PRINT_PAYLOAD',
            html: html,
            baseUrl: window.location ? window.location.href : '',
            title: document.title || ''
          };
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        } catch (error) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PRINT_ERROR', message: String(error) }));
          }
        }
      })();
      true;
    `);
  };

  const handleRequestNativePrint = () => {
    const now = Date.now();
    if (now - lastPrintRequestAtRef.current < 800) {
      return;
    }

    if (!webViewRef.current) {
      Alert.alert('تنبيه', 'المعاينة غير جاهزة للطباعة بعد');
      return;
    }

    lastPrintRequestAtRef.current = now;
    requestNativePrintPayload();
  };

  const handlePrint = () => {
    handleRequestNativePrint();
  };

  const handleReload = () => {
    setLoadError(null);
    setIsLoading(true);
    webViewRef.current?.reload?.();
  };

  const handleWebMessage = (event: any) => {
    const payloadRaw = event?.nativeEvent?.data;
    if (!payloadRaw) {
      return;
    }

    try {
      const payload = JSON.parse(payloadRaw);
      if (payload?.type === 'REQUEST_NATIVE_PRINT') {
        handleRequestNativePrint();
        return;
      }

      if (payload?.type === 'NATIVE_PRINT_PAYLOAD') {
        const nativePrint = resolveNativePrintModule();

        if (!nativePrint?.print) {
          Alert.alert('خطأ', 'ميزة الطباعة غير متاحة داخل التطبيق حالياً');
          return;
        }

        const html = typeof payload?.html === 'string' ? payload.html : '';
        const baseUrl = typeof payload?.baseUrl === 'string' ? payload.baseUrl : sourceUrl;
        const printableHtml = buildPrintableHtml(html, baseUrl);
        const jobName =
          (typeof payload?.title === 'string' && payload.title.trim()) ||
          (typeof title === 'string' && title.trim()) ||
          'طباعة';

        if (!printableHtml) {
          Alert.alert('خطأ', 'تعذر تجهيز محتوى الصفحة للطباعة');
          return;
        }

        setIsNativePrinting(true);
        nativePrint.print({
          html: printableHtml,
          jobName,
        })
          .catch(() => {
            Alert.alert('خطأ', 'تعذر بدء نافذة الطباعة');
          })
          .finally(() => {
            setIsNativePrinting(false);
          });
        return;
      }

      if (payload?.type === 'PRINT_ERROR') {
        Alert.alert('خطأ', 'تعذر بدء الطباعة من المعاينة الداخلية');
      }
    } catch {
      // ignore non-json messages
    }
  };

  if (!sourceUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={20} color="#1e3a8a" />
            <Text style={styles.headerButtonText}>رجوع</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>معاينة وطباعة</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centered}>
          <Text style={styles.errorText}>رابط الاستمارة غير متاح</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (webViewLoadError || !WebViewComponent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={20} color="#1e3a8a" />
            <Text style={styles.headerButtonText}>رجوع</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>معاينة وطباعة</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centered}>
          <Text style={styles.errorText}>عارض الويب غير جاهز داخل التطبيق</Text>
          <Text style={styles.helpText}>أعد بناء التطبيق وتأكد من تثبيت react-native-webview</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={20} color="#1e3a8a" />
          <Text style={styles.headerButtonText}>رجوع</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'استمارة المتدرب'}
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleReload}>
            <Icon name="refresh" size={20} color="#1e3a8a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButtonPrimary, isNativePrinting && styles.iconButtonDisabled]}
            onPress={handlePrint}
            disabled={isNativePrinting}>
            <Icon name="print" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {!!loadError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{loadError}</Text>
        </View>
      )}

      <WebViewComponent
        ref={webViewRef}
        source={{
          uri: sourceUrl,
          headers: headers && typeof headers === 'object' ? headers : {},
        }}
        injectedJavaScriptBeforeContentLoaded={authBootstrapScript || undefined}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onLoadStart={() => {
          setIsLoading(true);
          setLoadError(null);
        }}
        onLoadEnd={() => setIsLoading(false)}
        onError={(event: any) => {
          const description = event?.nativeEvent?.description || 'تعذر تحميل الاستمارة';
          setLoadError(description);
        }}
        onHttpError={(event: any) => {
          const statusCode = event?.nativeEvent?.statusCode;
          setLoadError(`فشل التحميل - كود ${statusCode}`);
        }}
        onMessage={handleWebMessage}
        style={styles.webView}
        renderLoading={() => (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={styles.loadingText}>جاري تحميل الاستمارة...</Text>
          </View>
        )}
      />

      {isLoading && (
        <View style={styles.floatingHint}>
          <Text style={styles.floatingHintText}>بعد اكتمال التحميل اضغط زر الطباعة</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PrintWebViewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
  },
  headerButtonText: {
    marginLeft: 4,
    color: '#1e3a8a',
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
  headerSpacer: {
    width: 56,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  iconButtonPrimary: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d4ed8',
  },
  iconButtonDisabled: {
    opacity: 0.65,
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  errorText: {
    color: '#b91c1c',
    fontWeight: '700',
    textAlign: 'center',
  },
  helpText: {
    marginTop: 8,
    color: '#64748b',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorBannerText: {
    color: '#b91c1c',
    textAlign: 'center',
    fontWeight: '600',
  },
  floatingHint: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(15,23,42,0.86)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  floatingHintText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
