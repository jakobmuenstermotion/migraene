# Langzeit-Balance · kurze Gartenbesuche

Reguläre Tagesziele sollen innerhalb von etwa vier bis fünf Minuten erreichbar sein. Nach spätestens zehn aktiven Minuten schläft die Figur ein. Bis Minute fünf wächst alles normal, bis Minute acht sinkt das Nachwachsen auf 10 %, bis Minute neun auf null. Bereits reife Pflanzen bleiben bis zum Einschlafen erntbar. Läden, Dekoration und Accessoires sind langfristige Wünsche außerhalb der regulären Tagesziele.

## Korrektur der überhöhten Verkäufe an Tag 7

Die vorherige Balanceversion 6 verteilte die gesamten Tageskosten auf nur 220 Referenzeinheiten, zuzüglich eines Reichweitenfaktors. Der tatsächliche Korb wurde dabei immer größer. Außerdem verwendete die Rechnung den niedrigsten Pflanzenwert und berücksichtigte den manuellen Erntebonus nicht. So konnte ein einziger großer Korb schon den gesamten Tag finanzieren. Die bisherige Testfigur verkaufte nach wenigen Pflanzen; ihre vielen kurzen Wege verdeckten das Problem in den Zeitmessungen.

Ein nachgestellter Altstand an Tag 7 mit Korbstufe 3 (272 Plätze), Mondblumenbeet Stufe 3, Werkzeugstufen 2/3/2/2 und Blumenbinderei Stufe 1 lieferte ohne seltene Pflanzen etwa 11.392 Münzen pro Korb. Die regulären Tageskosten inklusive Puffer betrugen dabei etwa 9.727 Münzen. Das ist eine Reproduktion des Mechanismus, kein ausgelesener Spielstand der Spielerin.

Balanceversion 7 berechnet den Erntefaktor aus einem größeren Referenzertrag: `(1400 + min(Korbgröße, 300)) × (1 + 0,01 × Sichelstufe)`. Als Pflanzenwert zählt die wertvollste bereits vorhandene Sorte samt manuellem Erntebonus. Die begrenzte Berücksichtigung der Korbgröße bildet gesparte Verkaufswege ab, ohne für beliebig große Körbe beliebig viel Feldnachwuchs vorauszusetzen. Die Rechnung setzt bei Bedarf auch einen Faktor unter eins ein; Speichern/Laden darf ihn nicht wieder auf eins erhöhen.

Im gleichen Tag-7-Beispiel ergibt ein normaler voller Korb jetzt etwa **1.528 Münzen**, rund **16 %** des Tagesplans. In den vollständigen Durchläufen braucht Tag 7 acht Verkaufsbesuche; der größte tatsächlich verkaufte Rohstoffstapel finanziert dort rund 15 % der Tageskosten. In allen sieben Spielweisen bleiben die größten Einzelverkäufe der ersten elf Tage unter der Prüfgrenze von 35 %.

Das ist eine Ertragskalibrierung, keine tägliche Einkommensgrenze. Wer länger arbeitet, darf weiterhin verdienen. Korb-, Beet- und Wertverbesserungen wirken innerhalb des Tages weiter, verarbeitete Waren bleiben mehr wert als ihre Zutaten. Preise hängen weiterhin von Inhalt und Freischaltung ab, nicht vom Kontostand. Früh verfügbare Zusatzstufen und Kosmetikwünsche erhöhen den regulären Tagesplan nicht.

## Bestehende Spielstände

Ein laufender älterer Tagesplan erhält beim nächsten Laden einmalig den neuen Erntefaktor. Seine ursprüngliche Gesamtsumme, die bereits verbuchten Ausgaben und die Angebotsliste bleiben erhalten. Der Faktor wird aus dem Tagesbudget neu berechnet, statt alte Ertragsfaktoren weiter zu multiplizieren. Nachfolgende Neuladungen verändern ihn nicht erneut.

Geld, gekaufte Ausbauten, Anzahlungen und die Werte bereits vorhandener Waren bleiben erhalten. Deshalb kann ein bereits gefüllter alter Korb noch zum früheren Wert verkauft werden. Die Korrektur betrifft neu geerntete Pflanzen und daraus hergestellte Waren. Es gibt keine automatische Guthabenkürzung und keine zusätzliche Verwaltungsseite. Ohne Export liegt der tatsächliche Spielstand weiterhin ausschließlich auf ihrem Gerät.

## Aktuelle Langzeitprüfung

Sieben vollständige Durchläufe mit jeweils 77 Runden erreichen sämtliche regulären Ausbauten und die Bushaltestelle. Jede Runde kauft alle regulär vorgesehenen Verbesserungen und anschließend die Pflanzenbelohnung. Alle **539 Abschlüsse** gelingen vor dem Einschlafen. Es entstehen genau sieben Samen und siebzig Gießaktionen je Durchlauf. Speichern und Normalisierung erhalten Vorräte, Anzahlungen und Belohnungen.

| Spielweise | Median | Längster Tag | Verpasste Abschlüsse |
|---|---:|---:|---:|
| Manuell | 3:04,5 | 4:39,5 | 0 |
| Mit Helfern | 2:35,5 | 3:54,0 | 0 |
| Helfer + Farm | 2:33,0 | 3:54,0 | 0 |
| Freiwillige Kosmetikausgaben | 2:50,5 | 4:49,5 | 0 |
| Spezialisierung: eigene Ernte | 2:40,0 | 3:54,0 | 0 |
| Spezialisierung: Werkstätten | 2:49,5 | 4:22,0 | 0 |
| Spezialisierung: Helfer | 2:47,0 | 4:09,5 | 0 |

Die ersten vier regulären Tage dauern etwa 3:22 bis 3:43,5 Minuten; die erste Verbesserung ist nach etwa 61,5 Sekunden möglich. Vier bis fünf Minuten bleiben ein Ziel für die Erreichbarkeit, keine Mindestspielzeit. Ersparnisse, Vorräte und Helfer können spätere Tage verkürzen. Die verbleibende Zeit bis Minute zehn lässt sich zum Sammeln oder für langfristige Wünsche nutzen.

Der Accessoireladen ist ab Tag 12 zum Ansparen verfügbar, der Dekoladen später ab Tag 20. Im fertig gebauten Laden stehen sofort sämtliche Artikel bereit. Einzelne Accessoires und Dekorationen haben keine zusätzlichen Tagesgrenzen mehr. Die vorhandenen Artikel behalten ihre bisherigen Preise über `priceRound`. Neu sind ein Glühpilzhut für sechs Millionen und eine Mondkrone für fünfzig Millionen. So bleiben auch besonders teure Wünsche von Beginn an sichtbar, werden aber erst bei entsprechendem Einkommen bezahlbar. Bereits gekaufte Bauten, Artikel und Anzahlungen bleiben erhalten.

Die Kosmetikspielweise investiert zehn Prozent ihrer neuen Verkaufseinnahmen in Läden und Artikel. Die Preise sind jetzt auf mehrtägiges Ansparen ausgelegt: Beim erstmaligen Freischalten liegt jedes Sparziel über dem doppelten theoretischen Rohstoffwert eines vollständigen Zehn-Minuten-Tages im Testgarten. Diese konservative Obergrenze behandelt alle Pflanzen als sofort erntbar und nach jeder Wachstumszeit augenblicklich erneut abgeerntet; zusätzlich wird sogar vollständige Verarbeitung mit bis zu doppeltem Wert unterstellt. Reale Laufwege, Ernte- und Produktionszeiten verringern das tatsächlich erreichbare Einkommen. Vorher erspartes Geld, alte Waren und Missionsprämien sind darin nicht enthalten; wer bereits genug besitzt, darf weiterhin auf einmal zahlen. Es gibt keine tägliche Einzahlungssperre. Die drei Spezialisierungen investieren ein begrenztes, angespartes Budget in tatsächlich früh verfügbare Stufen. Sie kaufen sechs, 22 beziehungsweise zwölf solcher Verbesserungen. Diese Entscheidungen sind keine zusätzlichen Tagespflichten. Im Durchlauf mit zehn Prozent Sparbudget entstehen zuerst der Accessoireladen über 31 Beitragsrunden und danach der Dekoladen über vier; die danach gekauften einzelnen Dekorationen und Accessoires werden über eine bis elf Beitragsrunden bezahlt. Für den Glühpilzhut sind es vier, für die Mondkrone elf Beitragsrunden; die Mondkrone wird in dieser Strategie an Tag 72 fertig bezahlt. Die Schneckenaugen werden in dieser festen Kaufreihenfolge an Tag 56 mit dem dann höheren Einkommen sofort finanziert. Die bisherigen Preise bleiben trotz früherer Verfügbarkeit erhalten. Die Prüfung des tatsächlichen Ansparens gilt nahe der Freischaltung; lange zurückliegende Angebote erhalten keine künstliche Zahlungssperre. Das ist eine beobachtete Strategie, keine vorgeschriebene Wartezeit. Vorhandene Anzahlungen bleiben betragsgleich erhalten, bereits gekaufte Gegenstände gehören weiter der Spielerin.

## Testverhalten und Grenzen

Die Simulation benutzt die echten Ernte-, Preis-, Bewegungs-, Produktions-, Farm-, Helfer- und Kauffunktionen. Sie bewegt sich in 0,5-Sekunden-Schritten und erntet innerhalb dieser Schritte mit der tatsächlichen Erntefrequenz. Sie sammelt bis zum vollen Korb oder bis eine kleinere Ladung für die verbleibenden Tageskäufe reicht. Bei fehlenden reifen Pflanzen verkauft sie eine vorhandene Teilladung. Hausbauzutaten werden bedarfsgerecht abgegeben; bereits laufende Produktion wird berücksichtigt. Zur normalen Geldbeschaffung bevorzugt sie Blumen vor der langsameren, stationären Obsternte.

Der Verkauf eines großen Stapels verwendet wie das Spiel dessen Größe geteilt durch 1,3 Sekunden, mindestens 28 Einheiten pro Sekunde. Die Testfigur läuft bis zur Mitte des Verkaufsstands; im Spiel kann das Entladen bereits innerhalb seines Radius beginnen. Die Rohdaten enthalten Anzahl der Verkaufsbesuche, größten Rohstoffverkauf und dessen Anteil am Tagesbudget. Der Kosmetikreport enthält zusätzlich die theoretische Tagesobergrenze und die erste, letzte sowie Anzahl der Beitragsrunden je Sparziel. Eine Prüfung verhindert einen Einzelverkauf von mindestens 35 % des Tagesbudgets in den ersten elf Tagen.

Nach jeder Runde folgen acht simulierte Stunden Abwesenheit sowie Speichern/Laden. Ein regulärer Tag über 310 Sekunden oder ein Durchlauf mit freiwilligen Ausgaben über 420 Sekunden führt zum Fehler. Einschlafen vor dem Abschluss ist unabhängig davon immer ein Fehler. Die zehn Sekunden Toleranz am regulären Fünf-Minuten-Ziel vermeiden eine knappe Abhängigkeit einzelner Lauf- und Kaufabschnitte.

Die Simulation garantiert keine identischen menschlichen Wege oder Zeiten auf einem physischen iPhone. Sie simuliert weder das Sammeln jeder möglichen Missionsprämie noch absichtliche zehnminütige Zusatzernte nach jedem Abschluss. Solche zusätzlichen Einnahmen können spätere Tage verkürzen. Viel optionales Geldausgeben oder Trödeln kann weiterhin zum Einschlafen ohne Tagesbelohnung führen; Geld und Waren bleiben dann erhalten, und fehlende Pflanzenbelohnungen lassen sich durch weitere verdiente Tage nachholen.

Die 82 Logiktests prüfen direkte Schneckenlieferung und Verkauf, volles Werkstattinventar, Pausen, gespeicherte Altladungen und sichtbaren Nachschub aus dem manuell befüllten Lager. Sie prüfen außerdem seltene Pflanzen, den Tag-7-Verkauf mit mehreren Korbstufen, Wertverbesserungen, Ertragsfaktoren unter eins, unbegrenzte Weiterernte, walletunabhängige Preise und die einmalige Migration offener und abgeschlossener Altstände. Die Browserprüfung kauft die Schneckenaugen über die echten Ladenknöpfe und prüft die gespeicherte Ausrüstung beider Figuren nach Reload. Sie prüft auch die Käufe von Glühpilzhut und Mondkrone, alle Artikel im Laden an Tag 12 und die gespeicherte Ausrüstung. Die echten Charaktermodelle werden in Nahansicht mit allen drei neueren Kopfbedeckungen gerendert. Zusätzlich misst der Test den tatsächlichen Stapel über mehrere Rucksackgrößen und Rohstoff-/Produktmodelle, bis hin zu nur noch einem freien Platz. Außerdem importiert sie einen alten Tag-7-Plan und kontrolliert die Korrektur einschließlich erneutem Laden, Geld, Warenwert und Anzahlungen. Farm, Läden, Accessoires, Schlaf, Aufwachen, lokale Sofortbelohnung und Datei-Export/-Import werden ebenfalls geprüft. Externe Nachrichten werden im Begleiter-Test abgefangen.

## Weitere unveränderte Wirtschaftsregeln

- Werkstätten brauchen 12/16/20/26 Sekunden Grundzeit, mit Verbesserungen mindestens vier Sekunden. Zutaten werden tatsächlich verbraucht, bei zusammengesetzten Rezepten auch zuvor hergestellte Produkte. Der Zutatenwert wächst bei Verarbeitung um 20 % plus zwei Prozentpunkte je weiterer Werkstattstufe. Die Hausabschnitte benötigen vier Sträuße, vier Tees und drei Öle.
- Nachtproduktion verarbeitet nur vorhandene Zutaten: höchstens zwölf simulierte Produktionssekunden je längerer Pause. Es gibt kein Offline-Ernten oder automatisches Offline-Geld. Farmaufzucht erhält unabhängig davon höchstens 90 Sekunden Pflegefortschritt pro Pause.
- Helferschnecken tragen 24 Rohstoffe plus vier je Schneckenzauber-Stufe (maximal 64). Sie liefern direkt zur passenden gebauten Werkstatt, liefern bei wenig Platz eine Teilladung ab und verkaufen den Rest am Stand. Auch bei ganz vollem Eingang oder fehlender passender Werkstatt wird die Ernte verkauft. Ein wegen Platzmangel gewählter Verkaufsweg bleibt über Speichern/Laden hinweg erhalten, bis diese Ladung verkauft ist. Das Lager wird von der Spielfigur oder ausdrücklich mit Lagerlieferung beauftragten Schnecken befüllt. Die Standardaufgabe bleibt die Werkstattlieferung mit Überschussverkauf. Bei tatsächlicher Nachtbeleuchtung (ab 0,68) schlafen Schnecken an Ort und Stelle und behalten ihre Ladung bis zur nächsten verdienten Runde. Namen und Aufgaben werden je Helfer gespeichert. Die unsichtbare Versorgung ist entfernt; Schnecki und die beauftragte Waldschnepfe holen Vorräte physisch ab und transportieren auch fertige Zutaten für zusammengesetzte Rezepte. Mengen, Werte und Hausbaumaterial-Reservierungen bleiben erhalten. Gemessene Arbeitsraten und Engpässe stehen in GARTEN-TECHNIK.md.
- Helferschnecken lassen Pflanzen innerhalb von acht Welteinheiten um die Figur für deren eigene Ernte stehen. Außerhalb arbeiten sie weiter. Gekaufte Sonnenhüte, Glühpilzhüte und Mondkronen können ihnen einzeln oder gemeinsam aufgesetzt werden. Das kostet keine weitere Währung und hat keinen Einfluss auf Ernte, Laufgeschwindigkeit, Tragkraft oder Ablieferung. Die gemessenen Beispielraten und genauen Arbeitsregeln stehen in GARTEN-TECHNIK.md.
- Zusätzliche Ausbaustufen sind bis zu drei Runden früher verfügbar, zum ursprünglichen Preis. Erstkäufe bleiben zeitlich unverändert: Farm 18, Waldschnepfe 32, Obstgarten 47. Freiwillige Käufe bleiben nach dem Pflanzenkauf bis zum Einschlafen möglich.
- Warnungen erscheinen nach 8:00 und 9:00 Minuten, Einschlafen folgt nach 10:00. Menüs, versteckte Tabs und Abwesenheit zählen nicht mit. Bei verpasstem Abschluss wird nur dessen unvollständige Anzahlung erstattet. Bereits erworbene Pflanzenbelohnungen bleiben erhalten.

```sh
node --test tests.mjs farm-tests.mjs comfort-tests.mjs economy-tests.mjs visual-tests.mjs snail-hat-tests.mjs snail-work-tests.mjs snail-logistics-tests.mjs snail-care-tests.mjs seed-schedule-tests.mjs garden-ledger-tests.mjs
node scripts/helper-throughput.mjs
node scripts/balance.mjs
node scripts/balance.mjs --cosmetics
node scripts/balance.mjs --choices
node build-garden.mjs
```

Die aktuellen Rohdaten stehen in [balance-results.json](balance-results.json), [cosmetic-balance-results.json](cosmetic-balance-results.json) und [choice-balance-results.json](choice-balance-results.json). Die Zeitstempel gehören jeweils zum vollständig erfolgreichen Durchlauf.

Die regulären Begleit-Samen werden an Gartentag 1, 5, 12, 20, 30, 40 und 50 angeboten. Jeder der sieben Langzeitdurchläufe prüft vier erhaltene Samen bis Tag 20 und sieben bis Tag 50; insgesamt bleiben es sieben Samen und siebzig Gießaktionen. Zusätzliche Nachholkäufe für Altstände kosten 35 % des aktuellen Tagesabschluss-Preises und gehören nicht zu den notwendigen Tageskosten. Der separate Altstand-Test an Tag 7 erhält die vorhandenen Gießaktionen und erlaubt genau einen fehlenden Zusatzsamen. Die neue Werkzeuganordnung mit größeren Abständen ist in den tatsächlichen Laufwegen der Simulation enthalten. Nachtverkauf durch schlafende Schnecken wird separat mit tatsächlichem Beleuchtungswert und vorhandener Fracht geprüft; die Tagesziel-Simulation endet weiterhin beim regulären Abschluss.
