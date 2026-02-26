@echo off
setlocal

:: Verifica se um arquivo XML foi passado como argumento
if "%~1"=="" (
    echo Uso: arraste um arquivo .xml sobre este .bat ou execute:
    echo   print-xml.bat caminho\para\nota.xml
    pause
    exit /b 1
)

:: Caminho base do script (pasta onde este .bat esta)
set "BASE=%~dp0"

:: Arquivo XML recebido
set "XML=%~1"

:: Arquivo ZPL temporario gerado na mesma pasta do XML
set "ZPL=%~dpn1.zpl"

:: Gera o ZPL a partir do XML
node "%BASE%scripts\xml-to-zpl.js" "%XML%" "%ZPL%"
if errorlevel 1 (
    echo ERRO: Falha ao gerar o ZPL a partir do XML.
    pause
    exit /b 1
)

:: Envia o ZPL para a impressora RAW
copy /b "%ZPL%" "\\localhost\ZEBRARAW" >nul
if errorlevel 1 (
    echo ERRO: Falha ao enviar o ZPL para a impressora.
    pause
    exit /b 1
)

:: Remove o ZPL temporario
del "%ZPL%" >nul 2>&1

endlocal
