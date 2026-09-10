# Aufwind – Ein Spruch für jetzt.

**Live-Demo: https://drnightmaredev.github.io/zufalls-motivationssprueche-de/**

Aufwind zeigt dir bei jedem Öffnen einen zufälligen deutschen Motivationsspruch – ruhig,
ohne Ablenkung, ohne Wartezeit. Ein Klick oder Tastendruck bringt den nächsten. Mehr macht
die Seite bewusst nicht.

Es gibt keine Anmeldung, keine Cookies, kein Tracking und keine Werbung. Die Seite lädt
keine Daten von fremden Servern und schickt nichts an irgendjemanden.

---

## So benutzt du es

### Im Internet

Öffne https://drnightmaredev.github.io/zufalls-motivationssprueche-de/ – fertig. Funktioniert
am Handy genauso wie am Computer.

### Auf deinem eigenen Rechner

Du brauchst weder Internet noch ein Programm zu installieren:

1. Lade dieses Projekt herunter (auf GitHub oben rechts der grüne Knopf **Code** →
   **Download ZIP**) und entpacke es.
2. **Doppelklick auf die Datei `index.html`.**

Die Seite öffnet sich in deinem Browser und funktioniert sofort.

---

## Bedienung

| Was du willst | Was du tust |
|---|---|
| Nächster Spruch | Auf **„Noch einen"** klicken |
| Nächster Spruch, ohne Maus | **Leertaste**, **Pfeil-rechts (→)** oder **N** drücken |
| Spruch kopieren | Auf **„Kopieren"** klicken – unten erscheint kurz „Kopiert" |

Der kopierte Spruch liegt danach in deiner Zwischenablage und lässt sich überall mit
`Strg+V` (Mac: `Cmd+V`) einfügen, etwa in eine Nachricht.

Jeder Spruch kommt genau einmal dran, bevor sich einer wiederholt. Sind alle 80 durch,
werden sie neu gemischt – und der erste neue Spruch ist nie derselbe wie der letzte davor.

**Hinweis zum Kopieren beim lokalen Öffnen:** Wenn du die Seite per Doppelklick öffnest
(statt über die Internet-Adresse), sperren manche Browser aus Sicherheitsgründen den Zugriff
auf die Zwischenablage. Die Seite versucht dann automatisch einen zweiten Weg. Klappt auch
der nicht, sagt sie dir das ehrlich, statt fälschlich „Kopiert" zu melden – dann kannst du
den Spruch mit der Maus markieren und `Strg+C` drücken.

---

## Sprüche ändern oder ergänzen

Alle Sprüche stehen in **einer einzigen Datei**: `assets/quotes.js`.
Du brauchst dafür keine Programmierkenntnisse, ein einfacher Texteditor genügt.

Öffne die Datei. Nach den ersten Zeilen kommt eine lange Liste, die so aussieht:

```js
    'Du schaffst das.',
    'Fang klein an. Fang jetzt an.',
    'Ein Schritt reicht für heute.',
```

**Einen Spruch hinzufügen:** Kopiere eine dieser Zeilen, füge sie darunter ein und ersetze
den Text zwischen den Anführungszeichen. Achte auf zwei Dinge:

- Die einfachen Anführungszeichen `'` am Anfang und Ende müssen stehen bleiben.
- Das **Komma am Zeilenende** darf nicht fehlen.

**Einen Spruch löschen:** Die ganze Zeile entfernen.

**Wichtig – Apostroph:** Wenn im Spruch ein Apostroph vorkommt, benutze das typografische
Zeichen `’` (z. B. „geht’s"), nicht das gerade `'`. Sonst denkt der Browser, der Satz sei
zu Ende, und die Seite bleibt leer.

Speichern, Seite im Browser neu laden – der neue Spruch ist dabei.

> Wenn du die Anzahl der Sprüche änderst, schlägt der automatische Test an, der auf genau 80
> Sprüche prüft (`test/quotes.test.js`). Das ist kein Fehler in deinem Text, sondern nur eine
> Sicherung. Wer die Tests nutzt, passt dort die Zahl an.

---

## Für Entwickler:innen

### Aufbau

```
index.html          Die Seite selbst
assets/quotes.js    Die 80 Sprüche (Pflege-Datei)
assets/app.js       Logik: Mischen, Anzeigen, Tastatur, Kopieren
assets/style.css    Gestaltung, Farbverlauf, Dunkelmodus
test/               Automatische Tests
docs/               Stories, Architektur, QA-Bericht
```

Bewusst ohne Framework, ohne Bundler, ohne Build-Schritt: reines HTML, CSS und JavaScript.
Deshalb läuft die Seite sowohl über `file://` (Doppelklick) als auch über jeden Webserver.
Aus demselben Grund werden **keine ES-Module** verwendet – Browser blockieren die bei
`file://`. Stattdessen liegt alles unter dem Namensraum `window.Aufwind` und ist über einen
CommonJS-Fuß zusätzlich in Node testbar.

Details und Begründungen: [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md).

### Tests

```bash
npm test
```

Nutzt den in Node eingebauten Test-Runner (`node --test`), Node 18 oder neuer.
**Es gibt keine einzige Abhängigkeit** – kein `npm install` nötig, kein `node_modules`.

### Veröffentlichen

Die Seite liegt auf GitHub Pages, Quelle: Branch `main`, Ordner `/` (root).
Ein `git push` auf `main` genügt – nach etwa einer Minute ist die Änderung live.
Es gibt keine Build-Pipeline und keine GitHub Action; die Dateien werden direkt ausgeliefert.
Die leere Datei `.nojekyll` verhindert, dass GitHub die Dateien vorher durch Jekyll schickt.

---

## Datenschutz

Die Seite speichert nichts und sendet nichts. Kein Analytics, keine Cookies, kein
`localStorage`, keine Schriftarten von fremden Servern, keine externen Aufrufe. Welcher
Spruch gerade dran ist, steht nur im Arbeitsspeicher des Browser-Tabs und ist beim Neuladen
weg.

## Inhalte

Alle Sprüche sind eigens für dieses Projekt formuliert. Es werden bewusst keine fremden
Zitate verwendet, damit keine Urheberrechte berührt werden – deshalb steht auch bei keinem
Spruch ein Autorenname.
