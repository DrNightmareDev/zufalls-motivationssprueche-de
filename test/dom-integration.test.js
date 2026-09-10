/* test/dom-integration.test.js
 * QA-Ergaenzung: prueft das Zusammenspiel von initApp/queryElements mit dem
 * echten DOM-Kontrakt aus docs/ARCHITEKTUR.md Abschnitt 5.1, OHNE jsdom
 * (bewusst kein zusaetzliches Dependency, siehe Abschnitt 10).
 *
 * Es wird ein minimales Fake-DOM nachgebaut, das genau die Methoden bereit-
 * stellt, die app.js tatsaechlich benutzt (getElementById, addEventListener,
 * classList, appendChild/removeChild, textContent). Das deckt Luecken ab,
 * die reine Funktions-Unit-Tests nicht sehen: fehlende IDs, Ladereihenfolge-
 * unabhaengiges Verdrahten von Klick-/Tastatur-Listenern, und den
 * Doppelausloesungs-Schutz auf Ebene des vollstaendigen initApp-Ablaufs.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { initApp, queryElements, showSnackbar, handleCopyClick } = require('../assets/app.js');

function createFakeElement(tag) {
  const classes = new Set();
  const el = {
    tagName: tag.toUpperCase(),
    id: '',
    textContent: '',
    style: {},
    value: '',
    _listeners: {},
    children: [],
    offsetWidth: 0,
    _focused: false,
    classList: {
      add: function (c) { classes.add(c); },
      remove: function (c) { classes.delete(c); },
      contains: function (c) { return classes.has(c); }
    },
    setAttribute: function (name, value) { this['_attr_' + name] = value; },
    addEventListener: function (type, handler) {
      this._listeners[type] = this._listeners[type] || [];
      this._listeners[type].push(handler);
    },
    removeEventListener: function (type, handler) {
      if (!this._listeners[type]) { return; }
      this._listeners[type] = this._listeners[type].filter(function (h) { return h !== handler; });
    },
    dispatch: function (type, evt) {
      (this._listeners[type] || []).forEach(function (h) { h(evt); });
    },
    focus: function () { this._focused = true; },
    select: function () {},
    setSelectionRange: function () {},
    appendChild: function (child) { this.children.push(child); },
    removeChild: function (child) {
      const i = this.children.indexOf(child);
      if (i >= 0) { this.children.splice(i, 1); }
    }
  };
  return el;
}

// ids: Objekt { id: tagName }. Fehlt eine ID, wird sie einfach ausgelassen,
// damit queryElements() den fehlenden-Element-Pfad ausloest.
function createFakeDocument(ids) {
  const registry = {};
  Object.keys(ids).forEach(function (id) {
    const el = createFakeElement(ids[id]);
    el.id = id;
    registry[id] = el;
  });
  const body = createFakeElement('body');
  const doc = {
    _listeners: {},
    readyState: 'complete',
    getElementById: function (id) { return registry[id] || null; },
    addEventListener: function (type, handler) {
      this._listeners[type] = this._listeners[type] || [];
      this._listeners[type].push(handler);
    },
    dispatch: function (type, evt) {
      (this._listeners[type] || []).forEach(function (h) { h(evt); });
    },
    body: body,
    createElement: function (tag) { return createFakeElement(tag); },
    execCommand: function () { return true; }
  };
  return doc;
}

const REQUIRED_IDS = { quote: 'p', 'next-button': 'button', 'copy-button': 'button', snackbar: 'div' };

// --- DOM-Kontrakt (Architektur 5.1) ------------------------------------------

test('queryElements findet alle vier Pflicht-Elemente aus dem DOM-Kontrakt', () => {
  const doc = createFakeDocument(REQUIRED_IDS);
  const els = queryElements(doc);
  assert.ok(els.quote, '#quote fehlt');
  assert.ok(els.nextButton, '#next-button fehlt');
  assert.ok(els.copyButton, '#copy-button fehlt');
  assert.ok(els.snackbar, '#snackbar fehlt');
});

test('queryElements wirft mit klarer Fehlermeldung, wenn ein Pflicht-Element fehlt (einzeln fuer jede ID)', () => {
  Object.keys(REQUIRED_IDS).forEach(function (missingId) {
    const ids = Object.assign({}, REQUIRED_IDS);
    delete ids[missingId];
    const doc = createFakeDocument(ids);
    assert.throws(
      () => queryElements(doc),
      /required DOM element is missing/,
      'fehlende ID "' + missingId + '" haette einen Fehler werfen muessen'
    );
  });
});

// --- initApp: erster Spruch, Verdrahtung, Doppelausloesungs-Schutz ----------

test('initApp zeigt beim Start sofort einen Spruch ohne Fade-Klasse (Story 1 / Architektur 6.3)', () => {
  const doc = createFakeDocument(REQUIRED_IDS);
  const quotes = ['Eins', 'Zwei', 'Drei'];
  initApp(doc, quotes, { random: () => 0 });
  const quoteEl = doc.getElementById('quote');
  assert.ok(quotes.includes(quoteEl.textContent), 'es sollte sofort ein Spruch aus der Liste stehen');
  assert.equal(quoteEl.classList.contains('quote--fade'), false, 'beim allerersten Render darf nicht geblendet werden');
});

test('Klick auf #next-button zeigt einen neuen, anderen Spruch (Story 2)', () => {
  const doc = createFakeDocument(REQUIRED_IDS);
  const quotes = ['Eins', 'Zwei', 'Drei'];
  initApp(doc, quotes, { random: Math.random });
  const quoteEl = doc.getElementById('quote');
  const first = quoteEl.textContent;
  doc.getElementById('next-button').dispatch('click');
  assert.notEqual(quoteEl.textContent, first);
});

test('Pfeil-rechts (keydown auf document) loest ebenfalls den naechsten Spruch aus und unterdrueckt das Standardverhalten', () => {
  const doc = createFakeDocument(REQUIRED_IDS);
  const quotes = ['Eins', 'Zwei', 'Drei'];
  initApp(doc, quotes, { random: Math.random });
  const quoteEl = doc.getElementById('quote');
  const before = quoteEl.textContent;
  let prevented = false;
  doc.dispatch('keydown', { key: 'ArrowRight', target: { tagName: 'BODY' }, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true, 'preventDefault haette aufgerufen werden muessen');
  assert.notEqual(quoteEl.textContent, before);
});

test('Leertaste zeigt den naechsten Spruch, wenn kein Button fokussiert ist', () => {
  const doc = createFakeDocument(REQUIRED_IDS);
  const quotes = ['Eins', 'Zwei', 'Drei'];
  initApp(doc, quotes, { random: Math.random });
  const quoteEl = doc.getElementById('quote');
  const before = quoteEl.textContent;
  doc.dispatch('keydown', { key: ' ', target: { tagName: 'BODY' }, preventDefault: () => {} });
  assert.notEqual(quoteEl.textContent, before);
});

test('Doppelausloesungs-Schutz End-to-End: Leertaste mit Fokus auf #next-button loest KEINEN Spruchwechsel ueber den Tastatur-Listener aus', () => {
  // Reales Browserverhalten: haelt ein <button> den Fokus, aktiviert der
  // Browser ihn bei Leertaste selbst (eigener 'click'). Das kann in Node
  // ohne echten Browser nicht erzeugt werden. Was aber sehr wohl prüfbar
  // ist: der eigene keydown-Listener darf in diesem Fall NICHT zusaetzlich
  // showNextQuote ausloesen - sonst wuerde der Browser-Klick plus unser
  // Listener zusammen zu einem doppelten Sprung fuehren.
  const doc = createFakeDocument(REQUIRED_IDS);
  const quotes = ['Eins', 'Zwei', 'Drei'];
  initApp(doc, quotes, { random: Math.random });
  const quoteEl = doc.getElementById('quote');
  const before = quoteEl.textContent;

  doc.dispatch('keydown', { key: ' ', target: { tagName: 'BUTTON' }, preventDefault: () => {
    throw new Error('preventDefault haette hier NICHT aufgerufen werden duerfen');
  } });
  assert.equal(quoteEl.textContent, before, 'der keydown-Listener haette bei fokussiertem Button nichts tun duerfen');

  // Der eigentliche (simulierte) Browser-Klick darf genau einmal ausloesen:
  doc.getElementById('next-button').dispatch('click');
  assert.notEqual(quoteEl.textContent, before);
});

test('initApp zeigt einen ehrlichen Hinweistext bei leerer Sprueche-Liste, statt einer weissen Seite oder eines Fehlers', () => {
  const doc = createFakeDocument(REQUIRED_IDS);
  assert.doesNotThrow(() => initApp(doc, [], {}));
  const state = initApp(doc, [], {});
  assert.equal(doc.getElementById('quote').textContent, 'Gerade ist die Sprüche-Liste leer.');
  assert.equal(state.bag, null);
});

// --- Snackbar-Timer (Architektur 7.4): kein Stapeln, Selbst-Schliessen -----

test('showSnackbar blendet ein und schliesst sich nach Ablauf des Timeouts selbst', async () => {
  const doc = createFakeDocument(REQUIRED_IDS);
  const elements = queryElements(doc);
  showSnackbar(elements, 'Kopiert', 20);
  assert.equal(elements.snackbar.textContent, 'Kopiert');
  assert.equal(elements.snackbar.classList.contains('snackbar--visible'), true);
  await new Promise((resolve) => setTimeout(resolve, 45));
  assert.equal(elements.snackbar.classList.contains('snackbar--visible'), false);
});

test('showSnackbar stapelt laufende Timer nicht, sondern setzt sie zurueck', async () => {
  const doc = createFakeDocument(REQUIRED_IDS);
  const elements = queryElements(doc);
  showSnackbar(elements, 'Erste Meldung', 20);
  await new Promise((resolve) => setTimeout(resolve, 10));
  // Zweiter Aufruf VOR Ablauf des ersten Timers: der erste Timer darf die
  // Snackbar nicht mehr verstecken, sobald der zweite laeuft.
  showSnackbar(elements, 'Zweite Meldung', 20);
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(elements.snackbar.textContent, 'Zweite Meldung');
  assert.equal(
    elements.snackbar.classList.contains('snackbar--visible'),
    true,
    'der erste (kuerzere) Timer haette die Snackbar nicht vorzeitig verstecken duerfen'
  );
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(elements.snackbar.classList.contains('snackbar--visible'), false);
});

// --- handleCopyClick End-to-End (Deps werden explizit uebergeben) ---------
//
// handleCopyClick nimmt jetzt ein drittes `deps`-Argument entgegen und
// reicht es unveraendert an copyText weiter. Dadurch ist die Funktion ohne
// Patchen der echten globalen `navigator`/`document` testbar (vorheriger
// QA-Befund zur Kopplung ueber globale Bezeichner ist damit behoben). Im
// Browser bleibt das Verhalten identisch: initApp baut `deps` aus dem
// eigenen `doc` und `options.navigator` (Default: die echten globalen
// Objekte, siehe Test weiter unten).

test('handleCopyClick zeigt "Kopiert" und gibt den Fokus an #copy-button zurueck, wenn die Clipboard-API klappt', async () => {
  const doc = createFakeDocument(REQUIRED_IDS);
  const elements = queryElements(doc);
  const state = { currentText: 'Ein Testspruch ohne Autor' };
  const deps = { navigator: { clipboard: { writeText: () => Promise.resolve() } }, document: doc };

  await handleCopyClick(state, elements, deps);

  assert.equal(elements.snackbar.textContent, 'Kopiert');
  assert.equal(elements.copyButton._focused, true, 'Fokus haette auf #copy-button zurueckgehen sollen');
});

test('handleCopyClick zeigt die ehrliche Fehlermeldung, wenn weder Clipboard-API noch execCommand funktionieren', async () => {
  const doc = createFakeDocument(REQUIRED_IDS);
  doc.execCommand = function () { return false; };
  const elements = queryElements(doc);
  const state = { currentText: 'Ein Testspruch ohne Autor' };
  const deps = { navigator: {}, document: doc };

  await handleCopyClick(state, elements, deps);

  assert.equal(
    elements.snackbar.textContent,
    'Kopieren hat nicht geklappt – markiere den Spruch und drücke Strg+C.'
  );
});

test('handleCopyClick wirft nie, selbst wenn gar keine deps uebergeben werden (faellt dann auf die echten globalen Objekte zurueck)', async () => {
  const doc = createFakeDocument(REQUIRED_IDS);
  const elements = queryElements(doc);
  const state = { currentText: 'Ein Testspruch ohne Autor' };
  // Bewusst ohne deps: nutzt das echte Node-`navigator` (kein .clipboard)
  // und, falls vorhanden, das echte globale `document` -> muss dennoch
  // sauber durchlaufen und die Fehlermeldung anzeigen, ohne zu werfen.
  await assert.doesNotReject(() => handleCopyClick(state, elements));
  assert.equal(
    elements.snackbar.textContent,
    'Kopieren hat nicht geklappt – markiere den Spruch und drücke Strg+C.'
  );
});

test('Klick auf #copy-button (ueber initApp) nutzt das an initApp uebergebene Dokument fuer den Kopier-Fallback, nicht ein globales document', async () => {
  const doc = createFakeDocument(REQUIRED_IDS);
  const quotes = ['Eins', 'Zwei', 'Drei'];
  // navigator: {} simuliert den file://-Fall (keine Clipboard-API) und
  // erzwingt damit den execCommand-Fallback ueber legacyCopy(text, doc).
  initApp(doc, quotes, { random: Math.random, navigator: {} });

  doc.getElementById('copy-button').dispatch('click');
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(doc.getElementById('snackbar').textContent, 'Kopiert');
  assert.equal(doc.body.children.length, 0, 'das temporaere Textarea haette im (injizierten) doc.body wieder entfernt werden muessen');
});
