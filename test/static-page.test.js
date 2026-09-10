/* test/static-page.test.js
 * QA-Ergaenzung: statische Pruefung von index.html und assets/style.css
 * gegen die Constraints aus docs/ARCHITEKTUR.md Abschnitt 2 (file://-
 * Tauglichkeit) und Abschnitt 5.1 (DOM-Kontrakt). Reiner Text-/Regex-Check,
 * bewusst ohne HTML-Parser-Dependency (Projekt bleibt dependency-frei).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'assets', 'style.css');
const appJsPath = path.join(__dirname, '..', 'assets', 'app.js');
const quotesJsPath = path.join(__dirname, '..', 'assets', 'quotes.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');
const quotesJs = fs.readFileSync(quotesJsPath, 'utf8');

// --- file://-Tauglichkeit (Architektur Abschnitt 2) -------------------------

test('kein <script type="module"> in index.html (CORS-Falle unter file://)', () => {
  assert.equal(/type\s*=\s*["']module["']/i.test(html), false);
});

test('keine ES-Module-Syntax (import/export) in app.js oder quotes.js', () => {
  // grobe, aber fuer diese Codebasis ausreichende Heuristik: Zeilenanfang
  // mit import/export als Schluesselwort (Kommentare enthalten das Wort
  // nicht in dieser Form).
  assert.equal(/^\s*(import|export)\s/m.test(appJs), false, 'app.js enthaelt ES-Modul-Syntax');
  assert.equal(/^\s*(import|export)\s/m.test(quotesJs), false, 'quotes.js enthaelt ES-Modul-Syntax');
});

test('script- und link-Tags verwenden ausschliesslich relative Pfade (kein fuehrender Slash)', () => {
  const srcs = [...html.matchAll(/<script[^>]*\ssrc\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const hrefs = [...html.matchAll(/<link[^>]*\shref\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  assert.ok(srcs.length >= 2, 'es sollten mindestens die zwei App-Skripte referenziert sein');
  [...srcs, ...hrefs].forEach((ref) => {
    assert.equal(ref.startsWith('/'), false, 'absoluter Pfad gefunden: ' + ref);
    assert.equal(/^[a-z]+:\/\//i.test(ref), false, 'externe URL gefunden: ' + ref);
  });
});

test('Skripte werden ohne defer/async/type=module geladen (Architektur 2.2)', () => {
  const scriptTags = [...html.matchAll(/<script\b[^>]*>/gi)].map((m) => m[0]);
  assert.ok(scriptTags.length >= 2, 'erwartet mindestens 2 script-Tags');
  scriptTags.forEach((tag) => {
    assert.equal(/\bdefer\b/i.test(tag), false, 'defer gefunden in: ' + tag);
    assert.equal(/\basync\b/i.test(tag), false, 'async gefunden in: ' + tag);
    assert.equal(/type\s*=\s*["']module["']/i.test(tag), false, 'type=module gefunden in: ' + tag);
  });
});

test('Ladereihenfolge: assets/quotes.js steht vor assets/app.js', () => {
  const quotesPos = html.indexOf('assets/quotes.js');
  const appPos = html.indexOf('assets/app.js');
  assert.notEqual(quotesPos, -1, 'assets/quotes.js wird nicht eingebunden');
  assert.notEqual(appPos, -1, 'assets/app.js wird nicht eingebunden');
  assert.ok(quotesPos < appPos, 'quotes.js muss vor app.js geladen werden (app.js liest window.Aufwind.QUOTES)');
});

test('beide Skripte stehen vor dem schliessenden </body> (kein <head>-Blocking)', () => {
  const bodyClosePos = html.indexOf('</body>');
  const quotesPos = html.indexOf('assets/quotes.js');
  const appPos = html.indexOf('assets/app.js');
  assert.ok(quotesPos < bodyClosePos && appPos < bodyClosePos);
});

// --- Keine externen Requests (Story 10) -------------------------------------

test('index.html enthaelt keine externen http(s)-Requests (kein CDN, keine Fonts, kein Tracking)', () => {
  const externalRefs = html.match(/https?:\/\/[^"'\s)]+/gi) || [];
  assert.deepEqual(externalRefs, []);
});

test('index.html referenziert kein externes <link rel="preconnect"|"dns-prefetch"> o.ae.', () => {
  assert.equal(/rel\s*=\s*["'](preconnect|dns-prefetch|preload)["']/i.test(html), false);
});

test('assets/style.css enthaelt keine externen Requests (kein @import, keine url() zu http(s), keine Web-Fonts)', () => {
  assert.equal(/@import/i.test(css), false);
  const urlRefs = css.match(/url\(\s*["']?https?:\/\/[^)"']+["']?\s*\)/gi) || [];
  assert.deepEqual(urlRefs, []);
  assert.equal(/@font-face/i.test(css), false, 'es sollen keine Web-Fonts eingebunden werden (Story 10)');
});

test('index.html setzt keine Cookies/Tracking-Skripte (kein Google Analytics, kein gtag, kein Cookie-Hinweis-Skript)', () => {
  assert.equal(/document\.cookie/i.test(html), false);
  assert.equal(/gtag\(|googletagmanager|google-analytics|analytics\.js|plausible\.io|fbq\(/i.test(html), false);
});

test('app.js verwendet weder localStorage noch sessionStorage noch document.cookie (Story 3/10: kein Persistieren)', () => {
  assert.equal(/localStorage|sessionStorage/.test(appJs), false);
  assert.equal(/document\.cookie/.test(appJs), false);
});

// --- DOM-Kontrakt (Architektur 5.1) ------------------------------------------

test('DOM-Kontrakt: alle Pflicht-Selektoren aus Architektur 5.1 sind in index.html vorhanden', () => {
  assert.match(html, /<header[^>]*class\s*=\s*["'][^"']*site-header[^"']*["']/i);
  assert.match(html, /<h1[^>]*class\s*=\s*["'][^"']*wordmark[^"']*["'][^>]*>\s*Aufwind\s*<\/h1>/i);
  assert.match(html, /class\s*=\s*["'][^"']*tagline[^"']*["']/i);
  assert.match(html, /<main[^>]*id\s*=\s*["']main["']/i);
  assert.match(html, /<p[^>]*id\s*=\s*["']quote["'][^>]*aria-live\s*=\s*["']polite["']/i);
  assert.match(html, /id\s*=\s*["']quote["'][^>]*aria-atomic\s*=\s*["']true["']/i);
  assert.match(html, /class\s*=\s*["'][^"']*actions[^"']*["']/i);
  assert.match(html, /<button[^>]*id\s*=\s*["']next-button["']/i);
  assert.match(html, /id\s*=\s*["']next-button["'][^>]*aria-label\s*=\s*["'][^"']+["']/i);
  assert.match(html, /<button[^>]*id\s*=\s*["']copy-button["']/i);
  assert.match(html, /id\s*=\s*["']copy-button["'][^>]*aria-label\s*=\s*["'][^"']+["']/i);
  assert.match(html, /id\s*=\s*["']snackbar["'][^>]*role\s*=\s*["']status["']/i);
  assert.match(html, /<footer[^>]*class\s*=\s*["'][^"']*site-footer[^"']*["']/i);
});

test('Button-Beschriftungen entsprechen Story 1/2/5 ("Noch einen", "Kopieren")', () => {
  assert.match(html, /id\s*=\s*["']next-button["'][^>]*>\s*Noch einen\s*</i);
  assert.match(html, /id\s*=\s*["']copy-button["'][^>]*>\s*Kopieren\s*</i);
});

test('genau ein <h1> auf der Seite (Story 15 / Landmark-Struktur)', () => {
  const h1s = html.match(/<h1\b/gi) || [];
  assert.equal(h1s.length, 1);
});

test('Pflicht-Angaben im <head>: lang="de", charset, viewport, color-scheme, title, description', () => {
  assert.match(html, /<html[^>]*lang\s*=\s*["']de["']/i);
  assert.match(html, /<meta[^>]*charset\s*=\s*["']utf-8["']/i);
  assert.match(html, /<meta[^>]*name\s*=\s*["']viewport["'][^>]*content\s*=\s*["'][^"']*width=device-width[^"']*["']/i);
  assert.match(html, /<meta[^>]*name\s*=\s*["']color-scheme["'][^>]*content\s*=\s*["']light dark["']/i);
  assert.match(html, /<title>[^<]+<\/title>/i);
  assert.match(html, /<meta[^>]*name\s*=\s*["']description["']/i);
});

test('#quote startet ohne Platzhaltertext im Markup (wird per JS gesetzt, Architektur 5.1)', () => {
  const match = html.match(/<p[^>]*id\s*=\s*["']quote["'][^>]*>([\s\S]*?)<\/p>/i);
  assert.ok(match, '#quote-Element nicht gefunden');
  assert.equal(match[1].trim(), '');
});

test('<noscript>-Hinweis vorhanden, falls JavaScript deaktiviert ist', () => {
  assert.match(html, /<noscript>[\s\S]*<\/noscript>/i);
});

test('kein Favicon-Request ins Leere: entweder Data-URI-Favicon oder gar kein <link rel="icon">', () => {
  const iconLinks = [...html.matchAll(/<link[^>]*rel\s*=\s*["']icon["'][^>]*>/gi)];
  iconLinks.forEach((m) => {
    assert.match(m[0], /href\s*=\s*["']data:/i, 'Favicon-Link ohne Data-URI wuerde einen echten Request ausloesen: ' + m[0]);
  });
});

// --- Dark-Mode / responsives Layout: CSS-Regeln vorhanden (Story 6/7) -------
// Tatsaechliches Rendering/Scrollverhalten ist NICHT automatisiert pruefbar
// (kein Browser in dieser Umgebung) - siehe QA-Bericht, Abschnitt "nur
// manuell abnehmbar". Hier wird nur belegt, dass die noetigen CSS-Regeln
// ueberhaupt existieren und die vorgegebenen Werte tragen.

test('CSS: prefers-color-scheme: dark ist als Media Query vorhanden', () => {
  assert.match(css, /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/i);
});

test('CSS: helle und dunkle Farbverlaufswerte entsprechen exakt den Vorgaben aus Story 7', () => {
  assert.match(css, /#f6f9ff/i);
  assert.match(css, /#eaf3ff/i);
  assert.match(css, /#0f172a/i);
  assert.match(css, /#1e293b/i);
});

test('CSS: 100vh steht als Fallback vor 100dvh (Architektur 8.1, R6)', () => {
  const vhPos = css.indexOf('100vh');
  const dvhPos = css.indexOf('100dvh');
  assert.notEqual(vhPos, -1);
  assert.notEqual(dvhPos, -1);
  assert.ok(vhPos < dvhPos, '100vh (Fallback) muss vor 100dvh stehen, damit modernere Browser es ueberschreiben');
});

test('CSS: max-width 680px fuer den Spruchtext ist gesetzt (Story 6)', () => {
  assert.match(css, /max-width:\s*680px/i);
});

test('CSS: prefers-reduced-motion: reduce schaltet Animationen ab (Architektur 8.5)', () => {
  assert.match(css, /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i);
});

test('CSS: sichtbarer Fokusring wird nicht per outline:none entfernt', () => {
  assert.equal(/outline\s*:\s*none/i.test(css), false);
  assert.match(css, /:focus-visible\s*\{[^}]*outline\s*:\s*3px solid/i);
});
