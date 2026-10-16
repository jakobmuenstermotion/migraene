# Langzeit-Balance · 16. Oktober 2026

Drei vollständige Durchläufe mit jeweils 77 Gartenrunden erreichen die Bushaltestelle. Es gibt keine blockierten Runden. Alle Durchläufe erhalten genau sieben Samen- und siebzig Gießbelohnungen; Normalisierung nach dem Speichern erhält die Bestände und Erntezeiten.

| Spielweise | Erste Verbesserung | Tagesdauer Median | Längster Tag | Geld nach Buskauf |
|---|---:|---:|---:|---:|
| Manuell | 1:25 | 8:12 | 22:36 | 87.414.618 |
| Mit Helfern | 1:25 | 5:58 | 22:03 | 17.936.115 |
| Helfer + Farm | 1:25 | 6:34 | 22:59 | 13.574.359 |

Zeiten in Minuten:Sekunden. Jede Strategie kauft alle aktuell angebotenen Ausbauten, bevor sie die Tagesbelohnung kauft. Das ist umfangreicher als ein gewöhnlicher Besuch, bei dem man den Tag früher abschließen darf. Die langen Tage liegen bei den Hausbau-/Produktionsschritten um Runde 22/23; die restliche Wartezeit wird beim Sammeln überbrückt.

## Was angepasst wurde

- Die frühe Wirtschaft war ohne den früheren Lagergewinn zu langsam. Die Tagesquote rechnet in den ersten vier Runden jetzt mit 600 Referenzeinheiten statt 3000, später mit 1000 statt 2000. Die erste Verbesserung dauert im aktuellen Durchlauf etwa 85 Sekunden.
- Das Nachwachsen nimmt weiter mit aktiver Spielzeit ab, aber sanfter: Zeitskala 900 statt 360 Sekunden. Es bleibt eine Untergrenze von 2,5 %, kein harter Erntestopp.
- Werkstätten verwenden echte, wertmäßig mitgeführte Zutaten. Der Aufschlag beträgt 20 % plus zwei Prozentpunkte je weiterer Werkstattstufe. Nachts sind höchstens 90 Produktionssekunden möglich. In den Durchläufen entstanden je Pause höchstens zwölf Produkte über sämtliche Werkstätten; automatisch verkauft wurde nachts nichts. Die deterministische Obergrenze liegt bei höchstens acht fertigen Produkten je Werkstatt und Pause, einschließlich eines angebrochenen Auftrags.
- Die Farm lässt höchstens zwei Häuschen pro Runde finden. Aufziehen braucht drei Mahlzeiten und zwölf Minuten, Hunger wartet ohne Schaden. Verkauf erstattet den Zutatenwert und einen begrenzten Zusatzgewinn. Farmhelfer teilen sich dieselben freigeschalteten Plätze und die Obergrenze von zwölf mit gekauften Schnecken.
- Bei neuen Farmhelfern werden Kaufplätze aktualisiert. Die Simulation deckte sonst einen veralteten Schneckenkauf auf, der nach einem zwischenzeitlich eingesetzten Helfer nicht mehr abgeschlossen werden konnte.

Im Farm-Durchlauf wurden alle zehn Arten entdeckt, sechs erwachsene Schnecken als Helfer eingesetzt und 82 verkauft. Die Aufzucht läuft über mehrere Gartenrunden weiter. Die Farm ist ab Runde 18 verfügbar, die Waldschnepfe ab 32 und der Obstgarten ab 47.

## Aussagekraft und Grenzen

Die Simulation verwendet die echten Funktionen für Preise, Freischaltungen, Ernte, Nachwachsen, Kapazitäten, Rohstoff-/Produktwerte, Werkstätten, Offline-Produktion, Farm, Helfer und Kaufzahlungen. Bewegungen werden mit 0,5-Sekunden-Schritten berechnet; innerhalb der Schritte wird die tatsächliche Erntefrequenz an interpolierten Positionen abgearbeitet. Die Strategien laufen zu passenden reifen Pflanzen und nehmen erforderliche Hauszutaten gezielt mit. Ein Tag bricht nach zwei simulierten Stunden als Fehler ab. Nach jedem Abschluss werden acht Stunden Abwesenheit simuliert und der Spielstand serialisiert/normalisiert.

Das ist ein reproduzierbarer Bot-Durchlauf ohne Grafik, kein Test menschlicher Wege oder eines physischen iPhones. Der manuelle Bot verwendet Werkstätten primär für benötigte Hausmaterialien. Der Farm-Bot pflegt möglichst sofort und setzt Erwachsene vor einem gleichwertigen Schneckenkauf ein. Diese Strategien beweisen nicht für jede denkbare Kaufreihenfolge dasselbe Tempo.

Weiteres Ernten und Geldansparen sind ausdrücklich erlaubt. Deshalb können einzelne spätere Runden mit wenigen angebotenen Ausbauten aus Ersparnissen sehr schnell beendet werden. Es gibt keine künstliche Mindestspielzeit und keine an den Kontostand angepassten Preise. Gespeicherte Altbestände werden nicht entwertet. Eine Aufhebung dieser Möglichkeit würde die gewünschte offene Ernte wieder einschränken; die Rundensperren begrenzen weiterhin, welche Ausbauten verfügbar sind.

## Wiederholen

```sh
node scripts/balance.mjs
node --test tests.mjs farm-tests.mjs
node build-garden.mjs
```

[balance-results.json](balance-results.json) enthält die aktuellen 231 Tagesergebnisse einschließlich Dauer, Käufen, Restgeld und Offline-Produktion. Der Zeitstempel bezeichnet den tatsächlich beendeten Durchlauf. Der JSON-Bericht wird erst nach erfolgreichem Abschluss aller drei Strategien ersetzt.
