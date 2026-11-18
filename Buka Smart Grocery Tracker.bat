@echo off
title Smart Grocery & Budget Safety Tracker
if exist "%~dp0Smart-Grocery-Tracker" cd /d "%~dp0Smart-Grocery-Tracker"
echo ========================================================
echo   SMART GROCERY & BUDGET SAFETY TRACKER (PWA)
echo   Untuk Siswa Rantau Belanja Supermarket
echo ========================================================
echo.
echo Menjalankan Web Server Lokal...
node server.js
pause