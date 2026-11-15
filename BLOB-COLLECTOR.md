# Blob Collector in der Begleitapp

Seit 7.11.2026 ist Blob Collector das Belohnungsspiel der Begleitseite. Die Mondblumenfarm ist nicht mehr eingebunden.

## Ablauf
1. Ein gespeicherter Eintrag schenkt eine Gartenaktion (wie bisher, 10 Minuten Sperre).
2. „☀ Blob-Collector-Tag starten“ öffnet das Spiel (`blob-collector/index.html?hud=cozy&embedded=1`) und beginnt einen Spieltag. Alle Akkus sind voll. Im Spiel laden Akkus nur noch über Nacht.
3. Geht die Figur ins Bett, schließt sich das Spiel. Die App schreibt eine Gießkanne gut (`blob-day:N`). Der nächste Tag braucht wieder eine Gartenaktion.
4. Der 7. und letzte Samen kommt, sobald die Figur zum ersten Mal die Küste erreicht (`blob-seed:coast`).
5. Wer das Spiel mitten am Tag über „← Zur Begleitseite“ (in den Spiel-Einstellungen) verlässt, kann mit „Tag fortsetzen“ weiterspielen. Dafür wird keine neue Aktion verbraucht.

## Speicher
- `mt-garden-actions-v1` (Einträge → Aktionen) und `mt-garden-plants-v1` (Pflanzen, Samen, Gießkannen) sind unverändert.
- `mt-blob-days-v1`: `{version:1, base, started, active:{n,gameDay}|null, rewards:[…]}`. `base` sind die Aktionen, die der Mondgarten schon verbraucht hat. Beim ersten Start werden die dort verdienten, noch nicht abgeholten Belohnungen einmal übernommen.
- Das Spiel speichert unter `blob-redesign:*`.
- Der alte Mondgarten-Spielstand `mondgarten.companion.save.v1` bleibt unberührt. Der Mondgarten ist weiter spielbar über `mondgarten/index.html?archiv=1` (Link unten auf der Begleitseite). Er bringt aber keine Pflanzenbelohnungen mehr.

## Schnittstelle (postMessage, gleiche Herkunft)
Spielseite: `blob-collector/embed-bridge.mjs`. App-Seite: `companion-garden.mjs`.

| Richtung | Nachricht |
|---|---|
| Spiel → App | `blob:ready {day}`, `blob:day-started {day}`, `blob:day-ended {day}`, `blob:areas {coast, ice}`, `blob:saved {id, ok}`, `blob:close` (Knopf „Zur Begleitseite“ in den Einstellungen) |
| App → Spiel | `blob:start-day`, `blob:continue-day {day}`, `blob:save {id}` |

Schläft die Figur, während die App die Meldung verpasst, merkt die App das beim nächsten Öffnen: `blob:ready` meldet dann einen höheren Tag.

## Weiterentwicklung
Seit 8.11.2026 wird das Spiel **direkt hier im Ordner `blob-collector/` weiterentwickelt**. Das Projekt BlobGame ist nicht mehr die Quelle.
- `update-blob-collector.mjs` ist gesperrt. Es würde alles in `blob-collector/` mit dem alten Stand aus BlobGame überschreiben.
- Nach Änderungen an Spieldateien `node build-garden.mjs` ausführen, damit `sw.js` die neuen Dateien offline ausliefert.
- Die Schnittstelle zur App steht in `blob-collector/embed-bridge.mjs`.

## Früher: Spiel-Update aus BlobGame einspielen (gesperrt)
Nur noch mit `node update-blob-collector.mjs --erzwingen` möglich und überschreibt dann alle Änderungen hier.
```
node update-blob-collector.mjs
git add -A
git commit -m "Blob Collector aktualisiert"
git push
```
Das Skript baut `BlobGame/redesign` (über `tools/build-deploy.mjs`) und kopiert das Ergebnis nach `blob-collector/`. Dabei entfernt es den eigenen Service Worker und das Manifest des Spiels und erneuert `sw.js` der App (`build-garden.mjs`). Optional nimmt es einen anderen Spielordner als Argument.

## Schutz vor Spielstand-Verlust (seit 15.11.2026)
- **Nie stillschweigend überschreiben:** Lässt sich ein vorhandener Spielstand nicht laden (Fehler/unbekannte Version), legt das Spiel eine Rettungskopie an (`blob-collector-rescue`), blockiert das Speichern und fragt nach (Datei sichern, Sicherung laden, neu anfangen).
- **Automatische Sicherungen:** Beim Schlafengehen (neuer Spieltag) und beim ersten Start werden drei rotierende Sicherungen angelegt (`blob-collector-backup-1..3`). Fehlt der Spielstand, aber eine Sicherung ist da, bietet das Spiel an, sie zurückzuholen.
- **Datei-Erinnerung:** Nach dem Schlafen fragt das Spiel alle 3 Tage, ob der Spielstand als Datei gesichert werden soll (Teilen-Menü, z. B. iCloud Drive). „Spielstand laden“ in den Einstellungen spielt die Datei zurück.
- **Dauerhafter Speicher:** Beim Start wird `navigator.storage.persist()` angefragt (iOS entscheidet selbst).
- **Begleitseite:** Journal und Blob-Tage werden bei jedem Schreiben zusätzlich in `mt-companion-backup` gespiegelt und bei Verlust daraus zurückgeholt. Pflanzen auf den Knöpfen gibt es nicht mehr.
- **Updates:** Die App prüft beim Start, beim Zurückkehren und alle 10 Minuten auf eine neue Version und lädt nach dem Speichern selbst neu.

## Cloud-Sync zwischen Geräten (Supabase, seit 15.11.2026)
Einstellungen im Spiel → „Cloud-Sync (iPhone & iPad)“. Das erste Gerät erstellt einen 20-stelligen Sync-Code, weitere Geräte verbinden sich damit und laden den Stand.
- **Einrichtung (einmalig):** `supabase-setup.sql` im Supabase-SQL-Editor ausführen. Danach den öffentlichen Schlüssel („anon“/„publishable“) in `blob-collector/cloud-config.mjs` bei `key` eintragen. NIE den „service_role“-/„secret“-Schlüssel eintragen.
- **Sicherheit:** Die Tabelle ist für die API gesperrt; Zugriff nur über `save_get`/`save_put`/`save_delete` mit dem Code. Codes lassen sich nicht auflisten. Gespeichert wird nur der Spielstand.
- **Ablauf:** Hochgeladen wird beim Schlafengehen, beim Verlassen der App und alle 5 Minuten (wenn sich etwas geändert hat). Beim Start prüft das Spiel, ob die Cloud einen neueren Stand hat, und fragt nach. Der Server lehnt Hochladen ab, wenn ein anderes Gerät inzwischen weitergespielt hat (Vergleich über `p_base`); dann entscheidet der Spieler. Vor jedem Einspielen eines Cloud-Stands wird der lokale Stand automatisch gesichert.
- **Begleitseite:** Jedes Gerät zählt seine Gartentage selbst (Einträge werden pro Gerät gespeichert).

## Controller (seit 15.11.2026)
Das Spiel unterstützt Controller über die Gamepad-API (PlayStation, Xbox, MFi am iPad/iPhone). Safari meldet einen Controller erst, wenn darauf eine Taste gedrückt wurde. Belegung (PlayStation; Xbox: Kreuz = A, Kreis = B, Viereck = X, Dreieck = Y):
- Linker Stick oder Steuerkreuz: laufen · Kreuz: Saugen an/aus bzw. aufheben · Kreis halten: sprinten (zusätzlich L2/L3) · Viereck: Interaktionsknöpfe (Gebäude, Blob füttern, Köder …) · L1/R1: Sauger wechseln · Dreieck oder Start: Einstellungen
- In Menüs: Steuerkreuz oder linker Stick wählt aus, Kreuz bestätigt, Kreis schließt (bei Sprechblasen: Kreuz weiter, Kreis überspringen). Regler lassen sich mit links/rechts verstellen.
- Code: `blob-collector/gamepad.mjs`, eingebunden in `game.js` (`gamepad.poll()` pro Bild).

## Versionsnummer (seit 15.11.2026)
Unten in den Spiel-Einstellungen („Version 30 · 15.11.2026“) und im Fuß der Begleitseite („App-Version 30 · …“). Die Nummer erzeugt `node build-garden.mjs` automatisch: Sie steigt um 1, sobald sich irgendeine App-Datei ändert, und bleibt gleich, wenn nichts geändert wurde. Dazu legt das Skript `blob-collector/version.json` (Zähler, Datum, Inhalts-Hash) und `blob-collector/version.mjs` an – beide nicht von Hand ändern. Nach jeder Änderung `node build-garden.mjs` ausführen und die beiden Dateien mit einchecken.
