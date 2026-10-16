# Langzeit-Balance · kurze Gartenbesuche

Die Vorgabe ist: reguläre Tagesziele ungefähr innerhalb von vier bis fünf Minuten erreichen und spätestens nach acht aktiven Minuten einschlafen. Läden, Dekoration und Accessoires sind langfristige Wünsche und gehören nicht zu den geplanten Tageszielen. Die bisherige 30-Minuten-Grenze wurde entfernt.

## Aktueller Stand

Vier vollständige Durchläufe mit jeweils 77 Runden erreichen sämtliche regulären Ausbauten und die Bushaltestelle. In jeder Runde werden alle verfügbaren regulären Verbesserungen und anschließend die Pflanzenbelohnung gekauft. Alle 308 Abschlüsse gelingen vor dem Einschlafen. Genau sieben Samen und siebzig Gießaktionen werden vergeben; Speichern und Normalisierung erhalten Vorräte, Anzahlungen und Belohnungen.

| Spielweise | Median | Längster Tag | Verpasste Abschlüsse |
|---|---:|---:|---:|
| Manuell | 1:38,5 | 4:15,5 | 0 |
| Mit Helfern | 1:38,5 | 5:00,5 | 0 |
| Helfer + Farm | 1:37,0 | 4:54,5 | 0 |
| Zusätzlich freiwillige Kosmetikausgaben | 1:37,5 | 5:27,0 | 0 |

Zeiten in Minuten:Sekunden,Zehntel. Die ersten vier Tage dauern 3:20 bis 4:11 Minuten, die erste Verbesserung ist nach etwa 33 Sekunden möglich. Der längste reguläre Durchlaufstag liegt bei etwa fünf Minuten. Der zusätzliche Durchlauf gibt freiwillig zehn Prozent seiner neuen Verkaufseinnahmen für Läden und Artikel aus und benötigt im längsten Tag 5:27 Minuten. Diese Käufe sind ausdrücklich keine Abschlussvoraussetzung.

Die Mediane sind kürzer als vier Minuten: Bereits angespartes Geld, vorhandene Waren und Helfer können spätere Tage früher abschließen. Vier bis fünf Minuten sind ein Ziel für die Erreichbarkeit, keine Mindestspielzeit. Das Spiel zieht keine Ersparnisse ein und setzt keine künstliche Wartefrist. Die verbleibende Zeit bis Minute acht lässt sich zum Sammeln oder für langfristige Wünsche nutzen.

## Änderungen

- Ertragsquote: 300 Referenzeinheiten in den ersten vier Runden, danach 220 statt zuvor 600/1000. Der Preisplan wird weiterhin aus den verfügbaren regulären Ausbauten bestimmt; Kontostand und Kosmetikwünsche bestimmen keine Preise. Laufende alte Pläne erhalten einmalig den höheren Erntefaktor. Gespeichertes Geld und vorhandene Warenwerte bleiben erhalten.
- Aktive Werkstätten: 12/16/20/26 Sekunden Grundzeit statt 45/60/75/100 Sekunden. Zutaten werden weiterhin tatsächlich verbraucht, bei zusammengesetzten Rezepten auch zuvor hergestellte Waren. Die Wertsteigerung bleibt 20 % plus zwei Prozentpunkte je weiterer Stufe. Hausbauabschnitte brauchen vier Sträuße, vier Tees und drei Öle, statt acht/acht/sechs.
- Nachtproduktion: höchstens zwölf simulierte Produktionssekunden je längerer Pause; kein automatisches Ernten oder Verkaufen. In den aktuellen Durchläufen entstehen höchstens vier Produkte pro Pause über sämtliche Werkstätten. Farmaufzucht behält unabhängig davon bis zu 90 Sekunden Pflegefortschritt.
- Helferschnecken ernten nicht innerhalb von acht Welteinheiten um die Spielfigur. Das schützt deren aktive Ernte vor Konkurrenz um dieselben Pflanzen. Anderswo arbeiten sie weiter.
- Tagesrhythmus: Warnungen nach 6:00 und 7:30 Minuten, Einschlafen nach 8:00. Der Pflanzenkauf schließt den Tag regulär ab, anschließendes Sammeln bleibt bis zum Einschlafen möglich. Menüs, versteckte Tabs und Abwesenheit zählen nicht mit. Sonnenuntergang beginnt ab Minute drei; nach Abschluss erfolgt die Nachtüberblendung über maximal 90 Sekunden bei voller Ausgangshelligkeit.
- Kosmetikkäufe bleiben außerhalb des täglichen Plans. Ihre Preise, Freischaltungen und dauerhaften Anzahlungen bleiben erhalten. Der Test verlangt nicht, dass alle Kosmetika bis Tag 77 gekauft wurden.

## Verifikation und Grenzen

Die Simulation nutzt die echten Preis-, Ernte-, Bewegungs-, Produktions-, Farm-, Helfer- und Kauffunktionen. Sie bewegt sich in 0,5-Sekunden-Schritten, erntet innerhalb dieser Schritte mit der tatsächlichen Erntefrequenz und nimmt benötigte Hausmaterialien gezielt mit. Nach jeder Runde werden acht Stunden Abwesenheit und Speichern/Laden simuliert. Ein regulärer Tag über 310 Sekunden oder ein Durchlauf mit freiwilligen Ausgaben über 420 Sekunden führt zum Fehler; Einschlafen vor dem Abschluss ist unabhängig davon immer ein Fehler.

Die 10 Sekunden Toleranz am regulären Fünf-Minuten-Ziel vermeiden eine knappe Abhängigkeit einzelner Lauf- und Kaufabschnitte. Die Simulation ist kein Beweis identischer Zeiten für menschliche Wege oder ein physisches iPhone. Bei viel optionalem Geldausgeben oder absichtlichem Trödeln kann die Tagesbelohnung weiterhin verpasst werden. Frühere Belohnungen, Geld und Waren gehen dabei nicht verloren. Eine unvollständige Anzahlung für den Abschluss wird erstattet, und fehlende Belohnungen bleiben durch spätere verdiente Tage nachholbar.

Die Logiktests prüfen außerdem acht absichtlich verpasste Tage, die Nachholung der Belohnungsquoten, Warnungen, sichere Migration laufender Pläne und den Vorrang manueller Ernte vor Helfern. Die Browserprüfung prüft lokale Speicherung, Datei-Export/-Import, Farm, Ladenanzahlungen, Accessoires, Einschlafen nach acht Minuten und Aufwachen durch eine weitere verdiente Runde.

```sh
node scripts/balance.mjs
node scripts/balance.mjs --cosmetics
node --test tests.mjs farm-tests.mjs comfort-tests.mjs
node build-garden.mjs
```

Die Rohdaten stehen in [balance-results.json](balance-results.json) und [cosmetic-balance-results.json](cosmetic-balance-results.json). Zeitstempel gehören jeweils zum erfolgreich abgeschlossenen Durchlauf.
