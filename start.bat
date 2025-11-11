@echo off
echo ================================
echo   TAGE MAGE Trainer
echo ================================
echo.
echo Demarrage de l'application...
echo.

REM Verifier si node_modules existe
if not exist "node_modules" (
    echo Installation des dependances...
    call npm install
    echo.
)

REM Lancer l'application
echo L'application va s'ouvrir sur http://localhost:3000
echo.
echo Appuyez sur Ctrl+C pour arreter l'application
echo.

start http://localhost:3000

call npm run dev

pause
