@echo off
chcp 65001 >nul
title KÖKİZ Yerel Sunucu
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0baslat.ps1"
if errorlevel 1 pause

