# QA-Bericht: Aufwind – Zufalls-Motivationssprüche (DE)

Geprüft am 09./10.09.2026 gegen `docs/STORIES.md` (MUSS-Stories 1–12, SOLL-Story 15) und
`docs/ARCHITEKTUR.md`. Grundsatz dieser Prüfung: keine Behauptung ohne Beleg (Testname,
Datei:Zeile, eigenes Prüfskript oder CLI-Aufruf).

## 0. Ausgangslage / Start des Projekts

- Letzter Commit im Repo zu Prüfbeginn: `383e1dd "Kopieren, Gestaltung und Barrierefreiheit"`.
  `git ls-files` zeigte zu diesem Zeitpunkt **kein `README.md`** und **kein
  `ABSCHLUSSBERICHT.md`** im Repository.
- „Start wie im README beschrieben" war zu Prüfbeginn nicht möglich, weil kein README
  existierte. Ersatzweise wurde die Seite gemäß Architektur-Doku gestartet:
  `python3 -m http.server` im Projektordner, danach `curl` auf alle vier Auslieferungsdateien
  → `index.html`, `assets/app.js`, `assets/style.css`, `assets/quotes.js` liefern alle
  HTTP 200. Ein echter Doppelklick-Test (`file://`) ist in dieser Umgebung ohne Browser nicht
  ausführbar, wurde aber durch `node --check assets/app.js` / `node --check assets/quotes.js`
  (beide syntaktisch valide) und die statische Analyse in Abschnitt 3 ersetzt.
- **Während der laufenden Prüfung** wurde ein `README.md` von dritter Seite auf die
  Festplatte geschrieben (`git status` zeigt es weiterhin als **untracked**, Stand Ende der
  Prüfung — nicht committet, nicht gepusht). Es wird unten inhaltlich mitbewertet, aber der
  Fund „Story 12 zum letzten Commit nicht erfüllt" bleibt bestehen, siehe Befundliste.

## 1. Testsuite

`npm test` (Ausgangsstand, 4 Testdateien): **38/38 grün.**

Im Rahmen dieser Prüfung wurden zwei Testdateien ergänzt, weil mehrere Akzeptanzkriterien
testbar, aber ungetestet waren (siehe Abschnitt 4):

- `test/dom-integration.test.js` – Fake-DOM-Integrationstests für `queryElements`, `initApp`,
  Klick-/Tastatur-Verdrahtung, Doppelauslösungs-Schutz End-to-End, `showSnackbar`-Timerlogik,
  `handleCopyClick` End-to-End (inkl. echtem Node-`navigator`/gepatchtem `document`).
- `test/static-page.test.js` – statische Prüfung von `index.html`/`assets/style.css` gegen
  den file://-Constraint (kein ES-Modul, keine externen Requests, Ladereihenfolge,
  DOM-Kontrakt aus Architektur 5.1).

**Neuer Gesamtstand: `npm test` → 75/75 grün**, zweimal hintereinander ausgeführt, keine
Flakiness beobachtet:

```
# tests 75
# pass 75
# fail 0
```

Keine bestehenden Tests wurden verändert, keine Assertions abgeschwächt.

## 2. Story-Tabelle

Legende: ✅ erfüllt (mit Beleg) · ❌ nicht erfüllt · 🔍 nur manuell im Browser abnehmbar
(CSS/Struktur statisch geprüft, tatsächliches Rendering nicht).

| Story | Kriterium | Ergebnis | Beleg |
|---|---|---|---|
| 1 | Spruch sofort ohne Spinner sichtbar | ✅ | `dom-integration.test.js` „initApp zeigt beim Start sofort einen Spruch ohne Fade-Klasse"; kein Ladeindikator im Markup (`index.html`) |
| 1 | Ohne Scrollen vollständig lesbar (Mobile/Desktop) | 🔍 | CSS-Grundlage vorhanden und geprüft (`static-page.test.js`: `100vh`-Fallback vor `100dvh`, `max-width:680px`); tatsächliches Scrollverhalten nur im echten Browser/Gerät prüfbar |
| 1 | Bei jedem Aufruf ggf. anderer Spruch (echte Zufallsauswahl) | ✅ | `shuffle-bag.test.js` „shuffleIndices liefert eine echte Permutation"; `bootstrap()` in `assets/app.js:262` nutzt `Math.random` ohne festen Seed |
| 2 | Klick auf Button zeigt neuen Spruch ohne Reload | ✅ | `dom-integration.test.js` „Klick auf #next-button zeigt einen neuen, anderen Spruch" |
| 2 | Neuer Spruch ≠ zuletzt gezeigter | ✅ | `shuffle-bag.test.js` „createShuffleBag: über die Rundengrenze hinweg wird der letzte Wert nie sofort wiederholt, auch bei manipulierter Zufallsquelle" (erzwingt gezielt den Kollisionsfall); `dom-integration.test.js` bestätigt dasselbe end-to-end über den echten Klick-Pfad |
| 2 | Button-Label „Noch einen" | ✅ | `index.html:20`; `static-page.test.js` „Button-Beschriftungen entsprechen Story 1/2/5" |
| 3 | Kein bereits gezeigter Spruch wiederholt, bis alle gezeigt wurden | ✅ | `shuffle-bag.test.js` „createShuffleBag: 80 Aufrufe liefern alle Indizes ohne Wiederholung" |
| 3 | Nach vollem Durchlauf: neu mischen, danach Wiederholung erlaubt | ✅ | dieselbe Testfunktion, `remaining()`-Prüfung nach dem 81. Aufruf |
| 3 | „Sitzung" = Tab offen; Reload setzt zurück | ✅ | kein `localStorage`/`sessionStorage`/Cookie im Code; `static-page.test.js` „app.js verwendet weder localStorage noch sessionStorage noch document.cookie"; Zustand lebt nur in der lokalen `state`-Variable von `initApp` (`assets/app.js:227`) |
| 4 | Leertaste → nächster Spruch, kein Seiten-Scroll | ✅ | `keyboard.test.js` „true für Leertaste..."; `dom-integration.test.js` „Leertaste zeigt den nächsten Spruch..."; `event.preventDefault()` wird im Listener aufgerufen (`assets/app.js:251`), per `dom-integration.test.js` mit ArrowRight-Fall belegt (gleicher Codepfad) |
| 4 | Pfeil-rechts → nächster Spruch | ✅ | `keyboard.test.js`; `dom-integration.test.js` „Pfeil-rechts (keydown auf document) löst ebenfalls..." inkl. `preventDefault`-Nachweis |
| 4 | „N" → nächster Spruch | ✅ | `keyboard.test.js` „true für ... n und N" |
| 4 (Zusatz) | Doppelauslösung bei fokussiertem Button vermieden | ✅ | `keyboard.test.js` „false, wenn ein aktivierbares Element den Fokus hat"; **End-to-End ergänzt:** `dom-integration.test.js` „Doppelausloesungs-Schutz End-to-End" – simuliert Leertaste mit Fokus auf `#next-button`, prüft dass der `keydown`-Listener NICHTS auslöst (der reale Browser-Klick wird separat simuliert und darf dann genau einmal wirken). Der komplette Vorgang „Browser feuert bei fokussiertem Button selbst ein Klick-Event" ist ohne echten Browser nicht erzeugbar – dieser Teil bleibt 🔍 nur manuell verifizierbar (siehe Abschnitt 5) |
| 5 | Klick auf „Kopieren" kopiert Spruchtext | ✅ | `clipboard.test.js` (8 Tests, u. a. Erfolg/Fallback/Fehlerfälle); `dom-integration.test.js` „handleCopyClick zeigt 'Kopiert'..." end-to-end |
| 5 | Selbstschließende Bestätigung „Kopiert" ~2 s | ✅ | Code: `assets/app.js:171` `showSnackbar(elements, 'Kopiert', 2000)`; Mechanik (Timer setzt/löscht sich korrekt, kein Stapeln) durch `dom-integration.test.js` „showSnackbar blendet ein und schließt sich..." und „...stapelt laufende Timer nicht" mit verkürzten Timeouts nachgewiesen |
| 5 | Kein Autorenname mitkopiert | ✅ | `assets/quotes.js` enthält kein Autorenfeld; `copyText` kopiert ausschließlich `state.currentText` (reiner Spruchtext, `assets/app.js:169`) |
| 6 | 360×740 & Desktop ohne Scrollen | 🔍 | CSS-Grundlage geprüft (`static-page.test.js`: `dvh`-Fallback-Reihenfolge, `max-width:680px`, `flex`-Layout in `style.css:52-99`); reales Scrollverhalten nur im Browser/Gerät prüfbar |
| 6 | Zentriert, max. Textbreite ~680 px | ✅ | `style.css:103` `max-width: 680px`; `static-page.test.js` „CSS: max-width 680px..." |
| 6 | Große, lesbare Typografie, keine ablenkenden Elemente | ✅ (Struktur) / 🔍 (visuelle Größe) | `clamp()`-Typografie in `style.css:105`; Markup enthält ausschließlich Wortmarke, Tagline, Spruch, zwei Buttons, Footer-Hinweis (`index.html`) – keine weiteren UI-Elemente. Tatsächliche gefühlte Lesbarkeit nur am Bildschirm beurteilbar |
| 7 | Heller Verlauf #f6f9ff → #eaf3ff | ✅ | `style.css:20-21`; `static-page.test.js` „CSS: helle und dunkle Farbverlaufswerte..." |
| 7 | Dunkler Verlauf #0f172a → #1e293b bei System-Dark-Mode | ✅ | `style.css:37-38` innerhalb `@media (prefers-color-scheme: dark)`; Test wie oben |
| 7 | Wechsel des Systemthemas ohne Reload übernommen | ✅ (Mechanik) / 🔍 (visuell) | Umsetzung ausschließlich über `@media (prefers-color-scheme: dark)`, **kein** JS-Toggle, der das überschreiben könnte (`static-page.test.js` bestätigt, dass `app.js` keinerlei Theme-Logik enthält) – das ist Standard-Browserverhalten und technisch nicht anders lösbar als richtig; der tatsächliche Live-Wechsel ist nur am Gerät beobachtbar |
| 8 | Wortmarke „Aufwind" oben zentriert | ✅ | `index.html:13`; `static-page.test.js` „DOM-Kontrakt..." prüft `<h1 class="wordmark">Aufwind</h1>`; `style.css:69` `text-align:center` auf `.site-header` |
| 8 | Unterzeile ausblendbar < 360 px | ✅ (Regel vorhanden) / 🔍 (visuell) | `style.css:85-89` `@media (max-width: 359px) { .tagline { display:none; } }` |
| 8 | Durchgängige Du-Anrede | ✅ | Stichprobenprüfung aller 80 Sprüche per Skript: keine Formalanrede „Sie/Ihr/Ihnen" gefunden; 43/80 Sprüche direkt in Du-Form, Rest neutral formuliert, UI-Chrome ebenfalls ohne „Sie" |
| 9 | Alle Sprüche deutsch, selbst formuliert, keine Fremdzitate | ✅ | Alle 80 Sprüche gelesen (kein erkennbares Fremdzitat, durchgehend Deutsch); `quotes.test.js` sichert Formatregeln automatisiert ab |
| 9 | Mischung kurz/lang | ⚠️ teilweise (niedrig) | Automatisiert geprüft (`quotes.test.js`: Länge 15–180 Zeichen erlaubt); eigene Auswertung: tatsächliche Länge liegt bei **16–68 Zeichen**, kein Spruch nutzt den oberen erlaubten Bereich aus. Story-Kriterium „Mischung" ist im Kern erfüllt (3 zweisätzige, mehrere sehr kurze), aber schmaler als möglich – siehe Befundliste |
| 9 | Ton positiv, klar, ohne Kitsch/Heilsversprechen | ✅ (manuell gelesen) | Alle 80 Sprüche durchgelesen; kein Heilsversprechen, kein übertriebener Kitsch gefunden |
| 9 | Genau 80 Sprüche | ✅ | `quotes.test.js` „contains exactly 80 quotes"; unabhängig per Node-Skript nachgezählt: `QUOTES.length === 80`; keine Duplikate (eigenes Skript, case-insensitiv/getrimmt) |
| 10 | Läuft vollständig ohne Backend | ✅ | Nur statische Dateien im Repo (`index.html`, `assets/*`), kein Server-Code; lokal per `python3 -m http.server` + `curl` bestätigt (alle 4 Dateien HTTP 200) |
| 10 | Keine Cookies, kein Tracking/Analytics | ✅ | `static-page.test.js` „index.html setzt keine Cookies/Tracking-Skripte", „app.js verwendet weder localStorage noch sessionStorage..." |
| 10 | Schnell, minimale Requests | ✅ | Genau 4 Requests insgesamt (html+css+2×js), keine Web-Fonts, kein CDN (`static-page.test.js` „keine externen http(s)-Requests", „keine @font-face") |
| 11 | Erreichbar über GitHub Pages (main/root) | ❌ **kritisch** | `gh api repos/DrNightmareDev/zufalls-motivationssprueche-de` → `"has_pages": false`; `curl` auf die im README genannte Live-URL → **HTTP 404**. Zusätzlich ist das Repo `"visibility": "private"` – kostenlose GitHub Pages funktioniert für private Repos nicht (Pro/Team/Enterprise nötig) |
| 11 | Link zur Live-Seite in README/Abschlussbericht | ❌ | README enthält einen Link, der aktuell ins Leere führt (404); `ABSCHLUSSBERICHT.md` existiert im Repo noch nicht |
| 11 | Keine GitHub-Actions-Pipeline nötig | ✅ | Kein `.github/workflows`-Verzeichnis vorhanden |
| 12 | README mit allen Pflichtinhalten (Beschreibung, Doppelklick-Anleitung, Shortcuts, Kopieren-Erklärung, Erweiterungs-Hinweis, Live-Link) | ⚠️ **kritisch (Prozess) / ✅ (Inhalt, sobald committet)** | Zum letzten Commit (`383e1dd`) existierte **kein** `README.md` im Repository (`git ls-files`). Während der Prüfung tauchte lokal eine `README.md` auf (untracked, nicht gepusht) – inhaltlich deckt sie alle geforderten Punkte ab (Projektbeschreibung, Doppelklick-Schritt, Tabelle mit allen drei Tastenkürzeln, Kopieren-Erklärung inkl. `file://`-Sonderfall, Abschnitt „Sprüche ändern oder ergänzen" mit Beispielzeilen, Live-Link). Solange sie nicht committet/gepusht ist, ist Story 12 im Projektstand **nicht erfüllt** |
| 12 | README auf Deutsch, ohne Fachjargon | ✅ (mit Einschränkung) | Haupttext ist laienverständlich; ein separat abgegrenzter Abschnitt „Für Entwickler:innen" nutzt technische Begriffe (CommonJS, Namensraum) – das ist zulässig, da klar als Zusatzabschnitt gekennzeichnet und für die Kernnutzung nicht nötig |
| 15 (SOLL) | Buttons mit aussagekräftigem `aria-label` | ✅ | `index.html:20-21` `aria-label="Noch einen Spruch anzeigen"` / `aria-label="Spruch kopieren"`; `static-page.test.js` prüft beide |
| 15 (SOLL) | Kontrast Text/Hintergrund ≥ WCAG AA (hell & dunkel) | ✅ | Unabhängig **nachgerechnet** (eigenes Python-Skript, WCAG-Relativluminanz-Formel, nicht nur den Kommentaren in `style.css` vertraut): hell `text`/`muted` auf `bg-from`/`bg-to` 13.07–13.87:1 bzw. 6.77–7.19:1; dunkel 13.35–16.30:1 bzw. 9.85–12.02:1 (alle ≫ 4.5:1). UI-Kontraste (`border`, `focus`) 4.25–9.90:1 (≫ 3:1 Vorgabe für Fließtext-Randelemente) |

## 3. Nur manuell im Browser abnehmbar (nicht automatisierbar in dieser Umgebung)

Diese Umgebung hat keinen Browser. Folgende Punkte sind **statisch/strukturell geprüft**
(siehe Tabelle), aber das tatsächliche Verhalten muss noch manuell abgenommen werden:

1. Tatsächliches Rendering auf 360×740 und Desktop – kein Scrollen, nichts abgeschnitten.
2. Ein-/Ausfahren der mobilen Adressleiste (`dvh`-Verhalten in der Praxis).
3. Optischer Wechsel hell/dunkel bei laufender Seite (Systemthema umschalten).
4. `prefers-reduced-motion` in der Praxis (Animation tatsächlich deaktiviert).
5. Die vollständige Doppelauslösungs-Kette im echten Browser: Tab zu „Kopieren", Leertaste
   drücken → Browser aktiviert den Button selbst (eigener Klick) und der Spruch bleibt stehen.
   Der Code-Teil „unser Listener greift dabei nicht ein" ist automatisiert bewiesen
   (`dom-integration.test.js`); dass der Browser wirklich nur *einen* Klick auslöst, ist
   Browser-Standardverhalten und in Node nicht simulierbar.
6. Zwischenablage-Inhalt nach echtem Einfügen in einen Editor (exakter Text, kein Autor).
7. Screenreader-Stichprobe (NVDA/VoiceOver).
8. Doppelklick-Test unter `file://` in Chrome/Firefox/Safari (der wichtigste Test laut
   Architektur 10.2, Punkt 1) – hier ersetzt durch Syntax-Check + statische Analyse.

## 4. Geschriebene Tests (Lückenschluss)

| Datei | Zweck | Zuvor ungetestet? |
|---|---|---|
| `test/dom-integration.test.js` | `queryElements` gegen den echten DOM-Kontrakt (alle 4 Pflicht-IDs, inkl. Fehlerfall pro fehlender ID einzeln); `initApp`-Verdrahtung (Klick, Tastatur) mit einem selbstgebauten Fake-DOM (bewusst kein jsdom, siehe Architektur 10); Doppelauslösungs-Schutz End-to-End; `showSnackbar`-Timer (Selbstschließen, kein Stapeln); `handleCopyClick` End-to-End inkl. Patch der echten globalen `navigator`/`document` | Ja – Architektur stufte diese Funktionen explizit als „nicht unit-getestet" ein (Abschnitt 5.2); das ist eine Lücke, kein Fehler der Architektur, aber die Kriterien sind sehr wohl ohne echten Browser testbar |
| `test/static-page.test.js` | `index.html`/`style.css` gegen file://-Constraints (kein `type=module`, keine `import`/`export`, relative Pfade, Ladereihenfolge quotes→app, kein `defer`/`async`), keine externen Requests (kein `@import`, kein `@font-face`, keine `http(s)://`-Links), vollständiger DOM-Kontrakt aus Architektur 5.1, Pflicht-`<head>`-Angaben, Dark-Mode-/Layout-CSS-Regeln vorhanden | Ja – diese Kriterien standen in der Architektur, wurden aber nirgends automatisiert geprüft |

Alle bestehenden Tests wurden unverändert gelassen. `npm test` läuft weiterhin ausschließlich
über `node --test`, keine neue Abhängigkeit wurde hinzugefügt.

## 5. Nutzersicht: Kann ein Laie es starten und benutzen, ohne Code zu lesen?

**Zum Stand des letzten Commits: Nein.** Es gab kein `README.md`. Ein nicht-technischer
Auftraggeber hätte weder gewusst, dass ein Doppelklick auf `index.html` reicht, noch die
Tastenkürzel oder die Live-Adresse gekannt.

**Mit der (noch nicht committeten) README-Datei, die während der Prüfung auftauchte:** Ja,
inhaltlich gut – klare Doppelklick-Anleitung, verständliche Tabelle der Bedienung, ehrliche
Erklärung des Kopieren-Sonderfalls unter `file://`, nachvollziehbare Anleitung zum Ergänzen
von Sprüchen ohne Programmierkenntnisse. Der im README beworbene Live-Link funktioniert
aktuell nicht (siehe Story 11).

Die Doppelklick-Variante selbst (lokal öffnen) ist die einzige Variante, die ein Laie *heute*
tatsächlich nutzen kann, da die Live-Seite nicht erreichbar ist.

## 6. Befundliste (priorisiert)

### Kritisch
1. **Story 11 nicht erfüllt: GitHub Pages ist nicht aktiv.** `has_pages: false` (GitHub-API),
   Live-URL liefert HTTP 404. Das Repository ist zudem `private` – kostenlose GitHub Pages
   funktioniert für private Repos nicht. Der Auftraggeber kann die Seite nicht wie gefordert
   direkt teilen.
2. **Story 12 zum aktuellen Repo-Stand nicht erfüllt: kein committetes README.** Der letzte
   Commit (`383e1dd`) enthält kein `README.md`. Die während der Prüfung aufgetauchte Datei
   ist nicht getrackt/committet/gepusht. Ohne Commit ist sie für niemanden sichtbar, der das
   Repository klont oder die GitHub-Seite ansieht.
3. **Toter Live-Link im README.** Der im (noch unfertigen) README beworbene Link
   `https://drnightmaredev.github.io/zufalls-motivationssprueche-de/` liefert HTTP 404 –
   direkte Folge von Befund 1, verstärkt aber den Eindruck eines unfertigen Produkts, sobald
   das README committet wird.

### Hoch
4. **`ABSCHLUSSBERICHT.md` fehlt im Repository**, obwohl laut `CLAUDE.md`-Arbeitsordnung
   Pflichtbestandteil vor Projektabschluss. Kein Story-Akzeptanzkriterium, aber Teil der
   verbindlichen Definition of Done und Teil der Nutzersicht/Auftraggeber-Kommunikation.

### Mittel
5. **Shift+N wird nicht als „N"-Taste erkannt**, obwohl Leertaste und Pfeil-rechts auch mit
   gedrückter Umschalttaste funktionieren (`assets/app.js:89`:
   `isN = ... && !event.shiftKey`). Story 4 verlangt nur „N drücken" ohne Einschränkung bei
   Shift; das Verhalten ist inkonsistent zu den anderen beiden Tasten und für Nutzer schwer
   nachvollziehbar (z. B. Caps-Lock aus, versehentlich Shift gehalten).
6. **`handleCopyClick` reicht das an `initApp` übergebene `doc`/`options` nicht an `copyText`
   weiter**, sondern verlässt sich auf die echten globalen `navigator`/`document`
   (`assets/app.js:168-169`). Im Ein-Fenster-Browser-Kontext harmlos, macht die Funktion aber
   unnötig schwer isoliert testbar (siehe Workaround mit `Object.defineProperty(global, ...)`
   in `dom-integration.test.js`) und wäre in einem Mehr-Dokument-Kontext (z. B. iframe) ein
   Bug. Kein Story-Verstoß, aber ein Wartbarkeits-/Architektur-Hinweis für den Entwickler.
7. **Sprüche-Längen-Mischung schöpft den erlaubten Rahmen nicht aus.** Story 9 verlangt eine
   „Mischung aus sehr kurzen und ein- bis zweisätzigen längeren Sprüchen"; real liegen alle 80
   Sprüche zwischen 16 und 68 Zeichen (erlaubt wären bis 180). Nur 3 Sprüche haben zwei Sätze.
   Kriterium ist im Kern erfüllt, aber die Varianz ist geringer als möglich.

### Niedrig / kosmetisch
8. `.claude-run.log` und `.claude-stream.jsonl` liegen im Projektordner (nicht von Git
   getrackt, `.gitignore` deckt sie ab) – kein Repo-Fund, nur als Beobachtung der
   Arbeitsumgebung vermerkt.
9. Der README-Abschnitt „Für Entwickler:innen" verwendet Fachbegriffe (CommonJS,
   Namensraum). Das ist bewusst als separater, abgegrenzter Abschnitt für Nachfolgeprojekte
   gedacht und verletzt die Laienverständlichkeit der Kernanleitung nicht – nur der
   Vollständigkeit halber erwähnt.
10. Theoretischer Doppelfehlerfall in `legacyCopy`: Wirft sowohl `execCommand` als auch das
    anschließende `doc.body.removeChild(area)` im `finally`-Block, würde der zweite Fehler den
    ersten überschreiben und aus `copyText` herauspropagieren (`copyText` würde entgegen der
    Doku doch einmal werfen). In allen Zielbrowsern praktisch nicht auslösbar
    (`removeChild` eines zuvor selbst erfolgreich angehängten Elements schlägt nicht fehl);
    rein informativ, kein Testfall sinnvoll nachstellbar ohne künstliche Fakes, die den echten
    Code nicht mehr abbilden.

## 7. Fazit

Die Kernlogik (Shuffle-Bag, Tastatursteuerung, Kopieren-Fallback-Kette, Sprüche-Datenqualität)
ist gründlich getestet und hält, was die Architektur verspricht – inklusive der explizit als
„kritisch" markierten Fälle (Rundenübergang ohne Dublette, Doppelauslösungs-Schutz auf
Funktionsebene, `textarea`-Aufräumen in jedem Fehlerpfad). Die **Auslieferung** ist jedoch
nicht abnahmefähig: Die Seite ist nicht öffentlich erreichbar (Story 11) und zum
Prüfzeitpunkt gab es keine laienverständliche Anleitung im Repository (Story 12). Beides sind
für einen nicht-technischen Auftraggeber die Kriterien, die am unmittelbarsten sichtbar
wären.
