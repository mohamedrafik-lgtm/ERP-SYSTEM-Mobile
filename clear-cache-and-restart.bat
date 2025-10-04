@echo off
echo 🔧 مسح الـ Cache وإعادة تشغيل التطبيق...
echo.

echo 📱 إيقاف العمليات السابقة...
taskkill /f /im node.exe 2>nul
taskkill /f /im react-native.exe 2>nul

echo.
echo 🗑️ مسح الـ Cache...
npx react-native start --reset-cache

echo.
echo ✅ تم الانتهاء! أعد فتح التطبيق الآن.
pause
