# Mondgarten-Anbindung · v308

Die ursprüngliche Begleitseite entspricht dem am 15.10.2026 heruntergeladenen GitHub-Stand (abgesehen von Zeilenenden). Die medizinischen Eintragsfunktionen bleiben erhalten. Garten und Pflanzen haben eigene Speicherschlüssel. Die Haupt-App erhält ausschließlich den Geschenkknopf und das zusätzliche verschlüsselte Geschenkzählerfeld.

## Einträge und Geschenke

Erst wenn das vorhandene entschlüsselte ACK den aktuellen Änderungsstand eines Eintrags bestätigt, wird dessen ID an die Gartenbuchhaltung übergeben. Diese verarbeitet jede ID einmal. Gelöschte Einträge, Änderungen und Wiederholungen erzeugen keine weitere Runde. Historische Einträge vor Einrichtung des Gartens werden nicht rückwirkend belohnt.

Nach einer Eintragsbelohnung gilt eine dauerhafte Sperre von 600.000 ms. In der Sperre entstandene oder bestätigte Einträge werden als bearbeitet gespeichert, ohne eine spätere Belohnung anzustauen. Der medizinische Eintrag und seine Übertragung bleiben jederzeit möglich. Rückgängig erzeugt keine Aktion; eine bereits gutgeschriebene Runde wird nicht wieder entzogen.

Die Haupt-App speichert einen kumulativen gardenGiftCount und sendet gardenGift:{epoch,count} im vorhandenen AES-GCM-verschlüsselten Vokabularpaket. Die Begleitseite schreibt nur die bisher nicht gesehenen Zählerwerte gut. Wiederholte Abfragen duplizieren keine Geschenke. Geschenke umgehen die Eintragssperre. Die bestehenden Verbindungsschlüssel und ntfy-Themen werden weiterverwendet.

Diese Regeln laufen lokal im Browser. Sie sind kein serverseitiger Schutz vor absichtlichen Änderungen von Uhr oder Spielstand.

## Speicherschlüssel

- mt-begleiter-v1: bestehende medizinische Begleitdaten, unverändertes Format.
- mt-garden-actions-v1: Eintrags-IDs, Installationszeit, letzte Belohnung, Rundengutschriften und Geschenkzähler; keine medizinischen Inhalte.
- mt-garden-plants-v1: sieben Knopfpflanzen und eindeutig verbuchte Samen-/Gießbelohnungen.
- mondgarten.companion.save.v1: unabhängiger Spielstand des eingebetteten Gartens.

Das Spiel startet ohne kostenlosen Tag. Die erste verdiente Runde öffnet Tag 1. Der Tagesabschluss wird im Spiel gekauft und erzeugt genau eine Pflanzenbelohnung. Sieben Samen und siebzig Gießaktionen lassen sieben Pflanzen vom Samen bis zur zehnten Wachstumsstufe wachsen. Zusätzliche verdiente Gartentage erlauben einen späteren Spielabschluss und das Nachholen verpasster Belohnungen; insgesamt bleiben es höchstens sieben Samen und siebzig Gießaktionen. Im Spiel steht keine Gesamtzahl der Tage.

Ein JSON-Export des Gartenspiels enthält dessen Spielstand, nicht die getrennte Eintragssperre oder die bereits verwendeten Pflanzenaktionen. Bestehende Haupt-App-Sicherungen bleiben unverändert; die zusätzlichen Browserstände sind nicht automatisch Teil dieser Sicherungen.

## Erweiterung und Aufbau

- begleiter/garden-config.mjs: Sperrzeit, Speicherkennungen und sieben Pflanzplätze.
- begleiter/garden-ledger.mjs: Gutschriften, Deduplizierung, Pflanzenbelohnungen.
- begleiter/companion-garden.mjs und .css: Gartenfenster und Pflanzenbedienung.
- begleiter/garden-modules/plants.js: Pflanzenarten, Bildstufen und Ausschnitte.
- begleiter/mondgarten/content.mjs: Sammelarten, Farben, Formen und Grundwerte.
- begleiter/mondgarten/village-content.mjs: Beete, Werkstätten, Rezepte und Bauplätze.
- begleiter/mondgarten/economy.mjs: Preise und Ertragskurve.
- begleiter/mondgarten/daily.mjs und funding.mjs: vollständiger Tagesbedarf und endlicher Ertrag.

Nach Änderungen im Begleiterordner `node build-garden.mjs` ausführen. Das erzeugt das klassische companion-garden.js ohne Laufzeit-Buildwerkzeuge und erneuert den Offline-Cache anhand der Dateiinhalte. Spielmodule sind direkt bearbeitbar. Alle Laufzeitdateien und Bilder liegen lokal; ntfy-Anfragen werden vom Service Worker nicht zwischengespeichert.

## Tageswirtschaft (bis 15. Oktober; durch die unten stehenden Regeln ersetzt)

Zu Tagesbeginn werden alle an diesem Tag erlaubten Ausbaustufen einschließlich ihrer Folgefreischaltungen sowie der Tagesabschluss zusammen berechnet. Der Ertrag reicht für die gesamte Summe mit kleinem Puffer. Es gibt keine Geldreservierung und keine vorgeschriebene Kaufreihenfolge. Ausstehende Ausbauten bleiben in späteren Tagen kaufbar.

Mit dem bereits erspielten Wert in Geld, getragenen Stapeln, Lager, Transporten und Werkstätten wird das Wachstum allmählich schwächer. Ist die Summe erreicht, endet neue Ernte; erforderliche Hauszutaten dürfen noch gezielt entstehen. Bestehende Vorräte werden weiterverarbeitet und verkauft. Rohstoffe können aus dem Lager abgeholt und direkt verkauft werden. Durch den Kauf der Gartenaktion endet der Tag mit langsamer Dämmerung.

## Frühere Prüfung (nicht auf die neue Wirtschaft übertragbar)

Der vollständige Haupt-App-Bericht enthält zwölf bestandene Prüfgruppen. Zusätzlich bestehen zwölf gezielte Buchhaltungs-/Pflanzenprüfungen und die Spielprüfungen. Zwei vollständige Simulationen erreichen alle angebotenen Ausbauten einschließlich Bushaltestelle am geplanten letzten Tag. Es gibt weder unbezahlbare Tagesziele noch neues Einkommen nach abgearbeiteten Vorräten. Details und Grenzen stehen in gartenplanet/BALANCE.md.

Die synthetische Browserprüfung bestätigt ACK-Belohnung, Sperre, Rückgängig, Geschenk, Einlösen von Pflanzenaktionen und das Öffnen des Gartens im Hochformat. Es wurden keine echten Einträge, Nachrichten oder vorhandenen Spielstände verwendet. Keine Prüfung auf einem physischen iPhone.

## Direkte Bedienung auf der Begleitseite

Spielstart und Nachtbesuch liegen ganz unten. Ein Nachtbesuch öffnet den bereits abgeschlossenen Tag und verbraucht keine wartende Gartenaktion. Der nächste Tag wird ausschließlich mit dem Startknopf auf der Begleitseite geöffnet. Ein unterbrochener offener Tag kann dort fortgesetzt werden.

Samen und Gießkanne haben kein zusätzliches Menü. Bei einer Samenbelohnung erscheint die Sortenauswahl oberhalb der Eintragsknöpfe. Nach der Auswahl pflanzt der nächste Klick auf einen freien Knopf den Samen halb in die Erde. Nach dem Tagesabschluss kann man im Garten bleiben oder ausdrücklich zur Begleitseite zurückkehren. Bei der Rückkehr folgt die Abschlussanimation und die Gießkanne ist ausgewählt. Der nächste Klick auf eine geeignete Pflanze verbraucht genau eine Belohnung und zeigt Tropfen und Wachstum. Nur ein ausdrücklich ausgewählter Pflanzenmodus fängt den Klick vor dem medizinischen Handler ab; Später hebt ihn auf. Nach der Pflanzenaktion sind normale Einträge wieder möglich.

Spiel und Begleitseite prüfen Ursprung und iframe-Fenster bei Nachrichten. Die Abschlussnachricht ist kein Gutschriftbeleg: Der Empfänger liest die bereits gespeicherte, abgeschlossene Runde und deren eindeutige Belohnung. Das Schließen entlädt das iframe nach einer Speicheraufforderung, damit kein unsichtbarer offener Gartentag im Hintergrund weiterläuft.

mondgarten/upgrade-info.mjs bündelt verständliche Kurztexte, Wirkungen und Symbole. Dieselbe Erklärung wird auf den Bauflächen und in den größeren Ausbautexten benutzt. Das Lager ist der gemeinsame Zutatenvorrat der Werkstätten; ohne Werkstatt zunächst nur zusätzlicher Platz. Rohstoffe können auch wieder abgeholt und direkt verkauft werden.


## Aktualisierung · 16. Oktober 2026

- Ein Finger-/Mausdruck auf die freie Spielfläche setzt den Joystick an diesen Punkt. Ziehen steuert die Richtung, Loslassen, Abbruch, Fokusverlust und Menüs stoppen die Bewegung. Menü-Wege und Tastatur bleiben nutzbar.
- Werkstätten besitzen eigene Zutatenstapel (`workshops[id].inputs` und `inputValues`). Passende Rohstoffe und getragene Zwischenprodukte werden links abgelegt; fertige Produkte rechts abgeholt. Das Lager ist zunächst optionaler Stauraum. Mit Ernteschnecken oder Schnecki versorgt es Werkstätten rezeptweise. Vorhandene Lagerbestände bleiben erhalten.
- Eingänge fassen 120 Einheiten, Abholstapel 24 Produkte. Diese Grenzen betreffen den Platz, nicht die insgesamt erlaubte Ernte. Die Blumenbinderei braucht auf Stufe 1 12 Sekunden je Strauß; weitere Werkstätten 16/20/26 Sekunden. Verbesserungen verkürzen die Zeit behutsam, mindestens vier Sekunden. Der tatsächliche Zutatenwert wird um 20 % plus 2 Prozentpunkte je weiterer Werkstattstufe veredelt. Bestehende fertige Waren, Geldbestände und laufende alte Aufträge behalten ihren Wert.
- Offline werden ausschließlich vorhandene Zutaten verarbeitet: 1/300 des aktiven Tempos, höchstens eine Stunde Abwesenheit angerechnet (= höchstens zwölf Produktionssekunden pro Werkstatt und Pause). Bei 20 Minuten sind es vier Sekunden. Die Farmaufzucht behält unabhängig davon ihre höchstens 90 Sekunden Pflegefortschritt pro Pause. Es gibt offline keine frische Ernte und keinen automatischen Verkauf. Bereits getragene Helferlieferungen bleiben erhalten. Häufigere Besuche erhöhen die Summe der zeitproportionalen Verarbeitung, lange einzelne Pausen bleiben begrenzt.
- Das Lager liegt nun bei (-14, -7), deutlich weiter vom Verkauf. Ablieferanimationen zielen aufs Lager bzw. die Werkstatt. Der Knopf ▤ öffnet direkt Lager und Verwaltung, einschließlich Wegen zur Zutatenabgabe.
- Tagespläne begrenzen die Ernte nicht mehr. Bis Minute fünf bleibt das Nachwachsen normal. Danach fällt es bis Minute acht auf 10 % und bis Minute neun auf null. Bereits reife Pflanzen dürfen weiterhin geerntet werden. Das gilt nach Tagesabschluss ebenso. Neue Bau-Stufen werden weiterhin erst mit neuen verdienten Runden zugänglich. Ein noch nicht verdienter erster Tag bleibt gesperrt.
- Der Tagesabschluss vergibt weiter höchstens eine Pflanzenbelohnung. Danach kann man im Garten bleiben oder zur Begleitseite zurückkehren. Der Nachtbesuch bleibt bis zum Einschlafen nach zehn aktiven Minuten möglich.
- Ab drei aktiven Minuten beginnt ein langsamer Sonnenuntergang; Einkommen beeinflusst die Beleuchtung nicht. Vor dem Tagesabschluss wird es höchstens abendlich. Nach Abschluss dauert die volle Überblendung zur Nacht mindestens 90 Sekunden. Warmes Licht geht an Wegen, Lager und Werkstätten an.

### Prüfen

`node --test tests.mjs farm-tests.mjs comfort-tests.mjs` prüft in 37 Fällen Produktion, Zutatenwerte, Lager/Helfer-Abhängigkeit, Ausgabegrenzen, Rezepte, Offline-Zuwachs, Save-Kompatibilität, Wachstum, Belohnungen, Beleuchtung, Obsternte und alle drei Waldschnepfenaufträge. `node build-garden.mjs` aktualisiert nach Änderungen die Offline-Cache-Version. Ein lokaler HTTP-Server muss `.mjs` als JavaScript liefern. Ergänzend im mobilen Browser Joystick, direkte Abgabe/Abholung, Verkauf nach Abschluss, Menüs und Speicherung prüfen.

### Obstgarten und Waldschnepfe

Der bestehende Sternenfruchtplatz (ID `fruit`, Feldindex 4, Rohstoff `starfruit`) ist ab Runde 47 als kaufbarer Obstgarten mit 20 Bäumen verfügbar; der passende Samen kann ab Runde 46 beim vorherigen Feld gefunden werden. Beim Baum 1,2 Sekunden stehen bleiben pflückt bis zu sechs Früchte als Stapel. Bewegung oder Weggehen bricht den Pflückvorgang ab. Stamm und Krone bleiben nach dem Pflücken stehen; nur die Früchte wachsen nach. Die Feld-ID, Freischaltung, Ausbaustufe und vorhandenen Sternenfrüchte bleiben erhalten. Die Zellverteilung ändert sich; alte Erntezeiten werden nur für noch vorhandene Zellschlüssel weitergeführt.

Ab Runde 32 lässt sich die Waldschnepfe freischalten. Unter ▤ gibt es drei wählbare Aufträge: Zutaten vom Lager zu Werkstätten bringen, fertige Waren zum Stand tragen oder Waldschätze suchen. Eine laufende Lieferung wird bei Auftragswechsel zuerst beendet. Zutaten und Waren werden tatsächlich aus dem jeweiligen Bestand entnommen. Automatische Verkäufer lassen benötigte Hausbau-/Elixierzutaten liegen. Waldschätze erscheinen als Sammelzähler, nach jeweils 90 Sekunden Suche vor Ort; sie haben derzeit keine weitere Verwendung. Auftrag, Funde und getragene Lieferung werden gespeichert. Die Waldschnepfe arbeitet nur während aktiven Spielens.

### Schneckenfarm (ab Runde 18)

Die Farm ist ein kaufbarer Ausbau. Beim aktiven Ernten und bei der Suche der Waldschnepfe können Häuschen auftauchen: mindestens 240 gesammelte Einheiten und 180 aktive Sekunden pro Fund, höchstens zwei Funde je Gartenrunde. Zehn Arten werden zwischen Runde 18 und 68 nach und nach verfügbar. Die Fundauswahl besitzt einen gespeicherten Zufallszustand; Laden erzeugt keine neuen Würfe. Höchstens 30 Häuschen können warten.

Sechs Aufzuchtplätze stehen zur Verfügung. Ein Häuschen wird dort eingesetzt und benötigt drei Portionen Futter sowie insgesamt zwölf Minuten Wachstum. Jede Portion reicht für vier Minuten; ohne Futter wartet die Schnecke ohne Schaden. Pflege und Wachstum sind auch im Farmmenü möglich, während die übrige Simulation dort pausiert. Offline läuft die begrenzte Verarbeitung mit maximal 90 Sekunden weiter; neue Häuschen werden offline nicht gefunden.

12 Mondblüten ergeben zwei Portionen Futter; später ergeben 6 Mondblüten und 2 Sternenfrüchte vier Portionen. Zutaten werden aus getragenen Rohstoffen und dem Lager genommen. Die Zutatenwerte bleiben in der Aufzucht buchhalterisch erhalten. Eine erwachsene Schnecke kann verkauft werden (Zutatenwert zurück plus 25 % Gewinn, dessen Zusatzbetrag begrenzt ist) oder einen freien Helferplatz belegen. Die Helferplätze folgen derselben Freischaltung wie gekaufte Schnecken und sind insgesamt auf zwölf begrenzt. Aufträge und Lagerautomatisierung funktionieren mit gezüchteten Helfern ebenso. Zehn Arten haben unterschiedliche Namen und Gehäusefarben; die Arbeitsleistung ist gleich.

### Langzeit-Balance

`node scripts/balance.mjs` prüft drei Strategien über jeweils 77 Runden mit echten Preis-, Ernte-, Laufweg-, Produktions-, Helfer-, Farm- und Kauf-Funktionen. Die letzte Runde erreicht jeweils die Bushaltestelle, alle 77 Pflanzenbelohnungen bleiben eindeutig. Der Report steht in [BALANCE.md](BALANCE.md), die aktuellen Rohdaten in `balance-results.json`.

Die Ertragsquote verwendet in den ersten vier Runden 300 Referenzeinheiten, anschließend 220. Reguläre Tagesziele sollen ungefähr nach vier bis fünf Minuten erreichbar sein; Läden und Kosmetik bleiben langfristige Wünsche außerhalb des Tagesplans. Das zeitabhängige Nachwachsen läuft bis Minute fünf normal, nimmt danach ab und endet nach neun aktiven Minuten. Bestehende Tagespläne bekommen einmalig den höheren Erntefaktor (Balanceversion 6), ohne Guthaben, Anzahlungen und gespeicherte Warenwerte neu zu bewerten. Der Hausbau benötigt vier Sträuße, vier Tees und drei Öle in getrennten Bauabschnitten. Preise werden nicht an den Kontostand angepasst.

### Lokaler Spielstand

Das Spiel speichert automatisch alle zehn Sekunden sowie beim Verlassen auf diesem Gerät. In den Einstellungen lassen sich JSON-Sicherungen exportieren und wieder laden. Es gibt keine Online-Spielstandverbindung. Browserdaten zu löschen entfernt auch den lokalen Spielstand; vorher eine Datei exportieren.

`PLAYWRIGHT_CORE_PATH=/pfad/zu/playwright-core node scripts/browser-smoke.cjs` prüft Farmbedienung, lokale Speicherung nach Neuladen und Datei-Export/-Import. Auch mit alten Verbindungseinstellungen im Browserspeicher darf das eigenständige Spiel keine externen Anfragen mehr senden.

### Gartenläden und Accessoires

Gartenglück (ab Tag 12) und Faden & Blüte (ab Tag 20) sind teure, einmalige Ladenbauten. Anschließend können Dekorationen und Accessoires mit frei gewählten Teilzahlungen gekauft werden: bis zu 100, bis zu 1000 oder den ganzen Rest einzahlen. Niemals wird mehr als das vorhandene Geld oder der Restpreis abgezogen. Anzahlungen überstehen Tagwechsel, Einschlafen, Speichern, Import und Pausen. Keine Kosten verschwinden bei einem neuen Tag. Die Läden stehen sichtbar im nördlichen Mittelteil des Gartens; vor dem Stand stehen bleiben oder im Gartenmenü „Dekoration & Kleidung“ wählen.

Mondlaternen, eine Bank für zwei und ein Blütenbogen werden an festen Plätzen aufgebaut. Blüte, Sonnenhut und Lavendelschal lassen sich für beide Figuren unabhängig an- und ablegen. Die Artikel haben keine Ertragsboni. Ihre Preise hängen nur von der Definition und Freischaltrunde ab. Optionale Einkäufe erhöhen keine Tagespreise und sind nicht Teil der notwendigen Ausbauquote. Die Hauptfigur hat lange blonde Haare, grünblaue Augen, kleine goldene Ohrringe und eine olivgrüne Jacke; Schnecki trägt kurze dunkle Haare, Schnurrbart und eine grüne karierte Jacke. Das Referenzfoto wird nicht mit ausgeliefert.

### Verbindliches Einschlafen

Nach acht und neun Minuten aktiver Spielzeit gibt es einmalige Warnungen, nach zehn Minuten schläft die Hauptfigur am aktuellen Ort ein. Der Kauf der Tagesbelohnung schließt den Tag weiterhin regulär ab; danach ist der verbleibende Nachtbesuch möglich. Auch ein schon bezahlter Tag endet durch Einschlafen. Menüs, versteckte Browser-Tabs und Abwesenheit zählen nicht zum Tageslimit. Im Schlaf pausieren Bewegung, Ernte, Helfer und aktive Produktion. Aufzucht im Farmmenü pausiert dann ebenfalls.

Wer ohne Abschluss einschläft, erhält für diesen Tag keine neue Pflanzenbelohnung. Nur eine noch nicht abgeschlossene Anzahlung für die Tagesbelohnung wird zurückgebucht. Geld, Inventar, Waren, Bauten und sonstige Anzahlungen bleiben bestehen; bereits verdiente Pflanzenbelohnungen werden nicht entfernt. Eine weitere verdiente Runde ist zum Aufwachen nötig; das Spiel erzeugt keinen kostenlosen nächsten Tag. Der Rückweg zur Begleitseite bleibt auch ohne Belohnung verfügbar. Fehlende Samen/Gießaktionen lassen sich durch weitere verdiente Tage nach Tag 77 vervollständigen. Ein Migrationstag mit früher bereits mehr als acht aktiven Minuten bekommt noch zwei Minuten Vorwarnzeit; seine Erntezeiten bleiben erhalten.

Die neue Browserprüfung verwendet echte lokale Datei-Importe, damit laufende Speicherereignisse beim Neuladen Testdaten nicht überschreiben. Sie prüft Ladenbau, Anzahlungen über Reload, Deko, Accessoires beider Figuren, Einschlafen ohne Belohnung, Erstattung und Aufwachen durch eine verdiente Runde. Die reine Logik prüft zusätzlich den normalen Kauf vor dem Einschlafen, Quoten-Nachholung, Warnungen und Altspielstände.

Helferschnecken lassen Pflanzen innerhalb von acht Welteinheiten um die Spielfigur für deren manuelle Ernte stehen. Außerhalb arbeiten sie weiter. Das verhindert, dass zusätzliche Helfer reguläre Tagesziele durch Konkurrenz um dieselben Pflanzen verlängern.

### Auswahl von Upgrades

`pacePad` unterscheidet die reguläre Freischaltrunde (`requiredRound`) von der früheren Verfügbarkeit (`availableRound`). Zusätzliche Stufen können bei Werkzeugen, bestehenden Werkstätten, Helfern, Lager, Gartenpflege und bestehenden Beet-Ausbaustufen bis zu drei Runden früher verfügbar sein. Sie tragen dann `optional: true`. Erstkäufe neuer Inhalte werden nicht vorgezogen. Der Kostenzuschlag richtet sich weiterhin nach `requiredRound`, nicht nach dem früheren Kaufzeitpunkt. Es gibt keine Klassenwahl, die andere Richtungen dauerhaft sperrt.

`prepareDay` nimmt nur reguläre Stufen in die Quote auf. Vorgezogene Angebote erhöhen weder Tagesziel noch Erntefaktor. Schon vorhandene Anzahlungen bleiben bestehen, auch wenn ein optionaler Kauf erst später beendet wird. Der reguläre Pflanzenkauf schließt den Tag weiterhin ab, erlaubt nun aber weitere freigeschaltete Investitionen während des Nachtbesuchs. Erst Einschlafen oder ein noch nicht verdienter erster Tag sperrt sämtliche Bauzahlungen. Mehrfaches Kaufen derselben Tagesbelohnung bleibt verhindert.

`growthFactor` beschreibt ausschließlich das Nachwachsen, `harvestingAllowed` die Erlaubnis zu ernten. Hauptfigur und Helferschnecken dürfen nach Minute neun noch reife Pflanzen ernten. `tickJourney` integriert die beiden linearen Abfallphasen exakt, auch wenn ein Zeitschritt eine Grenze überschreitet. Der Wachstumszähler bleibt ab Minute neun stehen. Erntezeiten werden mit diesem Zähler gespeichert, sodass angeschnittene Pflanzen vor der nächsten Runde nicht neu reifen.

`node scripts/balance.mjs --choices` prüft zusätzlich drei Spezialisierungen, die tatsächliche frühe Käufe nutzen. Der Browser-Test prüft Ernte bei eingefrorenem Wachstum und den Kauf einer freiwilligen Stufe nach bereits bezahltem Tagesabschluss.
