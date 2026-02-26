#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

function usage() {
  console.log("Uso:");
  console.log("  node scripts/xml-to-zpl.js <entrada.xml> [saida.zpl]");
  console.log("");
  console.log("Exemplo:");
  console.log("  node scripts/xml-to-zpl.js temp/teste-NF-xml.xml temp/danfe-97x150.zpl");
}

function getArgPaths() {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(args.length < 1 ? 1 : 0);
  }

  const inputPath = path.resolve(process.cwd(), args[0]);
  const outputPath = path.resolve(
    process.cwd(),
    args[1] || path.join("temp", "danfe-97x150.zpl"),
  );
  return { inputPath, outputPath };
}

function readXmlNfe(filePath) {
  const xml = fs.readFileSync(filePath, "utf8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: false,
    trimValues: true,
  });

  const doc = parser.parse(xml);
  const nfeProc = doc.nfeProc || doc.NFe || doc;
  const nfeNode = nfeProc.NFe || nfeProc;
  const infNFe = nfeNode.infNFe || nfeNode;
  const protNFe = nfeProc.protNFe || {};
  const infProt = protNFe.infProt || {};

  return { infNFe, infProt };
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function onlyDigits(value) {
  return String(value || "").replace(/\D+/g, "");
}

function toAscii(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^ -~]/g, " ")
    .replace(/[\^~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function money(value) {
  const num = Number(value || 0);
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const raw = value.slice(0, 10);
    const [yyyy, mm, dd] = raw.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }
  return toAscii(value);
}

function chunk(str, size) {
  const clean = String(str || "");
  const out = [];
  for (let i = 0; i < clean.length; i += size) {
    out.push(clean.slice(i, i + size));
  }
  return out;
}

function getOrderNumber(infNFe) {
  const infCplRaw = String((((infNFe.infAdic || {}).infCpl) || ""));
  const infCpl = infCplRaw
    .replace(/&lt;br\s*\/?&gt;/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  const orderFromObs = infCpl.match(/N\s*Pedido\s*:\s*([A-Za-z0-9\-_.]+)/i);
  if (orderFromObs && orderFromObs[1]) {
    return toAscii(orderFromObs[1]);
  }

  return toAscii((((infNFe.compra || {}).xPed) || ""));
}

function buildAddress(dest) {
  const end = dest.enderDest || {};
  const l1 = `${end.xLgr || ""}, ${end.nro || "S/N"} ${end.xCpl ? `- ${end.xCpl}` : ""}`;
  const l2 = `${end.xBairro || ""}`;
  const cep = onlyDigits(end.CEP || "");
  const cepFmt = cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
  const l3 = `${cepFmt} ${end.xMun || ""}/${end.UF || ""}`;
  return [toAscii(l1), toAscii(l2), toAscii(l3)].filter(Boolean);
}

function zplText(x, y, size, text) {
  return `^FO${x},${y}^A0N,${size},${size}^FD${text}^FS`;
}

function formatCpfCnpj(value) {
  const digits = onlyDigits(value);
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  return digits;
}

function generateDanfeLabel(data) {
  const ide = data.infNFe.ide || {};
  const emit = data.infNFe.emit || {};
  const dest = data.infNFe.dest || {};
  const transp = data.infNFe.transp || {};
  const transporta = transp.transporta || {};
  const volume = asArray(transp.vol)[0] || {};
  const prot = data.infProt || {};

  const numeroNf = String(ide.nNF || "").padStart(6, "0");
  const numeroFmt = numeroNf.length === 6 ? `${numeroNf.slice(0, 3)}.${numeroNf.slice(3)}` : numeroNf;
  const serie = String(ide.serie || "");
  const emissao = fmtDate(ide.dhEmi || "");
  const chave = onlyDigits(prot.chNFe || "");
  const chaveBlocos = chunk(chave, 4).join(" ");
  const qrPayload = chave || "0";
  const protocolo = toAscii(prot.nProt || "");
  const dhProt = fmtDate(prot.dhRecbto || "");

  const emitNome = toAscii(emit.xNome || "");
  const emitUf = toAscii(((emit.enderEmit || {}).UF) || "");
  const emitCnpj = formatCpfCnpj(emit.CNPJ || emit.CPF || "");
  const emitIe = toAscii(emit.IE || "");

  const destNome = toAscii(dest.xNome || "");
  const destUf = toAscii(((dest.enderDest || {}).UF) || "");
  const destCpfCnpj = formatCpfCnpj(dest.CPF || dest.CNPJ || "");
  const destIe = toAscii(dest.IE || "");

  const carrier = toAscii(transporta.xNome || "");
  const carrierDoc = formatCpfCnpj(transporta.CNPJ || transporta.CPF || "");
  const qVol = toAscii(volume.qVol || "");
  const especie = toAscii(volume.esp || "");
  const marca = toAscii(volume.marca || "");
  const numVol = toAscii(volume.nVol || "");
  const pesoL = toAscii(volume.pesoL || "");
  const pesoB = toAscii(volume.pesoB || "");

  const lines = [
    "^XA",
    "^CI28",
    "^PW850",
    "^LL1105",
    "^LH0,0",
    "^FO20,20^GB810,1065,2^FS",
    "^FO325,40^GFA,5000,5000,25,,::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::gJ0402,gJ0C023,g01I0C063,g01800C067,g01810C067,g01831E06F18,g01C39E4EF38,g01C39E4EE38,gG0E39JE78,gG0E39EDDE78,g08E39EFDC7,g0C619EFDCF,X080C719EFFCF,X0E0E71DEFBDE01C,X070E71DEFB9E01C,X078E79CEFFBE038,V02078F79CIFBC078,V0383C739CIF3C0F,V03C1C73DEIF780F,V01C1E7BDEIF781E,V01E1E7BDEJF81E,W0F0F39FEJF03C,W0F873DFEJF07C,W07C7BDFEJF078,W03E3BDFEJF0F8018,W01E3IFEIFE1F0038,X0F3MFE1F007,V01879MFC3E01F,V01E7DMFC7C03E,W0F3CMF87C07C,U03879EMF8F80F8,U03C7DF7LF1F81F,U01E3ENF1F03E,V0F1F7MF3E0FC,V078NFE7E0F801C,V03C7MFE7C3F007C,V01E3MFEF87E00F8,W0F3MFDF8FC03F,U0F879OF1F80FE,U07E3CMFBF3F01F8,U03F9F7MFEFE07F,U01FCFBMFDFC1FE,V07F7PF83F8,V03QFE0FF,W0QFC3FC00E,W03PF8FF00FF,U03F0PF3FE07FE,U07FE7NFEFFC3FF8,U03TF3FFC,V07UFE,W07TF,W01SFC,X03QFE,V0FF07PF,V0FFE0OF8,V01FFE3OFE,W07RFC,X0QFE,Y0OFC,Y01MFC,g07KFC,Y07KFE,X07LF8,X07C001FE,gI0F8,gI0F,:gI0E,::::::gH01E,:gH01C,:,::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::^FS",
    zplText(35, 190, 34, "DANFE SIMPLIFICADO"),
    zplText(35, 242, 28, `1 - SAIDA   SERIE ${serie}`),
    zplText(35, 274, 28, `NUMERO ${numeroFmt}`),
    zplText(35, 306, 28, `EMISSAO: ${emissao}`),
    zplText(35, 338, 24, "CHAVE DE ACESSO"),
    "^BY2,2,92",
    "^FO35,368^BCN,92,N,N,N^FD" + (chave || "0") + "^FS",
    "^FO640,135^BQN,2,5^FDLA," + qrPayload + "^FS",
    zplText(35, 466, 22, chaveBlocos || "CHAVE NAO INFORMADA"),
    zplText(35, 495, 24, "PROTOCOLO DE AUTORIZACAO DE USO"),
    zplText(35, 525, 23, `${protocolo || "-"} - ${dhProt || "-"}`),
    "^FO30,560^GB790,0,2^FS",

    zplText(35, 580, 30, "EMITENTE"),
    zplText(35, 612, 27, emitNome || "-"),
    zplText(35, 640, 24, emitUf || "-"),
    zplText(35, 666, 24, `CPF/CNPJ ${emitCnpj || "-"}`),
    zplText(540, 666, 24, `IE: ${emitIe || ""}`),
    "^FO30,694^GB790,0,2^FS",

    zplText(35, 716, 30, "DESTINATARIO"),
    zplText(35, 748, 27, destNome || "-"),
    zplText(35, 776, 24, destUf || "-"),
    zplText(35, 802, 24, `CPF/CNPJ ${destCpfCnpj || "-"}`),
    zplText(540, 802, 24, `IE: ${destIe || ""}`),
    "^FO30,830^GB790,0,2^FS",

    zplText(35, 852, 29, "TRANSPORTADOR"),
    zplText(35, 884, 24, carrier || "-"),
    zplText(35, 910, 22, `CPF/CNPJ ${carrierDoc || "-"}`),
    "^FO30,936^GB790,0,2^FS",

    zplText(35, 958, 29, "VOLUMES TRANSPORTADOS"),
    zplText(35, 990, 21, `QTD: ${qVol || "-"}   ESPECIE: ${especie || "-"}   MARCA: ${marca || "-"}`),
    zplText(35, 1016, 21, `NUMERACAO: ${numVol || "-"}   PESO L: ${pesoL || "-"}   PESO B: ${pesoB || "-"}`),
    "^XZ",
    "",
  ];

  return lines.join("\n");
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  const { inputPath, outputPath } = getArgPaths();
  if (!fs.existsSync(inputPath)) {
    console.error(`Arquivo XML nao encontrado: ${inputPath}`);
    process.exit(1);
  }

  const data = readXmlNfe(inputPath);
  const zpl = generateDanfeLabel(data);
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, zpl, "utf8");
  console.log(`ZPL gerado com sucesso: ${outputPath}`);
}

main();
