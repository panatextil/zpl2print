# zpl2print – Impressão ZPL/DANFE na Zebra (RAW)

Converte XML de NF-e em etiqueta ZPL e envia direto para impressora Zebra via porta RAW.

---

## Pré-requisitos

- Windows 10/11
- Node.js instalado e disponível no PATH
- Impressora Zebra configurada (ver seção abaixo)

---

## Configuração da Impressora

### 1. Instalar driver Zebra

Instalar **ZDesigner ZD220-203dpi ZPL** normalmente.

### 2. Criar impressora RAW (ponte)

Adicionar impressora local:

- Porta: `USB001`
- Driver: **Generic / Text Only**
- Nome: `Generic / Text Only`

### 3. Compartilhar a impressora

Propriedades → Compartilhamento:

- Marcar **Compartilhar esta impressora**
- Nome do compartilhamento: `ZEBRA` (ou o nome que preferir)

Verificar com:

```cmd
net share
```

### 4. Ajustes obrigatórios

Propriedades → Avançado:

- ✔ Imprimir diretamente na impressora
- ✖ Desabilitar recursos avançados

---

## Instalação do projeto

```bash
npm install
```

---

## Uso

### Script principal: `print-xml-zpl.bat`

Script único que aceita `.xml` ou `.zpl`:

- **XML** → converte para ZPL via `scripts/xml-to-zpl.js` → envia para impressora
- **ZPL** → envia direto para impressora

**Duplo clique** ou arrastar o arquivo sobre o `.bat` — imprime automaticamente.

**Via terminal:**

```cmd
print-xml-zpl.bat caminho\para\nota.xml
print-xml-zpl.bat caminho\para\etiqueta.zpl
```

### Configurações (início do `print-xml-zpl.bat`)

```bat
set "PRINTER_SHARE=ZEBRA"
set "KEEP_ZPL=0"
```

| Variável        | Descrição                                                   |
|-----------------|-------------------------------------------------------------|
| `PRINTER_SHARE` | Nome do compartilhamento da impressora (`net share`)        |
| `KEEP_ZPL`      | `0` = apaga o `.zpl` após imprimir · `1` = mantém para debug |

---

## Associar extensões ao bat (opcional)

Para que duplo clique em `.xml` ou `.zpl` já imprima automaticamente,
execute no CMD como **Administrador**:

```cmd
assoc .zpl=ZPLFile
ftype ZPLFile="C:\Windows\System32\cmd.exe" /c ""C:\apps_development\apps_ativos\zpl2print\print-xml-zpl.bat" "%1""

assoc .xml=XMLNFe
ftype XMLNFe="C:\Windows\System32\cmd.exe" /c ""C:\apps_development\apps_ativos\zpl2print\print-xml-zpl.bat" "%1""
```

> **Atenção:** associar `.xml` afeta todos os arquivos XML do Windows.
> Se preferir, use apenas arrastar o arquivo sobre o `.bat`.

---

## Log de eventos

Cada execução grava em `logs\print-events.log`:

```
[2026-03-03 12:41:22 UTC-3] [INFO] [print-xml-zpl.bat] [start] type=".zpl" file="etiqueta.zpl" printer="ZEBRA" message="inicio_processamento_zpl"
[2026-03-03 12:41:23 UTC-3] [INFO] [print-xml-zpl.bat] [printed_success] type=".zpl" file="etiqueta.zpl" printer="ZEBRA" message="zpl_enviado_para_impressora"
```

Eventos registrados:

| Evento                  | Descrição                              |
|-------------------------|----------------------------------------|
| `start`                 | Início do processamento                |
| `zpl_generated`         | ZPL gerado com sucesso (fluxo XML)     |
| `printed_success`       | ZPL enviado para impressora            |
| `zpl_deleted`           | Arquivo ZPL removido (`KEEP_ZPL=0`)    |
| `zpl_kept`              | Arquivo ZPL mantido (`KEEP_ZPL=1`)     |
| `file_not_found`        | Arquivo de entrada não encontrado      |
| `zpl_generate_failed`   | Falha na conversão XML → ZPL           |
| `print_failed`          | Falha ao enviar para impressora        |
| `node_not_found`        | Node.js não encontrado no PATH         |
| `unsupported_extension` | Extensão não suportada (não .xml/.zpl) |
| `missing_argument`      | Nenhum arquivo informado               |

---

## Estrutura do projeto

```
zpl2print/
├── print-xml-zpl.bat       # Script principal (XML e ZPL)
├── scripts/
│   └── xml-to-zpl.js       # Conversor NF-e XML → ZPL (Node.js)
├── logs/
│   └── print-events.log    # Log de eventos (gerado automaticamente)
├── package.json
└── README.md
```

---

## Especificação

- Impressora: Zebra ZD220
- Linguagem: ZPL
- Modo: RAW via `\\localhost\ZEBRA`
- Etiqueta: 97mm × 150mm
- Resolução: 203 dpi
