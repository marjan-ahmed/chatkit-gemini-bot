@echo off
echo === ChatKit Gemini Demo ===
echo.

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo Please edit .env and add your GEMINI_API_KEY
    echo Get your key at: https://aistudio.google.com/apikey
    pause
    exit /b 1
)

REM Setup backend
echo Setting up backend...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r backend\requirements.txt -q

REM Setup frontend
echo.
echo Setting up frontend...
cd frontend
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
)

REM Start both servers
echo.
echo Starting servers...
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop
echo.

start cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && cd backend && python main.py"
call npm run dev
