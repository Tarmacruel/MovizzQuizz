@echo off
setlocal
cd /d "%~dp0"
set "AUTO_Y="
set "NO_PAUSE="
echo %* | findstr /I /C:"/y" >nul && set "AUTO_Y=1"
echo %* | findstr /I /C:"/nopause" >nul && set "NO_PAUSE=1"

title MovizzQuizz - atualizar

echo.
echo ========================================
echo  MovizzQuizz - atualizar pelo GitHub
echo ========================================
echo.

git status --short
echo.
echo Se houver alteracoes locais nao commitadas, o git pull pode falhar.
echo.
if not defined AUTO_Y (
  choice /C SN /N /M "Continuar com git pull e atualizacao? [S/N] "
  if errorlevel 2 (
    echo Operacao cancelada.
    exit /b 0
  )
)

echo.
echo Baixando atualizacoes...
git pull --ff-only
if errorlevel 1 goto :erro

echo.
echo Instalando dependencias...
call npm run install:all
if errorlevel 1 goto :erro

if exist "server\.env" (
  echo.
  echo Aplicando migrations...
  cd /d "%~dp0server"
  call npx prisma migrate deploy
  if errorlevel 1 goto :erro

  echo.
  echo Sincronizando seed...
  call npm run prisma:seed
  if errorlevel 1 goto :erro

  cd /d "%~dp0"
) else (
  echo.
  echo [AVISO] server\.env nao encontrado; migrations e seed foram ignorados.
)

echo.
echo Gerando build do frontend...
call npm run build
if errorlevel 1 goto :erro

echo.
echo Atualizacao concluida.
echo Use iniciar.bat para subir o ambiente.
echo.
if not defined NO_PAUSE pause
exit /b 0

:erro
cd /d "%~dp0"
echo.
echo [ERRO] Atualizacao interrompida.
echo.
if not defined NO_PAUSE pause
exit /b 1
