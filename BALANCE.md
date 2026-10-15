# Tageswirtschaft · 15. Oktober 2026

Die Simulation nutzt die echten Funktionen für Ernte, Nachwachsen, Laufwege, Zutaten, Produktion, Transporte und Käufe. Sie ist kein manuelles Durchspielen auf einem physischen iPhone.

## Neues Tagesbudget

Zu Tagesbeginn enthält der Plan alle heute erlaubten Ausbaustufen einschließlich neu freischaltbarer Folgekäufe und den Tagesabschluss. 1,5 % Puffer werden mitgerechnet. Es gibt keine Geldreservierung. Alle Käufe sind frei wählbar; ungekaufte Zweige bleiben in späteren Tagen verfügbar. Die Summe wird beim Start festgeschrieben und beim Laden erhalten.

Für die Wachstumsruhe zählt bereits erspielter Wert in Geld, Stapeln, Lager, laufender Produktion und Transporten mit. Ab 70 % des Tagesbedarfs nimmt das Wachstum allmählich ab; bei voller Finanzierung und fertigen Hauszutaten ruht neue Ernte. Fehlende Hauszutaten dürfen gezielt fertiggestellt werden. Vorhandene Vorräte bleiben erhalten und werden weiter verarbeitet oder verkauft. Es gibt keinen starren Zehn-Minuten-Stopp, der einen unbezahlbaren Tagesabschluss hinterlassen könnte. Ein vollständiger Helligkeitswechsel dauert mindestens 65 Sekunden.

## Vollständige Durchläufe

Jeder Tag wird maximal ausgespielt: alle angebotenen Stufen kaufen, Vorräte abarbeiten, Tagesabschluss kaufen, anschließend acht Stunden Offline-Verarbeitung. Am Ende werden weitere lange Pausen simuliert. Normales aktives Spiel sammelt fertige Produkte in kleinen Chargen, damit nicht für jedes einzelne Produkt ein langer Weg entsteht.

| Spielweise | Erste Verbesserung | Tagesdauer Median / Maximum | Alle 175 Ausbauten | Geld nach Abschluss |
|---|---:|---:|---:|---:|
| Aktiv, mit Laufwegen | 90 Sekunden | 142 / 495 Sekunden | Tag 77 | 100.444.746 |
| Stresstest ohne manuelle Laufwege | 43 Sekunden | 120 / 343 Sekunden | Tag 77 | 130.947.657 |

Kein Tag hinterlässt ungekaufte angebotene Ausbauten. Beide Durchläufe erreichen die Bushaltestelle zuletzt. Nach Abarbeiten vorhandener Vorräte bringen weitere Pausen genau null zusätzliches Einkommen.

Die absoluten Zahlen werden im späten Spiel groß. Das Restgeld entspricht etwa 10 % bzw. 13 % des letzten simulierten Tagesertrags und entsteht unter anderem aus bereits geernteten Zutaten und Veredelungsaufschlägen. Es gibt kein willkürliches Abschneiden des Kontostands. Damit ist endloses Nachverdienen ausgeschlossen; perfekte Balance für jede denkbare Spielweise ist durch zwei Strategien nicht bewiesen. Die späteren kurzen Tage sind eine Folge der freigeschalteten Automatisierung.

## Nachvollziehen

- node tests.mjs — 69 Funktionsprüfungen.
- node tools/playthrough.mjs --mode=active --output=audit/daily-final-active.json
- node tools/playthrough.mjs --mode=optimistic --output=audit/daily-final-optimistic.json

Diese beiden daily-final-Dateien sind die aktuellen Rohberichte. Andere Berichte in audit dokumentieren frühere Balancefassungen und sind für die aktuelle Fassung nicht maßgeblich.

Die Begleitbuchhaltung hat zwölf zusätzliche Prüfungen. Der vollständige Haupt-App-Bericht hat zwölf bestandene Prüfgruppen. Hochformat wurde bei 402 × 874 und 402 × 730 CSS-Pixeln mit synthetischem Speicher geprüft. Keine echten Tagebuchdaten oder ntfy-Nachrichten wurden verwendet.
