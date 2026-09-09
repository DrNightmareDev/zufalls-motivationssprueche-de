'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { shuffleIndices, avoidImmediateRepeat, createShuffleBag } = require('../assets/app.js');

// Deterministische Zufallsquelle: zyklisch durch eine feste Zahlenfolge.
function seq(values) {
  var i = 0;
  return function () { return values[i++ % values.length]; };
}

function isPermutation(order, size) {
  if (order.length !== size) { return false; }
  var seen = new Array(size).fill(false);
  for (var i = 0; i < order.length; i++) {
    var v = order[i];
    if (typeof v !== 'number' || v < 0 || v >= size || seen[v]) { return false; }
    seen[v] = true;
  }
  return true;
}

test('shuffleIndices liefert eine echte Permutation', () => {
  for (const size of [1, 2, 5, 10, 80]) {
    const order = shuffleIndices(size, Math.random);
    assert.equal(order.length, size);
    assert.ok(isPermutation(order, size), 'order = ' + JSON.stringify(order));
  }
});

test('shuffleIndices ist mit fester Zufallsfolge reproduzierbar', () => {
  const random = seq([0.9, 0.1, 0.5, 0.0, 0.99]);
  const a = shuffleIndices(5, random);
  const random2 = seq([0.9, 0.1, 0.5, 0.0, 0.99]);
  const b = shuffleIndices(5, random2);
  assert.deepEqual(a, b);
});

test('shuffleIndices liefert [] fuer size 0', () => {
  assert.deepEqual(shuffleIndices(0, Math.random), []);
});

test('avoidImmediateRepeat: laesst lastIndex = null unangetastet', () => {
  const order = [3, 1, 2, 0];
  const result = avoidImmediateRepeat(order.slice(), null, Math.random);
  assert.deepEqual(result, order);
});

test('avoidImmediateRepeat: tauscht nur bei Kollision an Position 0', () => {
  const noCollision = avoidImmediateRepeat([3, 1, 2, 0], 1, Math.random);
  assert.deepEqual(noCollision, [3, 1, 2, 0]);

  const random = seq([0.0]); // waehlt j = 1 + floor(0 * 3) = 1
  const collision = avoidImmediateRepeat([1, 2, 3, 0], 1, random);
  assert.equal(collision[0] !== 1, true);
  assert.equal(collision[1], 1);
});

test('avoidImmediateRepeat: der Tauschpartner j liegt immer in [1, length-1], nie 0', () => {
  // random nahe 1 wuerde bei falscher Bereichsrechnung j = length liefern
  // (Index ausserhalb des Arrays) statt j = length - 1.
  const almostOne = seq([0.999999]);
  const result = avoidImmediateRepeat([5, 1, 2, 3, 0], 5, almostOne);
  assert.equal(result.length, 5);
  assert.equal(result[0] !== 5, true);
  assert.equal(result.includes(5), true);
});

test('avoidImmediateRepeat: bei nur 1 Spruch (order.length < 2) unveraendert', () => {
  const single = avoidImmediateRepeat([0], 0, Math.random);
  assert.deepEqual(single, [0]);
});

test('createShuffleBag: 80 Aufrufe liefern alle Indizes ohne Wiederholung, 81. startet neue Runde', () => {
  const size = 80;
  const bag = createShuffleBag(size, { random: Math.random });
  const seen = new Set();
  for (let i = 0; i < size; i++) {
    const idx = bag.next();
    assert.equal(seen.has(idx), false, 'Index ' + idx + ' wurde innerhalb der Runde wiederholt');
    seen.add(idx);
  }
  assert.equal(seen.size, size);
  assert.equal(bag.remaining(), 0);

  const next = bag.next(); // 81. Aufruf: neue Runde
  assert.ok(next >= 0 && next < size);
  assert.equal(bag.remaining(), size - 1);
});

test('createShuffleBag: ueber die Rundengrenze hinweg wird der letzte Wert nie sofort wiederholt, auch bei manipulierter Zufallsquelle', () => {
  // random liefert immer 0 -> Fisher-Yates tauscht i mit j=0 in jedem Schritt,
  // das ist eine der ungluecklicheren Zufallsfolgen fuer diesen Test.
  const alwaysZero = () => 0;
  const size = 4;
  const bag = createShuffleBag(size, { random: alwaysZero });

  let previous = null;
  for (let round = 0; round < 5; round++) {
    for (let i = 0; i < size; i++) {
      const current = bag.next();
      if (previous !== null) {
        assert.notEqual(current, previous, 'Wiederholung am Rundenuebergang erkannt');
      }
      previous = current;
    }
  }
});

test('createShuffleBag: size = 1 liefert stabil 0 ohne Endlosschleife', () => {
  const bag = createShuffleBag(1, { random: Math.random });
  for (let i = 0; i < 10; i++) {
    assert.equal(bag.next(), 0);
  }
});

test('createShuffleBag: size < 1 wirft RangeError', () => {
  assert.throws(() => createShuffleBag(0), RangeError);
  assert.throws(() => createShuffleBag(-3), RangeError);
});

test('createShuffleBag: reset mischt sofort neu und uebernimmt lastIndex', () => {
  const bag = createShuffleBag(5, { random: Math.random });
  bag.next();
  bag.next();
  assert.ok(bag.remaining() < 5);
  bag.reset({ lastIndex: 2 });
  assert.equal(bag.remaining(), 5);
});
