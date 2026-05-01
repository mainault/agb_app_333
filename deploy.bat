@echo off
echo ============================
echo   DEPLOY SCRIPT START
echo ============================

echo.
echo === Etat Git ===
git status

echo.
echo Vérifie les fichiers ci-dessus
pause

echo.
echo === Git add (ALL) ===
git add .

echo.
echo === Commit ===
set /p msg="Message de commit: "
git commit -m "%msg%"

echo.
echo === Push ===
git push

echo.
echo ============================
echo   BUILD EAS ?
echo ============================
set /p build="Lancer build Android ? (y/n): "

if /I "%build%"=="y" (
    echo === Build Android ===
    eas build --platform android --profile production
)

echo.
echo ============================
echo   DEPLOY TERMINE
echo ============================
pause