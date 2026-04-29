@echo off
setlocal
cd /d "%~dp0"
set "AUTO_Y="
set "NO_PAUSE="
echo %* | findstr /I /C:"/y" >nul && set "AUTO_Y=1"
echo %* | findstr /I /C:"/nopause" >nul && set "NO_PAUSE=1"

title MovizzQuizz - resetar banco

echo.
echo ========================================
echo  MovizzQuizz - resetar PostgreSQL local
echo ========================================
echo.
echo Este comando apaga e recria as tabelas do banco movizzquizz.
echo Perguntas, admin inicial e parametros serao recriados pelo seed.
echo.
if not defined AUTO_Y (
  choice /C SN /N /M "Continuar? [S/N] "
  if errorlevel 2 (
    echo Operacao cancelada.
    exit /b 0
  )
)

if not exist "server\.env" (
  echo [ERRO] server\.env nao encontrado.
  echo Crie o arquivo com base em server\.env.example.
  pause
  exit /b 1
)

echo.
echo Instalando dependencias se necessario...
call npm run install:all
if errorlevel 1 goto :erro

echo.
echo Resetando migrations e executando seed...
cd /d "%~dp0server"
call npx prisma migrate reset --force
if errorlevel 1 goto :erro

echo.
echo Sincronizando seed...
call npm run prisma:seed
if errorlevel 1 goto :erro

echo.
echo Gerando Prisma Client...
call npm run prisma:generate
if errorlevel 1 goto :erro

cd /d "%~dp0"
echo.
echo Reset concluido.
echo Admin: Tarmac / Thmpv77d6f*
echo.
if not defined NO_PAUSE pause
exit /b 0

:erro
cd /d "%~dp0"
echo.
echo [ERRO] Reset interrompido.
echo.
if not defined NO_PAUSE pause
exit /b 1
