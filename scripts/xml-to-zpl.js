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
    "^LL1155",
    "^LH0,0",
    "^FO20,20^GB810,1115,2^FS",
    zplText(35, 40, 34, "DANFE SIMPLIFICADO - ETIQUETA"),
    zplText(35, 92, 28, `1 - SAIDA   SERIE ${serie}`),
    zplText(35, 124, 28, `NUMERO ${numeroFmt}`),
    zplText(35, 156, 28, `EMISSAO: ${emissao}`),
    zplText(35, 188, 24, "CHAVE DE ACESSO"),
    "^BY2,2,92",
    "^FO35,218^BCN,92,N,N,N^FD" + (chave || "0") + "^FS",
    "^FO640,0^BQN,2,5^FDLA," + qrPayload + "^FS",
    zplText(35, 316, 22, chaveBlocos || "CHAVE NAO INFORMADA"),
    zplText(35, 345, 24, "PROTOCOLO DE AUTORIZACAO DE USO"),
    zplText(35, 375, 23, `${protocolo || "-"} - ${dhProt || "-"}`),
    "^FO30,410^GB790,0,2^FS",

    zplText(35, 440, 38, "EMITENTE"),
    zplText(35, 483, 34, emitNome || "-"),
    zplText(35, 520, 30, emitUf || "-"),
    zplText(35, 557, 30, `CPF/CNPJ ${emitCnpj || "-"}`),
    zplText(540, 557, 30, `IE: ${emitIe || ""}`),
    "^FO30,592^GB790,0,2^FS",

    zplText(35, 622, 38, "DESTINATARIO"),
    zplText(35, 665, 34, destNome || "-"),
    zplText(35, 702, 30, destUf || "-"),
    zplText(35, 739, 30, `CPF/CNPJ ${destCpfCnpj || "-"}`),
    zplText(540, 739, 30, `IE: ${destIe || ""}`),
    "^FO30,774^GB790,0,2^FS",

    zplText(35, 804, 36, "TRANSPORTADOR"),
    zplText(35, 847, 30, carrier || "-"),
    zplText(35, 883, 28, `CPF/CNPJ ${carrierDoc || "-"}`),
    "^FO30,918^GB790,0,2^FS",

    zplText(35, 948, 36, "VOLUMES TRANSPORTADOS"),
    zplText(35, 989, 26, `QTD: ${qVol || "-"}   ESPECIE: ${especie || "-"}   MARCA: ${marca || "-"}`),
    zplText(35, 1023, 26, `NUMERACAO: ${numVol || "-"}   PESO L: ${pesoL || "-"}   PESO B: ${pesoB || "-"}`),
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
