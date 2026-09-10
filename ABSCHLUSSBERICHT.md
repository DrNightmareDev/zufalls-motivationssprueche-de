# Abschlussbericht: Aufwind – Zufalls-Motivationssprüche

**Live-Demo: https://drnightmaredev.github.io/zufalls-motivationssprueche-de/**
Repository: https://github.com/DrNightmareDev/zufalls-motivationssprueche-de

## Was wurde gebaut

„Aufwind" ist eine kleine Web-Seite, die beim Öffnen sofort einen zufälligen deutschen
Motivationsspruch anzeigt. Ein Klick auf „Noch einen" oder ein Druck auf Leertaste,
Pfeil-rechts oder N bringt den nächsten; ein zweiter Knopf legt den Spruch in die
Zwischenablage und bestätigt das kurz. Alle 80 Sprüche kommen genau einmal an die Reihe,
bevor sich einer wiederholt – danach wird neu gemischt, wobei nie derselbe Spruch zweimal
hintereinander erscheint. Die Seite passt sich automatisch an Handy und Computer an und
schaltet in den Dunkelmodus, wenn das Gerät auf dunkel steht.

Es ist eine reine statische Seite: kein Server, keine Anmeldung, keine Cookies, kein
Tracking, keine Werbung, keine Inhalte von fremden Servern. Sie lädt in Sekundenbruchteilen
und funktioniert auch ohne Internet, wenn man die Dateien lokal hat.

## So startet man es

**Im Internet:** https://drnightmaredev.github.io/zufalls-motivationssprueche-de/ öffnen –
mehr ist nicht nötig, am Handy wie am Computer.

**Auf dem eigenen Rechner (ohne Internet):**
1. Auf der Repo-Seite oben rechts auf den grünen Knopf **Code** → **Download ZIP** klicken.
2. Die heruntergeladene Datei entpacken.
3. **Doppelklick auf `index.html`** – die Seite öffnet sich im Browser und läuft sofort.

**Einen Spruch ergänzen oder ändern:** Alle Sprüche stehen in der einen Datei
`assets/quotes.js`. Eine Zeile kopieren, den Text zwischen den Anführungszeichen ersetzen,
Komma am Zeilenende stehen lassen, speichern. Die ausführliche Anleitung mit Beispiel steht
im README. Wer die Änderung auch im Internet sehen will, lädt die Datei auf GitHub hoch –
etwa eine Minute später ist sie live.

## Was es kann / noch nicht kann

**Kann:**
- Zufälliger Spruch sofort beim Laden, ohne Ladezeit und ohne Wartebalken.
- Nächster Spruch per Knopf oder per Leertaste, Pfeil-rechts oder N. Die Leertaste scrollt
  dabei nicht die Seite weg.
- Jeder Spruch einmal pro Runde, danach neu gemischt und nie eine direkte Wiederholung.
- Kopieren in die Zwischenablage mit kurzer Bestätigung „Kopiert".
- Ruhige Optik mit dezentem Farbverlauf, automatischer Dunkelmodus nach Systemeinstellung,
  große Schrift, mittig, ohne Scrollen nutzbar auf Handy und Computer.
- Barrierefreiheit: Screenreader kündigen den neuen Spruch an, alle Farbkontraste liegen
  über dem Standard WCAG AA (nachgerechnet, nicht geschätzt).
- Läuft ohne Internet per Doppelklick genauso wie im Netz.

**Kann (noch) nicht – bewusst so entschieden, laut Auftrag ausgeschlossen:**
- Keine Benutzerkonten, keine Favoriten, keine Kategorien oder Filter, keine täglichen
  Erinnerungen, keine Statistik.
- Kein Teilen-Knopf für soziale Netzwerke und keine Adresse für einen einzelnen Spruch
  (jeder Aufruf zeigt einen neuen Zufallsspruch).
- Der Fortschritt geht beim Neuladen verloren: Nach einem Reload beginnt eine neue Runde.
  Das ist Absicht, denn Speichern hätte einen Cookie oder Browser-Speicher erfordert.

**Ehrlicher Hinweis zum Kopieren:** Öffnet man die Seite per Doppelklick statt über die
Internet-Adresse, sperren manche Browser den Zugriff auf die Zwischenablage. Die Seite
versucht dann automatisch einen zweiten Weg; klappt auch der nicht, sagt sie das offen,
statt fälschlich Erfolg zu melden. Über die Live-Adresse funktioniert das Kopieren normal.

## Getroffene Annahmen

1. **Widersprüchliche Vorgaben** – In den Vorgaben gab es vier Konflikte (Knopfbeschriftung,
   Anzahl der Sprüche, Tastenbelegung, hell gegen Dunkelmodus). Alle wurden vor der
   Umsetzung per Rückfrage geklärt und entschieden: „Noch einen", 80 Sprüche, alle drei
   Tasten, automatischer Dunkelmodus mit hell als Standard. Nichts davon wurde geraten.
2. **Nur eigene Sprüche** – Eine Vorgabe erlaubte auch gemeinfreie Sprüche, eine andere
   verlangte ausschließlich selbst formulierte. Entschieden wurde die vorsichtigere Variante:
   alle 80 Sprüche sind eigens formuliert. Ob ein fremdes Zitat wirklich gemeinfrei ist,
   lässt sich ohne juristische Prüfung nie sicher sagen – so entfällt jedes Risiko. Deshalb
   steht bei keinem Spruch ein Autorenname.
3. **„Pro Sitzung" bedeutet „solange der Tab offen ist"** – Ein Neuladen startet eine neue
   Runde. Alles andere hätte Browser-Speicher gebraucht, was dem Wunsch „keine Cookies,
   keine Speicherung" widersprochen hätte.
4. **Verzicht auf eine zusätzliche Sicherheitsregel (CSP)** – Das Sicherheitsreview empfahl
   eine vorsorgliche Schutzregel im Seitenkopf. Sie hätte allerdings das Öffnen per
   Doppelklick zerstören können, und ohne Browser ließ sich das hier nicht gegenprüfen. Da
   das lokale Öffnen ein festes Abnahmekriterium ist und das Review sonst keinerlei Mängel
   fand, wurde bewusst darauf verzichtet. Die Begründung steht als Kommentar in `index.html`,
   die Regel ist jederzeit nachrüstbar.
5. **Öffentliches Repository statt kostenpflichtigem Plan** – GitHub Pages liefert private
   Repositories nur in einem Bezahltarif aus. Nach Freigabe wurde das Repository öffentlich
   gestellt und vorher bereinigt: Auftrag, interne Arbeitsordnung, Team-Rollen und die
   Konfiguration der Entwicklungsumgebung wurden entfernt – auch rückwirkend aus der
   gesamten Versionsgeschichte. Zusätzlich wurde die in jedem Commit hinterlegte
   E-Mail-Adresse `kidev@nexion.ddns.net` durch eine neutrale Adresse ersetzt: Sie verweist
   auf einen privaten Heimserver und hätte sonst öffentlich eingesehen werden können. Dass
   die Dateien nicht mehr abrufbar sind, wurde nach der Umstellung überprüft.

## Qualitätssicherung

- **79 automatische Tests, alle grün.** Geprüft werden unter anderem: das Mischen ohne
  Wiederholung (auch über die Rundengrenze hinweg), alle drei Tasten samt Umschalttaste,
  dass ein Tastendruck bei fokussiertem Knopf nicht doppelt auslöst, sämtliche Fehlerwege
  beim Kopieren, die Qualität der Sprücheliste (Anzahl, Länge, Dubletten, Längenmischung)
  sowie dass die Seite keine externen Inhalte lädt und ohne Server funktioniert.
- **Sicherheitsreview: null Befunde** in allen sieben geprüften Bereichen (Schadcode-Einbau,
  Zugangsdaten, Abhängigkeiten, externe Aufrufe, Zwischenablage, Auslieferung, Eingaben).
  Das Projekt hat bewusst **keine einzige fremde Programmbibliothek**, damit von dort auch
  keine Sicherheitslücken kommen können.
- **Abnahme gegen die Akzeptanzkriterien** dokumentiert in `docs/QA-BERICHT.md`. Alle
  gemeldeten Befunde wurden behoben.

## Offene Punkte / Vorschläge für die nächste Runde

1. **Sichtprüfung im echten Browser steht aus.** In der Entwicklungsumgebung gab es keinen
   Browser, der Download eines Testbrowsers wurde blockiert. Geprüft wurde deshalb, was sich
   ohne Browser prüfen lässt: dass die Gestaltungsregeln vorhanden und korrekt sind, die
   Kontraste ausreichen und die Seite fehlerfrei ausgeliefert wird. **Empfehlung: einmal
   selbst am Handy und am Computer öffnen** und auf zwei Dinge achten – dass nichts gescrollt
   werden muss und dass ein sehr langer Spruch sauber umbricht. Das ist eine Sache von zwei
   Minuten und schließt die letzte Lücke.
2. **Sicherheitsregel (CSP) nachrüsten**, sobald jemand die Seite in Chrome, Firefox und
   Safari per Doppelklick gegenprüfen kann. Nutzen: Schutz davor, dass später versehentlich
   fremde Inhalte eingebunden werden.
3. **Sprücheliste erweitern.** 80 Sprüche bedeuten bei täglicher Nutzung mehrere Monate ohne
   Wiederholung. Wer mehr möchte, ergänzt sie in `assets/quotes.js`; einzig der Test, der auf
   genau 80 prüft, muss dann angepasst werden.
4. **Eigene Adresse (z. B. aufwind.de)** wäre über GitHub Pages ohne Zusatzkosten möglich,
   die Adresse selbst kostet je nach Anbieter wenige Euro im Jahr. Nur sinnvoll, wenn die
   Seite häufiger geteilt werden soll.
5. **Denkbare kleine Erweiterungen**, alle bewusst nicht gebaut, weil sie im Auftrag
   ausgeschlossen oder nicht gefordert waren: ein Symbol für den Startbildschirm des Handys,
   ein Teilen-Knopf, oder eine Adresse pro Spruch zum Verlinken.
