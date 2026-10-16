# Langzeit-Balance · kurze Gartenbesuche

Die Vorgabe ist: reguläre Tagesziele ungefähr innerhalb von vier bis fünf Minuten erreichen und spätestens nach zehn aktiven Minuten einschlafen. Läden, Dekoration und Accessoires sind langfristige Wünsche und gehören nicht zu den geplanten Tageszielen. Bis Minute fünf ist das Wachstum normal, bis Minute acht fällt es auf 10 %, bis Minute neun auf null. Bereits reife Pflanzen bleiben bis zum Einschlafen erntbar.

## Aktueller Stand

Sieben vollständige Durchläufe mit jeweils 77 Runden erreichen sämtliche regulären Ausbauten und die Bushaltestelle. In jeder Runde werden alle regulär vorgesehenen Verbesserungen und anschließend die Pflanzenbelohnung gekauft. Früh verfügbare Zusatzstufen gehören nicht zu diesen Tageszielen. Alle 539 Abschlüsse gelingen vor dem Einschlafen. Genau sieben Samen und siebzig Gießaktionen werden vergeben; Speichern und Normalisierung erhalten Vorräte, Anzahlungen und Belohnungen.

| Spielweise | Median | Längster Tag | Verpasste Abschlüsse |
|---|---:|---:|---:|
| Manuell | 1:38,5 | 4:15,5 | 0 |
| Mit Helfern | 1:37,5 | 4:37,0 | 0 |
| Helfer + Farm | 1:36,5 | 4:37,0 | 0 |
| Freiwillige Kosmetikausgaben | 1:36,5 | 5:18,5 | 0 |
| Spezialisierung: eigene Ernte | 1:44,0 | 5:10,0 | 0 |
| Spezialisierung: Werkstätten | 1:49,5 | 4:57,0 | 0 |
| Spezialisierung: Helfer | 1:52,0 | 5:19,0 | 0 |

Zeiten in Minuten:Sekunden,Zehntel. Die ersten vier Tage dauern 3:20 bis 4:11 Minuten, die erste Verbesserung ist nach etwa 33 Sekunden möglich. Der längste reguläre Durchlaufstag liegt bei 4:37 Minuten. Der zusätzliche Durchlauf gibt freiwillig zehn Prozent seiner neuen Verkaufseinnahmen für Läden und Artikel aus und benötigt im längsten Tag 5:18,5 Minuten. Diese Käufe sind ausdrücklich keine Abschlussvoraussetzung.

Die Mediane sind kürzer als vier Minuten: Bereits angespartes Geld, vorhandene Waren und Helfer können spätere Tage früher abschließen. Vier bis fünf Minuten sind ein Ziel für die Erreichbarkeit, keine Mindestspielzeit. Das Spiel zieht keine Ersparnisse ein und setzt keine künstliche Wartefrist. Die verbleibende Zeit bis Minute zehn lässt sich zum Sammeln oder für langfristige Wünsche nutzen.

## Änderungen

- Ertragsquote: 300 Referenzeinheiten in den ersten vier Runden, danach 220 statt zuvor 600/1000. Der Preisplan wird weiterhin aus den verfügbaren regulären Ausbauten bestimmt; Kontostand und Kosmetikwünsche bestimmen keine Preise. Laufende alte Pläne erhalten einmalig den höheren Erntefaktor. Gespeichertes Geld und vorhandene Warenwerte bleiben erhalten.
- Aktive Werkstätten: 12/16/20/26 Sekunden Grundzeit statt 45/60/75/100 Sekunden. Zutaten werden weiterhin tatsächlich verbraucht, bei zusammengesetzten Rezepten auch zuvor hergestellte Waren. Die Wertsteigerung bleibt 20 % plus zwei Prozentpunkte je weiterer Stufe. Hausbauabschnitte brauchen vier Sträuße, vier Tees und drei Öle, statt acht/acht/sechs.
- Nachtproduktion: höchstens zwölf simulierte Produktionssekunden je längerer Pause; kein automatisches Ernten oder Verkaufen. In den aktuellen Durchläufen entstehen höchstens vier Produkte pro Pause über sämtliche Werkstätten. Farmaufzucht behält unabhängig davon bis zu 90 Sekunden Pflegefortschritt.
- Helferschnecken ernten nicht innerhalb von acht Welteinheiten um die Spielfigur. Das schützt deren aktive Ernte vor Konkurrenz um dieselben Pflanzen. Anderswo arbeiten sie weiter.
- Tagesrhythmus: Warnungen nach 8:00 und 9:00 Minuten, Einschlafen nach 10:00. Der Pflanzenkauf schließt den Tag regulär ab. Anschließend bleiben Sammeln und freigeschaltete Upgrades bis zum Einschlafen möglich. Ab Minute neun pausiert nur das Nachwachsen, nicht die Ernte vorhandener reifer Pflanzen. Menüs, versteckte Tabs und Abwesenheit zählen nicht mit. Sonnenuntergang beginnt ab Minute drei; nach Abschluss erfolgt die Nachtüberblendung über maximal 90 Sekunden bei voller Ausgangshelligkeit.
- Kosmetikkäufe bleiben außerhalb des täglichen Plans. Ihre Preise, Freischaltungen und dauerhaften Anzahlungen bleiben erhalten. Der Test verlangt nicht, dass alle Kosmetika bis Tag 77 gekauft wurden.

## Verifikation und Grenzen

Die Simulation nutzt die echten Preis-, Ernte-, Bewegungs-, Produktions-, Farm-, Helfer- und Kauffunktionen. Sie bewegt sich in 0,5-Sekunden-Schritten, erntet innerhalb dieser Schritte mit der tatsächlichen Erntefrequenz und nimmt benötigte Hausmaterialien gezielt mit. Nach jeder Runde werden acht Stunden Abwesenheit und Speichern/Laden simuliert. Ein regulärer Tag über 310 Sekunden oder ein Durchlauf mit freiwilligen Ausgaben über 420 Sekunden führt zum Fehler; Einschlafen vor dem Abschluss ist unabhängig davon immer ein Fehler.

Die 10 Sekunden Toleranz am regulären Fünf-Minuten-Ziel vermeiden eine knappe Abhängigkeit einzelner Lauf- und Kaufabschnitte. Die Simulation ist kein Beweis identischer Zeiten für menschliche Wege oder ein physisches iPhone. Bei viel optionalem Geldausgeben oder absichtlichem Trödeln kann die Tagesbelohnung weiterhin verpasst werden. Frühere Belohnungen, Geld und Waren gehen dabei nicht verloren. Eine unvollständige Anzahlung für den Abschluss wird erstattet, und fehlende Belohnungen bleiben durch spätere verdiente Tage nachholbar.

Die Logiktests prüfen außerdem acht absichtlich verpasste Tage, die Nachholung der Belohnungsquoten, Warnungen, sichere Migration laufender Pläne und den Vorrang manueller Ernte vor Helfern. Die Browserprüfung prüft lokale Speicherung, Datei-Export/-Import, Farm, Ladenanzahlungen, Accessoires, Einschlafen nach zehn Minuten und Aufwachen durch eine weitere verdiente Runde.

```sh
node scripts/balance.mjs
node scripts/balance.mjs --cosmetics
node scripts/balance.mjs --choices
node --test tests.mjs farm-tests.mjs comfort-tests.mjs
node build-garden.mjs
```

Die Rohdaten stehen in [balance-results.json](balance-results.json), [cosmetic-balance-results.json](cosmetic-balance-results.json) und [choice-balance-results.json](choice-balance-results.json). Zeitstempel gehören jeweils zum erfolgreich abgeschlossenen Durchlauf.

## Frühe Auswahl ohne längere Tagespflichten

Bei Werkzeugen, bestehenden Werkstätten, Helfern, Lager, Gartenpflege und bereits ausgebauten Beeten sind weitere Stufen bis zu drei Gartentage früher verfügbar. Erste Freischaltungen und große Inhalte behalten ihren Zeitpunkt, insbesondere Farm 18, Waldschnepfe 32 und Obstgarten 47. Preise verwenden weiterhin die ursprüngliche Freischaltrunde. Die zusätzlichen Möglichkeiten sind im Spiel als freiwillig markiert und werden vom regulären Tagesplan ausgeschlossen. Nach dem Pflanzenkauf kann man bis zum Einschlafen weiter investieren; abgeschlossene Belohnungen werden dabei nicht erneut vergeben.

Drei zusätzliche Langzeitläufe investieren ein begrenztes, angespartes Budget in frühe Stufen für eigene Ernte, Werkstätten beziehungsweise Helfer. Sie wählen tatsächlich sechs, 21 beziehungsweise zwölf solche Upgrades und erreichen alle regulären Abschlüsse sowie die Bushaltestelle. Die längsten Tage dauern 5:10, 4:57 und 5:19 Minuten. Der Test verlangt keine bestimmte Spezialisierung vom normalen Spiel. Die höheren Ausgaben sind Entscheidungen, keine zusätzlichen Tagesziele.

Die Wachstumsintegration wird zusätzlich mit großen und kleinen Zeitschritten über alle Phasengrenzen geprüft. Nach Minute neun verändern sich weder Wachstumszeit noch Erntezeitpunkte weiter. Reife Pflanzen und vorhandene Helferlieferungen bleiben nutzbar, bis die Spielfigur nach zehn aktiven Minuten einschläft.
