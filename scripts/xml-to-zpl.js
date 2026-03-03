#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
const HARDCODED_LOGO_LINE = '^FO0,0^GFA,11280,5640,60,fffffffffff3fe7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff3fe79ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe3fc73fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7ffe3fc63fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff3ffe3fce3fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff3fbe3fcc3cffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff3f9c3f8c3cffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1f9c398c38ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9f9c398878ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9f9c398870ffffffffffffffffffffffffffffffffffffffffffc3fffffffffffffffffffffffffffffffffffffffffffffffff07fffffffffffffff8f9c391870ffffffffffffffffffffffffffffffffffffffffff81fffffffffffffffffffffffffffffffffffffffffffffffff07fffffffffffffff8f8c311860ffffffffffffffffffffffffffffffffffffffffff81ffffffffffffffffffffffffffffffffffffffffffffffffe03ffffffffffffff78f8c3110e0ffffffffffffffff00000000000fffffffffffffff00fffffffffffffc003fffffffffffff00001fffffffffffffe03ffffffffffffff3878c1110c1ffffffffffffffff000000000001ffffffffffffff00fffffffffffffc003fffffffffffff00001fffffffffffffc01fffffffffffdff3c78c1010c1ffffffffffffffff0000000000003ffffffffffffe007ffffffffffffc001fffffffffffff00001fffffffffffffc01fffffffffffc7f1c78c1000c1ff9fffffffffffff0000000000001ffffffffffffe007ffffffffffffc000fffffffffffff00001fffffffffffff800fffffffffffc3f1c38e102183ff1fffffffffffff00000000000007fffffffffffc003ffffffffffffc000fffffffffffff00001fffffffffffff800fffffffffffe1f0c386102183fe1fffffffffffff80000000000003fffffffffffc003ffffffffffffc0007ffffffffffff80003fffffffffffff0007ffffffffffe0f0c386100103fc3fffffffffffffe0000000000001fffffffffff8001fffffffffffff0003ffffffffffffe0007fffffffffffff0007fffffffffff0f0c186000107f83fffffffffffffe0000000000000fffffffffff8001fffffffffffffc003ffffffffffffe000fffffffffffffe0003ffffffffe3f0786186000307f87ffffffffffffff00000000000007ffffffffff0001fffffffffffffe001fffffffffffff001fffffffffffffe0003ffffffffe1f8386186004207f07ffffffffffffff001fffffc00003ffffffffff0000ffffffffffffff000fffffffffffff001fffffffffffffc0003ffffffffe0f838608600020ff0fffffffffffffff001ffffff80001fffffffffe0000ffffffffffffff0007ffffffffffff001fffffffffffffc0001fffffffff07c18208600040fe0fffffffffffffff001ffffffe0001fffffffffe00007fffffffffffff0003ffffffffffff001fffffffffffff80001fffffffff03c18208200041fc1fffffffffffffff001fffffff8000fffffffffc00007fffffffffffff0003ffffffffffff001fffffffffffff80000fffffffff83e0c204200041fc1fffffffffffffff001fffffffc0007ffffffffc00003fffffffffffff0001ffffffffffff001fffffffffffff00000fffffffffc1e0c304200081f83fffffffffffffff001fffffffe0007ffffffff800003fffffffffffff0000ffffffffffff001fffffffffffff000007ffffffffc0f04104200083f03fffffffffffffff001ffffffff0007ffffffff800001fffffffffffff00003fffffffffff001ffffffffffffe000007ffffffffe0704100200083f07ffeffffffffffff001ffffffff8003ffffffff000001fffffffffffff00001fffffffffff001ffffffffffffe000003fffffffff0782100200103e07ff8ffffffffffff001ffffffff8003ffffffff000000fffffffffffff00000fffffffffff001ffffffffffffc000003fffffffff8382000200107c0fff0ffffffffffff001ffffffffc003fffffffe002000fffffffffffff000007ffffffffff001ffffffffffffc004001fffffffff81c2080200007c0ffe1ffffffffffff001ffffffffc001fffffffe003000fffffffffffff000003ffffffffff001ffffffffffff800c001ffffffffbc0c008000000f81ffc3ffffffffffff001ffffffffc001fffffffc0070007ffffffffffff000000ffffffffff001ffffffffffff800e001ffffffff9e0e100000000f01ff07ffffffffffff001ffffffffe001fffffffc0078007ffffffffffff0000007fffffffff001ffffffffffff001e000ffffffff8706000000000f03fe07ffffffffffff001ffffffffe001fffffff800f8003ffffffffffff0000003fffffffff001ffffffffffff001e000ffffffffc303000000001e07fc0fffffffffffff001ffffffffe001fffffff800f8003ffffffffffff0000000fffffffff001ffffffffffff003f0007fffff8fc181000000001c07f81fffffffffffff001ffffffffe001fffffff801fc001ffffffffffff00100007ffffffff001fffffffffffe003f0007fffffc3e0c1000000003c0ff03fffffffffffff001ffffffffe001fffffff001fc001ffffffffffff001c0001ffffffff001fffffffffffe007f8003fffffc1e06080000000380fe07fffffffffffff001ffffffffe001fffffff003fe000ffffffffffff001e00007fffffff001fffffffffffc007f8003fffffe0702000000000301f807fffffffffffff001ffffffffe001ffffffe003fe000ffffffffffff001f00003fffffff001fffffffffffc00ffc001ffffff0381000000000703f00ffffffffffffff001ffffffffe001ffffffe007ff0007fffffffffff001f80000fffffff001fffffffffff800ffc001ffffff81c0800000000603e01ffe3ffffffffff001ffffffffc001ffffffc007ff0007fffffffffff001fe00003ffffff001fffffffffff801ffe000ffffffc0e0400000000c07c03ff83ffffffffff001ffffffffc003ffffffc00fff8007fffffffffff001ff00000ffffff001fffffffffff001ffe000ffffffe070000000000c0f807fe07ffffffffff001ffffffff8003ffffff800fff8003fffffffffff001ffc00007fffff001fffffffffff003ffe000fffffff03000000000180f00ff80fffffffffff001ffffffff8003ffffff801fff8003fffffffffff001ffe00001fffff001ffffffffffe003fff0007ffff3f81800000000101e01ff01fffffffffff001ffffffff0003ffffff001fffc001fffffffffff001fff800007ffff001ffffffffffe007fff0007ffff07c0c00000000101803fc07fffffffffff001fffffffe0007ffffff003fffc001fffffffffff001fffe00001ffff001ffffffffffc007fff8003ffff80e060000000020300ff00ffffffffffff001fffffffc0007fffffe003fffe000fffffffffff001ffff00000ffff001ffffffffffc00ffff8003ffffc07030000000000601fc01ffffffffffff001fffffff8000ffffffe007fffe000fffffffffff001ffffc00003fff001ffffffffff800ffffc001ffffe01c18000000000403f803ffffffffffff001fffffff0000ffffffc007ffff0007ffffffffff001fffff00001fff001ffffffffff801ffffc001fffff00604000000000807e00fffffffffffff001ffffffc0001ffffffc00fffff0007ffffffffff001fffffc00007ff001ffffffffff001ffffe000fffffc030200000000100f801fffffffffffff001fffffe00003ffffff800fffff8003ffffffffff001fffffe00003ff001ffffffffff003ffffe000fffffe008000000000003e007fffffffffffff001ffffc000007ffffff801fffff8003ffffffffff001ffffff80001ff001fffffffffe003ffffe0007fffff800000000000007800ffffffffffffff00000000000007ffffff001fffff8001ffffffffff001ffffffe0000ff001fffffffffe007fffff0007fffffe0000000000000f003ff00ffffffffff0000000000000fffffff003fffffc001ffffffffff001fffffff80003f001fffffffffc007fffff0007ffffff8000000000001c007f800ffffffffff0000000000001ffffffe003fffffc001ffffffffff001fffffffc0001f001fffffffffc00ffffff8003fffc03e000000000003001f8003ffffffffff0000000000007ffffffe007fffffe000ffffffffff001ffffffff0000f001fffffffff800ffffff8003fff000300000000000c007c000fffffffffff000000000000fffffffc007fffffe000ffffffffff001ffffffff80007001fffffffff801ffffffc001fffc00040000000001001e0007fffffffffff000000000003fffffffc0000000000007fffffffff001ffffffffe0003001fffffffff0000000000001ffff800000000000020060003ffffffffffff00000000000ffffffff80000000000007fffffffff001fffffffff0001001fffffffff0000000000000fffff0000000000000010001fffffffffffff00000000007ffffffff80000000000003fffffffff001fffffffff8000001ffffffffe0000000000000fffffe000000000000000007fffffffffffff000000001ffffffffff00000000000003fffffffff001fffffffffc000001ffffffffe00000000000007fffffc0000000000000003ffffffffffffff001ffffffffffffffff00000000000001fffffffff001fffffffffe000001ffffffffc00000000000007ffffff800000000000001fffffffffffffff001ffffffffffffffff00000000000001fffffffff001ffffffffff800001ffffffffc00000000000003fff807f0000000000000ffffffffffffffff001fffffffffffffffe00000000000000fffffffff001ffffffffffc00001ffffffffc00000000000003fff0007c000000000007ffffffffffffffff001fffffffffffffffe00000000000000fffffffff001ffffffffffe00001ffffffff800000000000003fff8000f80000000003f9fffffffffffffff001fffffffffffffffc00000000000000fffffffff001fffffffffff00001ffffffff800000000000001ffff0001e000000001000fffffffffffffff001fffffffffffffffc00fffffffff0007ffffffff001fffffffffff80001ffffffff001ffffffffc001ffffe0000800000000003fffffffffffffff001fffffffffffffff801fffffffff0007ffffffff001fffffffffff80001ffffffff003ffffffffe000fffffe00000000000003ffffffffffffffff001fffffffffffffff801fffffffff8003ffffffff001fffffffffffc0001fffffffe007ffffffffe000ffffffc000000000003fffffffffffffffff001fffffffffffffff003fffffffff8003ffffffff001fffffffffffe0001fffffffe007fffffffff0007ffffff80000000003ffffffffffffffffff001fffffffffffffff003fffffffffc001ffffffff001ffffffffffff0001fffffffc00ffffffffff0007fffffff000000003fffffffffffffffffff001ffffffffffffffe007fffffffffc001ffffffff001ffffffffffff8001fffffffc00ffffffffff8003fffffff80000003ffffffffffffffffffff001ffffffffffffffe007fffffffffe000ffffffff001ffffffffffff8001fffffff801ffffffffff8003ffffff00000001fffffffffffffffffffff001ffffffffffffffc00ffffffffffe000ffffffff001ffffffffffffc001fffffff801ffffffffffc001ffffe000000007fffffffffffffffffffff001ffffffffffffffc00fffffffffff0007fffffff001ffffffffffffe001fffffff003ffffffffffc001ffffc000ff801ffffffffffffffffffffff000ffffffffffffff800fffffffffff0007fffffff001ffffffffffffe001ffffffe003ffffffffffe000ffffffffffc07fffffffffffffffffffffe000ffffffffffffff000fffffffffff0003ffffffe000fffffffffffff001ffffffc003ffffffffffe0007fffffffffc0ffffffffffffffffffffffc0007ffffffffffffe0007ffffffffff0001ffffffc0007ffffffffffff001ffffff8001ffffffffffc0003fffffffffc1ffffffffffffffffffffff80001ffffffffffff80001fffffffffc00007fffff00001ffffffffffff801fffffe00007fffffffff80000fffffffffc1ffffffffffffffffffffff00001ffffffffffff00001fffffffffc00003fffff00001ffffffffffff801fffffe00003fffffffff00000fffffffffc1ffffffffffffffffffffff00001ffffffffffff00001fffffffffc00003fffff00001ffffffffffffc01fffffe00003fffffffff00000fffffffffc3ffffffffffffffffffffff00001ffffffffffff00001fffffffffc00003fffff00001ffffffffffffc01fffffe00003fffffffff00000fffffffffc3ffffffffffffffffffffff00001ffffffffffff00001fffffffffc00003fffff00001ffffffffffffc01fffffe00003fffffffff00000fffffffffc3ffffffffffffffffffffff00001ffffffffffff00001fffffffffc00003fffff00001ffffffffffffc01fffffe00003fffffffff00000fffffffffc3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff83ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff83ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff87ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff87fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff^FS';

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
  return HARDCODED_LOGO_LINE.replace("^FO0,0", "^FO140,50");
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
    zplText(35, 270, 28, `EMISSAO ${emissao}`),
    zplText(35, 310, 28, `No. ${numeroFmt} | 1 SAIDA | SERIE ${serie}`),
    zplText(35, 380, 24, "CHAVE DE ACESSO"),
    "^BY2,2,10",
    "^FO20,410^BCN,90,N,N,N^FD" + (chave || "0") + "^FS",
    "^FO640,200^BQN,2,5^FDLA," + qrPayload + "^FS",
    zplText(35, 515, 25, chaveBlocos || "CHAVE NAO INFORMADA"),
    zplText(35, 550, 27, "PROTOCOLO DE AUTORIZACAO DE USO"),
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
    zplText(36, 890, 30, "TRANSPORTADOR"),
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


