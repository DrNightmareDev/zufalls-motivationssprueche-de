'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { copyText } = require('../assets/app.js');

// Ein minimales Fake-<textarea>-Element, das die fuer legacyCopy benoetigten
// DOM-Methoden bereitstellt, ohne ein echtes DOM zu benoetigen.
function makeFakeTextarea() {
  return {
    tagName: 'TEXTAREA',
    value: '',
    attributes: {},
    style: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() {},
    select() {},
    setSelectionRange() {}
  };
}

// Ein Fake-document, das appendChild/removeChild-Aufrufe zaehlt, damit die
// Tests belegen koennen, dass das temporaere Textarea immer wieder entfernt wird.
function makeFakeDocument(options) {
  const opts = options || {};
  const calls = { appendChild: 0, removeChild: 0 };
  const doc = {
    createElement(tag) {
      assert.equal(tag, 'textarea');
      return makeFakeTextarea();
    },
    execCommand(command) {
      assert.equal(command, 'copy');
      if (typeof opts.execCommand === 'function') { return opts.execCommand(); }
      return opts.execCommand === undefined ? true : opts.execCommand;
    },
    body: {
      appendChild(el) { calls.appendChild++; },
      removeChild(el) {
        calls.removeChild++;
        if (opts.removeChildThrows) { throw new Error('removeChild failed'); }
      }
    }
  };
  doc._calls = calls;
  return doc;
}

test('copyText: erfolgreiche Clipboard-API liefert "clipboard"', async () => {
  const nav = { clipboard: { writeText: () => Promise.resolve() } };
  const doc = makeFakeDocument();
  const result = await copyText('Ein Spruch', { navigator: nav, document: doc });
  assert.equal(result, 'clipboard');
  // Der execCommand-Weg wurde gar nicht erst betreten.
  assert.equal(doc._calls.appendChild, 0);
  assert.equal(doc._calls.removeChild, 0);
});

test('copyText: ablehnende Clipboard-API faellt auf execCommand zurueck', async () => {
  const nav = { clipboard: { writeText: () => Promise.reject(new Error('denied')) } };
  const doc = makeFakeDocument({ execCommand: true });
  const result = await copyText('Ein Spruch', { navigator: nav, document: doc });
  assert.equal(result, 'execCommand');
  assert.equal(doc._calls.appendChild, 1);
  assert.equal(doc._calls.removeChild, 1);
});

test('copyText: ohne navigator.clipboard (file://-Fall) nutzt execCommand', async () => {
  const nav = {}; // kein clipboard-Objekt, wie unter file:// ueblich
  const doc = makeFakeDocument({ execCommand: true });
  const result = await copyText('Ein Spruch', { navigator: nav, document: doc });
  assert.equal(result, 'execCommand');
  assert.equal(doc._calls.appendChild, 1);
  assert.equal(doc._calls.removeChild, 1);
});

test('copyText: execCommand liefert false -> Ergebnis false, kein Fehler', async () => {
  const nav = {};
  const doc = makeFakeDocument({ execCommand: false });
  const result = await copyText('Ein Spruch', { navigator: nav, document: doc });
  assert.equal(result, false);
  assert.equal(doc._calls.appendChild, 1);
  assert.equal(doc._calls.removeChild, 1);
});

test('copyText: execCommand wirft -> Ergebnis false, textarea trotzdem entfernt', async () => {
  const nav = {};
  const doc = makeFakeDocument({
    execCommand: () => { throw new Error('boom'); }
  });
  const result = await copyText('Ein Spruch', { navigator: nav, document: doc });
  assert.equal(result, false);
  assert.equal(doc._calls.appendChild, 1);
  assert.equal(doc._calls.removeChild, 1);
});

test('copyText: Clipboard-API lehnt ab UND execCommand wirft -> false, textarea entfernt', async () => {
  const nav = { clipboard: { writeText: () => Promise.reject(new Error('denied')) } };
  const doc = makeFakeDocument({
    execCommand: () => { throw new Error('boom'); }
  });
  const result = await copyText('Ein Spruch', { navigator: nav, document: doc });
  assert.equal(result, false);
  assert.equal(doc._calls.appendChild, 1);
  assert.equal(doc._calls.removeChild, 1);
});

test('copyText: ohne document (kein body, kein execCommand) liefert false, wirft nie', async () => {
  const nav = {};
  const doc = {}; // kein body, kein execCommand
  const result = await copyText('Ein Spruch', { navigator: nav, document: doc });
  assert.equal(result, false);
});

test('copyText: execCommand erfolgreich, aber removeChild wirft danach -> Ergebnis bleibt "execCommand" (kein Zweitfehler ueberschreibt den Erfolg)', async () => {
  const nav = {};
  const doc = makeFakeDocument({ execCommand: true, removeChildThrows: true });
  const result = await copyText('Ein Spruch', { navigator: nav, document: doc });
  assert.equal(result, 'execCommand');
  assert.equal(doc._calls.removeChild, 1);
});

test('copyText: execCommand wirft UND removeChild wirft danach -> Ergebnis false, copyText wirft trotzdem nie', async () => {
  const nav = {};
  const doc = makeFakeDocument({
    execCommand: () => { throw new Error('boom'); },
    removeChildThrows: true
  });
  await assert.doesNotReject(() => copyText('Ein Spruch', { navigator: nav, document: doc }));
  const result = await copyText('Ein Spruch', { navigator: nav, document: doc });
  assert.equal(result, false);
  assert.equal(doc._calls.removeChild, 2);
});

test('copyText: wirft nie synchron, auch wenn deps komplett fehlen', async () => {
  assert.doesNotThrow(() => {
    copyText('Ein Spruch', { navigator: null, document: null });
  });
  const result = await copyText('Ein Spruch', { navigator: null, document: null });
  assert.equal(result, false);
});
