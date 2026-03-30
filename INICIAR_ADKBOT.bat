@echo off
chcp 65001 >nul
title ADKBOT QUANTUM PRO - Launcher
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║         ADKBOT QUANTUM PRO  -  Iniciando...                 ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verifica se Python está instalado
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  [ERRO] Python nao encontrado!
    echo  Instale em: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

:: Instala dependência MetaTrader5 se necessário
echo  Verificando dependencias...
python -c "import MetaTrader5" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  Instalando MetaTrader5 API...
    pip install MetaTrader5 --quiet
)

:: Inicia o launcher principal
python "%~dp0iniciar_adkbot.py"
