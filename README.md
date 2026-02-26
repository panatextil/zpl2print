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

## Impressão automática a partir de XML (duplo clique)

O arquivo `print-xml.bat` faz tudo automaticamente:

1. Recebe o XML da NF-e
2. Gera o ZPL via `scripts/xml-to-zpl.js`
3. Envia direto para a impressora RAW (`\\localhost\ZEBRARAW`)
4. Remove o `.zpl` temporário

### Pré-requisito

Node.js instalado e `npm install` executado uma vez na pasta do projeto.

### Associar extensão `.xml` ao bat (CMD como Administrador)

```cmd
assoc .xml=XMLNFe
ftype XMLNFe="C:\Windows\System32\cmd.exe" /c ""C:\apps_blrv\ativos\zpl2print\print-xml.bat" "%1""
```

> Atenção: isso associa **todos** os `.xml` do Windows a este bat.
> Se preferir usar só para NF-e, mantenha a associação manual (arrastar o XML sobre o bat).

### Uso manual (sem associar extensão)

Arraste qualquer `.xml` de NF-e sobre o `print-xml.bat` — imprime automaticamente.

---

## Gerar ZPL a partir de XML da NF-e (Node.js)

Este projeto tambem inclui um script para converter um XML de NF-e em uma etiqueta ZPL no padrao `97mm x 150mm` (mesma area util usada na etiqueta dos Correios).

### Instalar dependencias

```bash
npm install
```

### Gerar etiqueta

```bash
npm run gen:zpl -- temp/teste-NF-xml.xml temp/danfe-97x150.zpl
```

Ou diretamente:

```bash
node scripts/xml-to-zpl.js temp/teste-NF-xml.xml temp/danfe-97x150.zpl
```

O arquivo de saida pode ser impresso com o mesmo fluxo RAW ja configurado.

---

## Especificação

* Impressora: Zebra ZD220
* Linguagem: ZPL
* Modo: RAW
* Etiqueta: 9,7 x 15 cm
* Resolução: 203 dpi

---
