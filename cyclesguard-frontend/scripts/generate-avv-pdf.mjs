#!/usr/bin/env node
/**
 * Generates the CyclesGuard AVV (Auftragsverarbeitungsvertrag, Art. 28 DSGVO) as a
 * clean, print-ready PDF — fully local, zero paid services (pdfkit is MIT-licensed,
 * runs entirely offline).
 *
 * Known founder details (already public via /impressum + docs/pitch/AVV-EMAIL-DRAFT.md)
 * are pre-filled. The Verein's data and the founder's street/PLZ (not committed to the
 * repo — PII) stay as clearly marked placeholders for manual completion before signing.
 *
 * Usage:
 *   node scripts/generate-avv-pdf.mjs
 *   node scripts/generate-avv-pdf.mjs --out ../docs/legal/CyclesGuard-AVV.pdf
 */
import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outArgIdx = process.argv.indexOf('--out');
const outPath = resolve(
  root,
  outArgIdx !== -1 ? process.argv[outArgIdx + 1] : '../docs/legal/CyclesGuard-AVV.pdf'
);
mkdirSync(dirname(outPath), { recursive: true });

const FOUNDER_NAME = 'Mahad Daud Abdulle';
const FOUNDER_TRADE_NAME = 'CyclesGuard';
const FOUNDER_EMAIL = 'cyclesguard@proton.me';
const FOUNDER_CITY_LINE = '[Deine PLZ] Frankfurt am Main';
const FOUNDER_STREET_LINE = '[Deine Straße und Hausnummer]';

const MARGIN = 56;
const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
doc.pipe(createWriteStream(outPath));

const PAGE_WIDTH = doc.page.width - MARGIN * 2;
const INK = '#1a1a2e';
const MUTED = '#555566';
const RULE = '#cfcfe0';

function ensureSpace(minHeight) {
  if (doc.y + minHeight > doc.page.height - MARGIN) doc.addPage();
}

function h1(text) {
  doc
    .font('Helvetica-Bold')
    .fontSize(17)
    .fillColor(INK)
    .text(text, { align: 'center' });
  doc.moveDown(0.3);
}

function subtitle(text) {
  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor(MUTED)
    .text(text, { align: 'center' });
  doc.moveDown(1.1);
}

function rule() {
  const y = doc.y;
  doc.moveTo(MARGIN, y).lineTo(MARGIN + PAGE_WIDTH, y).strokeColor(RULE).lineWidth(0.75).stroke();
  doc.moveDown(0.9);
}

function partyLabel(text) {
  doc.font('Helvetica').fontSize(10.5).fillColor(MUTED).text(text);
  doc.moveDown(0.15);
}

function partyBlock(lines, note) {
  ensureSpace(90);
  doc.font('Helvetica').fontSize(10.5).fillColor(INK);
  for (const line of lines) {
    doc.text(line, { lineGap: 2 });
  }
  if (note) {
    doc.moveDown(0.2);
    doc.font('Helvetica-Oblique').fontSize(9.5).fillColor(MUTED).text(note);
  }
  doc.moveDown(0.8);
}

function sectionHeading(text) {
  ensureSpace(50);
  doc.moveDown(0.4);
  doc.font('Helvetica-Bold').fontSize(12.5).fillColor(INK).text(text);
  doc.moveDown(0.35);
}

function paragraph(text, opts = {}) {
  ensureSpace(30);
  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor(INK)
    .text(text, { align: 'justify', lineGap: 3, ...opts });
  doc.moveDown(0.55);
}

/**
 * Hanging-indent list item: marker (bullet/number) in a fixed left column,
 * wrapped body text to its right. Height is pre-measured so `ensureSpace`
 * can page-break *before* drawing — avoids pdfkit silently inserting a
 * mid-item page break (which previously produced extra blank pages).
 */
function hangingItem(marker, text, indent) {
  const width = PAGE_WIDTH - indent;
  doc.font('Helvetica').fontSize(10.5);
  const height = doc.heightOfString(text, { width, lineGap: 3, align: 'justify' });
  ensureSpace(height + 8);
  const startY = doc.y;
  doc
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .fillColor(INK)
    .text(marker, MARGIN, startY, { width: indent, lineBreak: false });
  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor(INK)
    .text(text, MARGIN + indent, startY, { width, align: 'justify', lineGap: 3 });
  doc.y = startY + height;
  doc.moveDown(0.5);
}

function numberedItem(n, text) {
  hangingItem(`${n}.`, text, 22);
}

function bulletItem(text) {
  hangingItem('•', text, 16);
}

function tomHeading(text) {
  ensureSpace(40);
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(text);
  doc.moveDown(0.3);
}

function signatureBlock(label) {
  ensureSpace(70);
  doc.font('Helvetica').fontSize(10.5).fillColor(INK).text('Ort, Datum: _______________________');
  doc.moveDown(1.2);
  const y = doc.y;
  doc.moveTo(MARGIN, y).lineTo(MARGIN + 260, y).strokeColor(INK).lineWidth(0.75).stroke();
  doc.moveDown(0.25);
  doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(label);
  doc.moveDown(1.4);
}

// ── Title ────────────────────────────────────────────────────────────────
h1('Vertrag zur Auftragsverarbeitung (AVV)');
subtitle('gemäß Art. 28 Abs. 3 Datenschutz-Grundverordnung (DSGVO)');
rule();

partyLabel('Zwischen');
partyBlock(
  ['[Name des Vereins / der GmbH]', '[Straße, Hausnummer]', '[PLZ, Ort]'],
  '– nachfolgend „Verantwortlicher“ genannt –'
);

partyLabel('und');
partyBlock(
  [`${FOUNDER_NAME} / ${FOUNDER_TRADE_NAME}`, FOUNDER_STREET_LINE, FOUNDER_CITY_LINE, FOUNDER_EMAIL],
  '– nachfolgend „Auftragsverarbeiter“ genannt –'
);

// ── § 1 ──────────────────────────────────────────────────────────────────
sectionHeading('§ 1 Gegenstand und Zweck der Verarbeitung');
paragraph(
  `Der Auftragsverarbeiter erbringt für den Verantwortlichen Dienstleistungen im Bereich der softwaregestützten Trainings- und Belastungssteuerung. Gegenstand dieses Vertrages ist die Verarbeitung personenbezogener Daten durch den Auftragsverarbeiter im Rahmen der Nutzung der SaaS-Plattform „${FOUNDER_TRADE_NAME}“ (gemäß Hauptvertrag / Pilot-Vereinbarung).`
);
paragraph(
  'Zweck der Verarbeitung ist die datenschutzkonforme Erfassung von täglichen Check-ins der Spielerinnen zur Berechnung einer aggregierten Belastungs-Ampel (Grün, Gelb, Rot) für den Trainerstab.'
);

// ── § 2 ──────────────────────────────────────────────────────────────────
sectionHeading('§ 2 Dauer der Verarbeitung');
paragraph(
  'Dieser Vertrag tritt mit Unterzeichnung in Kraft. Die Dauer der Verarbeitung richtet sich nach der Laufzeit des zugrundeliegenden Hauptvertrages (bzw. der Pilotphase). Er endet automatisch mit der Beendigung des Hauptvertrages.'
);

// ── § 3 ──────────────────────────────────────────────────────────────────
sectionHeading('§ 3 Art der Daten und Kreis der betroffenen Personen');
paragraph('(1) Art der verarbeiteten Daten:', { align: 'left' });
bulletItem('Personenstammdaten: Vorname, Nachname, E-Mail-Adresse, Trikotnummer (optional).');
bulletItem(
  'Besondere Kategorien personenbezogener Daten (Art. 9 DSGVO): Gesundheits- und Zyklusdaten (tägliches Wohlbefinden, Symptome, Zyklusphasen).'
);
doc.moveDown(0.15);
doc
  .font('Helvetica-Oblique')
  .fontSize(9.7)
  .fillColor(MUTED)
  .text(
    'Hinweis zur Zero-Knowledge-Architektur: Die unter Art. 9 DSGVO fallenden Daten werden auf den Servern des Auftragsverarbeiters ausschließlich algorithmisch verarbeitet. Dem Verantwortlichen (Trainerteam/Verein) werden technisch bedingt (via Row Level Security) ausschließlich aggregierte Handlungsempfehlungen (Ampel-Status) zur Verfügung gestellt, niemals die zugrundeliegenden Intimdaten.',
    { align: 'justify', lineGap: 2 }
  );
doc.moveDown(0.6);
paragraph('(2) Kategorien betroffener Personen:', { align: 'left' });
bulletItem('Spielerinnen (Athletinnen) des Verantwortlichen');
bulletItem('Trainerstab und Vereinsadministratoren des Verantwortlichen');

// ── § 4 ──────────────────────────────────────────────────────────────────
sectionHeading('§ 4 Pflichten des Auftragsverarbeiters');
numberedItem(
  1,
  `Der Auftragsverarbeiter verarbeitet personenbezogene Daten ausschließlich auf dokumentierte Weisung des Verantwortlichen, es sei denn, er ist gesetzlich hierzu verpflichtet. Die Bereitstellung und der bestimmungsgemäße Betrieb der Software ${FOUNDER_TRADE_NAME} gelten als dokumentierte Weisung.`
);
numberedItem(
  2,
  'Der Auftragsverarbeiter gewährleistet, dass sich die zur Verarbeitung der personenbezogenen Daten befugten Personen zur Vertraulichkeit verpflichtet haben oder einer angemessenen gesetzlichen Verschwiegenheitspflicht unterliegen.'
);
numberedItem(
  3,
  'Der Auftragsverarbeiter unterstützt den Verantwortlichen nach Möglichkeit mit geeigneten technischen und organisatorischen Maßnahmen bei der Erfüllung von dessen Pflichten zur Beantwortung von Anträgen auf Wahrnehmung der Rechte betroffener Personen (z. B. Export- und Löschfunktionen innerhalb der Applikation).'
);
numberedItem(
  4,
  'Nach Abschluss der Erbringung der Verarbeitungsleistungen löscht der Auftragsverarbeiter nach Wahl des Verantwortlichen alle personenbezogenen Daten oder gibt sie zurück, sofern keine gesetzliche Verpflichtung zur Speicherung besteht.'
);

// ── § 5 ──────────────────────────────────────────────────────────────────
sectionHeading('§ 5 Inanspruchnahme von Unterauftragsverarbeitern');
paragraph('(1) Der Verantwortliche stimmt der Beauftragung der nachfolgenden Unterauftragsverarbeiter zu:');
bulletItem('Vercel Inc. (Hosting Frontend & API-Routing) – Serverstandort: EU (z. B. Frankfurt)');
bulletItem('Supabase Inc. (Datenbank, Authentifizierung & Storage) – Serverstandort: EU (z. B. Frankfurt)');
paragraph(
  '(2) Der Auftragsverarbeiter schließt mit diesen Unterauftragsverarbeitern Verträge gem. Art. 28 Abs. 4 DSGVO ab und stellt sicher, dass dieselben Datenschutzpflichten, die in diesem Vertrag festgelegt sind, auch den Unterauftragsverarbeitern auferlegt werden. Wechsel der Unterauftragsverarbeiter werden dem Verantwortlichen rechtzeitig vorab mitgeteilt.'
);

// ── § 6 ──────────────────────────────────────────────────────────────────
sectionHeading('§ 6 Technische und organisatorische Maßnahmen (TOM)');
paragraph(
  'Der Auftragsverarbeiter hat geeignete technische und organisatorische Maßnahmen (TOM) ergriffen, um ein dem Risiko angemessenes Schutzniveau zu gewährleisten, insbesondere hinsichtlich der Verarbeitung von Gesundheitsdaten (Art. 9 DSGVO). Die detaillierten Maßnahmen sind in Anlage 1 zu diesem Vertrag dokumentiert.'
);

// ── § 7 ──────────────────────────────────────────────────────────────────
sectionHeading('§ 7 Meldung von Datenschutzverletzungen');
paragraph(
  'Der Auftragsverarbeiter meldet dem Verantwortlichen Verletzungen des Schutzes personenbezogener Daten unverzüglich, spätestens jedoch innerhalb von 24 Stunden nach Kenntniserlangung.'
);

// ── Signatures ───────────────────────────────────────────────────────────
doc.addPage();
doc.font('Helvetica-Bold').fontSize(13).fillColor(INK).text('Unterschriften');
doc.moveDown(1.2);
signatureBlock('Unterschrift Verantwortlicher (Verein)');
signatureBlock(`Unterschrift Auftragsverarbeiter (${FOUNDER_NAME})`);

// ── Anlage 1 ─────────────────────────────────────────────────────────────
doc.addPage();
doc
  .font('Helvetica-Bold')
  .fontSize(14)
  .fillColor(INK)
  .text(`Anlage 1: Technische und organisatorische Maßnahmen (TOM) der ${FOUNDER_TRADE_NAME} Plattform`, {
    align: 'left',
  });
doc.moveDown(0.8);

tomHeading('1. Zutritts- und Zugangskontrolle');
bulletItem('Das physische Hosting erfolgt in ISO-27001-zertifizierten Rechenzentren (AWS EU via Vercel/Supabase).');
bulletItem(
  'Der administrative Zugang zu den Systemen ist durch starke Passwörter und Zwei-Faktor-Authentifizierung (2FA) geschützt.'
);

tomHeading('2. Zugriffskontrolle (Das Kernstück)');
bulletItem(
  'Row Level Security (RLS): Strikte Datenbank-Policies auf Supabase-Ebene stellen sicher, dass Trainer-Accounts technisch keinen Lesezugriff (Read-Access) auf die Datenbank-Spalten der rohen Zyklus- und Symptom-Logs haben.'
);
bulletItem(
  'Zero-Knowledge-Aggregation: Die Transformation der Athletinnen-Eingaben in den Ampel-Status erfolgt automatisiert und server-seitig; die Rohdaten verlassen die Datenbank nicht in Richtung des Vereins-Dashboards.'
);

tomHeading('3. Weitergabekontrolle & Verschlüsselung');
bulletItem('Sämtliche Datenübertragungen zwischen Endgerät und Server erfolgen verschlüsselt (TLS 1.3).');
bulletItem('Ruhende Daten in der Datenbank (Data at Rest) werden mittels AES-256 verschlüsselt gespeichert.');

tomHeading('4. Eingabekontrolle');
bulletItem(
  'Das System protokolliert, wer welche Daten eingegeben oder verändert hat (z. B. Zeitstempel bei der Eingabe der täglichen Logs oder beim Hinzufügen/Entfernen von Spielerinnen durch den Admin).'
);

tomHeading('5. Verfügbarkeitskontrolle & Belastbarkeit');
bulletItem(
  'Verwendung robuster Cloud-Infrastrukturen (Next.js Edge Network, Supabase Managed Database) mit automatisierten Backups zur Sicherstellung der Datenverfügbarkeit.'
);

tomHeading('6. Trennungsgebot');
bulletItem(
  'Die Daten unterschiedlicher Verantwortlicher (Mandanten/Clubs) werden durch strikte Tenant-IDs und RLS-Richtlinien logisch strikt voneinander getrennt verarbeitet. Cross-Club-Zugriffe sind technisch ausgeschlossen.'
);

// ── Footer page numbers ──────────────────────────────────────────────────
// Writing into the bottom margin zone would otherwise make pdfkit think the
// content overflows and silently append extra blank pages — temporarily
// zero out the bottom margin while drawing the footer to prevent that.
const pageRange = doc.bufferedPageRange();
const savedBottomMargin = doc.page.margins.bottom;
for (let i = 0; i < pageRange.count; i++) {
  doc.switchToPage(pageRange.start + i);
  doc.page.margins.bottom = 0;
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(MUTED)
    .text(
      `${FOUNDER_TRADE_NAME} — AVV gem. Art. 28 DSGVO · Seite ${i + 1} / ${pageRange.count}`,
      MARGIN,
      doc.page.height - MARGIN + 12,
      { width: PAGE_WIDTH, align: 'center', lineBreak: false }
    );
  doc.page.margins.bottom = savedBottomMargin;
}

doc.end();

console.log(`✓ AVV PDF geschrieben: ${outPath}`);
