# Blob Collector in der Begleitapp

Seit 7.11.2026 ist Blob Collector das Belohnungsspiel der Begleitseite. Die Mondblumenfarm ist nicht mehr eingebunden.

## Ablauf
1. Ein gespeicherter Eintrag schenkt eine Gartenaktion (wie bisher, 10 Minuten Sperre).
2. „☀ Blob-Collector-Tag starten“ öffnet das Spiel (`blob-collector/index.html?hud=cozy&embedded=1`) und beginnt einen Spieltag. Alle Akkus sind voll. Im Spiel laden Akkus nur noch über Nacht.
3. Geht die Figur ins Bett, schließt sich das Spiel. Die App schreibt eine Gießkanne gut (`blob-day:N`). Der nächste Tag braucht wieder eine Gartenaktion.
4. Der 7. und letzte Samen kommt, sobald die Figur zum ersten Mal die Küste erreicht (`blob-seed:coast`).
5. Wer das Spiel mitten am Tag über „← Zur Begleitseite“ verlässt, kann mit „Tag fortsetzen“ weiterspielen. Dafür wird keine neue Aktion verbraucht.

## Speicher
- `mt-garden-actions-v1` (Einträge → Aktionen) und `mt-garden-plants-v1` (Pflanzen, Samen, Gießkannen) sind unverändert.
- `mt-blob-days-v1`: `{version:1, base, started, active:{n,gameDay}|null, rewards:[…]}`. `base` sind die Aktionen, die der Mondgarten schon verbraucht hat. Beim ersten Start werden die dort verdienten, noch nicht abgeholten Belohnungen einmal übernommen.
- Das Spiel speichert unter `blob-redesign:*`.
- Der alte Mondgarten-Spielstand `mondgarten.companion.save.v1` bleibt unberührt. Der Mondgarten ist weiter spielbar über `mondgarten/index.html?archiv=1` (Link unten auf der Begleitseite). Er bringt aber keine Pflanzenbelohnungen mehr.

## Schnittstelle (postMessage, gleiche Herkunft)
Spielseite: `BlobGame/redesign/embed-bridge.mjs`. App-Seite: `companion-garden.mjs`.

| Richtung | Nachricht |
|---|---|
| Spiel → App | `blob:ready {day}`, `blob:day-started {day}`, `blob:day-ended {day}`, `blob:areas {coast, ice}`, `blob:saved {id, ok}` |
| App → Spiel | `blob:start-day`, `blob:continue-day {day}`, `blob:save {id}` |

Schläft die Figur, während die App die Meldung verpasst, merkt die App das beim nächsten Öffnen: `blob:ready` meldet dann einen höheren Tag.

## Spiel-Update einspielen
```
node update-blob-collector.mjs
git add -A
git commit -m "Blob Collector aktualisiert"
git push
```
Das Skript baut `BlobGame/redesign` (über `tools/build-deploy.mjs`) und kopiert das Ergebnis nach `blob-collector/`. Dabei entfernt es den eigenen Service Worker und das Manifest des Spiels und erneuert `sw.js` der App (`build-garden.mjs`). Optional nimmt es einen anderen Spielordner als Argument.
