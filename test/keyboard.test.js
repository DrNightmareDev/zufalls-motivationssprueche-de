'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldHandleNextKey } = require('../assets/app.js');

function makeEvent(overrides) {
  return Object.assign({
    key: '',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    repeat: false,
    isComposing: false,
    target: { tagName: 'BODY' }
  }, overrides || {});
}

test('true fuer Leertaste, Pfeil-rechts, n und N', () => {
  assert.equal(shouldHandleNextKey(makeEvent({ key: ' ' })), true);
  assert.equal(shouldHandleNextKey(makeEvent({ key: 'ArrowRight' })), true);
  assert.equal(shouldHandleNextKey(makeEvent({ key: 'n' })), true);
  assert.equal(shouldHandleNextKey(makeEvent({ key: 'N' })), true);
});

test('false fuer andere Tasten', () => {
  assert.equal(shouldHandleNextKey(makeEvent({ key: 'a' })), false);
  assert.equal(shouldHandleNextKey(makeEvent({ key: 'Enter' })), false);
  assert.equal(shouldHandleNextKey(makeEvent({ key: 'ArrowLeft' })), false);
});

test('false bei Modifier-Tasten (ctrl/meta/alt)', () => {
  assert.equal(shouldHandleNextKey(makeEvent({ key: ' ', ctrlKey: true })), false);
  assert.equal(shouldHandleNextKey(makeEvent({ key: ' ', metaKey: true })), false);
  assert.equal(shouldHandleNextKey(makeEvent({ key: ' ', altKey: true })), false);
  assert.equal(shouldHandleNextKey(makeEvent({ key: 'ArrowRight', ctrlKey: true })), false);
  assert.equal(shouldHandleNextKey(makeEvent({ key: 'n', metaKey: true })), false);
});

test('false, wenn ein aktivierbares Element den Fokus hat (Doppelausloesung)', () => {
  assert.equal(shouldHandleNextKey(makeEvent({ key: ' ', target: { tagName: 'BUTTON' } })), false);
  assert.equal(shouldHandleNextKey(makeEvent({ key: ' ', target: { tagName: 'INPUT' } })), false);
  assert.equal(shouldHandleNextKey(makeEvent({ key: ' ', target: { tagName: 'TEXTAREA' } })), false);
  assert.equal(shouldHandleNextKey(makeEvent({ key: ' ', target: { tagName: 'A' } })), false);
  assert.equal(shouldHandleNextKey(makeEvent({ key: ' ', target: { tagName: 'SELECT' } })), false);
});

test('true bei target.tagName === BODY', () => {
  assert.equal(shouldHandleNextKey(makeEvent({ key: ' ', target: { tagName: 'BODY' } })), true);
});

test('false ohne Event bzw. ohne key', () => {
  assert.equal(shouldHandleNextKey(null), false);
  assert.equal(shouldHandleNextKey(undefined), false);
});

test('false waehrend IME-Komposition', () => {
  assert.equal(shouldHandleNextKey(makeEvent({ key: ' ', isComposing: true })), false);
});

test('N mit gedrueckter Shift-Taste wird nicht als N-Taste gewertet', () => {
  assert.equal(shouldHandleNextKey(makeEvent({ key: 'N', shiftKey: true })), false);
});

test('event.repeat wird bewusst nicht gefiltert (Dauerdruecken erlaubt)', () => {
  assert.equal(shouldHandleNextKey(makeEvent({ key: ' ', repeat: true })), true);
});
