/* assets/app.js
 * Aufwind – reine Logik + DOM-Verdrahtung.
 * Läuft ohne Build sowohl im Browser (window.Aufwind) als auch im
 * Node-Test-Runner (require), siehe docs/ARCHITEKTUR.md Abschnitt 2.1.
 */
(function (global) {
  'use strict';

  // --- 6.1 Fisher-Yates ----------------------------------------------------

  function shuffleIndices(size, random) {
    var rnd = random || Math.random;
    var order = [];
    for (var i = 0; i < size; i++) { order.push(i); }
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1)); // 0 <= j <= i
      var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    }
    return order;
  }

  // --- 6.2 Reshuffle-Regel: kein Dubletten-Sandwich am Rundenübergang ------

  function avoidImmediateRepeat(order, lastIndex, random) {
    var rnd = random || Math.random;
    if (lastIndex === null || lastIndex === undefined) { return order; }
    if (order.length < 2) { return order; } // bei nur 1 Spruch unvermeidbar
    if (order[0] !== lastIndex) { return order; }
    var j = 1 + Math.floor(rnd() * (order.length - 1)); // 1 <= j <= length-1
    var tmp = order[0]; order[0] = order[j]; order[j] = tmp;
    return order;
  }

  // --- 6.2 Shuffle-Bag -------------------------------------------------------

  function createShuffleBag(size, options) {
    if (size < 1) {
      throw new RangeError('Aufwind: createShuffleBag requires size >= 1, got ' + size + '.');
    }
    var opts = options || {};
    var random = opts.random || Math.random;
    var lastIndex = (opts.lastIndex === undefined) ? null : opts.lastIndex;

    var order = avoidImmediateRepeat(shuffleIndices(size, random), lastIndex, random);
    var cursor = 0;

    function next() {
      if (cursor >= order.length) {
        order = avoidImmediateRepeat(shuffleIndices(size, random), lastIndex, random);
        cursor = 0;
      }
      var index = order[cursor];
      cursor++;
      lastIndex = index;
      return index;
    }

    function remaining() {
      return order.length - cursor;
    }

    function reset(resetOptions) {
      var ro = resetOptions || {};
      if (ro.lastIndex !== undefined) { lastIndex = ro.lastIndex; }
      order = avoidImmediateRepeat(shuffleIndices(size, random), lastIndex, random);
      cursor = 0;
    }

    return { next: next, remaining: remaining, reset: reset };
  }

  // --- 6.4 Tastatur: reine, DOM-freie Entscheidung --------------------------

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
    var isSpace = (key === ' ' || key === 'Spacebar' || key === 'Space');
    var isRight = (key === 'ArrowRight' || key === 'Right');
    var isN = (typeof key === 'string' && key.toLowerCase() === 'n' && !event.shiftKey);
    if (!isSpace && !isRight && !isN) { return false; }

    // Kern der Doppelauslösungs-Vermeidung: Hat ein Button/Link den Fokus,
    // aktiviert der Browser ihn bei Space/Enter selbst. Wir halten uns dann
    // komplett heraus - sonst würde "Kopieren" kopieren UND gleichzeitig ein
    // neuer Spruch erscheinen.
    if (isActivatableTarget(event.target)) { return false; }

    return true;
  }

  // --- DOM-nahe Funktionen (nicht unit-getestet) ----------------------------

  function queryElements(doc) {
    var quote = doc.getElementById('quote');
    var nextButton = doc.getElementById('next-button');
    var copyButton = doc.getElementById('copy-button');
    var snackbar = doc.getElementById('snackbar');
    if (!quote || !nextButton || !copyButton || !snackbar) {
      throw new Error(
        'Aufwind: required DOM element is missing ' +
        '(expected #quote, #next-button, #copy-button, #snackbar).'
      );
    }
    return { quote: quote, nextButton: nextButton, copyButton: copyButton, snackbar: snackbar };
  }

  function renderQuote(elements, text) {
    elements.quote.textContent = text;
  }

  function showNextQuote(state, elements) {
    var index = state.bag.next();
    state.currentIndex = index;
    state.currentText = state.quotes[index];
    renderQuote(elements, state.currentText);
  }

  function initApp(doc, quotes, options) {
    var opts = options || {};
    var list = Array.isArray(quotes) ? quotes : [];
    var elements = queryElements(doc);
    var state = {
      quotes: list,
      bag: null,
      currentIndex: -1,
      currentText: ''
    };

    try {
      state.bag = createShuffleBag(list.length, { random: opts.random });
    } catch (err) {
      renderQuote(elements, 'Gerade ist die Sprüche-Liste leer.');
      return state;
    }

    elements.nextButton.addEventListener('click', function () {
      showNextQuote(state, elements);
    });

    doc.addEventListener('keydown', function (event) {
      if (!shouldHandleNextKey(event)) { return; }
      event.preventDefault(); // unterdrückt das Leertasten-Scrollen (Story 4)
      showNextQuote(state, elements);
    });

    showNextQuote(state, elements);

    return state;
  }

  function bootstrap() {
    var quotes = (global.Aufwind && global.Aufwind.QUOTES) || [];
    initApp(document, quotes);
  }

  // --- public surface --------------------------------------------------------

  var api = {
    shuffleIndices: shuffleIndices,
    avoidImmediateRepeat: avoidImmediateRepeat,
    createShuffleBag: createShuffleBag,
    shouldHandleNextKey: shouldHandleNextKey,
    queryElements: queryElements,
    renderQuote: renderQuote,
    showNextQuote: showNextQuote,
    initApp: initApp,
    bootstrap: bootstrap
  };

  // Browser: window.Aufwind sammelt die Bausteine aller Dateien ein.
  global.Aufwind = Object.assign(global.Aufwind || {}, api);

  // Node/Tests: klassischer CommonJS-Export.
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }

  // Start nur im Browser, nie beim bloßen Laden/Require dieser Datei.
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
      bootstrap();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
