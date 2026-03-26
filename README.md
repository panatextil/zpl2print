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

### 2. Compartilhar a impressora ZDesigner

Após instalar o driver, a impressora `ZDesigner ZD220-203dpi ZPL` aparece automaticamente.
Compartilhe ela diretamente (não é necessário criar uma impressora genérica):

Propriedades → Compartilhamento:

- Marcar **Compartilhar esta impressora**
- Nome do compartilhamento: `ZEBRA`

> **Atenção:** certifique-se de que a porta usada é a porta nativa Zebra (descrição `Zebra Technologies ZTC ZD220-203dpi ZPL`), não uma porta USB genérica como `USB002`. Veja a seção Troubleshooting se houver dúvida.

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

## Diagnóstico da fila (spool)

Use o utilitário `check-spool-zebra.bat` para inspecionar e corrigir rapidamente a fila da Zebra.

Comandos:

```cmd
check-spool-zebra.bat status
check-spool-zebra.bat clear
check-spool-zebra.bat restart
check-spool-zebra.bat open
```

Sem argumentos, ele abre um menu interativo.

| Comando   | Ação |
|-----------|------|
| `status`  | Mostra status da impressora e jobs na fila |
| `clear`   | Remove jobs pendentes da fila |
| `restart` | Reinicia o serviço `Spooler` |
| `open`    | Abre a janela da fila da impressora |

---

## Estrutura do projeto

```
zpl2print/
├── check-spool-zebra.bat   # Diagnóstico e manutenção da fila
├── print-xml-zpl.bat       # Script principal (XML e ZPL)
├── scripts/
│   └── xml-to-zpl.js       # Conversor NF-e XML → ZPL (Node.js)
├── logs/
│   └── print-events.log    # Log de eventos (gerado automaticamente)
├── package.json
└── README.md
```

---

## Troubleshooting

### Impressora não encontrada / `printer_share_not_found`

**Sintoma:** o script loga `printer_share_not_found` e nada é impresso.

**Causa mais comum:** o compartilhamento `ZEBRA` está apontando para a porta errada ou foi perdido.

**Como diagnosticar:**

```cmd
wmic printer get Name,ShareName,PortName,DriverName /format:list
```

**Situação correta esperada:**

| Impressora | Driver | Porta | Share |
|---|---|---|---|
| `ZDesigner ZD220-203dpi ZPL` | ZDesigner (nativo Zebra) | `USB005` | `ZEBRA` |

> A porta `USB005` pode variar — o importante é que seja a porta nativa da Zebra (`Zebra Technologies ZTC ZD220-203dpi ZPL`), não uma porta USB genérica.

**Como verificar as portas:**

```cmd
wmic printerport get Name,Description /format:list
```

Procure a porta com `Description=Zebra Technologies ZTC ZD220-203dpi ZPL` — essa é a correta.

---

### Impressora Zebra sumiu da lista após troca de porta

**Causa:** trocar a porta de uma impressora para uma porta já em uso por outra pode fazer o Windows remover ambas.

**Solução:**

1. Desconecte e reconecte o cabo USB da Zebra ZD220 — o Windows reinstala o driver automaticamente.
2. Verifique se a impressora `ZDesigner ZD220-203dpi ZPL` voltou na lista.
3. Compartilhe ela com o nome `ZEBRA`:
   - Painel de Controle → Dispositivos e Impressoras → clique direito → Propriedades da impressora → aba **Compartilhamento**
   - Marcar **Compartilhar esta impressora** → nome: `ZEBRA`
4. Confirme com:

```cmd
wmic printer get Name,ShareName,PortName /format:list
```

---

### Verificar se o envio RAW funciona diretamente

Independente do script, teste o envio manual:

```cmd
copy /b "caminho\para\arquivo.zpl" "\\localhost\ZEBRA"
```

Se imprimir, o problema é apenas no script (verificação de fila via PowerShell). Se não imprimir, o problema é na configuração da impressora/porta.

---

## Especificação

- Impressora: Zebra ZD220
- Linguagem: ZPL
- Modo: RAW via `\\localhost\ZEBRA`
- Etiqueta: 97mm × 150mm
- Resolução: 203 dpi
