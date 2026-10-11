@echo off
setlocal
cd /d "%~dp0"
title Calorie Tracker

rem ---- MySQL (XAMPP) ----
netstat -an | find ":3306" | find "LISTENING" >nul
if errorlevel 1 (
    if not exist "C:\xampp\mysql_start.bat" (
        echo MySQL is not running. Start it from the XAMPP Control Panel, then run this again.
        pause
        exit /b 1
    )
    echo Starting MySQL...
    start "MySQL" /min cmd /c "C:\xampp\mysql_start.bat"
    timeout /t 5 /nobreak >nul
)
if exist "C:\xampp\mysql\bin\mysql.exe" (
    "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS calorie_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
)

rem ---- Backend: create the venv and .env on first run ----
if not exist "backend\.venv\Scripts\python.exe" (
    echo Setting up the Python environment, this takes a minute...
    python -m venv backend\.venv || goto :error
    backend\.venv\Scripts\python -m pip install -q -r backend\requirements.txt || goto :error
)
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    backend\.venv\Scripts\python -c "import pathlib, secrets; p = pathlib.Path('backend/.env'); p.write_text(p.read_text().replace('SECRET_KEY=change-me', 'SECRET_KEY=' + secrets.token_urlsafe(48)))"
)
rem Pick up new dependencies and bring the database schema up to date
backend\.venv\Scripts\python -m pip install -q -r backend\requirements.txt || goto :error
pushd backend
.venv\Scripts\alembic upgrade head || (popd & goto :error)
popd

rem ---- Frontend: install packages on first run ----
rem PATH can be stale right after installing Node, so check the default location too
where npm >nul 2>nul || if exist "%ProgramFiles%\nodejs\npm.cmd" set "PATH=%ProgramFiles%\nodejs;%PATH%"
where npm >nul 2>nul
if errorlevel 1 (
    echo Node.js is not installed. Get it from https://nodejs.org
    pause
    exit /b 1
)
if not exist "frontend\node_modules" (
    echo Installing frontend packages...
    pushd frontend
    call npm install || (popd & goto :error)
    popd
)

rem ---- Start both servers in their own windows ----
start "Calorie Tracker - backend" cmd /k "cd /d backend && .venv\Scripts\python -m uvicorn app.main:app --reload"
start "Calorie Tracker - frontend" cmd /k "cd /d frontend && npm run dev"

echo Opening http://localhost:5173 ...
timeout /t 4 /nobreak >nul
start "" http://localhost:5173
exit /b 0

:error
echo.
echo Setup failed, see the error above.
pause
exit /b 1
