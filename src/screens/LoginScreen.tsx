import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TestLogin = ({ navigation }: any) => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://10.0.2.2:4000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrPhone,
          password,
        }),
      });

      const data = await response.json();
      console.log("Response:", data);

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'تم تسجيل الدخول بنجاح',
          text2: 'مرحباً بك في مركز طيبة للتدريب',
        });
        setTimeout(() => {
          navigation.replace('Home');
        }, 1200);
      } else {
        Toast.show({
          type: 'error',
          text1: 'فشل تسجيل الدخول',
          text2: data.message || 'يرجى التحقق من البيانات',
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Toast.show({
        type: 'error',
        text1: 'خطأ في الاتصال',
        text2: 'تعذر الاتصال بالخادم',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.orgName}>مركز طيبة للتدريب</Text>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../img/502585454_122235753458244801_413190920156398012_n-removebg-preview.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>تسجيل الدخول للنظام الإداري</Text>

          <View style={styles.inputWrapper}>
            <Icon name="person" size={22} color="#3a4a63" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني أو رقم الهاتف"
              placeholderTextColor="#b0b8c1"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Icon name="lock" size={22} color="#3a4a63" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور"
              placeholderTextColor="#b0b8c1"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonLoading]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "...جاري الدخول" : "دخول"}</Text>
          </TouchableOpacity>
        </View>
        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default TestLogin;

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f4f6fa",
  },
  orgName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a237e",
    marginBottom: 12,
    letterSpacing: 1.2,
    textShadowColor: '#b0b8c1',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoContainer: {
    backgroundColor: '#fff',
    borderRadius: 70,
    padding: 10,
    marginBottom: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#3a4a63",
    marginBottom: 28,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#22223b",
    backgroundColor: 'transparent',
  },
  button: {
    width: "100%",
    backgroundColor: "#1a237e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  buttonLoading: {
    opacity: 0.7,
  },
});
