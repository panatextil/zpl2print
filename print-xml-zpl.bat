@echo off
setlocal

:: ============================================================
:: CONFIGURACOES - ajuste conforme seu ambiente
:: ============================================================
set "PRINTER_SHARE=ZEBRA"
:: KEEP_ZPL: 0=deleta o .zpl apos imprimir, 1=mantem para debug
set "KEEP_ZPL=1"
:: ============================================================

set "BASE=%~dp0"
set "LOG_DIR=%BASE%logs"
set "LOG_FILE=%LOG_DIR%\print-events.log"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1

:: Valida argumento
if "%~1"=="" (
    set "CURRENT_FILE="
    set "SOURCE_TYPE="
    call :log ERROR missing_argument "argumento_arquivo_nao_informado"
    echo Uso: arraste um arquivo .xml ou .zpl sobre este .bat ou execute:
    echo   print-xml-zpl.bat caminho\para\arquivo.xml
    echo   print-xml-zpl.bat caminho\para\arquivo.zpl
    pause
    exit /b 1
)

set "INPUT=%~1"
set "CURRENT_FILE=%INPUT%"
set "EXT=%~x1"
set "SOURCE_TYPE=%EXT%"

:: Valida extensao
if /I not "%EXT%"==".xml" if /I not "%EXT%"==".zpl" (
    call :log ERROR unsupported_extension "extensao_nao_suportada"
    echo ERRO: Extensao nao suportada: %EXT%
    echo Use arquivos .xml ou .zpl.
    pause
    exit /b 1
)

:: Valida existencia do arquivo
if not exist "%INPUT%" (
    call :log ERROR file_not_found "arquivo_nao_encontrado"
    echo ERRO: Arquivo nao encontrado:
    echo   %INPUT%
    pause
    exit /b 1
)

:: Bloco XML: converte para ZPL e imprime
if /I "%EXT%"==".xml" (
    where node >nul 2>&1
    if errorlevel 1 (
        call :log ERROR node_not_found "nodejs_nao_encontrado_no_path"
        echo ERRO: Node.js nao encontrado no PATH.
        echo Instale o Node.js e tente novamente.
        pause
        exit /b 1
    )
    call :log INFO start "inicio_processamento_xml"
    node "%BASE%scripts\xml-to-zpl.js" "%INPUT%" "%~dpn1.zpl"
    if errorlevel 1 (
        call :log ERROR zpl_generate_failed "falha_ao_gerar_zpl"
        echo ERRO: Falha ao gerar o ZPL a partir do XML.
        pause
        exit /b 1
    )
    call :log INFO zpl_generated "zpl_gerado_com_sucesso"
    copy /b "%~dpn1.zpl" "\\localhost\%PRINTER_SHARE%" >nul
    if errorlevel 1 (
        call :log ERROR print_failed "falha_no_envio_raw"
        echo ERRO: Falha ao enviar o ZPL para a impressora.
        echo ZPL gerado: %~dpn1.zpl
        pause
        exit /b 1
    )
    call :log INFO printed_success "zpl_enviado_para_impressora"
    echo ZPL enviado com sucesso para "\\localhost\%PRINTER_SHARE%"
    if "%KEEP_ZPL%"=="0" (
        del "%~dpn1.zpl" >nul 2>&1
        call :log INFO zpl_deleted "arquivo_zpl_removido"
    ) else (
        call :log INFO zpl_kept "arquivo_zpl_mantido_para_debug"
        echo ZPL mantido em:
        echo   %~dpn1.zpl
    )
)

:: Bloco ZPL: imprime diretamente
if /I "%EXT%"==".zpl" (
    call :log INFO start "inicio_processamento_zpl"
    copy /b "%INPUT%" "\\localhost\%PRINTER_SHARE%" >nul
    if errorlevel 1 (
        call :log ERROR print_failed "falha_no_envio_raw"
        echo ERRO: Falha ao enviar o ZPL para a impressora.
        echo Arquivo: %INPUT%
        pause
        exit /b 1
    )
    call :log INFO printed_success "zpl_enviado_para_impressora"
    echo ZPL enviado com sucesso para "\\localhost\%PRINTER_SHARE%"
)

endlocal
exit /b 0

:log
set "LOG_LEVEL=%~1"
set "LOG_EVENT=%~2"
set "LOG_MESSAGE=%~3"
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "(Get-Date).ToUniversalTime().AddHours(-3).ToString('yyyy-MM-dd HH:mm:ss')"`) do set "LOG_TS=%%I"
>> "%LOG_FILE%" echo [%LOG_TS% UTC-3] [%LOG_LEVEL%] [print-xml-zpl.bat] [%LOG_EVENT%] type="%SOURCE_TYPE%" file="%CURRENT_FILE%" printer="%PRINTER_SHARE%" message="%LOG_MESSAGE%"
exit /b 0
