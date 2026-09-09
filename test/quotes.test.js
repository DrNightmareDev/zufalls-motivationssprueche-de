/* test/quotes.test.js */
'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var QUOTES = require('../assets/quotes.js').QUOTES;

function normalize(text) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

test('contains exactly 80 quotes', function () {
  assert.equal(QUOTES.length, 80);
});

test('every quote is a non-empty string', function () {
  QUOTES.forEach(function (quote) {
    assert.equal(typeof quote, 'string');
    assert.ok(quote.length > 0, 'quote must not be an empty string');
  });
});

test('no duplicate quotes, even after normalization', function () {
  var seen = new Set();
  QUOTES.forEach(function (quote) {
    var key = normalize(quote);
    assert.ok(!seen.has(key), 'duplicate quote found: "' + quote + '"');
    seen.add(key);
  });
  assert.equal(seen.size, QUOTES.length);
});

test('every quote length is between 15 and 180 characters', function () {
  QUOTES.forEach(function (quote) {
    assert.ok(
      quote.length >= 15 && quote.length <= 180,
      'quote length out of range (' + quote.length + '): "' + quote + '"'
    );
  });
});

test('no quote has leading or trailing whitespace', function () {
  QUOTES.forEach(function (quote) {
    assert.equal(quote, quote.trim(), 'quote has leading/trailing whitespace: "' + quote + '"');
  });
});

test('no quote contains line breaks', function () {
  QUOTES.forEach(function (quote) {
    assert.ok(!/[\r\n]/.test(quote), 'quote contains a line break: "' + quote + '"');
  });
});

test('no quote contains double spaces', function () {
  QUOTES.forEach(function (quote) {
    assert.ok(!/ {2,}/.test(quote), 'quote contains double spaces: "' + quote + '"');
  });
});

test('no quote contains a straight apostrophe', function () {
  QUOTES.forEach(function (quote) {
    assert.ok(!quote.includes('\''), 'quote contains a straight apostrophe: "' + quote + '"');
  });
});

test('no quote contains HTML angle brackets', function () {
  QUOTES.forEach(function (quote) {
    assert.ok(!/[<>]/.test(quote), 'quote contains HTML-like characters: "' + quote + '"');
  });
});
