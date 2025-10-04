@echo off
echo ====================================
echo مسح الكاش وإعادة تشغيل التطبيق
echo ====================================
echo.

echo [1/4] إيقاف Metro Bundler...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] مسح كاش Metro...
cd /d "%~dp0.."
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q %TEMP%\metro-* 2>nul
rmdir /s /q %TEMP%\react-* 2>nul
rmdir /s /q %APPDATA%\Local\Temp\react-native-* 2>nul

echo [3/4] مسح كاش Gradle (Android)...
cd android
rmdir /s /q .gradle 2>nul
rmdir /s /q build 2>nul
rmdir /s /q app\build 2>nul
cd ..

echo [4/4] بدء Metro Bundler مع مسح الكاش...
echo.
echo ====================================
echo تم مسح الكاش بنجاح!
echo الآن شغل التطبيق بالأمر:
echo   npm run android
echo أو
echo   npx react-native run-android
echo ====================================
echo.

start cmd /k "npx react-native start --reset-cache"

pause

