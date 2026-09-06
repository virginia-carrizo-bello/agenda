@echo off
title Servidor Tempo - Backend Python
echo ========================================================
echo        Iniciando Backend Tempo (FastAPI + SQLite)
echo ========================================================
echo.

if not exist ".venv" (
    echo Creando entorno virtual .venv...
    python -m venv .venv
)

echo Verificando dependencias...
.\.venv\Scripts\python.exe -m pip install -r requirements.txt --quiet

echo.
echo ========================================================
echo  Servidor listo!
echo  Abriendo: http://localhost:8050
echo  Documentacion API: http://localhost:8050/docs
echo  Presiona Ctrl+C para detener el servidor.
echo ========================================================
echo.

.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8050 --reload
pause
