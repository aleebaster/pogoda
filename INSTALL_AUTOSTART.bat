@echo off
setlocal
set APP_DIR=%~dp0
set TASK_NAME=PogodaFishingBot
if not exist "%APP_DIR%logs" mkdir "%APP_DIR%logs"
schtasks /Create /TN "%TASK_NAME%" /SC ONLOGON /RL LIMITED /F /TR "cmd /c cd /d %APP_DIR% && npm run bot >> logs\bot.log 2>>&1"
echo Installed Windows autostart task: %TASK_NAME%
echo Logs: %APP_DIR%logs\bot.log
