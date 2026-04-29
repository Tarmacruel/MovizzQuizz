@echo off
setlocal
cd /d "%~dp0"

title MovizzQuizz - iniciar

echo.
echo ========================================
echo  MovizzQuizz - iniciar ambiente local
echo ========================================
echo.

if not exist "server\.env" (
  echo [AVISO] server\.env nao encontrado.
  echo Crie o arquivo com base em server\.env.example antes de iniciar.
  echo.
  pause
  exit /b 1
)

echo Frontend: http://localhost:5180
echo Backend : http://localhost:8001
echo Admin   : http://localhost:5180/admin
echo Tunnel  : https://quizz.sirel.com.br
echo.

npm run dev

endlocal
