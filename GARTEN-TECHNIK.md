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

Das Spiel startet ohne kostenlosen Tag. Die erste verdiente Runde öffnet Tag 1. Der Tagesabschluss wird im Spiel gekauft und erzeugt genau eine Pflanzenbelohnung. Sieben Samen und siebzig Gießaktionen lassen sieben Pflanzen vom Samen bis zur zehnten Wachstumsstufe wachsen. Zusätzliche Gartentage erlauben einen späteren Spielabschluss, erzeugen aber keine zusätzlichen Pflanzenaktionen. Im Spiel steht keine Gesamtzahl der Tage.

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
- Eingänge fassen 120 Einheiten, Abholstapel 24 Produkte. Diese Grenzen betreffen den Platz, nicht die insgesamt erlaubte Ernte. Die Blumenbinderei braucht auf Stufe 1 45 Sekunden je Strauß; weitere Werkstätten 60/75/100 Sekunden. Verbesserungen verkürzen die Zeit behutsam, mindestens 12 Sekunden. Der tatsächliche Zutatenwert wird um 20 % plus 2 Prozentpunkte je weiterer Werkstattstufe veredelt. Bestehende fertige Waren, Geldbestände und laufende alte Aufträge behalten ihren Wert.
- Offline werden ausschließlich vorhandene Zutaten verarbeitet: 2,5 % Tempo, höchstens eine Stunde Abwesenheit angerechnet (= höchstens 90 Produktionssekunden pro Werkstatt und Pause). Bei 20 Minuten sind es 30 Sekunden. Es gibt offline keine frische Ernte und keinen automatischen Verkauf. Bereits getragene Helferlieferungen bleiben erhalten. Häufigere Besuche erhöhen die Summe der zeitproportionalen Verarbeitung, lange einzelne Pausen bleiben begrenzt.
- Das Lager liegt nun bei (-14, -7), deutlich weiter vom Verkauf. Ablieferanimationen zielen aufs Lager bzw. die Werkstatt. Der Knopf ▤ öffnet direkt Lager und Verwaltung, einschließlich Wegen zur Zutatenabgabe.
- Tagespläne begrenzen die Ernte nicht mehr. Ab vier aktiven Minuten wird das Nachwachsen allmählich langsamer, mit einer Untergrenze von 2,5 %; vorhandene Pflanzen dürfen weiter geerntet werden. Das gilt nach Tagesabschluss ebenso. Neue Bau-Stufen werden weiterhin erst mit neuen verdienten Runden zugänglich. Ein noch nicht verdienter erster Tag bleibt gesperrt.
- Der Tagesabschluss vergibt weiter höchstens eine Pflanzenbelohnung. Danach kann man im Garten bleiben oder zur Begleitseite zurückkehren. Der kostenlose Nachtbesuch bleibt bestehen.
- Ab acht aktiven Minuten beginnt ein langsamer Sonnenuntergang; Einkommen beeinflusst die Beleuchtung nicht. Vor dem Tagesabschluss wird es höchstens abendlich. Nach Abschluss dauert die volle Überblendung zur Nacht mindestens drei Minuten. Warmes Licht geht an Wegen, Lager und Werkstätten an.

### Prüfen

`node --test tests.mjs farm-tests.mjs online-tests.mjs` prüft in 34 Fällen Produktion, Zutatenwerte, Lager/Helfer-Abhängigkeit, Ausgabegrenzen, Rezepte, Offline-Zuwachs, Save-Kompatibilität, Wachstum, Belohnungen, Beleuchtung, Obsternte und alle drei Waldschnepfenaufträge. `node build-garden.mjs` aktualisiert nach Änderungen die Offline-Cache-Version. Ein lokaler HTTP-Server muss `.mjs` als JavaScript liefern. Ergänzend im mobilen Browser Joystick, direkte Abgabe/Abholung, Verkauf nach Abschluss, Menüs und Speicherung prüfen.

### Obstgarten und Waldschnepfe

Der bestehende Sternenfruchtplatz (ID `fruit`, Feldindex 4, Rohstoff `starfruit`) ist ab Runde 47 als kaufbarer Obstgarten mit 20 Bäumen verfügbar; der passende Samen kann ab Runde 46 beim vorherigen Feld gefunden werden. Beim Baum 1,2 Sekunden stehen bleiben pflückt bis zu sechs Früchte als Stapel. Bewegung oder Weggehen bricht den Pflückvorgang ab. Stamm und Krone bleiben nach dem Pflücken stehen; nur die Früchte wachsen nach. Die Feld-ID, Freischaltung, Ausbaustufe und vorhandenen Sternenfrüchte bleiben erhalten. Die Zellverteilung ändert sich; alte Erntezeiten werden nur für noch vorhandene Zellschlüssel weitergeführt.

Ab Runde 32 lässt sich die Waldschnepfe freischalten. Unter ▤ gibt es drei wählbare Aufträge: Zutaten vom Lager zu Werkstätten bringen, fertige Waren zum Stand tragen oder Waldschätze suchen. Eine laufende Lieferung wird bei Auftragswechsel zuerst beendet. Zutaten und Waren werden tatsächlich aus dem jeweiligen Bestand entnommen. Automatische Verkäufer lassen benötigte Hausbau-/Elixierzutaten liegen. Waldschätze erscheinen als Sammelzähler, nach jeweils 90 Sekunden Suche vor Ort; sie haben derzeit keine weitere Verwendung. Auftrag, Funde und getragene Lieferung werden gespeichert. Die Waldschnepfe arbeitet nur während aktiven Spielens.

### Schneckenfarm (ab Runde 18)

Die Farm ist ein kaufbarer Ausbau. Beim aktiven Ernten und bei der Suche der Waldschnepfe können Häuschen auftauchen: mindestens 240 gesammelte Einheiten und 180 aktive Sekunden pro Fund, höchstens zwei Funde je Gartenrunde. Zehn Arten werden zwischen Runde 18 und 68 nach und nach verfügbar. Die Fundauswahl besitzt einen gespeicherten Zufallszustand; Laden erzeugt keine neuen Würfe. Höchstens 30 Häuschen können warten.

Sechs Aufzuchtplätze stehen zur Verfügung. Ein Häuschen wird dort eingesetzt und benötigt drei Portionen Futter sowie insgesamt zwölf Minuten Wachstum. Jede Portion reicht für vier Minuten; ohne Futter wartet die Schnecke ohne Schaden. Pflege und Wachstum sind auch im Farmmenü möglich, während die übrige Simulation dort pausiert. Offline läuft die begrenzte Verarbeitung mit maximal 90 Sekunden weiter; neue Häuschen werden offline nicht gefunden.

12 Mondblüten ergeben zwei Portionen Futter; später ergeben 6 Mondblüten und 2 Sternenfrüchte vier Portionen. Zutaten werden aus getragenen Rohstoffen und dem Lager genommen. Die Zutatenwerte bleiben in der Aufzucht buchhalterisch erhalten. Eine erwachsene Schnecke kann verkauft werden (Zutatenwert zurück plus 25 % Gewinn, dessen Zusatzbetrag begrenzt ist) oder einen freien Helferplatz belegen. Die Helferplätze folgen derselben Freischaltung wie gekaufte Schnecken und sind insgesamt auf zwölf begrenzt. Aufträge und Lagerautomatisierung funktionieren mit gezüchteten Helfern ebenso. Zehn Arten haben unterschiedliche Namen und Gehäusefarben; die Arbeitsleistung ist gleich.

### Langzeit-Balance

`node scripts/balance.mjs` prüft drei Strategien über jeweils 77 Runden mit echten Preis-, Ernte-, Laufweg-, Produktions-, Helfer-, Farm- und Kauf-Funktionen. Die letzte Runde erreicht jeweils die Bushaltestelle, alle 77 Pflanzenbelohnungen bleiben eindeutig. Der Report steht in [BALANCE.md](BALANCE.md), die aktuellen Rohdaten in `balance-results.json`.

Die neu kalibrierte Ertragsquote verwendet in den ersten vier Runden 600 statt 3000 Referenzeinheiten, anschließend 1000 statt 2000. Ab vier aktiven Minuten sinkt das Nachwachsen sanfter (Zeitskala 900 statt 360 Sekunden). Bestehende laufende Tagespläne und bereits gespeicherte Warenwerte bleiben erhalten; neue Ertragsquoten gelten ab dem nächsten neu erstellten Tagesplan. Preise werden nicht an den Kontostand angepasst.

### Online-Spielstand

Die kostenlose Anbindung verwendet Supabase. [supabase/README.md](supabase/README.md) beschreibt die Einrichtung mit [supabase/setup.sql](supabase/setup.sql). Das Gartenspiel enthält eine Ansicht zum Verbinden, Übernehmen des Online-Stands und bewussten Hochladen eines lokalen Stands. Ein eigener Node-/SQLite-Speicherdienst ist zusätzlich als lokale Test- und Hosting-Alternative vorhanden.

Übertragen werden ausschließlich AES-GCM-verschlüsselte Gartenspielstände einschließlich Farm sowie die getrennten Gartenaktionen und Begleitpflanzen. Medizinische Einträge und ihre Verbindungseinstellungen sind ausgeschlossen. Der persönliche Spielstandschlüssel bleibt lokal; öffentliche Supabase-Einstellungen dürfen in `mondgarten/online-settings.mjs` stehen. Automatische Übertragung erfolgt etwa alle 30 Sekunden bei geöffnetem Spiel. Offline bleibt die lokale Speicherung aktiv. Ein Versionskonflikt stoppt automatische Uploads bis zur bewussten Auswahl. Vor einer Übernahme wird der bisherige lokale Garten gesichert. Import und Neustart trennen die Online-Verbindung, ohne die Online-Sicherung zu löschen.

Die SQL-Funktionen prüfen den abgeleiteten Zugriffsschlüssel, Einrichtungscode bei Neuanlage, Revision und Nutzdatengröße. Private Tabellen haben RLS ohne direkte Client-Zugriffsrechte. Pro Sicherung bleiben die letzten zehn verschlüsselten Revisionen erhalten; standardmäßig sind zehn Sicherungen erlaubt. SQL und Browserabläufe wurden lokal gegen PostgreSQL geprüft. Ein öffentliches Supabase-Projekt muss nach Eingabe von URL und öffentlichem Publishable-/anon-Key noch eingerichtet und separat auf Erreichbarkeit geprüft werden.
