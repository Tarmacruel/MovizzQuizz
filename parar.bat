@echo off
setlocal
cd /d "%~dp0"
set "NO_PAUSE="
echo %* | findstr /I /C:"/nopause" >nul && set "NO_PAUSE=1"

title MovizzQuizz - parar

echo.
echo ========================================
echo  MovizzQuizz - parar processos locais
echo ========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = @(5180,8001); " ^
  "$portPids = Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique; " ^
  "$tree = Get-CimInstance Win32_Process | Where-Object { ($_.Name -in @('node.exe','cmd.exe','esbuild.exe')) -and ($_.CommandLine -like '*concurrently*MovizzQuizz*' -or $_.CommandLine -like '*vite --host 0.0.0.0*' -or $_.CommandLine -like '*vite.js*--host 0.0.0.0*' -or $_.CommandLine -like '*nodemon src/index.js*' -or $_.CommandLine -like '*nodemon.js*src/index.js*' -or $_.CommandLine -like '*node.exe*src/index.js*' -or $_.CommandLine -like '*@esbuild*') }; " ^
  "$pids = @($portPids + ($tree | Select-Object -ExpandProperty ProcessId)) | Where-Object { $_ } | Sort-Object -Unique; " ^
  "if (-not $pids) { Write-Host 'Nenhum processo do MovizzQuizz encontrado.'; exit 0 }; " ^
  "$pids | ForEach-Object { Write-Host ('Parando PID ' + $_); Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue };"

echo.
echo Concluido.
echo.
if not defined NO_PAUSE pause
endlocal
