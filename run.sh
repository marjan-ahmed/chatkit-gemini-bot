#!/bin/bash
echo "=== ChatKit Gemini Demo ==="
echo

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo
    echo "Please edit .env and add your GEMINI_API_KEY"
    echo "Get your key at: https://aistudio.google.com/apikey"
    exit 1
fi

# Setup backend
echo "Setting up backend..."
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r backend/requirements.txt -q

# Setup frontend
echo
echo "Setting up frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi
cd ..

# Start both servers
echo
echo "Starting servers..."
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo
echo "Press Ctrl+C to stop"
echo

# Start backend in background
source venv/bin/activate && cd backend && python main.py &
BACKEND_PID=$!

# Start frontend
cd frontend && npm run dev

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null
