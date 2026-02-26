# Zebra ZD220 – Impressão ZPL (RAW)

## Objetivo

Permitir que arquivos `.zpl` imprimam automaticamente na Zebra via envio RAW.

---

## 1. Instalar driver Zebra

Instalar **ZDesigner ZD220-203dpi ZPL** normalmente.

---

## 2. Criar impressora RAW (ponte)

Adicionar impressora local:

* Porta: `USB001`
* Driver: **Generic / Text Only**
* Nome: `Generic / Text Only`

---

## 3. Compartilhar impressora

Propriedades → Compartilhamento:

* Marcar **Compartilhar esta impressora**
* Nome do compartilhamento:

```
ZEBRARAW
```

Confirmar:

```cmd
net share
```

---

## 4. Ajustes obrigatórios

Propriedades → Avançado:

* ✔ Imprimir diretamente na impressora
* ✖ Desabilitar recursos avançados

---

## 5. Script de impressão

Criar:

```
C:\Zebra\print-zpl.bat
```

Conteúdo:

```bat
@echo off
copy /b "%~1" "\\localhost\ZEBRARAW" >nul
```

---

## 6. Associar extensão .zpl

CMD (Administrador):

```cmd
assoc .zpl=ZPLFile
ftype ZPLFile="C:\Windows\System32\cmd.exe" /c ""C:\Zebra\print-zpl.bat" "%1""
```

---

## Uso

Duplo clique em qualquer `.zpl` → imprime automaticamente.

---

## Especificação

* Impressora: Zebra ZD220
* Linguagem: ZPL
* Modo: RAW
* Etiqueta: 9,7 x 15 cm
* Resolução: 203 dpi

---
