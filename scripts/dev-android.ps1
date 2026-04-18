Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

trap {
    Write-Host ("DEV_ANDROID_ERROR: " + $_.Exception.Message) -ForegroundColor Red
    exit 1
}

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $ProjectRoot

function Get-SdkPath {
    $localPropertiesPath = Join-Path $ProjectRoot "android\local.properties"
    if (Test-Path $localPropertiesPath) {
        $line = Get-Content $localPropertiesPath | Where-Object { $_ -match '^sdk\.dir=' } | Select-Object -First 1
        if ($line) {
            $raw = ($line -replace '^sdk\.dir=', '').Trim()
            $raw = $raw -replace '\\:', ':'
            $raw = $raw -replace '\\\\', '\\'
            if (Test-Path $raw) {
                return $raw
            }
        }
    }

    if ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) {
        return $env:ANDROID_SDK_ROOT
    }

    if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
        return $env:ANDROID_HOME
    }

    throw "Android SDK path was not found. Set ANDROID_SDK_ROOT or configure android/local.properties."
}

function Test-MetroRunning {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8081/status" -UseBasicParsing -TimeoutSec 2
        return $response.Content -match "packager-status:running"
    }
    catch {
        return $false
    }
}

function Get-ConnectedDeviceId {
    param (
        [Parameter(Mandatory = $true)]
        [string]$AdbPath
    )

    $output = & $AdbPath devices 2>$null
    $online = $output | Where-Object { $_ -match '^(.+)\s+device$' }
    if (-not $online) {
        return $null
    }

    $preferred = $online | Where-Object { $_ -match '^emulator-\d+\s+device$' } | Select-Object -First 1
    if ($preferred) {
        return (($preferred -split '\s+')[0]).Trim()
    }

    return ((($online | Select-Object -First 1) -split '\s+')[0]).Trim()
}

function Get-EmulatorDeviceId {
    param (
        [Parameter(Mandatory = $true)]
        [string]$AdbPath
    )

    $output = & $AdbPath devices 2>$null
    $emulators = $output | Where-Object { $_ -match '^(emulator-\d+)\s+(device|offline|unauthorized)$' }
    if (-not $emulators) {
        return $null
    }

    return ((($emulators | Select-Object -First 1) -split '\s+')[0]).Trim()
}

function Wait-ForEmulatorAttach {
    param (
        [Parameter(Mandatory = $true)]
        [string]$AdbPath,
        [int]$TimeoutSeconds = 120
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $deviceId = Get-EmulatorDeviceId -AdbPath $AdbPath
        if ($deviceId) {
            return $deviceId
        }
        Start-Sleep -Seconds 2
    }

    throw "Emulator did not appear in adb devices within ${TimeoutSeconds}s."
}

function Stop-StaleEmulators {
    param (
        [Parameter(Mandatory = $true)]
        [string]$AdbPath
    )

    $output = & $AdbPath devices 2>$null
    $emulators = $output | Where-Object { $_ -match '^(emulator-\d+)\s+(device|offline|unauthorized)$' }

    foreach ($line in $emulators) {
        $id = ((($line -split '\s+')[0]).Trim())
        if ($id) {
            try {
                & $AdbPath -s $id emu kill | Out-Null
            }
            catch {
                # Ignore failures while cleaning stale emulator instances.
            }
        }
    }

    try {
        Get-Process -Name "qemu-system-x86_64" -ErrorAction SilentlyContinue | Stop-Process -Force
    }
    catch {
        # Ignore if process is not running.
    }

    try {
        Get-Process -Name "emulator" -ErrorAction SilentlyContinue | Stop-Process -Force
    }
    catch {
        # Ignore if process is not running.
    }
}

function Set-OrAddConfigValue {
    param (
        [Parameter(Mandatory = $true)]
        [string[]]$Lines,
        [Parameter(Mandatory = $true)]
        [string]$Key,
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $prefix = "$Key="
    $updated = $false

    for ($i = 0; $i -lt $Lines.Count; $i++) {
        if ($Lines[$i].StartsWith($prefix)) {
            $Lines[$i] = "$prefix$Value"
            $updated = $true
            break
        }
    }

    if (-not $updated) {
        $Lines += "$prefix$Value"
    }

    return ,$Lines
}

function Ensure-AvdStableSettings {
    param (
        [Parameter(Mandatory = $true)]
        [string]$AvdName,
        [Parameter(Mandatory = $true)]
        [string]$SdkPath
    )

    $avdIniPath = Join-Path $env:USERPROFILE (".android\\avd\\$AvdName.ini")
    if (-not (Test-Path $avdIniPath)) {
        return
    }

    $iniLines = Get-Content $avdIniPath
    $pathLine = $iniLines | Where-Object { $_ -match '^path=' } | Select-Object -First 1
    if (-not $pathLine) {
        return
    }

    $avdPath = ($pathLine -replace '^path=', '').Trim()
    $configPath = Join-Path $avdPath "config.ini"
    if (-not (Test-Path $configPath)) {
        return
    }

    $lines = [string[]](Get-Content $configPath)

    $currentImageRel = ($lines | Where-Object { $_ -match '^image\.sysdir\.1=' } | Select-Object -First 1)
    $currentImageRel = if ($currentImageRel) { ($currentImageRel -replace '^image\.sysdir\.1=', '').Trim() } else { '' }
    $currentImageAbs = if ($currentImageRel) { Join-Path $SdkPath $currentImageRel } else { '' }
    $currentKernel = if ($currentImageAbs) { Join-Path $currentImageAbs 'kernel-ranchu' } else { '' }

    $image36_1Rel = 'system-images\android-36.1\google_apis_playstore\x86_64\'
    $image36_1Abs = Join-Path $SdkPath $image36_1Rel
    $image36_1Kernel = Join-Path $image36_1Abs 'kernel-ranchu'

    $image36Rel = 'system-images\android-36\google_apis_playstore\x86_64\'
    $image36Abs = Join-Path $SdkPath $image36Rel
    $image36Kernel = Join-Path $image36Abs 'kernel-ranchu'

    if (-not (Test-Path $currentKernel)) {
        $replacementRel = $null
        $replacementTarget = $null

        if (Test-Path $image36_1Kernel) {
            $replacementRel = $image36_1Rel
            $replacementTarget = 'android-36.1'
        }
        elseif (Test-Path $image36Kernel) {
            $replacementRel = $image36Rel
            $replacementTarget = 'android-36'
        }

        if ($replacementRel) {
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match '^image\.sysdir\.1=') {
                    $lines[$i] = "image.sysdir.1=$replacementRel"
                }
                if ($lines[$i] -match '^target=') {
                    $lines[$i] = "target=$replacementTarget"
                }
            }
            Write-Host "AVD image corrected to $replacementTarget (complete kernel found)." -ForegroundColor Yellow
        }
    }

    $lines = Set-OrAddConfigValue -Lines $lines -Key "fastboot.forceColdBoot" -Value "yes"
    $lines = Set-OrAddConfigValue -Lines $lines -Key "fastboot.forceFastBoot" -Value "no"
    $lines = Set-OrAddConfigValue -Lines $lines -Key "hw.gpu.enabled" -Value "yes"
    $lines = Set-OrAddConfigValue -Lines $lines -Key "hw.gpu.mode" -Value "host"
    $lines = Set-OrAddConfigValue -Lines $lines -Key "hw.ramSize" -Value "4096"
    $lines = Set-OrAddConfigValue -Lines $lines -Key "showDeviceFrame" -Value "no"

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($configPath, $lines, $utf8NoBom)
}

function Ensure-AdbServer {
    param (
        [Parameter(Mandatory = $true)]
        [string]$AdbPath,
        [int]$Retries = 4
    )

    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        try {
            & $AdbPath start-server 2>$null | Out-Null
            $null = & $AdbPath devices 2>$null
            if ($LASTEXITCODE -eq 0) {
                return
            }
        }
        catch {
            # Retry below.
        }

        Start-Sleep -Seconds 2
    }

    throw "Failed to initialize adb server after $Retries attempts."
}

function Get-DeviceState {
    param (
        [Parameter(Mandatory = $true)]
        [string]$AdbPath,
        [Parameter(Mandatory = $true)]
        [string]$DeviceId
    )

    try {
        return ((& $AdbPath -s $DeviceId get-state 2>$null) -join "").Trim()
    }
    catch {
        return ""
    }
}

function Wait-ForDeviceOnline {
    param (
        [Parameter(Mandatory = $true)]
        [string]$AdbPath,
        [Parameter(Mandatory = $true)]
        [string]$DeviceId,
        [int]$TimeoutSeconds = 180
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $state = Get-DeviceState -AdbPath $AdbPath -DeviceId $DeviceId
        if ($state -eq "device") {
            try {
                $probe = ((& $AdbPath -s $DeviceId shell echo ok 2>$null) -join "").Trim()
                if ($probe -match "ok") {
                    return
                }
            }
            catch {
                # Keep waiting until shell is responsive.
            }
        }

        if ($state -eq "offline") {
            & $AdbPath reconnect offline 2>$null | Out-Null
        }

        Start-Sleep -Seconds 2
    }

    throw "Device $DeviceId did not become online within ${TimeoutSeconds}s."
}

function Wait-ForBootCompleted {
    param (
        [Parameter(Mandatory = $true)]
        [string]$AdbPath,
        [Parameter(Mandatory = $true)]
        [string]$DeviceId,
        [int]$TimeoutSeconds = 240
    )

    Wait-ForDeviceOnline -AdbPath $AdbPath -DeviceId $DeviceId -TimeoutSeconds $TimeoutSeconds

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $boot = ((& $AdbPath -s $DeviceId shell getprop sys.boot_completed 2>$null) -join "").Trim()
            $bootAnim = ((& $AdbPath -s $DeviceId shell getprop init.svc.bootanim 2>$null) -join "").Trim()
            if ($boot -eq "1" -and ($bootAnim -eq "stopped" -or $bootAnim -eq "")) {
                return
            }
        }
        catch {
            # Ignore transient adb states while emulator boots.
        }
        Start-Sleep -Seconds 2
    }

    throw "Emulator did not finish booting within ${TimeoutSeconds}s."
}

function Start-EmulatorAndWait {
    param (
        [Parameter(Mandatory = $true)]
        [string]$AdbPath,
        [Parameter(Mandatory = $true)]
        [string]$EmulatorPath,
        [int]$TimeoutSeconds = 240
    )

    $avds = & $EmulatorPath -list-avds 2>$null
    $preferredAvd = $env:DEV_ANDROID_AVD
    $avdName = if ($preferredAvd -and ($avds -contains $preferredAvd)) { $preferredAvd } else { $avds | Select-Object -First 1 }
    if (-not $avdName) {
        throw "No AVD found. Create one in Android Studio Device Manager."
    }

    Ensure-AvdStableSettings -AvdName $avdName -SdkPath $sdkPath

    $gpuMode = if ([string]::IsNullOrWhiteSpace($env:DEV_ANDROID_GPU)) { "host" } else { $env:DEV_ANDROID_GPU }

    $launchEmulator = {
        param([bool]$UseWipeData, [string]$GpuOverride)

        $selectedGpu = if ([string]::IsNullOrWhiteSpace($GpuOverride)) { $gpuMode } else { $GpuOverride }
        $emulatorArgs = @("-avd", $avdName, "-gpu", $selectedGpu, "-no-boot-anim", "-noaudio")
        if ($env:DEV_ANDROID_USE_SNAPSHOT -ne "1") {
            $emulatorArgs += @("-no-snapshot-load", "-no-snapshot-save")
        }
        if ($UseWipeData -or $env:DEV_ANDROID_WIPE_DATA -eq "1") {
            $emulatorArgs += @("-wipe-data")
        }

        Write-Host "Launching AVD '$avdName' with GPU '$selectedGpu'..." -ForegroundColor Cyan
        Start-Process -FilePath $EmulatorPath -ArgumentList $emulatorArgs | Out-Null
    }

    Stop-StaleEmulators -AdbPath $AdbPath
    Start-Sleep -Seconds 2

    try {
        & $launchEmulator $false ""
        $deviceId = Wait-ForEmulatorAttach -AdbPath $AdbPath -TimeoutSeconds 120
        Wait-ForBootCompleted -AdbPath $AdbPath -DeviceId $deviceId -TimeoutSeconds $TimeoutSeconds
        return $deviceId
    }
    catch {
        Write-Host "Emulator boot failed once. Retrying with wipe-data and software GPU..." -ForegroundColor Yellow
        Stop-StaleEmulators -AdbPath $AdbPath
        Start-Sleep -Seconds 2

        & $launchEmulator $true "swiftshader_indirect"
        $deviceId = Wait-ForEmulatorAttach -AdbPath $AdbPath -TimeoutSeconds 150
        Wait-ForBootCompleted -AdbPath $AdbPath -DeviceId $deviceId -TimeoutSeconds ([Math]::Max($TimeoutSeconds, 360))
        return $deviceId
    }
}

function Install-ApkFallback {
    param (
        [Parameter(Mandatory = $true)]
        [string]$DeviceId,
        [Parameter(Mandatory = $true)]
        [string]$AdbPath
    )

    $apkPath = Join-Path $ProjectRoot "android\app\build\outputs\apk\debug\app-debug.apk"
    if (-not (Test-Path $apkPath)) {
        Write-Host "Debug APK not found. Building APK..." -ForegroundColor Yellow
        Push-Location (Join-Path $ProjectRoot "android")
        try {
            & ".\gradlew.bat" assembleDebug
            if ($LASTEXITCODE -ne 0) {
                throw "Gradle assembleDebug failed."
            }
        }
        finally {
            Pop-Location
        }
    }

    Write-Host "Installing APK directly via adb..." -ForegroundColor Cyan
    & $AdbPath -s $DeviceId install -r $apkPath
    if ($LASTEXITCODE -ne 0) {
        throw "Direct adb install failed."
    }

    # Launch app after install to confirm package is present on device.
    & $AdbPath -s $DeviceId shell monkey -p com.erpsystem -c android.intent.category.LAUNCHER 1 | Out-Null
}

$sdkPath = Get-SdkPath
$adbPath = Join-Path $sdkPath "platform-tools\adb.exe"
$emulatorPath = Join-Path $sdkPath "emulator\emulator.exe"

if (-not (Test-Path $adbPath)) {
    throw "adb not found at $adbPath"
}
if (-not (Test-Path $emulatorPath)) {
    throw "emulator binary not found at $emulatorPath"
}

$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath
$env:Path = "$sdkPath\platform-tools;$sdkPath\emulator;$env:Path"
Ensure-AdbServer -AdbPath $adbPath

if (-not (Test-MetroRunning)) {
    Write-Host "Starting Metro in a new PowerShell window..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$ProjectRoot'; npm start"
    ) | Out-Null
}
else {
    Write-Host "Metro is already running on port 8081." -ForegroundColor Green
}

$deviceId = Get-ConnectedDeviceId -AdbPath $adbPath
if (-not $deviceId) {
    Write-Host "No connected Android device found. Launching emulator..." -ForegroundColor Yellow
    $deviceId = Start-EmulatorAndWait -AdbPath $adbPath -EmulatorPath $emulatorPath
}

Write-Host "Using Android device: $deviceId" -ForegroundColor Green
Wait-ForDeviceOnline -AdbPath $adbPath -DeviceId $deviceId
Wait-ForBootCompleted -AdbPath $adbPath -DeviceId $deviceId

function Install-DebugApp {
    param (
        [Parameter(Mandatory = $true)]
        [string]$DeviceId
    )

    Write-Host "Installing debug app (Fast Refresh stays active with Metro)..." -ForegroundColor Cyan
    $env:ANDROID_SERIAL = $DeviceId
    npx react-native run-android --device $DeviceId --no-packager
    if ($LASTEXITCODE -eq 0) {
        return 0
    }

    Write-Host "react-native install failed. Using adb APK fallback..." -ForegroundColor Yellow
    try {
        Install-ApkFallback -DeviceId $DeviceId -AdbPath $adbPath
        return 0
    }
    catch {
        Write-Host ("Fallback install error: " + $_.Exception.Message) -ForegroundColor Red
        return 1
    }
}

$installExitCode = Install-DebugApp -DeviceId $deviceId
if ($installExitCode -ne 0) {
    Write-Host "Install failed. Reconnecting adb and retrying once..." -ForegroundColor Yellow
    & $adbPath reconnect offline | Out-Null
    & $adbPath start-server | Out-Null

    $deviceId = Get-ConnectedDeviceId -AdbPath $adbPath
    if (-not $deviceId) {
        Write-Host "No active device after reconnect. Launching emulator again..." -ForegroundColor Yellow
        $deviceId = Start-EmulatorAndWait -AdbPath $adbPath -EmulatorPath $emulatorPath
    }

    Wait-ForBootCompleted -AdbPath $adbPath -DeviceId $deviceId
    $installExitCode = Install-DebugApp -DeviceId $deviceId
    if ($installExitCode -ne 0) {
        throw "Install failed after retry. Check emulator state and run the command again."
    }
}

Write-Host "Development mode is ready. Save any file and changes should appear instantly via Fast Refresh." -ForegroundColor Green
