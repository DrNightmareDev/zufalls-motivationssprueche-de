# User Stories: Aufwind – Zufalls-Motivationssprüche (DE)

Grundlage: `AUFTRAG.md` sowie die PM-Entscheidungen 1–4 aus `auftrag_lesen` (chronologisch,
spätere Einträge sind neuer). Widersprüche zwischen den Quellen sind am Ende aufgelöst
(siehe „Offene Punkte / Widersprüche“).

Priorisierung nach MoSCoW: **MUSS** (Must) / **SOLL** (Should) / **KANN** (Could) /
**WIRD NICHT** (Won't).

---

## MUSS

### 1. Spruch sofort beim Laden anzeigen
Als Nutzer:in möchte ich beim Öffnen der Seite sofort einen zufälligen deutschen
Motivationsspruch sehen, damit ich ohne Wartezeit einen Motivations-Kick bekomme.

- Given ich öffne die Seite (Desktop oder Handy), when die Seite geladen ist, then wird
  ohne spürbare Verzögerung (kein Spinner/Ladeindikator nötig) ein zufälliger Spruch
  zentriert angezeigt.
- Der Spruch ist ohne Scrollen vollständig lesbar, auf Mobile wie auf Desktop.
- Bei jedem frischen Seitenaufruf kann ein anderer Spruch erscheinen (echte Zufallsauswahl).

### 2. Nächsten Spruch per Button anzeigen
Als Nutzer:in möchte ich per Klick auf einen Button einen weiteren Spruch sehen, damit ich
ohne Neuladen der Seite weiter Motivation bekomme.

- Given ein Spruch wird angezeigt, when ich auf den primären Button klicke, then erscheint
  ohne Seiten-Reload ein neuer Spruch.
- Der neu angezeigte Spruch unterscheidet sich vom zuletzt gezeigten, sofern mehr als ein
  Spruch im Vorrat ist.
- Beschriftung des Buttons: **„Noch einen“** (entschieden, Punkt 1).

### 3. Keine Wiederholung innerhalb einer Sitzung
Als Nutzer:in möchte ich, dass mir innerhalb einer Sitzung kein Spruch doppelt gezeigt wird,
damit die Nutzung abwechslungsreich bleibt.

- Given ich klicke mehrfach auf „nächster Spruch“, when noch nicht alle Sprüche aus dem
  Vorrat gezeigt wurden, then wird kein bereits gezeigter Spruch wiederholt.
- Sobald alle Sprüche einmal gezeigt wurden, wird der Vorrat neu gemischt; danach dürfen
  Sprüche wieder erscheinen.
- „Eine Sitzung“ = solange der Tab geöffnet ist; ein Reload setzt den Vorrat zurück
  (entschieden, Punkt 7).

### 4. Bedienung per Tastatur
Als Nutzer:in möchte ich per Tastatur zum nächsten Spruch springen können, damit ich die
Seite auch ohne Maus/Touch nutzen kann.

- Given die Seite hat den Fokus, when ich die Leertaste drücke, then wird der nächste
  Spruch angezeigt und die Seite scrollt dabei nicht.
- Given die Seite hat den Fokus, when ich die Pfeil-rechts-Taste (→) drücke, then wird
  ebenfalls der nächste Spruch angezeigt.
- Given die Seite hat den Fokus, when ich „N“ drücke, then wird ebenfalls der nächste
  Spruch angezeigt (entschieden, Punkt 3 — ersetzt die frühere SOLL-Story 14).

### 5. Spruch in die Zwischenablage kopieren
Als Nutzer:in möchte ich den aktuell angezeigten Spruch kopieren können, damit ich ihn z. B.
in einer Nachricht weiterschicken kann.

- Given ein Spruch wird angezeigt, when ich auf den Button „Kopieren“ klicke, then wird der
  Spruchtext in die Zwischenablage kopiert.
- Nach dem Kopieren erscheint eine kurze, sich selbst schließende Bestätigung
  (Snackbar „Kopiert“, ca. 2 Sekunden sichtbar).
- Es wird kein Autorenname mitkopiert (entschieden, Punkt 4).

### 6. Responsives, ruhiges Layout
Als Nutzer:in möchte ich die Seite auf Handy und Desktop ohne Scrollen komfortabel nutzen
können, damit die App überall gut funktioniert.

- Auf gängigen Mobil-Viewports (z. B. 360×740) und Desktop-Auflösungen sind Spruch und
  Buttons ohne Scrollen vollständig sichtbar.
- Der Inhalt ist zentriert, die maximale Textbreite liegt bei ca. 680 px.
- Die Typografie ist groß und gut lesbar; keine ablenkenden Elemente außer Wortmarke,
  Spruch und den zwei Buttons.

### 7. Dezenter Farbverlauf mit Auto-Dark-Mode
Als Nutzer:in möchte ich, dass sich die Optik automatisch an mein Systemthema anpasst,
damit die App zu jeder Tageszeit angenehm wirkt.

- Given das System/der Browser steht auf „hell“, then zeigt die Seite einen dezenten hellen
  Farbverlauf (#f6f9ff → #eaf3ff).
- Given das System/der Browser steht auf „dunkel“, then zeigt die Seite einen dezenten
  dunklen Farbverlauf (#0f172a → #1e293b).
- Ein Wechsel des Systemthemas während die Seite geöffnet ist, wird ohne Neuladen
  übernommen.

### 8. Branding „Aufwind“
Als Nutzer:in möchte ich den Namen der App erkennen, damit sie einen Wiedererkennungswert
hat.

- Oben zentriert erscheint die schlichte Wortmarke „Aufwind“.
- Darunter kann die Unterzeile „Ein Spruch für jetzt.“ stehen; auf sehr kleinen Screens
  (unterhalb einer sinnvollen Breite, z. B. < 360 px) darf sie ausgeblendet werden.
- Die gesamte UI verwendet durchgängig die Du-Anrede.

### 9. Kuratierte, unbedenkliche Sprüche-Liste
Als Nutzer:in möchte ich ausschließlich unbedenkliche deutsche Motivationssprüche lesen,
damit weder Urheberrechtsprobleme entstehen noch der Ton unpassend wirkt.

- Alle Sprüche sind deutschsprachig und ausschließlich selbst formuliert; keine Fremdzitate
  (entschieden, Punkt 6).
- Die Liste enthält eine Mischung aus sehr kurzen Sätzen und ein- bis zweisätzigen längeren
  Sprüchen.
- Ton: positiv, klar, ohne Kitsch und ohne Heilsversprechen.
- Anzahl der Sprüche zum Start: **80** (entschieden, Punkt 2).

### 10. Statische Seite ohne Server, ohne Tracking
Als Betreiber möchte ich, dass die Seite als reine statische Web-Seite läuft, damit Hosting
einfach, kostenlos und datenschutzfreundlich ist.

- Die Seite funktioniert vollständig ohne Backend/Server, nur mit statischen Dateien.
- Es werden keine Cookies gesetzt und keine Tracking-/Analytics-Skripte eingebunden.
- Die Seite lädt schnell (kein unnötig großes Framework, minimale Anzahl Requests).

### 11. Veröffentlichung über GitHub Pages
Als Auftraggeber möchte ich, dass die Seite unter einer öffentlichen Adresse erreichbar ist,
damit ich sie direkt teilen kann.

- Die Seite ist über GitHub Pages erreichbar (Quelle: `main`-Branch, Wurzelverzeichnis).
- Der Link zur Live-Seite steht im README und im Abschlussbericht.
- Für das Deployment ist keine GitHub-Actions-Pipeline notwendig.

### 12. README für Laien
Als nicht-technischer Auftraggeber möchte ich eine verständliche Anleitung, damit ich die
Seite lokal öffnen kann und weiß, wie sie gepflegt wird.

- Das README enthält: kurze Projektbeschreibung, Anleitung zum lokalen Öffnen
  (z. B. Doppelklick auf `index.html`), die Liste der Tastatur-Shortcuts, eine Erklärung des
  Kopieren-Buttons, einen Hinweis, wo/wie die Sprüche-Liste erweitert wird, sowie den Link
  zur Live-Demo.
- Die Sprache im README ist Deutsch und verzichtet auf Fachjargon.

---

## SOLL

### 13. Sprüche-Liste leicht erweiterbar
Als Auftraggeber möchte ich später einfach weitere Sprüche hinzufügen können, damit die App
mit der Zeit wachsen kann.

- Die Sprüche liegen an einer zentralen, klar erkennbaren Stelle im Projekt.
- Das README erklärt in einfachen Worten, wie ein neuer Spruch ergänzt wird (ohne dass
  Programmierkenntnisse nötig sind).

### 14. ~~Zusätzliche Tastenbelegung „N“~~ → nach MUSS verschoben
Per PM-Entscheidung (Punkt 3) ist „N“ verbindlich und damit Teil von Story 4.

### 15. Grundlegende Barrierefreiheit
Als Nutzer:in mit Screenreader oder Sehbeeinträchtigung möchte ich die App gut nutzen
können.

- Buttons besitzen aussagekräftige Labels (z. B. `aria-label`).
- Der Farbkontrast von Text zu Hintergrund erreicht in hell und dunkel mindestens
  WCAG-AA-Niveau für Fließtext.

---

## KANN

### 16. Sanfter Übergang beim Spruchwechsel
Als Nutzer:in möchte ich einen dezenten Übergang (z. B. leichtes Ein-/Ausblenden) beim
Wechsel des Spruchs sehen, damit die App hochwertiger wirkt.

- Der Wechsel wirkt weich, dauert aber nicht länger als ca. 300 ms, damit die Bedienung
  weiterhin sofort reagiert.

### 17. ~~Erweiterung auf ca. 80 Sprüche~~ → nach MUSS verschoben
Per PM-Entscheidung (Punkt 2) sind 80 Sprüche schon im MVP verbindlich, siehe Story 9.

---

## WIRD NICHT (Won't, laut Auftrag ausdrücklich ausgeschlossen)

- Benutzerkonten/Login.
- Favoriten speichern.
- Kategorien oder Filter für Sprüche.
- Tägliche Erinnerungen/Push-Benachrichtigungen.
- Tracking/Analytics, Cookies.
- Kostenpflichtige Dienste ohne gesonderte PM-Freigabe.
- Autor:innen-Nennung im UI (entschieden, Punkt 4).

---

## Minimum, das vorzeigbar ist (MVP-Schnitt)

Das MVP umfasst genau die MUSS-Stories 1–12:

- Zufälliger Spruch beim Laden, „nächster Spruch“-Button, Wiederholungsschutz pro Sitzung.
- Tastatursteuerung (Leertaste, Pfeil-rechts, N).
- Kopieren-Button mit Bestätigung.
- Responsives, ruhiges Layout mit Auto-Dark-Mode und Farbverlauf.
- Branding „Aufwind“ mit optionaler Unterzeile.
- 80 unbedenkliche, selbst formulierte deutsche Sprüche.
- Statische Auslieferung ohne Tracking, live über GitHub Pages.
- Laienverständliches README.

Alles unter „SOLL“ und „KANN“ ist optionaler Ausbau nach dem ersten vorzeigbaren Stand.

---

## Entschiedene Punkte (ehemalige Widersprüche)

**Status: geklärt.** Die Punkte 1–5 wurden am 09.09.2026 per Rückfrage vom PM verbindlich
entschieden (siehe „PM-Entscheidung“ beim jeweiligen Punkt). Die Punkte 6 und 7 hat der
Chefentwickler entschieden (Content-Risiko bzw. rein technische Frage). Für die Umsetzung
gilt ausschließlich die jeweils fett markierte Entscheidung.

**1. Beschriftung des primären Buttons**
Quellen: „Nächster Spruch“ (Auftrag, PM-Entscheidung 1 und 3) vs. „Noch einen“
(PM-Entscheidung 4, die zeitlich neueste und ausdrücklichste Nennung als Button-Label).
→ **PM-Entscheidung: Button heißt „Noch einen“.** Der Kopieren-Button bleibt separat mit
der Beschriftung „Kopieren“ direkt daneben.

**2. Anzahl der Sprüche zum Start**
Quellen: Auftrag „ca. 60–100“, PM-Entscheidung 1 „80–100“, PM-Entscheidung 3 „Zielumfang
ca. 80“, PM-Entscheidung 4 „Start mit ca. 50 (leicht erweiterbar)“.
→ **PM-Entscheidung: 80 Sprüche zum Start** (absolutes Minimum 50, falls zeitkritisch).
Die Liste bleibt leicht erweiterbar. Story 17 entfällt damit, sie ist Teil des MVP.

**3. Tastenbelegung für „nächster Spruch“**
Quellen: Auftrag und PM-Entscheidung 3 nennen Leertaste **und** Pfeil-rechts (→);
PM-Entscheidung 4 nennt „N oder Leertaste“ (ohne Pfeil-rechts, dafür mit „N“).
→ **PM-Entscheidung: Leertaste, Pfeil-rechts und „N“** lösen alle denselben „nächster
Spruch“-Effekt aus. Das Standard-Scrollen der Leertaste muss unterdrückt werden. Alle drei
Tasten sind im README zu dokumentieren. Story 14 ist damit MUSS statt SOLL.

**4. Autor:innen-Attribution**
Quellen: Auftrag erwähnt „(und ggf. Autor)“ beim Kopieren; PM-Entscheidung 1 will eine
„gemischte“ Liste mit und ohne Attribution; PM-Entscheidung 3 sagt ausdrücklich
„Autor:innen-Nennung weglassen“; PM-Entscheidung 4 erlaubt zusätzlich gemeinfreie Sprüche,
äußert sich aber nicht zur Anzeige eines Autorennamens.
→ **PM-Entscheidung: Keine Autor:innenzeile im UI**, der Kopieren-Button kopiert
ausschließlich den Spruchtext. Das Datenmodell braucht kein Autorenfeld.

**5. „Freundlich-hell“ vs. Auto-Dark-Mode**
Quellen: PM-Entscheidung 4 beschreibt die UI als „freundlich-hell“; Auftrag,
PM-Entscheidung 1 und 3 fordern übereinstimmend und mehrfach einen automatischen
Dark-Mode nach Systemeinstellung, PM-Entscheidung 3 liefert sogar konkrete Hex-Farbwerte
für beide Modi.
→ **PM-Entscheidung: Auto-Dark-Mode mit den vorgegebenen Farbverläufen.** Hell ist der
Standard (#f6f9ff → #eaf3ff), dunkel greift nur bei System-Dark-Mode (#0f172a → #1e293b).
Max. Textbreite ~680 px, zentriert, sehr gut lesbar.

**6. Umfang der Content-Policy (nur selbst formuliert vs. auch gemeinfrei)**
Quellen: PM-Entscheidung 3 fordert „ausschließlich eigene, selbst formulierte“ Sprüche;
PM-Entscheidung 4 erlaubt zusätzlich „gemeinfreie“ deutsche Sprüche.
→ **Entscheidung Chefentwickler: ausschließlich selbst formulierte Sprüche.** Das ist die
konservativste Auslegung und von beiden Quellen gedeckt: PM-Entscheidung 4 *erlaubt*
gemeinfreie Sprüche, verlangt sie aber nicht. Da die Gemeinfreiheit eines Fremdzitats ohne
juristische Prüfung nie sicher belegbar ist, entfällt damit jedes Urheberrechtsrisiko.

**7. Bedeutung von „Sitzung“ beim Wiederholungsschutz**
Keine Quelle definiert genau, ob mit „Sitzung“ nur die Zeit gemeint ist, in der der Tab
geöffnet bleibt, oder ob der Fortschritt auch über einen Seiten-Reload/mehrere Tabs hinweg
erhalten bleiben soll.
→ **Entscheidung Chefentwickler: „Sitzung“ = solange der Tab/die Seite geöffnet ist.** Ein
Neuladen setzt den Spruch-Vorrat zurück und mischt neu. Rein technische Frage; die
In-Memory-Lösung kommt zudem ohne Cookies und ohne Speicherzugriff aus (Story 10).
