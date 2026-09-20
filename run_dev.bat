@echo off
echo ========================================================
echo   Starting EstatePulse Real Estate CRM Development Servers
echo ========================================================

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "EstatePulse Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching Vite Frontend on http://localhost:5173 ...
start "EstatePulse Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching in separate console windows:
echo - Backend API Docs: http://127.0.0.1:8000/api/docs
echo - Frontend Web App: http://localhost:5173
echo.
echo Demo Accounts:
echo - Admin: admin@coromandel.in / Admin@1234
echo - Sales Consultant: meera@coromandel.in / Sales@1234
echo ========================================================
