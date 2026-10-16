# Supabase im kostenlosen Tarif einrichten

Die App kann auf ihrer bisherigen statischen Webseite bleiben. Supabase speichert die verschlüsselten Gartensicherungen; ein eigener Server ist dafür nicht erforderlich. Die Anbindung benötigt die Projekt-URL und den **öffentlichen Publishable-/anon-Key**. Ein Secret-/service_role-Key oder Datenbankpasswort gehört weder ins Spiel noch ins Repository.

## Einmalig im Dashboard

1. Auf <https://supabase.com/dashboard> ein Projekt erstellen und warten, bis die Datenbank bereit ist.
2. Unter **Project Settings → API Keys** den **Publishable Key** kopieren (`sb_publishable_…`). Bei älteren Projekten ist der öffentliche Schlüssel als `anon` unter den Legacy-API-Keys aufgeführt. Die **Project URL** steht unter **Project Settings → Data API**.
3. Im **SQL Editor** eine neue Abfrage öffnen, den gesamten Inhalt von [setup.sql](setup.sql) einfügen und **Run** wählen. Das SQL lässt sich erneut ausführen, ohne vorhandene Sicherungen zurückzusetzen.
4. In einer zweiten Abfrage den folgenden Block ausführen. Er erzeugt einen zufälligen Einrichtungscode, speichert dessen Hash und zeigt den Code einmal im Ergebnis. Diesen Code im Passwortmanager aufbewahren und nur bei der ersten Einrichtung im Spiel eingeben. Er gehört nicht ins Repository oder in den Chat.

```sql
with token as (
  select encode(extensions.gen_random_bytes(24),'hex') as code
), saved as (
  update garden_private.settings
  set invite_hash=encode(extensions.digest((select code from token),'sha256'),'hex')
  where id=true returning id
)
select code as einrichtungscode from token,saved;
```

Der Block ändert bei erneutem Ausführen den Einrichtungscode. Bereits angelegte Spielstände und deren Spielstandschlüssel bleiben gültig.

## Im Spiel verbinden

Gartenmenü → Einstellungen → Online-Spielstand → **Supabase**. Projekt-URL und öffentlichen Key eintragen, einen neuen Spielstandschlüssel erzeugen und diesen ebenfalls sicher aufbewahren. Den Einrichtungscode aus Schritt 4 eingeben und **Verbinden und Spielstand prüfen** wählen.

Auf einem weiteren Gerät werden derselbe Spielstandschlüssel sowie dieselben öffentlichen Projekteinstellungen verwendet. Die App fragt, ob sie den Online-Stand laden oder den lokalen Stand online übernehmen soll. Beim Laden bleibt zuvor eine lokale Sicherung erhalten. Ein Import oder Neustart trennt die Online-Verbindung und erhält die bisherige Online-Sicherung.

Die öffentlichen Projekteinstellungen können in `mondgarten/online-settings.mjs` vorbelegt werden. Dort stehen ausschließlich URL und öffentlicher Key. Einrichtungscode und persönlicher Spielstandschlüssel bleiben außerhalb des Repositorys.

## Was gespeichert wird

Gartenspiel, Farm, Begleitpflanzen und Gartenaktionen werden im Browser mit AES-GCM verschlüsselt. Medizinische Einträge und deren Verbindungseinstellungen werden nicht hochgeladen. Die Datenbank erhält nur verschlüsselte Nutzdaten. Aus dem persönlichen Spielstandschlüssel werden getrennte Verschlüsselungs- und API-Zugriffsschlüssel abgeleitet. Supabase oder ein verlorener Projektzugang können den persönlichen Spielstandschlüssel nicht ersetzen.

Automatisches Sichern erfolgt ungefähr alle 30 Sekunden bei geöffnetem Spiel. Offline-Fortschritte bleiben lokal und werden später übertragen. Bei parallelen Änderungen auf zwei Geräten stoppt der automatische Upload und bittet um Auswahl; es gibt keinen stillen Austausch des neueren Stands.

`garden_private` ist nicht als öffentliche Tabelle freigegeben. Nur die beiden geprüften RPC-Funktionen lesen und schreiben nach Prüfung des Spielstandschlüssels. Neue Sicherungen verlangen den Einrichtungscode. Standardmäßig sind zehn Sicherungen mit jeweils zehn verschlüsselten Revisionen erlaubt. Das bleibt für eine persönliche Umgebung innerhalb eines kleinen Speicherbudgets. Vor einem Projektwechsel oder Löschen weiterhin den JSON-Export nutzen.

## Verifikation

```sh
node --test tests.mjs farm-tests.mjs online-tests.mjs
# Gegen einen ausschließlich für Tests angelegten PostgreSQL-17-Container:
node scripts/test-supabase.mjs mondgarten-pg-test
# Optional mit einer extern installierten playwright-core-Bibliothek und Chromium:
PLAYWRIGHT_CORE_PATH=/pfad/zu/playwright-core node scripts/browser-smoke.cjs --supabase
```

Der Browser-Test nutzt künstliche Spielstände und eine lokale RPC-Testbrücke zu echten PostgreSQL-Funktionen. Er prüft Farmbedienung, zwei Geräte, verschlüsselte Sicherung, Wiederherstellung, getrennte medizinische Daten und Konflikte. Die Erreichbarkeit des persönlichen Supabase-Projekts muss nach dessen Einrichtung gesondert geprüft werden.
