param(
    [string]$AndroidSdk = $env:ANDROID_HOME,
    [switch]$PrepareOnly
)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not $AndroidSdk) { $AndroidSdk = $env:ANDROID_SDK_ROOT }
if (-not $AndroidSdk) { $AndroidSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (-not (Test-Path -LiteralPath $AndroidSdk)) {
    throw 'Android SDK not found. Install Android Studio, install SDK Platform 35 and Build Tools 35.0.0, then run this script with -AndroidSdk PATH.'
}
if (-not (Test-Path -LiteralPath (Join-Path $AndroidSdk 'platforms\android-35\android.jar'))) {
    throw 'Install Android SDK Platform 35 through Android Studio > SDK Manager.'
}
if (-not (Test-Path -LiteralPath (Join-Path $AndroidSdk 'build-tools\35.0.0'))) {
    throw 'Install Android SDK Build Tools 35.0.0 through Android Studio > SDK Manager.'
}
$env:ANDROID_HOME = (Resolve-Path -LiteralPath $AndroidSdk).Path
if ($env:JAVA_HOME -and (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    $javaExe = Join-Path $env:JAVA_HOME 'bin\java.exe'
} else {
    $javaExe = (Get-Command java -ErrorAction Stop).Source
}
if (-not (Test-Path -LiteralPath (Join-Path (Split-Path $javaExe) 'javac.exe'))) {
    throw 'A full JDK 17 or newer is required. Set JAVA_HOME to Android Studio\jbr (or a JDK 17 installation).'
}
$previousErrorPreference = $ErrorActionPreference
try {
    # Java writes its version to stderr even on success (including in Windows PowerShell 5.1).
    $ErrorActionPreference = 'Continue'
    $javaInfo = & $javaExe -version 2>&1 | Out-String
    $javaExit = $LASTEXITCODE
} finally { $ErrorActionPreference = $previousErrorPreference }
if ($javaExit -ne 0) { throw 'The configured JDK could not start.' }
if ($javaInfo -notmatch 'version "(?<major>\d+)\.') { throw 'Cannot determine the installed JDK version.' }
if ([int]$Matches['major'] -lt 17) { throw 'JDK 17 or newer is required. Set JAVA_HOME to Android Studio\jbr or a JDK 17 installation.' }
$taskTools = Join-Path $PSScriptRoot '.build-tools'
$gradleHome = Join-Path $taskTools 'gradle-8.11.1'
$gradleExe = Join-Path $gradleHome 'bin\gradle.bat'
if (-not (Test-Path -LiteralPath $gradleExe)) {
    New-Item -ItemType Directory -Path $taskTools -Force | Out-Null
    $archive = Join-Path $taskTools 'gradle-8.11.1-bin.zip'
    $uri = 'https://services.gradle.org/distributions/gradle-8.11.1-bin.zip'
    Write-Host 'Downloading Gradle 8.11.1 from the official Gradle distribution service...'
    Invoke-WebRequest -Uri $uri -OutFile $archive
    $expectedHash = (Invoke-RestMethod -Uri "$uri.sha256").ToString().Trim()
    $actualHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash
    if ($expectedHash -notmatch '^[a-fA-F0-9]{64}$' -or $actualHash -ine $expectedHash) { throw 'Gradle checksum verification failed.' }
    Expand-Archive -LiteralPath $archive -DestinationPath $taskTools -Force
}
# Generate the official Gradle wrapper on the user's machine, rather than shipping a placeholder JAR.
& $gradleExe --no-daemon wrapper --gradle-version 8.11.1 --distribution-type bin
if ($LASTEXITCODE -ne 0) { throw 'Gradle wrapper generation failed.' }
if ($PrepareOnly) { Write-Host 'Ready. Open this folder in Android Studio.'; exit 0 }
& $gradleExe --no-daemon :app:assembleDebug :app:lintDebug
if ($LASTEXITCODE -ne 0) { throw 'Android build failed. Review the Gradle output above.' }
Write-Host 'APK: app\build\outputs\apk\debug\app-debug.apk'
