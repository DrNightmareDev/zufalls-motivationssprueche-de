# Architektur: Aufwind – Zufalls-Motivationssprüche (DE)

Grundlage: `AUFTRAG.md` und `docs/STORIES.md` (verbindlich). Die technischen
Rahmenentscheidungen des Chefentwicklers sind hier ausgearbeitet, nicht neu verhandelt.

Code-Bezeichner, Dateinamen und Kommentare sind **Englisch**, alle sichtbaren UI-Texte und
diese Dokumentation sind **Deutsch**.

---

## 1. Stack und Begründung

| Baustein | Wahl | Begründung |
|---|---|---|
| Sprache/Runtime im Browser | Vanilla HTML + CSS + JavaScript (ES2019-Niveau, kein Modul-System) | Die App hat drei Interaktionen und eine Liste im Speicher; jedes Framework wäre mehr Ballast als Nutzen. Ohne Build-Schritt ist der Auslieferungsstand identisch mit dem Quellstand. |
| Build | **keiner** | Kein Bundler, kein Transpiler, keine `node_modules` für die Auslieferung. Was im Repo liegt, läuft im Browser – das macht die Pflege durch Laien überhaupt erst möglich. |
| Hosting | GitHub Pages, Quelle `main` / Wurzelverzeichnis | Kostenlos, statisch, ohne Actions-Pipeline. Deshalb liegt `index.html` in der Repo-Wurzel. |
| Jekyll-Abschaltung | leere Datei `.nojekyll` in der Wurzel | Verhindert, dass Pages die Dateien durch Jekyll schickt (Dateien mit `_`-Präfix o. Ä. würden sonst ignoriert). Reine Vorsichtsmaßnahme, kostet nichts. |
| Schriften | System-Font-Stack, **keine** Web-Fonts | Keine Drittanbieter-Requests (Datenschutz, Story 10), keine Ladezeit, kein Text-Flackern. |
| Externe Ressourcen | **keine** (kein CDN, kein Analytics, keine Cookies, kein localStorage) | Story 10 verlangt Tracking-Freiheit; nebenbei funktioniert die Seite dadurch offline und per `file://`. |
| Tests | `node:test` + `node:assert/strict`, Aufruf `npm test` → `node --test` | Im Node ≥ 18 eingebaut. Null Test-Dependencies, damit `package.json` ohne `dependencies`/`devDependencies` auskommt und niemand `npm install` braucht. |
| Datenhaltung | JS-Array im Speicher (`assets/quotes.js`) | Kein Backend, kein `fetch` (das wäre unter `file://` durch CORS blockiert). Die Sprüche sind Teil des Skripts und damit sofort verfügbar. |

**Browser-Zielkorridor:** aktuelle Versionen von Chrome, Edge, Firefox und Safari
(Desktop + Mobile), jeweils die letzten zwei Hauptversionen. Kein IE11.

---

## 2. Kritischer Constraint: Doppelklick auf `index.html` (`file://`)

Der Auftraggeber muss die Datei lokal per Doppelklick öffnen können. Daraus folgt hart:

1. **Keine ES-Module.** `<script type="module">` unterliegt CORS; unter `file://` liefert
   das in allen Browsern einen Fehler („Cross origin requests are only supported for
   protocol schemes: http, https…"). Es werden ausschließlich klassische
   `<script src="…"></script>`-Tags verwendet.
2. **Kein `fetch`/`XMLHttpRequest`** auf lokale Dateien (gleicher Grund). Die Sprüche
   kommen deshalb aus einem Skript, nicht aus einer JSON-Datei.
3. **Keine absoluten Pfade** in `href`/`src`. Immer relativ (`assets/style.css`), sonst
   zeigt `/assets/style.css` unter `file://` auf das Wurzelverzeichnis der Festplatte.
4. **Clipboard-API ist unter `file://` meist nicht verfügbar** (kein „secure context“) –
   siehe Abschnitt 7.2.

### 2.1 Das UMD-artige Namespace-Muster (verbindlich)

Damit dieselben Dateien ohne Build sowohl im Browser (globaler Namespace) als auch im
Node-Test-Runner (`require`) funktionieren, bekommt **jede** JS-Datei denselben Rahmen:

```js
/* assets/app.js */
(function (global) {
  'use strict';

  // --- internals -----------------------------------------------------------
  function shuffleIndices(size, random) { /* ... */ }
  // ...

  // --- public surface ------------------------------------------------------
  var api = {
    shuffleIndices: shuffleIndices,
    createShuffleBag: createShuffleBag,
    shouldHandleNextKey: shouldHandleNextKey,
    copyText: copyText,
    initApp: initApp
  };

  // Browser: window.Aufwind sammelt die Bausteine aller Dateien ein.
  global.Aufwind = Object.assign(global.Aufwind || {}, api);

  // Node/Tests: klassischer CommonJS-Export.
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
})(typeof window !== 'undefined' ? window : globalThis);
```

Regeln dazu:

- `global.Aufwind` wird **gemerged**, nie überschrieben – die Ladereihenfolge der Dateien
  darf keine Rolle spielen.
- `assets/quotes.js` exportiert nach demselben Muster `{ QUOTES: [...] }`, also
  `window.Aufwind.QUOTES` bzw. `require('../assets/quotes.js').QUOTES`.
- `assets/app.js` darf beim bloßen Laden **nichts** am DOM tun. Der Start passiert
  ausschließlich in einem Guard am Ende der IIFE:

  ```js
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
      bootstrap();
    }
  }
  ```

  Nur so lässt sich `app.js` im Node-Test `require`n, ohne dass `document is not defined`
  fliegt.
- Kein `export`, kein `import`, kein `async`-Top-Level. `const`/`let`/Arrow-Functions sind
  erlaubt (alle Zielbrowser können das), aber der Datei-Rahmen bleibt die IIFE.

### 2.2 Ladereihenfolge in `index.html`

```html
<script src="assets/quotes.js"></script>
<script src="assets/app.js"></script>
```

Beide **ohne** `defer`/`async`/`type="module"`, platziert direkt vor `</body>`. Die
Dateien sind klein; ein `defer` würde nur zusätzliche Fallstricke unter `file://` bringen.

---

## 3. Ordnerstruktur

```
zufalls-motivationssprueche-de/
├── index.html                 # einzige Seite, in der Wurzel (GitHub-Pages-Vorgabe)
├── .nojekyll                  # leere Datei, schaltet Jekyll auf Pages ab
├── package.json               # nur name, private, scripts.test – keine Dependencies
├── README.md                  # Laien-Anleitung (Story 12)
├── ABSCHLUSSBERICHT.md        # am Projektende
├── assets/
│   ├── style.css              # komplettes Styling inkl. Dark-Mode
│   ├── quotes.js              # die 80 Sprüche als String-Array  ← Pflege-Datei
│   └── app.js                 # Shuffle-Bag, Rendering, Tastatur, Kopieren
├── docs/
│   ├── STORIES.md             # User Stories (verbindlich)
│   └── ARCHITEKTUR.md         # dieses Dokument
└── test/
    ├── shuffle-bag.test.js    # Fisher-Yates, Bag-Verhalten, Reshuffle-Regel
    ├── keyboard.test.js       # shouldHandleNextKey()
    ├── clipboard.test.js      # copyText() mit injizierten Fakes
    └── quotes.test.js         # Datenqualität der Sprüche-Liste
```

`package.json` exakt in diesem Umfang:

```json
{
  "name": "aufwind",
  "private": true,
  "scripts": { "test": "node --test" }
}
```

Keine `dependencies`, keine `devDependencies`, kein `type: "module"` (die Testdateien
nutzen `require`).

---

## 4. Datenmodell

### 4.1 Persistente Daten: `assets/quotes.js`

Ein flaches Array aus Strings. **Kein Autorenfeld, keine Objekte, keine IDs, keine
Kategorien** (Stories 4/„Wird nicht“). Die Datei ist bewusst so simpel, dass ein
Nicht-Techniker eine Zeile kopieren, den Text ersetzen und speichern kann.

```js
(function (global) {
  'use strict';

  // Sprüche pflegen: eine Zeile pro Spruch, in Anführungszeichen, mit Komma am Ende.
  var QUOTES = [
    'Fang klein an. Fang jetzt an.',
    'Du musst nicht jeden Tag gewinnen. Du musst nur weitermachen.'
    // ... insgesamt 80 Einträge
  ];

  var api = { QUOTES: QUOTES };
  global.Aufwind = Object.assign(global.Aufwind || {}, api);
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
})(typeof window !== 'undefined' ? window : globalThis);
```

Inhaltliche Regeln (aus Story 9, prüfbar in `quotes.test.js`):

| Regel | Wert |
|---|---|
| Anzahl | genau 80 |
| Sprache | Deutsch, Du-Anrede |
| Herkunft | ausschließlich selbst formuliert, keine Fremdzitate |
| Länge | 15–180 Zeichen; Mischung aus sehr kurzen und ein- bis zweisätzigen Sprüchen |
| Duplikate | keine (case-insensitiv, getrimmt) |
| Formatierung | kein führendes/abschließendes Leerzeichen, kein Zeilenumbruch, kein HTML |
| Anführungszeichen | im Text bevorzugt typografisch („…“), damit das JS-Quoting einfach bleibt |

**Quoting-Hinweis für den Entwickler:** Sprüche mit Apostroph (`geht’s`) verwenden das
typografische `’` (U+2019), nicht `'`. Damit funktioniert die einfache Umschließung mit
`'…'` ohne Escaping und die Pflege-Datei bleibt für Laien fehlerarm.

### 4.2 Laufzeit-Zustand (nur im Speicher, pro Tab)

```
AppState {
  quotes:       string[]   // Referenz auf QUOTES
  bag:          ShuffleBag // siehe 6.2
  currentIndex: number      // Index des angezeigten Spruchs, -1 vor dem ersten Render
  currentText:  string      // exakt der Text, den „Kopieren“ kopiert
}

ShuffleBag (internal) {
  size:      number
  order:     number[]  // aktuelle Ziehungsreihenfolge (Permutation von 0..size-1)
  cursor:    number    // nächste zu ziehende Position in order
  lastIndex: number|null // zuletzt gezogener Index, für die Reshuffle-Regel
  random:    () => number // injizierbare Zufallsquelle, Default Math.random
}
```

Es wird **nichts** persistiert: kein `localStorage`, kein `sessionStorage`, keine Cookies.
Ein Reload setzt den Zustand zurück (Story 3 / entschiedener Punkt 7).

---

## 5. Seiten und Schnittstellen

Es gibt genau **eine Seite** und **keine Netzwerk-Schnittstelle**. Die „Schnittstellen“
dieses Projekts sind das DOM-Kontrakt zwischen `index.html` und `app.js` sowie die
JS-Signaturen.

### 5.1 DOM-Kontrakt (`index.html`)

| Selektor | Element | Zweck |
|---|---|---|
| `body > header.site-header` | `<header>` (Landmark `banner`) | Wortmarke + Unterzeile |
| `.wordmark` | `<h1>` | Text „Aufwind“ |
| `.tagline` | `<p>` | „Ein Spruch für jetzt.“, unter 360 px ausgeblendet |
| `main#main` | `<main>` (Landmark `main`) | zentrierter Inhaltsbereich |
| `#quote` | `<p>` mit `aria-live="polite"`, `aria-atomic="true"` | der Spruchtext |
| `.actions` | `<div>` | Button-Zeile |
| `#next-button` | `<button type="button">` | Label „Noch einen“, `aria-label="Noch einen Spruch anzeigen"` |
| `#copy-button` | `<button type="button">` | Label „Kopieren“, `aria-label="Spruch kopieren"` |
| `#snackbar` | `<div role="status" aria-live="polite">` | Bestätigung „Kopiert“ |
| `footer.site-footer` | `<footer>` (Landmark `contentinfo`) | Tastatur-Hinweis, sehr dezent |

Weitere Pflicht-Angaben im `<head>`:
`<html lang="de">`, `<meta charset="utf-8">`,
`<meta name="viewport" content="width=device-width, initial-scale=1">`,
`<meta name="color-scheme" content="light dark">`,
`<title>Aufwind – Ein Spruch für jetzt.</title>`,
`<meta name="description" content="…">`. Kein Favicon-Request ins Leere: entweder ein
Inline-SVG-Favicon per Data-URI oder gar kein `<link rel="icon">`.

Der erste Spruch wird **per JavaScript** gesetzt. `#quote` startet leer (nicht mit
Platzhaltertext), damit kein Text aufblitzt, der sofort ersetzt wird. Falls JS deaktiviert
ist, zeigt ein `<noscript>`-Block einen kurzen Hinweissatz.

### 5.2 Öffentliche JS-Signaturen (`window.Aufwind` / `module.exports`)

#### `assets/quotes.js`

| Signatur | Rückgabe | Zweck |
|---|---|---|
| `QUOTES` | `string[]` | Die 80 Sprüche. Reine Daten, keine Funktion. |

#### `assets/app.js` – reine Logik (testbar, kein DOM)

| Signatur | Rückgabe | Zweck |
|---|---|---|
| `shuffleIndices(size, random)` | `number[]` | Liefert eine Permutation von `0..size-1` per Fisher-Yates (Rückwärtsvariante). `random` ist eine Funktion `() => number` mit Werten in `[0,1)`; Default `Math.random`. Für `size <= 0` → `[]`. |
| `avoidImmediateRepeat(order, lastIndex, random)` | `number[]` | Sorgt dafür, dass `order[0] !== lastIndex`. Gibt dasselbe (mutierte) Array zurück. Details siehe 6.2. |
| `createShuffleBag(size, options)` | `ShuffleBag` | Erzeugt den Zustandsbehälter. `options = { random?: () => number, lastIndex?: number \| null }`. Wirft `RangeError` bei `size < 1`. |
| `bag.next()` | `number` | Nächster Index. Leert sich der Vorrat, wird automatisch neu gemischt (inkl. Repeat-Schutz). |
| `bag.remaining()` | `number` | Wie viele Indizes bis zum nächsten Mischen übrig sind (nur für Tests/Debug). |
| `bag.reset(options)` | `void` | Mischt sofort neu; `options.lastIndex` überschreibt den Repeat-Schutz. |
| `shouldHandleNextKey(event)` | `boolean` | Entscheidet, ob ein Tastendruck „nächster Spruch“ auslösen soll. Erwartet ein Objekt mit `key`, `ctrlKey`, `metaKey`, `altKey`, `shiftKey`, `repeat`, `target` – deshalb ohne echtes DOM testbar. Details siehe 6.4. |
| `copyText(text, deps)` | `Promise<'clipboard' \| 'execCommand' \| false>` | Kopiert `text`. `deps = { navigator?, document? }` wird injiziert (Default: die globalen Objekte). Liefert die genutzte Strategie oder `false`, wirft nie. Details siehe 7.2. |

#### `assets/app.js` – DOM-nahe Funktionen (nicht unit-getestet)

| Signatur | Rückgabe | Zweck |
|---|---|---|
| `queryElements(doc)` | `{ quote, nextButton, copyButton, snackbar }` | Sammelt die DOM-Referenzen einmalig; wirft mit klarer Meldung, wenn ein Element fehlt. |
| `renderQuote(elements, text)` | `void` | Schreibt `text` per `textContent` (**nie** `innerHTML`) in `#quote` und stößt die Fade-Animation an. |
| `showNextQuote(state, elements)` | `void` | `state.bag.next()` → Index merken → `renderQuote`. |
| `showSnackbar(elements, message, timeoutMs)` | `void` | Blendet die Snackbar ein, blendet sie nach `timeoutMs` (Default 2000) wieder aus; ein laufender Timer wird zurückgesetzt, nicht gestapelt. |
| `handleCopyClick(state, elements)` | `Promise<void>` | Ruft `copyText(state.currentText)` und zeigt Erfolg oder ehrliche Fehlermeldung. |
| `initApp(doc, quotes, options)` | `AppState` | Verdrahtet alles: Elemente holen, Bag bauen, ersten Spruch zeigen, Listener registrieren. `options.random` erlaubt deterministische Läufe. |
| `bootstrap()` | `void` | `initApp(document, window.Aufwind.QUOTES)`; nur im `typeof document !== 'undefined'`-Guard. |

---

## 6. Kernlogik im Detail

### 6.1 Fisher-Yates

```js
function shuffleIndices(size, random) {
  var rnd = random || Math.random;
  var order = [];
  for (var i = 0; i < size; i++) { order.push(i); }
  for (var i = order.length - 1; i > 0; i--) {
    var j = Math.floor(rnd() * (i + 1));   // 0 <= j <= i
    var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  return order;
}
```

Rückwärtsvariante mit `j ∈ [0, i]` – das ist die korrekte, unverzerrte Form. Die
Zufallsquelle wird **immer** als Parameter durchgereicht, nie direkt `Math.random`
aufgerufen; nur so sind die Tests deterministisch.

### 6.2 Shuffle-Bag ohne Wiederholung, mit Übergangs-Schutz

Ablauf:

1. Beim Erzeugen: `order = shuffleIndices(size, random)`, `cursor = 0`, `lastIndex = null`.
2. `next()`:
   - Ist `cursor >= order.length`, wird neu gemischt: `order = shuffleIndices(size, random)`,
     danach `avoidImmediateRepeat(order, lastIndex, random)`, `cursor = 0`.
   - `var index = order[cursor]; cursor++; lastIndex = index; return index;`

**Der kritische Punkt – kein Dubletten-Sandwich am Rundenübergang:** Ohne Zusatzregel kann
der letzte Spruch einer Runde zufällig auch der erste der nächsten Runde sein; der Nutzer
sähe denselben Spruch zweimal hintereinander und würde die App für kaputt halten
(Story 2: „Der neu angezeigte Spruch unterscheidet sich vom zuletzt gezeigten“).

Lösung:

```js
function avoidImmediateRepeat(order, lastIndex, random) {
  var rnd = random || Math.random;
  if (lastIndex === null || lastIndex === undefined) { return order; }
  if (order.length < 2) { return order; }          // bei nur 1 Spruch unvermeidbar
  if (order[0] !== lastIndex) { return order; }
  var j = 1 + Math.floor(rnd() * (order.length - 1));  // 1 <= j <= length-1
  var tmp = order[0]; order[0] = order[j]; order[j] = tmp;
  return order;
}
```

Bewusst **kein** „so lange neu mischen, bis es passt“ (unbegrenzte Schleife, bei `size = 1`
Endlosschleife) und **kein** starrer Tausch mit Position 1 (wäre vorhersagbar). Der
einmalige Tausch mit einer zufälligen Position aus `1..n-1` ist O(1), terminiert immer und
verzerrt die Verteilung nur minimal.

Randfälle:

- `size === 1`: `next()` liefert dauerhaft `0`. Kein Fehler, kein Sonderfall im UI.
- `size === 0`: `createShuffleBag` wirft `RangeError`. `initApp` fängt das ab und zeigt
  „Gerade ist die Sprüche-Liste leer.“ statt einer weißen Seite.
- Der Repeat-Schutz greift **nur** am Rundenübergang; innerhalb einer Runde ist
  Wiederholungsfreiheit bereits durch die Permutation garantiert.

### 6.3 Erster Spruch beim Laden

`initApp` ruft direkt `showNextQuote` auf – der erste Spruch stammt also aus derselben
Permutation. Da `Math.random` bei jedem Seitenaufruf neu würfelt, erfüllt das
„Bei jedem frischen Seitenaufruf kann ein anderer Spruch erscheinen“ (Story 1). Beim
allerersten Render wird die Fade-Animation übersprungen (Klasse erst nach dem ersten
Frame aktivieren), damit nichts sichtbar einblendet.

### 6.4 Tastatur – und die Doppelauslösung

Ein einziger `keydown`-Listener auf `document`. Die Entscheidung steckt in der reinen
Funktion `shouldHandleNextKey(event)`:

```js
function isActivatableTarget(target) {
  if (!target || !target.tagName) { return false; }
  var tag = String(target.tagName).toLowerCase();
  return tag === 'button' || tag === 'a' || tag === 'input' ||
         tag === 'select' || tag === 'textarea';
}

function shouldHandleNextKey(event) {
  if (!event) { return false; }
  if (event.ctrlKey || event.metaKey || event.altKey) { return false; }
  if (event.isComposing) { return false; }

  var key = event.key;
  var isSpace  = (key === ' ' || key === 'Spacebar' || key === 'Space');
  var isRight  = (key === 'ArrowRight' || key === 'Right');
  var isN      = (typeof key === 'string' && key.toLowerCase() === 'n' && !event.shiftKey);
  if (!isSpace && !isRight && !isN) { return false; }

  // Kern der Doppelauslösungs-Vermeidung:
  // Hat ein Button/Link den Fokus, aktiviert der Browser ihn bei Space/Enter selbst.
  // Wir halten uns dann komplett heraus – sonst würde „Kopieren“ kopieren UND
  // gleichzeitig ein neuer Spruch erscheinen.
  if (isActivatableTarget(event.target)) { return false; }

  return true;
}
```

Im Listener:

```js
document.addEventListener('keydown', function (event) {
  if (!shouldHandleNextKey(event)) { return; }
  event.preventDefault();   // unterdrückt das Leertasten-Scrollen (Story 4)
  showNextQuote(state, elements);
});
```

Begründung der Details:

- **`preventDefault()` erst nach der Prüfung**, nie pauschal – sonst wären Formulare,
  Zoom-Shortcuts oder das Bedienen fokussierter Buttons kaputt.
- **`isActivatableTarget` schließt alle Buttons aus, nicht nur bei Space.** Wer mit Tab auf
  „Kopieren“ steht und `→` drückt, erwartet Fokus-/Standardverhalten, kein Spruchwechsel;
  außerdem bleibt die Regel dadurch einfach und leicht testbar. Die Maus-/Touch-Bedienung
  läuft ohnehin über den `click`-Listener des Buttons.
- **Modifier-Tasten ausgeschlossen**, damit `Strg+N` (neues Fenster) o. Ä. nicht abgefangen
  wird.
- **`event.repeat` wird bewusst NICHT gefiltert**: Dauerdrücken der Leertaste darf
  weiterblättern, das ist gewolltes Verhalten und stört niemanden.
- Da `shouldHandleNextKey` nur `key`, die Modifier und `target.tagName` liest, lässt sie
  sich im Node-Test mit einfachen Objektliteralen prüfen – ohne DOM, ohne jsdom.

### 6.5 Klick-Handler

`#next-button` → `showNextQuote`. `#copy-button` → `handleCopyClick`. Beide als
`type="button"` (kein Formular vorhanden, aber explizit ist sicherer). Nach einem Klick
behält der Button den Fokus – das ist gewollt, `shouldHandleNextKey` verhindert die
Doppelauslösung.

---

## 7. Kopieren in die Zwischenablage

### 7.1 Ausgangslage

`navigator.clipboard` existiert nur in „secure contexts“ (`https:` oder `localhost`). Unter
`file://` ist das Objekt in Chrome und Safari typischerweise `undefined`, in Firefox
teilweise vorhanden, aber `writeText` scheitert ohne Nutzergeste-/Berechtigungskontext.
Ein einfaches `await navigator.clipboard.writeText(...)` würde also genau in dem Szenario
brechen, das der Auftraggeber täglich benutzt.

### 7.2 Strategie mit Fallback

```js
function copyText(text, deps) {
  var nav = (deps && deps.navigator) || (typeof navigator !== 'undefined' ? navigator : null);
  var doc = (deps && deps.document) || (typeof document !== 'undefined' ? document : null);

  // 1. Moderner Weg
  if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
    return nav.clipboard.writeText(text)
      .then(function () { return 'clipboard'; })
      .catch(function () { return legacyCopy(text, doc); });
  }
  // 2. Fallback
  return Promise.resolve(legacyCopy(text, doc));
}

function legacyCopy(text, doc) {
  if (!doc || !doc.body || typeof doc.execCommand !== 'function') { return false; }
  var area = doc.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.style.position = 'fixed';   // fixed + opacity 0 => kein Scroll-Sprung,
  area.style.top = '0';            // und kein sichtbares Aufblitzen
  area.style.left = '0';
  area.style.opacity = '0';
  doc.body.appendChild(area);
  var ok = false;
  try {
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);   // iOS-Eigenheit
    ok = doc.execCommand('copy') === true;
  } catch (err) {
    ok = false;
  } finally {
    doc.body.removeChild(area);
  }
  return ok ? 'execCommand' : false;
}
```

Wichtig:

- `copyText` **wirft nie**; jeder Pfad endet in einem aufgelösten Promise. Der Aufrufer
  braucht kein `try/catch` um `await`.
- Nach `legacyCopy` gibt `handleCopyClick` den Fokus zurück auf `#copy-button`, damit
  Tastaturnutzer ihren Platz nicht verlieren.
- `document.execCommand('copy')` ist offiziell deprecated, funktioniert aber in allen
  Zielbrowsern und ist unter `file://` der einzige Weg. Das ist eine bewusste Entscheidung,
  kein Versehen – als Kommentar im Code festhalten.

### 7.3 Rückmeldung an den Nutzer (ehrlich, nicht geschönt)

| Ergebnis | Snackbar-Text |
|---|---|
| `'clipboard'` oder `'execCommand'` | **„Kopiert“** |
| `false` | **„Kopieren hat nicht geklappt – markiere den Spruch und drücke Strg+C.“** |

Es wird niemals „Kopiert“ gemeldet, wenn nichts kopiert wurde. Die Fehlermeldung bleibt
etwas länger stehen (ca. 4 s), weil sie eine Handlungsanweisung enthält.

### 7.4 Snackbar

- Markup: `<div id="snackbar" role="status" aria-live="polite" aria-atomic="true"></div>`,
  dauerhaft im DOM, per `opacity`/`transform` und `visibility` ein-/ausgeblendet (nicht per
  `display:none` erzeugen/entfernen – sonst kündigt der Screenreader unzuverlässig an).
- Sichtbar ca. **2000 ms**, dann Ausblenden über ~200 ms.
- Ein laufender Timer wird bei erneutem Klick per `clearTimeout` zurückgesetzt; es dürfen
  sich keine Timer stapeln.
- Position: unten zentriert, `position: fixed`, über dem Inhalt, `pointer-events: none`.

---

## 8. Layout, Optik, Barrierefreiheit

### 8.1 Höhe ohne Scrollen

```css
body {
  min-height: 100vh;   /* Fallback für ältere Browser */
  min-height: 100dvh;  /* moderne Browser: berücksichtigt mobile Adress-/Toolbars */
}
```

Die `100vh`-Zeile steht **zuerst**, `100dvh` überschreibt sie in Browsern, die die Einheit
kennen. Damit ist die App auf 360×740 ohne Scrollen nutzbar, auch wenn Safari/Chrome die
Adressleiste ein- und ausfahren.

Aufbau: `body` als Flex-Spalte (`display:flex; flex-direction:column`), Header oben, `main`
mit `flex: 1` und selbst zentrierendem Inhalt (`display:grid; place-items:center`), Footer
unten. Ein kleines `padding` (z. B. `clamp(1rem, 4vw, 2.5rem)`) verhindert Randkleben.

### 8.2 Typografie und lange Sprüche

```css
.quote {
  max-width: 680px;
  font-size: clamp(1.35rem, 4.2vw, 2.25rem);
  line-height: 1.35;
  text-wrap: balance;      /* progressive enhancement */
  overflow-wrap: break-word;
  hyphens: auto;           /* zusammen mit <html lang="de"> */
}
```

Strategie gegen „langer Spruch sprengt das Layout“ – mehrschichtig:

1. **`clamp()`-Typografie** skaliert die Schriftgröße mit dem Viewport, statt feste `px`
   zu verwenden.
2. **`max-width: 680px`** plus `margin-inline: auto` hält die Zeilenlänge lesbar (Story 6).
3. **`overflow-wrap: break-word` + `hyphens: auto`** verhindern, dass ein einzelnes langes
   Wort (Komposita!) horizontales Scrollen erzeugt.
4. **Harte Längengrenze in den Daten** (max. 180 Zeichen, per Test abgesichert) – die
   sauberste Absicherung: was nicht zu lang ist, kann nicht überlaufen.
5. Zusätzlich bekommt `main` `overflow: hidden` nicht (das würde Text abschneiden), sondern
   der Spruchcontainer eine kleine `min-height`, damit die Buttons beim Wechsel zwischen
   kurzem und langem Spruch nicht springen.

Font-Stack (System, ohne Download):

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, "Noto Sans", sans-serif;
```

### 8.3 Farben und Auto-Dark-Mode

Ausschließlich CSS, **kein JavaScript, kein localStorage, kein Toggle**. Dadurch wird ein
Systemwechsel bei geöffneter Seite automatisch übernommen (Story 7).

```css
:root {
  color-scheme: light dark;
  --bg-from: #f6f9ff;
  --bg-to:   #eaf3ff;
  --text:    #1e293b;   /* auf #eaf3ff: Kontrast ~12:1  → AA/AAA */
  --muted:   #475569;   /* auf #eaf3ff: Kontrast ~7:1   → AA    */
  --surface: #ffffff;
  --border:  #cbd5e1;
  --focus:   #1d4ed8;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-from: #0f172a;
    --bg-to:   #1e293b;
    --text:    #f1f5f9;   /* auf #1e293b: Kontrast ~14:1 → AAA */
    --muted:   #cbd5e1;   /* auf #1e293b: Kontrast ~9:1  → AA  */
    --surface: #1e293b;
    --border:  #475569;
    --focus:   #93c5fd;
  }
}

body {
  background: linear-gradient(160deg, var(--bg-from), var(--bg-to)) fixed;
  color: var(--text);
}
```

`background-attachment: fixed` (bzw. `background-color: var(--bg-to)` als Absicherung)
verhindert einen weißen Streifen beim Überscrollen auf Mobile. Alle Farbpaare sind vor der
Abnahme mit einem Kontrastprüfer gegen **WCAG AA (4.5:1 für Fließtext, 3:1 für große
Schrift und UI-Ränder)** zu verifizieren.

### 8.4 Buttons

- `#next-button` primär (gefüllt), `#copy-button` sekundär (Umriss), nebeneinander,
  auf sehr schmalen Screens umbrechend (`flex-wrap: wrap`).
- Trefferfläche mindestens **44×44 px** (Touch).
- `:focus-visible` mit deutlich sichtbarem Ring:
  `outline: 3px solid var(--focus); outline-offset: 3px;` – der Ring wird **nie** entfernt.
- `:hover`/`:active` dezent (Helligkeit/Schatten), keine Bewegungseffekte.

### 8.5 Übergang beim Spruchwechsel (Story 16, „Kann“)

Fade über eine Klasse, Dauer ≤ 300 ms, umgesetzt ohne Layout-Sprünge (nur `opacity`,
optional `transform: translateY(4px)`). Pflicht dabei:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

Der Text wird sofort gesetzt (kein Warten auf ein Animationsende), damit die App auf
Dauerdrücken der Leertaste weiter unmittelbar reagiert.

### 8.6 Barrierefreiheit (Story 15)

| Punkt | Umsetzung |
|---|---|
| Landmarks | `<header>`, `<main>`, `<footer>`; genau ein `<h1>` („Aufwind“) |
| Sprachwechsel | `<html lang="de">` |
| Spruchwechsel ansagen | `#quote` mit `aria-live="polite"` + `aria-atomic="true"`; **nicht** `assertive`, damit nichts unterbrochen wird |
| Button-Labels | sichtbarer Text + präzises `aria-label` („Noch einen Spruch anzeigen“, „Spruch kopieren“) |
| Snackbar | `role="status"` (implizit `aria-live="polite"`) |
| Fokus | sichtbarer `:focus-visible`-Ring, logische Tab-Reihenfolge Header → Spruch → Buttons |
| Kontrast | siehe 8.3, mindestens AA |
| Motion | `prefers-reduced-motion` respektiert |
| Ohne JS | `<noscript>`-Hinweis statt leerer Seite |

---

## 9. Umsetzungsreihenfolge (Pakete für den Entwickler)

Jedes Paket ist eigenständig testbar und endet mit einem eigenen Commit (deutsche
Commit-Nachricht).

### Paket 1 – Grundgerüst und Werkzeuge
- `package.json` (exakt wie in Abschnitt 3), `.nojekyll`, `index.html` mit vollständigem
  Markup-Skelett und allen IDs aus 5.1, leeres `assets/style.css`,
  `assets/quotes.js` mit 3 Platzhalter-Sprüchen, `assets/app.js` mit dem IIFE-Rahmen und
  einer `initApp`, die nur den ersten Spruch stumpf ins DOM schreibt.
- **Fertig, wenn:** Doppelklick auf `index.html` zeigt einen Spruch; `npm test` läuft
  (auch wenn es noch keine Tests gibt); Konsole ohne Fehler.

### Paket 2 – Shuffle-Bag als reine Logik
- `shuffleIndices`, `avoidImmediateRepeat`, `createShuffleBag` in `assets/app.js`.
- `test/shuffle-bag.test.js` mit injizierter Pseudo-Zufallsquelle.
- **Fertig, wenn:** alle Bag-Tests grün (siehe 10.1); die UI nutzt den Bag noch nicht
  zwingend.

### Paket 3 – Verdrahtung Button + Rendering
- `queryElements`, `renderQuote`, `showNextQuote`, Klick-Listener auf „Noch einen“.
- **Fertig, wenn:** Klicken zeigt neue Sprüche, nie zweimal denselben hintereinander,
  nach 80 Klicks wird neu gemischt (manuell mit einer kurzen Testliste geprüft).

### Paket 4 – Tastatur
- `shouldHandleNextKey` + `keydown`-Listener, `test/keyboard.test.js`.
- **Fertig, wenn:** Leertaste/→/N blättern weiter, die Seite scrollt bei Leertaste nicht,
  und Space auf fokussiertem „Kopieren“ kopiert nur (kein Spruchwechsel).

### Paket 5 – Kopieren und Snackbar
- `copyText`, `legacyCopy`, `showSnackbar`, `handleCopyClick`,
  `test/clipboard.test.js` mit gefälschten `navigator`/`document`-Objekten.
- **Fertig, wenn:** Kopieren funktioniert über `http://localhost` **und** per Doppelklick
  über `file://`; Snackbar erscheint ~2 s; erzwungener Fehlerfall zeigt den ehrlichen Text.

### Paket 6 – Styling, Dark-Mode, Responsivität
- Komplettes `assets/style.css`: Gradient, Dark-Mode, `dvh`, `clamp()`, Buttons, Fokusring,
  Snackbar, Fade, `prefers-reduced-motion`.
- **Fertig, wenn:** 360×740 und 1920×1080 ohne Scrollen nutzbar; Systemwechsel hell/dunkel
  greift ohne Reload; längster Spruch bricht sauber um.

### Paket 7 – Inhalte: die 80 Sprüche
- `assets/quotes.js` auf 80 selbst formulierte Sprüche füllen (Mischung kurz/lang),
  `test/quotes.test.js` (Anzahl, Duplikate, Länge, Whitespace).
- **Fertig, wenn:** Datenqualitäts-Tests grün und die Liste einmal komplett gegengelesen
  wurde (Ton: positiv, klar, kein Kitsch, keine Heilsversprechen).

### Paket 8 – Barrierefreiheit und Feinschliff
- Landmarks, `aria-live`, `aria-label`, Kontrastprüfung, `<noscript>`, `<meta description>`,
  Favicon-Entscheidung, Tastatur-Hinweis im Footer.
- **Fertig, wenn:** Kontraste ≥ AA belegt, Tab-Reihenfolge sauber, Screenreader-Stichprobe
  kündigt den Spruchwechsel an.

### Paket 9 – README und Veröffentlichung
- `README.md` für Laien (Projektbeschreibung, Doppelklick-Anleitung, Shortcut-Liste,
  Kopieren-Erklärung, **Wie ergänze ich einen Spruch** mit Beispielzeile, Live-Link),
  GitHub Pages aktivieren (`main` / root).
- **Fertig, wenn:** die Live-URL die aktuelle Version zeigt und ein Nicht-Techniker allein
  anhand des READMEs einen Spruch ergänzen könnte.

---

## 10. Teststrategie

`npm test` ruft `node --test` auf und findet automatisch alles unter `test/*.test.js`.
Kein jsdom, kein Playwright, keine Dependencies. Die Testdateien laden die
Produktionsdateien per `require('../assets/app.js')` – möglich dank des Musters aus 2.1.

### 10.1 Automatisiert (Unit-Tests)

| Datei | Was geprüft wird |
|---|---|
| `shuffle-bag.test.js` | `shuffleIndices` liefert eine echte Permutation (gleiche Länge, alle Indizes genau einmal); mit fester Zufallsfolge ein reproduzierbares Ergebnis; `size = 0` → `[]`. `createShuffleBag`: 80 Aufrufe von `next()` liefern alle 80 Indizes ohne Wiederholung; der 81. Aufruf startet eine neue Runde; **über die Rundengrenze hinweg ist `next() !== vorheriger Wert`** – auch mit einer manipulierten Zufallsquelle, die den Repeat gezielt erzwingen würde; `size = 1` liefert stabil `0` ohne Endlosschleife; `size < 1` wirft `RangeError`. `avoidImmediateRepeat` direkt: tauscht nur bei Kollision, tauscht nie an Position 0 zurück, lässt `lastIndex = null` unangetastet. |
| `keyboard.test.js` | `shouldHandleNextKey` → `true` für `' '`, `'ArrowRight'`, `'n'`, `'N'`; `false` für `'a'`, `'Enter'`, `'ArrowLeft'`; `false` bei `ctrlKey`/`metaKey`/`altKey`; `false`, wenn `target.tagName === 'BUTTON'` (Doppelauslösung!), ebenso für `INPUT`/`TEXTAREA`/`A`; `true` bei `target.tagName === 'BODY'`. |
| `clipboard.test.js` | `copyText` mit Fake-`navigator.clipboard` (Erfolg) → `'clipboard'`; mit ablehnendem `writeText` → fällt auf `execCommand` zurück; ohne `navigator.clipboard` (der `file://`-Fall) → `'execCommand'`; wenn `execCommand` `false` liefert oder wirft → Ergebnis `false`, **kein** unbehandelter Fehler; das temporäre `textarea` wird in jedem Fall wieder entfernt (der Fake zählt `appendChild`/`removeChild`). |
| `quotes.test.js` | genau 80 Einträge; alle vom Typ `string`; keine leeren Strings; keine Duplikate (getrimmt, case-insensitiv); Länge 15–180 Zeichen; kein führender/abschließender Whitespace; keine Zeilenumbrüche; kein `<`/`>` (kein HTML). |

Die Zufallsquelle in Tests ist eine deterministische Funktion, z. B. ein Zähler über einer
festen Zahlenfolge (`function seq(values) { var i = 0; return function () { return values[i++ % values.length]; }; }`).

### 10.2 Manuell (Checkliste vor der Abnahme)

Nicht automatisiert, weil echtes DOM, echte Browser oder echte Nutzerwahrnehmung nötig sind
– und weil eine Browser-Testinfrastruktur für dieses Projekt unverhältnismäßig wäre:

1. **Doppelklick-Test:** `index.html` per Doppelklick öffnen (Chrome, Firefox, Safari) –
   Spruch erscheint, Buttons und Tastatur funktionieren, Kopieren funktioniert oder zeigt
   die ehrliche Fehlermeldung. **Der wichtigste Test überhaupt.**
2. **Live-Test:** dieselben Punkte auf der GitHub-Pages-URL.
3. **Layout:** 360×740 (DevTools) und Desktop – kein Scrollen, nichts abgeschnitten;
   längster Spruch der Liste gezielt anzeigen.
4. **Mobile Adressleiste:** echtes Handy oder Gerätesimulation, Ein-/Ausfahren der
   Browserleiste (Test der `dvh`-Regel).
5. **Dark-Mode:** Systemthema bei geöffneter Seite umschalten – Farbwechsel ohne Reload.
6. **Tastatur-Doppelauslösung:** mit Tab auf „Kopieren“ fokussieren, Leertaste drücken –
   es wird kopiert, der Spruch bleibt stehen.
7. **Zwischenablage inhaltlich:** kopierten Text in einen Editor einfügen – exakt der
   Spruchtext, kein Autor, keine Anführungszeichen drumherum.
8. **Barrierefreiheit:** Screenreader-Stichprobe (NVDA oder VoiceOver), Fokusring sichtbar,
   Kontrastwerte mit einem Prüfwerkzeug belegt.
9. **Netzwerk:** DevTools-Netzwerk-Tab zeigt ausschließlich Requests an eigene Dateien –
   kein CDN, keine Fonts, keine Analytics.
10. **Reduced Motion:** Systemeinstellung aktivieren – keine Animationen mehr.

---

## 11. Risiken

| # | Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|---|
| R1 | Clipboard-API unter `file://` nicht verfügbar | Kopieren scheitert genau im Hauptszenario des Auftraggebers | `execCommand`-Fallback (7.2) + ehrliche Fehlermeldung; Punkt 1 der manuellen Checkliste |
| R2 | Versehentlicher Einsatz von ES-Modulen oder `fetch` | Seite ist per Doppelklick komplett tot (weiße Seite) | Verbot in 2.1 dokumentiert; Doppelklick-Test ist Abnahmekriterium jedes Pakets |
| R3 | Doppelauslösung Leertaste bei fokussiertem Button | Nutzer klickt „Kopieren“ und der Spruch springt weg – wirkt kaputt | `shouldHandleNextKey` filtert aktivierbare Targets; eigener Unit-Test |
| R4 | 80 eigene, gute Sprüche zu schreiben ist der zeitaufwendigste Teil | Terminrisiko, oder Qualität/Ton leidet | Eigenes Paket 7 am Ende; Notfallgrenze 50 Sprüche laut Story 9; Datenqualitätstest fängt Schludrigkeiten ab |
| R5 | Urheberrecht bei Fremdzitaten | Abmahnrisiko | Content-Policy: ausschließlich selbst formuliert (entschiedener Punkt 6); im Review explizit gegenprüfen |
| R6 | `100dvh` in älteren Browsern unbekannt | Layout scrollt auf Mobile leicht | `100vh` steht als Fallback davor; manuelle Prüfung Punkt 4 |
| R7 | `aria-live` auf `#quote` ist bei schnellem Weiterblättern geschwätzig | Screenreader-Nutzer werden überflutet | `polite` statt `assertive`; keine zusätzliche Ansage des Buttons |
| R8 | GitHub-Pages-Caching / Pages nicht aktiviert | Auftraggeber sieht eine alte oder gar keine Version | Nach dem Deploy Live-URL mit Hard-Reload prüfen; Pages-Einstellung im Abschlussbericht dokumentieren |
| R9 | Laie bearbeitet `quotes.js` und zerschießt die Syntax | Seite bleibt leer | Typografische Apostrophe (4.1), Kommentar mit Beispielzeile in der Datei, README-Anleitung, `quotes.test.js` als Netz für den, der testen kann |
| R10 | Kontrastwerte nur geschätzt statt gemessen | WCAG-AA verfehlt | Paket 8 verlangt eine belegte Messung, nicht nur eine Vermutung |
| R11 | Sehr langer Spruch sprengt auf kleinem Screen die Höhe | Scrollen nötig, Story 6 verletzt | Fünfstufige Strategie in 8.2, harte Zeichengrenze im Datentest |
| R12 | `document.execCommand` wird künftig entfernt | Fallback bricht irgendwann weg | Bewusst akzeptiert; heute ohne Alternative für `file://`. Im Code als Kommentar markiert, im Abschlussbericht als offener Punkt führen |
