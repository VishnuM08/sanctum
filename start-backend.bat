@echo off
echo ===================================================
echo   Sanctum Backend Stack Launcher
echo ===================================================
echo.

:: Check if docker daemon is reachable
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker daemon is not running. Launching Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo.
    echo Please wait for Docker Desktop to finish loading and accept any administrator (UAC) prompts.
    echo Once the Docker whale icon in your system tray is green, press any key here to continue...
    echo.
    pause
)

echo.
echo [1/3] Starting docker-compose services (with build)...
docker compose up --build -d
if %errorlevel% neq 0 (
    echo [!] Failed to start containers. Make sure Docker is fully started.
    pause
    exit /b 1
)

echo.
echo [2/3] Waiting for Ollama service to boot...
:: Loop to wait for Ollama endpoint to respond
:OllamaWait
curl -s http://localhost:11434/ >nul 2>&1
if %errorlevel% neq 0 (
    echo     Waiting for Ollama API to be ready...
    ping -n 3 127.0.0.1 >nul
    goto OllamaWait
)
echo.
echo [3/3] Downloading/Pulling Llama 3.2 1B model inside the Ollama container...
echo.
docker exec -it vault_ollama ollama pull llama3.2:1b

echo.
echo ===================================================
echo   Success! Backend Stack is fully online!
echo.
echo   Spring Boot Server: http://localhost:8080
echo   Ollama RAG Engine:  http://localhost:11434
echo ===================================================
echo.
pause
