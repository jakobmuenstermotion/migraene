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

## Tageswirtschaft

Zu Tagesbeginn werden alle an diesem Tag erlaubten Ausbaustufen einschließlich ihrer Folgefreischaltungen sowie der Tagesabschluss zusammen berechnet. Der Ertrag reicht für die gesamte Summe mit kleinem Puffer. Es gibt keine Geldreservierung und keine vorgeschriebene Kaufreihenfolge. Ausstehende Ausbauten bleiben in späteren Tagen kaufbar.

Mit dem bereits erspielten Wert in Geld, getragenen Stapeln, Lager, Transporten und Werkstätten wird das Wachstum allmählich schwächer. Ist die Summe erreicht, endet neue Ernte; erforderliche Hauszutaten dürfen noch gezielt entstehen. Bestehende Vorräte werden weiterverarbeitet und verkauft. Rohstoffe können aus dem Lager abgeholt und direkt verkauft werden. Durch den Kauf der Gartenaktion endet der Tag mit langsamer Dämmerung.

## Prüfung

Der vollständige Haupt-App-Bericht enthält zwölf bestandene Prüfgruppen. Zusätzlich bestehen zwölf gezielte Buchhaltungs-/Pflanzenprüfungen und die Spielprüfungen. Zwei vollständige Simulationen erreichen alle angebotenen Ausbauten einschließlich Bushaltestelle am geplanten letzten Tag. Es gibt weder unbezahlbare Tagesziele noch neues Einkommen nach abgearbeiteten Vorräten. Details und Grenzen stehen in gartenplanet/BALANCE.md.

Die synthetische Browserprüfung bestätigt ACK-Belohnung, Sperre, Rückgängig, Geschenk, Einlösen von Pflanzenaktionen und das Öffnen des Gartens im Hochformat. Es wurden keine echten Einträge, Nachrichten oder vorhandenen Spielstände verwendet. Keine Prüfung auf einem physischen iPhone.
