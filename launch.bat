@echo off
title GitReal Command Center
color 0A
echo.
echo  =======================================================
echo   G I T R E A L   -   H A C K A T H O N   L A U N C H
echo  =======================================================
echo.
echo  [1] Launching The Brain (Python Backend)...
start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo  [2] Launching The Face (Next.js Frontend)...
start cmd /k "cd frontend && npm run dev"

echo.
echo  [SUCCESS] Systems Online.
echo  Backend: http://localhost:8000
echo  Frontend: http://localhost:3000
echo.
pause

