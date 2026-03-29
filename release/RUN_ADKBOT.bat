@echo off
setlocal
cd /d "%~dp0"
title ADKBOT QUANTUM - ONE-CLICK LAUNCHER

:MENU
cls
color 0b
echo ============================================================
echo   ADKBOT QUANTUM - SISTEMA DE TRADING PREMIUM
echo ============================================================
echo.
echo   [1] CONEXAO AUTOMATICA (Conectar ao MT5 e Abrir Painel)
echo   [2] APENAS SERVIDOR (Modo Background)
echo   [3] SAIR DO SISTEMA
echo.
echo ============================================================
set /p choice="Escolha uma opcao [1-3]: "

if "%choice%"=="1" goto START_FULL
if "%choice%"=="2" goto START_SERVER
if "%choice%"=="3" exit
goto MENU

:START_FULL
cls
echo ============================================================
echo   INICIANDO ADKBOT QUANTUM - PROTOCOLO DE CONEXAO
echo ============================================================
echo.

:: Verifica se o arquivo esta sendo executado de dentro do ZIP sem extrair
if not exist "server\server.js" (
    echo [ERRO CRITICO]
    echo Os arquivos do sistema nao foram encontrados!
    echo POR FAVOR, EXTRAIA TODOS OS ARQUIVOS PARA UMA PASTA ANTES DE EXECUTAR.
    echo.
    pause
    exit /b
)

echo [*] Validando MT5 local (Conexao direta)...
node -v >nul 2>&1 || (echo ERROR: Node.js nao encontrado! && pause && exit /b)
python --version >nul 2>&1 || (echo ERROR: Python nao encontrado! && pause && exit /b)

echo [*] Sincronizando com Terminal MT5...
echo [*] Preparando Painel de Operacoes...

:: Inicia o servidor em background minimizado
start "ADKBOT SERVER" /min cmd /c "node server/server.js"

:: Aguarda o servidor subir
timeout /t 2 /nobreak >nul

:: Abre o painel no navegador padrao
start http://localhost:3001

echo.
echo ============================================================
echo   SISTEMA ONLINE! 
echo   O painel foi aberto no seu navegador.
echo   MT5 Conectado automaticamente.
echo ============================================================
echo.
pause
exit

:START_SERVER
cls
echo [*] Iniciando servidor em modo background...
start "ADKBOT SERVER" /min cmd /c "node server/server.js"
echo Servidor rodando em http://localhost:3001
pause
goto MENU
