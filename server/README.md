# Optional: eigener Speicherdienst

Für die gewählte kostenlose Supabase-Anbindung gilt [supabase/README.md](../supabase/README.md). Dieser alternative Dienst eignet sich für eigenes Hosting und lokale Tests.

Der Dienst liefert die statische App und eine API für verschlüsselte Gartensicherungen. Node.js 24 genügt; keine npm-Pakete, externe Datenbank oder Drittanbieter-Konten sind erforderlich. Ein veröffentlichter HTTPS-Server ist notwendig. GitHub Pages allein kann die API nicht betreiben.

## Bereitstellen

1. `node build-garden.mjs` im Repository ausführen.
2. Auf einem Node-/Docker-Host einen dauerhaften Datenträger unter `/data` anlegen. `Dockerfile` ist vorbereitet; alternativ `node server/sync-server.mjs` mit Node.js 24 starten.
3. Einen zufälligen Einrichtungscode mit mindestens 16 Zeichen im Passwortmanager erzeugen und als **SYNC_INVITE_CODE** in den geheimen Hosting-Einstellungen hinterlegen. Keine Zugangsdaten ins Repository schreiben. Ohne diesen Code kann der Dienst bestehende Sicherungen lesen, legt aber keine neuen an.
4. **SYNC_ALLOWED_ORIGINS** auf die genaue öffentliche App-Adresse setzen, zum Beispiel `https://garten.example.com`. Mehrere Ursprünge werden durch Kommas getrennt. Das ist auch bei einem HTTPS-Reverse-Proxy vor dem HTTP-Prozess nötig. Eine separat auf GitHub Pages gehostete App benötigt ihren eigenen Ursprung in dieser Liste.
5. Port 8080 hinter einem HTTPS-Reverse-Proxy veröffentlichen. Nur eine Instanz pro SQLite-Datei betreiben. `/health` muss HTTP 200 liefern. **SYNC_DB_PATH** kann den Datenbankpfad ändern; **PORT** den Port.
6. Datenbank einschließlich WAL konsistent sichern: laufenden Dienst stoppen und das gesamte Datenverzeichnis kopieren oder die SQLite-Backup-API benutzen. Die letzten zehn verschlüsselten Revisionen liegen zusätzlich in `history`, ersetzen aber kein externes Backup.

Beispiel für Caddy vor einem lokal gestarteten Dienst:

```caddy
# Durch die tatsächliche Domain ersetzen.
garten.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

Die hier geprüfte Maschine betreibt den Dienst nur lokal für Tests. Ein öffentliches Deployment und dessen HTTPS-Verbindung sind dadurch nicht bestätigt.

## Im Spiel verbinden

Unter Gartenmenü → Einstellungen → Online-Spielstand die Serveradresse eintragen, einen neuen Spielstandschlüssel erzeugen und sicher aufbewahren. Zum erstmaligen Anlegen den Einrichtungscode eingeben. Für weitere Geräte werden Serveradresse und Spielstandschlüssel benötigt; der Einrichtungscode ist dort nicht mehr nötig.

Der Schlüssel ist ein zufälliges Geheimnis, kein frei wählbares Passwort. Der Browser leitet daraus getrennte Schlüssel für AES-GCM und API-Zugriff ab. Der Verschlüsselungsschlüssel verlässt den Browser nicht. Wer den Spielstandschlüssel kennt, kann diesen Garten lesen und verändern. Der Server kann einen verlorenen Schlüssel nicht wiederherstellen. Der Einrichtungscode wird im Browser nicht gespeichert.

Automatische Übertragung erfolgt etwa alle 30 Sekunden bei geöffnetem Spiel und bei Wiederverbindung. Die lokale Speicherung bleibt unmittelbar aktiv; ein abrupt geschlossener Tab kann noch nicht hochgeladene Fortschritte lokal enthalten. Eine neuere Serverrevision erzeugt einen sichtbaren Konflikt. Die Stände werden nicht automatisch zusammengeführt. Beim bewussten Laden liegt der vorherige lokale Garten unter `mondgarten.save.v1.before-online-load (bzw. mondgarten.companion.save.v1.before-online-load)`. Ein JSON-Import oder Spielneustart trennt die Online-Verbindung, damit keine bestehende Online-Sicherung unbeabsichtigt überschrieben wird.

Gesichert werden das Gartenspiel einschließlich Farm sowie die getrennten Gartenaktionen und Begleitpflanzen. Medizinische Einträge, Verbindungskonfiguration der Migräne-App und der Online-Spielstandschlüssel sind nicht Teil des hochgeladenen Inhalts.

## Grenzen und Prüfungen

API-Schreibzugriffe verlangen eine passende Revision; gleichzeitige Schreibzugriffe können nicht beide gewinnen. Neue Sicherungen benötigen einen Einrichtungscode. Der Dienst begrenzt Anzahl der Sicherungen (standardmäßig 100), Anfragegröße (1 MiB), Sicherungsverlauf (zehn Revisionen) und Zugriffsrate. Datenbankdateien liegen außerhalb der veröffentlichten statischen Dateien. API-Antworten werden nicht vom Service Worker gespeichert.

```sh
node --test tests.mjs farm-tests.mjs online-tests.mjs
node scripts/balance.mjs
node build-garden.mjs
```

Die Tests verwenden ausschließlich künstliche Spielstände und kurzlebige lokale Schlüssel. Sie prüfen Verschlüsselung, Manipulationserkennung, falsche Schlüssel, Einladung, Konflikte, konkurrierende Schreibzugriffe, Offline-Wiederholung, Neustart/Persistenz, Versionsbegrenzung, Ursprünge und Pfadschutz. Die Docker-Konfiguration muss auf dem tatsächlichen Zielhost zusätzlich gebaut und gestartet werden.
