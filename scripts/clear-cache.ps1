# ════════════════════════════════════════════════════════════════
# مسح الكاش وإعادة تشغيل React Native
# ════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    مسح الكاش وإعادة تشغيل التطبيق" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# الانتقال لمجلد المشروع
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Split-Path -Parent $scriptPath
Set-Location $projectPath

Write-Host "[1/5] إيقاف Metro Bundler..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Write-Host "      ✓ تم" -ForegroundColor Green

Write-Host "[2/5] مسح كاش Metro Bundler..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
}
Remove-Item -Path "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\react-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\haste-*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "      ✓ تم" -ForegroundColor Green

Write-Host "[3/5] مسح كاش Watchman..." -ForegroundColor Yellow
& watchman watch-del-all 2>$null
Write-Host "      ✓ تم" -ForegroundColor Green

Write-Host "[4/5] مسح كاش Gradle (Android)..." -ForegroundColor Yellow
if (Test-Path "android\.gradle") {
    Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\build") {
    Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\app\build") {
    Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "      ✓ تم" -ForegroundColor Green

Write-Host "[5/5] مسح node_modules/.cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "      ✓ تم" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "    ✓ تم مسح الكاش بنجاح!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "الآن نفذ الأوامر التالية:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. في هذا الـ Terminal:" -ForegroundColor Cyan
Write-Host "     npx react-native start --reset-cache" -ForegroundColor White
Write-Host ""
Write-Host "  2. في Terminal آخر:" -ForegroundColor Cyan
Write-Host "     npx react-native run-android" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# سؤال المستخدم إذا كان يريد بدء Metro تلقائياً
$response = Read-Host "هل تريد بدء Metro Bundler الآن؟ (Y/N)"
if ($response -eq "Y" -or $response -eq "y" -or $response -eq "نعم") {
    Write-Host ""
    Write-Host "بدء Metro Bundler..." -ForegroundColor Yellow
    Write-Host "بعد بدء Metro، افتح Terminal آخر ونفذ: npx react-native run-android" -ForegroundColor Cyan
    Write-Host ""
    Start-Sleep -Seconds 2
    npx react-native start --reset-cache
}
else {
    Write-Host ""
    Write-Host "تم. يمكنك الآن بدء Metro يدوياً." -ForegroundColor Green
    Write-Host ""
}

