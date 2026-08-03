@echo off
cd /d "%~dp0"
start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0tools\serve.ps1"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:4173/?v=%RANDOM%%RANDOM%"
