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

function formatPeso(value) {
  if (value == null || value === "") return "-";
  const num = Number(String(value).replace(",", "."));
  if (isNaN(num)) return String(value);
  const fmt = num.toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  return fmt + " KG";
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

function loadLogoLine() {
  const logoPath = path.join(process.cwd(), "logo-model.zpl");
  if (fs.existsSync(logoPath)) {
    return fs.readFileSync(logoPath, "utf8").trim();
  }
  return "";
}

function generateDanfeLabel(data) {
  const ide = data.infNFe.ide || {};
  const emit = data.infNFe.emit || {};
  const dest = data.infNFe.dest || {};
  const transp = data.infNFe.transp || {};
  const transporta = transp.transporta || {};
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
  const carrierUf = toAscii(transporta.UF || "");
  const volumes = asArray(transp.vol);
  const qVol = toAscii(volumes[0]?.qVol || "");
  const especie = toAscii(volumes[0]?.esp || "");
  const marca = toAscii(volumes[0]?.marca || "");

  const volumeLinesData = [];
  for (const v of volumes) {
    if (!v) continue;
    const qty = Math.max(0, parseInt(v.qVol, 10) || 0);
    if (qty === 0) continue;
    for (let i = 0; i < qty; i++) {
      volumeLinesData.push({
        nVol: qty > 1 ? String(i + 1).padStart(2, "0") : (v.nVol ? toAscii(v.nVol) : "-"),
        pesoL: formatPeso(v.pesoL),
        pesoB: formatPeso(v.pesoB),
      });
    }
  }

  const emitLine = emitUf ? `${emitUf} - CPF/CNPJ: ${emitCnpj || "-"}` : `CPF/CNPJ: ${emitCnpj || "-"}`;
  const destLine = destUf ? `${destUf} - CPF/CNPJ: ${destCpfCnpj || "-"}` : `CPF/CNPJ: ${destCpfCnpj || "-"}`;
  const carrierLine = carrierUf ? `${carrierUf} - CPF/CNPJ: ${carrierDoc || "-"}` : `CPF/CNPJ: ${carrierDoc || "-"}`;

  const logoLine = loadLogoLine();

  const lines = [
    "^XA",
    "^CI28",
    "^PW850",
    "^LL1200",
    "^LH0,0",
    logoLine || "",
    zplText(35, 220, 45, "DANFE SIMPLIFICADO"),
    zplText(35, 270, 28, `NUMERO ${numeroFmt} - EMISSAO ${emissao}`),
    zplText(35, 310, 28, `1 SAIDA SERIE ${serie}`),
    zplText(35, 380, 24, "CHAVE DE ACESSO"),
    "^BY2,2,10",
    "^FO20,410^BCN,90,N,N,N^FD" + (chave || "0") + "^FS",
    "^FO640,200^BQN,2,5^FDLA," + qrPayload + "^FS",
    zplText(35, 515, 22, chaveBlocos || "CHAVE NAO INFORMADA"),
    zplText(35, 550, 24, "PROTOCOLO DE AUTORIZACAO DE USO"),
    zplText(35, 580, 23, `${protocolo || "-"} - ${dhProt || "-"}`),
    "^FO30,610^GB790,0,2^FS",

    zplText(35, 650, 30, "EMITENTE"),
    zplText(36, 650, 30, "EMITENTE"),
    zplText(35, 690, 25, (emitNome || "-").toUpperCase()),
    zplText(35, 720, 25, emitLine.toUpperCase()),
    zplText(600, 720, 25, `IE: ${emitIe || ""}`),
    "^FO30,750^GB790,0,2^FS",

    zplText(35, 770, 30, "DESTINATARIO"),
    zplText(36, 770, 30, "DESTINATARIO"),
    zplText(35, 810, 25, (destNome || "-").toUpperCase()),
    zplText(35, 840, 25, destLine.toUpperCase()),
    zplText(600, 840, 25, `IE: ${destIe || ""}`),
    "^FO30,870^GB790,0,2^FS",
    "\n",
    zplText(35, 890, 30, "TRANSPORTADOR"),
    zplText(35, 890, 30, "TRANSPORTADOR"),
    zplText(35, 930, 25, (carrier || "-").toUpperCase()),
    zplText(35, 960, 25, carrierLine.toUpperCase()),
    "^FO30,990^GB790,0,2^FS",

    zplText(35, 1010, 30, "VOLUMES TRANSPORTADOS"),
    zplText(36, 1010, 30, "VOLUMES TRANSPORTADOS"),
    zplText(35, 1050, 21, `QTD: ${qVol || "-"} | ESPECIE: ${especie || "-"} | MARCA: ${marca || "-"}`),
    ...(volumeLinesData.map((vl, i) =>
      zplText(35, 1090 + i * 30, 21, `NUMERACAO: ${vl.nVol} | PESO L: ${vl.pesoL} | PESO B: ${vl.pesoB}`)
    )),
    "^XZ",
    "",
  ];

  return lines.filter(Boolean).join("\n");
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
