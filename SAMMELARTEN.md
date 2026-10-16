> Stand 16. Oktober 2026: Die aktuelle Werkstatt-, Obstgarten- und Helferlogik steht in [GARTEN-TECHNIK.md](GARTEN-TECHNIK.md). Die folgenden Abschnitte beschreiben teilweise den vorherigen Stand. Aktuelle Regressionstests: `node --test tests.mjs farm-tests.mjs comfort-tests.mjs garden-ledger-tests.mjs`.

# Sammelarten schnell austauschen

Die zentrale Datei ist `dist/content.mjs`. Darstellung, Ernte, Inventar, Transportanimation und Verkauf verwenden dieselben Definitionen. Der Spielstand speichert den Erntewert bereits beim Einsammeln; ein späterer Ortswechsel ändert den Wert der getragenen Ernte nicht.

## Vorhandene Form auswählen

Jede Ernteart hat ein `model` und eine Transportform `bundle`:

| `model` | Darstellung | Typische Transportform |
| --- | --- | --- |
| `blossom` | Fünfblättrige Blüte mit Stiel und Blättern | `bale` – gebundenes Bündel |
| `sprig` | Aufrechter Lavendelzweig | `bale` |
| `crystal` | Drei Kristallspitzen | `crate` – gefüllte Kiste |
| `mushroom` | Runder Pilz mit Punkten | `crate` |
| `fruit` | Frucht am Stiel | `crate` |

Für einen neuen Inhalt mit einer dieser Formen genügt ein neuer Eintrag in `COLLECTIBLES`. Farben und Namen werden daraus gelesen; es braucht keine neue Erntelogik.

```js
moonberry: {
  name: 'Mondbeere',
  plural: 'Mondbeeren',
  action: 'sammeln',
  model: 'fruit',
  bundle: 'crate',
  color: '#c880b8',
  accent: '#f6cde9',
  stem: '#749b5b',
  wrap: '#c9a778',
  tie: '#f1dbad',
  value: 2,
  regrowSeconds: 45,
  height: 1.15,
  width: .65,
  rareChance: .04,
  collectSound: 820,
  sparkles: '#fbd8ef'
}
```

Die `crop`-Referenz am zugehörigen Inhalt beziehungsweise Beet muss auf diese ID zeigen. Beispiel für die aktuelle Garten-Zuordnung: `crop: 'moonberry'`. Namen, Wert, Nachwachszeit, Größe und Farbe haben damit eine einzige Quelle. Nach einer Konfigurationsänderung die Seite neu laden. Auf der gehosteten Seite wird dafür eine neue Veröffentlichung benötigt.

Ein völlig neuer geometrischer Grundtyp braucht zusätzlich eine Factory in `CROP_MODELS` in `dist/scene.js` und einen Eintrag unter den unterstützten Modellen in `validateContent()`. Bestehende Formen umzubenennen oder umzufärben braucht das nicht.

## Beete und Stapel

`WORLD.fields` beschreibt die Beete als Rechtecke mit Mittelpunkt `x/z`, `columns`, `rows` und `spacing`. Daraus erzeugt `generateFieldCells()` alle Pflanzenpositionen. Mehr oder dichtere Pflanzen brauchen keine anderen Spielregeln.

`WORLD.stack` steuert die sichtbaren Bündel: Anzahl, Höhe und wie viele Inventareinheiten eine sichtbare Lage repräsentiert. Die Anzeige bleibt bei großen Inventaren begrenzt; die tatsächliche Stückzahl und der tatsächliche Wert bleiben vollständig erhalten.

`WORLD.bank` und `WORLD.selling` legen Verkaufsstelle, Radius und Abladegeschwindigkeit fest. `WORLD.camera` steuert Draufsicht und Verfolgung.

## Zuständigkeiten

- `content.mjs`: Inhalte und Einstellungen.
- `harvest.mjs`: Ernte, Nachwachstum, portionsweiser Verkauf und Weltgrenzen; unabhängig vom Browser testbar.
- `core.mjs`: Wirtschaft, Verbesserungen, Aufträge, langfristige Boni und alte Spielstandkompatibilität.
- `scene.js`: 3D-Formen, Instanzen, Figuren, Stapel und Fluganimationen.
- `controls.js`: Tastatur, Klickbewegung und Joystick.
- `game.js`: Verbindet die Bausteine mit den Menüs.

## Prüfen

`node tests.mjs` prüft alle bestehenden Erntearten mit demselben Ablauf, einschließlich Restkapazität, seltenen Funden, Nachwachsen und Erhaltung des Verkaufswerts.

Mit `node server.mjs` und der lokalen Seite `/__render-check` können die fünf Grundformen, Bündel und Stapelhöhen betrachtet werden. Dieser Prüfaufbau liegt außerhalb von `dist` und wird nicht veröffentlicht.

## Eigener Garten, Werkstätten und Automatisierung

`dist/village-content.mjs` ist der zweite Inhaltskatalog. `BEDS` definiert feste Beetplätze, Ernteart, Freischaltpreis und Upgradepreis. `WORKSHOPS` definiert feste Werkstattplätze, 3D-Grundmodell, Rezeptzutaten, Arbeitszeit und Voraussetzungen. `PRODUCTS` definiert Namen und Grundverkaufswerte der Produkte. `VILLAGE` enthält unter anderem Schneckentempo, Preise, Transportkapazitäten, Wohnfläche, Lager, Bewässerung und Kaufverhalten.

Beispiel für ein neues Rezept innerhalb einer vorhandenen Werkstatt:

```js
{ id: 'tea', product: 'tea', inputs: { lavender: 8 }, seconds: 9, ... }
```

Zutaten-IDs können Erntearten aus `COLLECTIBLES` oder bereits hergestellte Produkte aus `PRODUCTS` sein. Die gemeinsame Produktionslogik nimmt Zutaten beim Start aus dem Lager und speichert den laufenden Auftrag. Beim Fertigstellen wird Platz für das Produkt berücksichtigt. Die automatische Verkäuferin hält benötigten Sternentee und Duftöl für die bestehende Elixierproduktion zurück.

`village.mjs` enthält die testbare Wirtschaft des Gartens: Lager, Rezepte, Bodenflächen, Anzahlungen und Offline-Fortschritt. `automation.mjs` enthält die Bewegung und Aufgaben der Schnecken und des Lieblingsmenschen. `harvest.mjs` erzeugt nur die bereits freigeschalteten Beete und erhält beim Ausbau bestehende Ernteschneisen. `scene.js` zeichnet gleichzeitig verschiedene Erntearten, Gebäudemodelle, Schnecken und die zugehörigen Kauf-Flächen.

Der aktuell verwendete Beetaufbau kommt aus `BEDS`; `WORLD.fields` und `GARDENS` bleiben als Referenzen für die isolierte Darstellungskontrolle und alte Spielstände erhalten. Sie steuern keine freischaltbaren neuen Welten im aktuellen Spiel.

## 77 Gartenrunden

journey.mjs enthält JOURNEY (77 Runden, 240 frische und insgesamt 600 aktive Sekunden pro Tag), buildRule (erste Sichtbarkeit, Stufenabstand, endgültiges Maximum), Tagesbelohnungen und die Ertragsskalierung. Die Schwellen regeln Kategorien, keine vorgegebenen Einkaufsaufträge. SEEDS in village-content.mjs unterscheidet gekaufte und beim vorherigen Beet gefundene Pflanzensorten. Diese Beetsamen sind getrennt von den sieben Samen-Belohnungen für die spätere Begleit-App. Der interne alte Bezeichner sprinkler bleibt für Sicherungen erhalten; die Anzeige heißt Gartenpflege.
