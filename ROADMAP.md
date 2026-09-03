# BREACHLINE — Living Production Roadmap

> Dieses Dokument ist die verbindliche Reihenfolge für Entwicklung, Asset-Produktion, Tests und Release. Es wird zu Beginn und am Ende jedes Arbeitsblocks aktualisiert.

## Dokumentstatus

| Feld | Stand |
|---|---|
| Letzte Aktualisierung | 2026-09-03 |
| Produktziel | Hochwertiger spielbarer Mobile-Web-Slice |
| Aktuelle Produktionsstufe | P0 — Projektgrundlage, Abschlussarbeiten |
| Aktueller Batch | B0 — Style-Anker: Kandidaten und Ingame-Review |
| Nächstes Gate | G1 — Technisches Fundament freigegeben |
| Primärplattform | Android, Chrome/Chromium, Landscape |
| Mindestgröße | 720 × 360 CSS-Pixel |
| Sekundärziele | Desktop Chrome/Edge; Safari/iOS funktional |

### Statuslegende

- `[ ]` Nicht begonnen
- `[~]` In Arbeit
- `[x]` Abgeschlossen und geprüft
- `[!]` Blockiert oder Entscheidung erforderlich

## Pflegekonvention

Bei jedem Arbeitsblock werden mindestens diese Stellen gepflegt:

1. Datum, aktuelle Produktionsstufe, aktueller Batch und nächstes Gate aktualisieren.
2. Erledigte Aufgaben erst nach Prüfung auf `[x]` setzen.
3. Neue Entscheidungen im Entscheidungsprotokoll ergänzen.
4. Build-, Test- und QA-Ergebnisse im Verifikationsprotokoll festhalten.
5. Neue Aufgaben an der fachlich richtigen Stelle einsortieren, nicht nur am Dokumentende anhängen.
6. Scope-Änderungen zuerst im Abschnitt „Produktumfang“ dokumentieren.

---

# 1. Produktumfang

## 1.1 Verbindlicher Umfang des Slices

- Singleplayer 3v3: ein kontrollierter Soldat plus zwei Friendly Bots gegen drei Enemy Bots
- eine kompakte, neu entwickelte 3-Lane-/Loop-Map
- Rifle, SMG und Shotgun
- Primary-Auswahl vor jeder Runde; kein freier Wechsel während der Runde
- Smoke-Granate als taktische Fähigkeit
- Medkit- und Ammo-Pickups
- automatische Übernahme eines lebenden Friendly Bots nach dem Tod
- 75 Sekunden reguläre Rundendauer
- Pressure Zone ab 20 Sekunden Restzeit
- Rundensieg nach exakt 6,0 Sekunden uncontested Capture
- Sudden Death bei 0:00 bis Elimination oder Capture
- Best of 5; drei Rundensiege gewinnen das Match
- echte 90°-Top-down-Grafik im freundlichen Comicstil
- Zwei-Daumen-Steuerung für Landscape sowie Desktop-Fallback
- modularer TypeScript-/Phaser-3-/Vite-Produktionscode

## 1.2 Bewusst nicht im ersten Slice

- Online-Multiplayer, Accounts oder Backend
- Matchmaking und Ranglisten
- Progression, Shop, Battle Pass oder Monetarisierung
- mehrere Maps oder Spielmodi
- große Cosmetic-Bibliothek
- komplexes Inventar
- vollständige Kampagne
- Single-HTML als primäres Quellformat

## 1.3 Nicht verhandelbare Qualitätsregeln

- V7 ist ausschließlich Verhaltens-, UX- und Art-Direction-Referenz.
- Produktionscode wird nicht aus der alten Single-File-Architektur weiterentwickelt.
- Kein benötigtes Asset darf ausschließlich eingebettet in HTML oder Build-Dateien existieren.
- Alle finalen Assets liegen als separate Quelldateien und als reproduzierbar erzeugte Runtime-Artefakte vor.
- Figuren und Umgebung verwenden eine echte senkrechte 90°-Draufsicht.
- Reload verschiebt nur vorhandene Munition; Munition wird niemals erzeugt.
- Gameplay-Regeln bleiben unabhängig von Darstellung und Eingabe testbar.
- Bei 720 × 360 dürfen HUD und Touch-Steuerung keine kritischen Informationen verdecken.

---

# 2. Verbindliche Spielregeln

## 2.1 Matchflow

```text
Boot
→ Title
→ Loadout
→ Deployment Countdown
→ Combat
→ Pressure Phase bei 20 s
→ Sudden Death bei 0:00
→ Round Result
→ nächstes Loadout oder Match Result
```

## 2.2 Loadout und Munition

- Der Spieler wählt vor jeder Runde Rifle, SMG oder Shotgun.
- Die zuletzt gewählte Waffe bleibt in der nächsten Loadout-Ansicht vorausgewählt.
- Die Auswahl wird mit `DEPLOY` verbindlich.
- Magazin und Reserve sind getrennte Zustände.
- Reload füllt das Magazin ausschließlich aus der Reserve.
- Ein Ammo-Pickup erhöht die Reserve exakt um eine Magazingröße bis zum jeweiligen Reserve-Cap.
- Beim Takeover übernimmt der Spieler den vollständigen Zustand des Bots: Waffe, Magazin, Reserve, Gesundheit, Rüstung und Granate.

## 2.3 Pressure Zone und Sudden Death

- Die Zone erscheint exakt bei 20 Sekunden Restzeit.
- Ein Team erobert sie nach 6,0 Sekunden ohne gegnerischen Soldaten in der Zone.
- Bei Teamwechsel beginnt der Capture-Fortschritt für das neue Team bei 0.
- Bei leerer oder umkämpfter Zone verfällt vorhandener Fortschritt mit 0,8 Sekunden pro realer Sekunde.
- Bei 0:00 friert die Anzeige auf `0:00` ein und Sudden Death beginnt.
- Die Zone bleibt aktiv, bis Capture oder Elimination die Runde entscheidet.

## 2.4 Takeover

Reihenfolge:

1. Tod des kontrollierten Soldaten abschließen.
2. Alle aktiven Touch-, Fire-, Aim- und Smoke-Zustände zurücksetzen.
3. Lebende, nicht exponierte Allies bevorzugen.
4. Innerhalb derselben Priorität den räumlich nächsten Ally wählen.
5. Gleichstand deterministisch über Actor-ID auflösen.
6. Position prüfen und gegebenenfalls depenetrieren.
7. KI des übernommenen Actors deaktivieren.
8. Kamera, HUD und Steuerung sichtbar übertragen.

## 2.5 Vorläufige Balancewerte

| Waffe | Schaden | Magazin | Startreserve | Reserve-Cap | Reload | Rolle |
|---|---:|---:|---:|---:|---:|---|
| Rifle | 31 | 20 | 40 | 60 | 1,55 s | kontrollierte mittlere Distanz |
| SMG | 18 | 28 | 56 | 84 | 1,35 s | mobile Nahdistanz |
| Shotgun | 13 × 7 | 6 | 12 | 18 | 1,80 s | Entry und sehr kurze Distanz |

Diese Werte sind Ausgangswerte. Änderungen erfolgen nur datengetrieben und werden im Entscheidungsprotokoll festgehalten.

---

# 3. Produktions-Gates

Ein nachfolgender großer Produktionsabschnitt beginnt erst, wenn sein Gate erfüllt ist.

## G1 — Technisches Fundament

- [x] Git-Repository und reproduzierbarer Ausgangsstand vorhanden
- [x] TypeScript, Phaser 3 und Vite eingerichtet
- [x] Produktions-Build erfolgreich
- [x] Kernregeln für Ammo, Capture und Takeover getestet
- [~] MatchScene in klar verantwortliche Systeme zerlegt
- [x] deterministischer Zufallsgenerator für Schüsse und KI vorhanden
- [x] Debug-Modi für Kollision, Navigation und Sichtlinien vorhanden

## G2 — Style-Lock

- [ ] Styleguide mit Kamera-, Licht-, Farb- und Konturregeln vorhanden
- [ ] blauer Rifle-Soldat als Character-Anker freigegeben
- [ ] Wandmodul als Environment-Anker freigegeben
- [ ] Kiste als Prop-Anker freigegeben
- [ ] Medkit als Pickup-/UI-Anker freigegeben
- [ ] alle vier Anker funktionieren gemeinsam bei 720 × 360
- [ ] echte 90°-Top-down-Perspektive visuell bestätigt

## G3 — Graybox und Core Combat

- [ ] neue Map ohne finale Grafik spielbar
- [ ] drei Lanes und mindestens zwei Querverbindungen vorhanden
- [ ] alle drei Waffen besitzen sinnvolle Einsatzbereiche
- [ ] Sichtlinien, Smoke, Pickups und Takeover funktionieren
- [ ] Bots erreichen alle spielrelevanten Bereiche

## G4 — First Art Complete

- [ ] alle P0-Assets integriert
- [ ] keine Referenzatlanten mehr im Runtime-Build
- [ ] Figuren, Environment, Props, FX und UI sind stilistisch konsistent
- [ ] vollständiges Match visuell lesbar

## G5 — Release Candidate

- [ ] mobile Layout-Matrix bestanden
- [ ] Balance- und KI-Simulationen bestanden
- [ ] Performanceziele auf Zielgerät erreicht
- [ ] Audio-, Pause-, Fokus- und Resume-Flows geprüft
- [ ] reproduzierbarer Release-Build vorhanden

---

# 4. Professionell sortierte Umsetzungsroadmap

## P0 — Projektgrundlage festigen

Ziel: Aus dem funktionalen Mechanics-Spike eine belastbare Produktionsbasis machen.

- [x] Git initialisieren und Ausgangsstand committen
- [x] Projektkonventionen und Formatierung festlegen
- [~] `MatchScene` in kleinere Systeme zerlegen
- [~] `Actor`, `Weapon`, `Pickup`, `Smoke` und `Round` als klare Zustandsmodelle definieren
- [x] Gameplay-Events für Damage, Death, Capture, Pickup und Takeover einführen
- [x] deterministischen Seed/PRNG einführen
- [x] verbleibende Balancewerte aus Scene-Code entfernen
- [x] Debug-Overlay für FPS, Actor-Positionen und Zustände ergänzen
- [x] Tests für Reload, Reserve-Cap, Capture, Sudden Death und Takeover vervollständigen
- [ ] G1 abnehmen

## P1 — Art Direction und Asset-Vertrag

Ziel: Eine reproduzierbare visuelle Sprache definieren, bevor Bulk-Produktion beginnt.

- [x] Styleguide als eigenes Markdown-Dokument erstellen
- [x] Kameraregel `90° top-down` mit Positiv-/Negativbeispielen dokumentieren
- [x] Rendergröße und gewünschte Ingame-Größe je Assetklasse festlegen
- [x] gemeinsame Lichtquelle und Kontaktschatten definieren
- [x] Konturstärke und Detaildichte definieren
- [x] Teamfarben und neutrale Materialpalette festlegen
- [x] Pivot-, Padding- und Namenskonventionen festlegen
- [~] vier B0-Style-Anker erzeugen
- [ ] Style-Anker einzeln und gemeinsam im Spiel testen
- [ ] G2 abnehmen

## P2 — Asset-Pipeline automatisieren

Ziel: Einzelassets kontrolliert erzeugen, prüfen, normalisieren und reproduzierbar packen.

- [x] Ordner `art/source`, `art/anchors`, `art/approved` und `public/assets/atlases` anlegen
- [x] zentrales Asset-Manifest erstellen
- [ ] Prompt-Vorlagen pro Assetklasse versionieren
- [ ] Transparenz- und Randprüfung automatisieren
- [ ] Trimming, Padding und Größen-Normalisierung automatisieren
- [ ] Pivotpunkte und Kollisions-Footprints als Metadaten speichern
- [ ] Atlas-Packer mit JSON-Ausgabe erstellen
- [ ] automatische Kontaktbögen für Review erzeugen
- [ ] doppelte oder ungenutzte Runtime-Assets melden
- [ ] Build gegen fehlende Quelldateien absichern

## P3 — Neue Map als Graybox

Ziel: Layout und Kampfentfernungen ohne Abhängigkeit von finaler Grafik validieren.

- [ ] Spawnräume und Spawn-Ausgänge definieren
- [ ] obere, mittlere und untere Lane bauen
- [ ] mindestens zwei sichere Querverbindungen bauen
- [ ] zentrale Pressure Zone platzieren
- [ ] hohe Sichtblocker und niedrige Deckung unterscheiden
- [ ] lange ununterbrochene Sichtlinien vermeiden
- [ ] Rifle-, SMG- und Shotgun-Distanzen auf der Map prüfen
- [ ] Pickup-Risiko und -Erreichbarkeit prüfen
- [ ] Navigationsraster und Zielpunkte erzeugen
- [ ] Bot-Stuck-Tests durchführen
- [ ] G3 abnehmen

## P4 — Core Gameplay vervollständigen

Ziel: Alle verbindlichen Spielregeln mit Graybox-Grafik korrekt und testbar abschließen.

- [ ] unabhängige Bewegungs- und Zielrichtung ermöglichen
- [ ] Touch Aim-Lock stabilisieren
- [ ] Fire- und Reload-Flows vervollständigen
- [ ] Rifle-Verhalten finalisieren
- [ ] SMG-Verhalten finalisieren
- [ ] Shotgun-Pellets und Shell-Verbrauch finalisieren
- [ ] Rüstung und Schaden finalisieren
- [ ] Ammo- und Medkit-Regeln finalisieren
- [ ] Smoke-Zielen, Wurf und Sichtblockierung finalisieren
- [ ] Takeover inklusive Kameraübergabe finalisieren
- [ ] Pressure Phase und Sudden Death finalisieren
- [ ] vollständigen Matchflow testen

## P5 — Bulk-Asset-Produktion und Integration

Die Batches werden in dieser Reihenfolge produziert. Jeder Batch folgt demselben Ablauf:

```text
Manifest → Kandidaten erzeugen → Review → gezielte Korrektur
→ Alpha/Größe/Pivot normalisieren → Atlas bauen → im Spiel prüfen → freigeben
```

### B0 — Style-Anker

- [~] blauer Rifle-Soldat
- [~] gerades Wandmodul
- [~] Standardkiste
- [~] Medkit

### B1 — Character-Core

Zuerst Figuren, weil Maßstab, Teamlesbarkeit und Waffen-Pivots alle späteren Assets beeinflussen.

- [ ] neutraler Kontaktschatten
- [ ] blaue und rote Bein-/Körperbasis
- [ ] Standpose
- [ ] kurzer Laufzyklus
- [ ] Rifle-Oberkörper/Waffenvariante
- [ ] SMG-Oberkörper/Waffenvariante
- [ ] Shotgun-Oberkörper/Waffenvariante
- [ ] Mündungsanker je Waffe
- [ ] mindestens zwei Todesposen je Team
- [ ] Player- und Takeover-Marker
- [ ] kleine HUD-Portraits

Technisches Ziel: Beine orientieren sich an Bewegung; Oberkörper und Waffe orientieren sich am Aim.

### B2 — Floor- und Map-Kit

- [ ] sauberer Beton
- [ ] verschmutzter Beton
- [ ] olivfarbene Bodenplatten
- [ ] Warnmarkierungsboden
- [ ] Metallgitter
- [ ] dezente Flecken/Decals
- [ ] Wand gerade, kurz und lang
- [ ] Innen- und Außenecke
- [ ] T-Verbindung
- [ ] Wand-Endstück
- [ ] Türöffnung
- [ ] geschlossene und offene Tür
- [ ] niedrige Deckung

### B3 — Gameplay-Cover und Props

- [ ] Holzkiste
- [ ] lange Versorgungskiste
- [ ] Metallkiste
- [ ] Sandbags
- [ ] Fass
- [ ] Versorgungsschrank
- [ ] Konsole
- [ ] Schreibtisch
- [ ] Serverrack
- [ ] Lüftung
- [ ] Pflanze
- [ ] Kabelrolle
- [ ] Werkzeugwagen
- [ ] Warnkegel und Bodenablauf

### B4 — Pickups, Waffen und Objective

- [ ] Rifle-Icon und World-Asset
- [ ] SMG-Icon und World-Asset
- [ ] Shotgun-Icon und World-Asset
- [ ] Medkit-World-Asset
- [ ] Ammo-World-Asset
- [ ] Smoke-Granate
- [ ] Spawnmarker
- [ ] Pressure-Zone-Markierung
- [ ] Capture-Segmente

### B5 — Combat FX

- [ ] Mündungsfeuer Rifle
- [ ] Mündungsfeuer SMG
- [ ] Mündungsfeuer Shotgun
- [ ] Metalltreffer
- [ ] Betontreffer
- [ ] Staubpartikel
- [ ] Hitmarker
- [ ] Kill-Bestätigung
- [ ] Smoke-Grundformen
- [ ] Laufstaub
- [ ] zurückhaltende Schadens-Decals

### B6 — HUD und Touch-UI

- [ ] Move-Stick
- [ ] Aim-Stick
- [ ] Fire-Button
- [ ] Reload-Button
- [ ] Smoke-Button
- [ ] Health- und Armor-Anzeige
- [ ] Magazin-/Reserve-Anzeige
- [ ] Teamstatus und Alive-Pips
- [ ] Rundentimer
- [ ] Capture-Leiste
- [ ] Loadout-Karten
- [ ] Takeover-Overlay
- [ ] Round- und Match-Result
- [ ] Pause-, SFX- und Shake-Einstellungen

### B7 — Audio

- [ ] Rifle-Schuss
- [ ] SMG-Schuss
- [ ] Shotgun-Schuss
- [ ] Empty-Click
- [ ] Reload
- [ ] Treffer und Kill
- [ ] Materialeinschläge
- [ ] Pickup
- [ ] Smoke-Wurf und -Aktivierung
- [ ] Countdown
- [ ] Pressure Zone
- [ ] Sudden Death
- [ ] Round Win/Loss
- [ ] Takeover

## P6 — Art-Complete-Integration

Ziel: Referenzassets vollständig aus dem Runtime-Build entfernen.

- [ ] Character-Layer und Animationen integrieren
- [ ] Mündungsanker mit Hitscan und FX verbinden
- [ ] Graybox-Boden durch B2 ersetzen
- [ ] Kollisions-Footprints unabhängig von Spriterändern halten
- [ ] Props nach Bodenkontakt korrekt sortieren
- [ ] Pickups und Objective-Grafik ersetzen
- [ ] FX-Budget und Smoke-Layer integrieren
- [ ] HUD und Loadout auf B6 umstellen
- [ ] alle alten Referenzatlanten entfernen
- [ ] Asset-Manifest auf Vollständigkeit prüfen
- [ ] G4 abnehmen

## P7 — KI und taktisches Teamverhalten

- [ ] Wahrnehmungsaktualisierungen zeitlich staffeln
- [ ] Sichtlinie, Sichtdistanz und Smoke korrekt kombinieren
- [ ] letzte bekannte Position verwenden
- [ ] realistische Reaktionszeit verwenden
- [ ] Rifle-Bot als Winkelhalter abstimmen
- [ ] SMG-Bot als Flanker abstimmen
- [ ] Shotgun-Bot als Entry-/Nahbereichsrolle abstimmen
- [ ] doppelte Zielwahl im Team reduzieren
- [ ] Pressure-Zone-Prioritäten ergänzen
- [ ] taktische Smoke-Nutzung ergänzen
- [ ] Navigation gegen Sackgassen und Schleifen testen
- [ ] große Anzahl simulierter Matches auswerten

## P8 — Game Feel und Präsentation

- [ ] Rückstoß je Waffe abstimmen
- [ ] Trefferreaktionen ergänzen
- [ ] Screen Shake begrenzen und abschaltbar machen
- [ ] Laufbewegung und Character-Bobbing abstimmen
- [ ] Mündungslicht und Impacts abstimmen
- [ ] Pickup- und Capture-Puls ergänzen
- [ ] Takeover-Kamerafahrt und Übergabe-Overlay polieren
- [ ] Pressure- und Sudden-Death-Inszenierung polieren
- [ ] Audio-Mix auf Smartphone-Lautsprecher testen
- [ ] visuelle und akustische Informationsüberladung prüfen

## P9 — Mobile UX und Safe Areas

- [ ] Layout 720 × 360 prüfen
- [ ] Layout 800 × 360 prüfen
- [ ] Layout 844 × 390 prüfen
- [ ] Layout 915 × 412 prüfen
- [ ] Layout 960 × 432 prüfen
- [ ] Layout 1280 × 720 prüfen
- [ ] 21:9-Verhalten prüfen
- [ ] `env(safe-area-inset-*)` auf allen Seiten berücksichtigen
- [ ] Touchflächen mindestens 44 CSS-Pixel groß halten
- [ ] gleichzeitige Move-, Aim- und Fire-Pointer testen
- [ ] `pointercancel`, Fokusverlust und Resume testen
- [ ] Vollbild optional halten
- [ ] Portrait-Hinweis prüfen
- [ ] echte Android-Chrome-Session testen
- [ ] Safari/iOS-Funktionstest durchführen

## P10 — Performance, Balance und Stabilität

- [ ] Ziel von 60 FPS auf durchschnittlichem Android-Gerät prüfen
- [ ] Device Pixel Ratio begrenzen
- [ ] Allokationen im Update-/Render-Loop reduzieren
- [ ] Atlaswechsel und Draw Calls prüfen
- [ ] Partikel- und Smoke-Budget begrenzen
- [ ] Navigations- und Sichtlinienlast profilieren
- [ ] Speicherverbrauch über mehrere Matches prüfen
- [ ] kalten Start und Asset-Ladezeit messen
- [ ] Waffen-Time-to-Kill vergleichen
- [ ] Team-Winrate in Bot-Simulationen auswerten
- [ ] Map-Heatmaps beziehungsweise Death Locations prüfen
- [ ] Spawnvorteile und dominante Winkel korrigieren
- [ ] langen Match-Stresstest durchführen

## P11 — Release Candidate und Packaging

- [ ] finalen Vite-Web-Build erstellen
- [ ] Sourcemaps und Debug-Optionen für Produktion konfigurieren
- [ ] Runtime-Assets komprimieren und versionieren
- [ ] Asset-Hashes und Manifest erzeugen
- [ ] Lizenz-/Quellenverzeichnis prüfen
- [ ] reproduzierbare Build-Anleitung aktualisieren
- [ ] optionales PWA-Manifest prüfen
- [ ] Deployment-Ziel definieren
- [ ] finalen Browser-Smoke-Test durchführen
- [ ] G5 abnehmen
- [ ] Release-Version markieren

---

# 5. Asset-Produktionsregeln

## 5.1 Allgemeine Regeln

- Keine vollständigen Sprite-Sheets in einem einzigen Bildgenerierungsschritt erzeugen.
- Pro Asset oder eng zusammengehöriger Variante einen kontrollierten Generierungsvorgang verwenden.
- Freigegebene Ankerbilder bei jeder neuen Generierung als Stilreferenz einsetzen.
- Quellbilder nicht destruktiv überschreiben; Varianten versionieren.
- Automatisch erzeugte Atlanten niemals als einzige Quelle behandeln.
- Im Spiel nicht verwendete Kandidaten nicht in den Runtime-Build aufnehmen.

## 5.2 Character-Regeln

- ausschließlich Helmkrone, Schultern, Rücken, Arme, Beine und Waffenoberseite sichtbar
- keine Gesichter oder Brustansicht
- symmetrischer, kompakter Kontaktschatten
- Lauf- und Zielrichtung technisch trennbar
- Teamfarbe mindestens an zwei großen Körperflächen sichtbar
- Waffen bei finaler Ingame-Größe unterscheidbar
- identischer Pivot für gleichartige Character-Layer

## 5.3 Environment-Regeln

- ausschließlich Oberseiten; keine Wandfassaden
- Rastermaß und Kollisions-Footprint müssen zusammenpassen
- Dekoration darf Kollisionsgrenzen nicht verschleiern
- Hindernishöhe wird durch Farbe, Kontur und Symbolik vermittelt
- Bodentexturen müssen ohne harte sichtbare Nähte kachelbar sein
- Schatten dürfen keine falschen begehbaren Flächen vortäuschen

## 5.4 Technische Dateiregeln

Empfohlenes Schema:

```text
category_subject_variant_state_vNN.png
```

Beispiele:

```text
character_blue_rifle_idle_v01.png
character_red_legs_walk02_v01.png
environment_wall_corner_outer_v02.png
pickup_medkit_idle_v01.png
fx_muzzle_rifle_01_v01.png
ui_button_fire_default_v01.png
```

---

# 6. Test- und Abnahmematrix

## 6.1 Automatisierte Tests

- [x] Ammo-Erzeugung und Reload-Transfer
- [x] Reserve-Cap und Ammo-Pickup
- [x] Capture nach 6,0 Sekunden
- [x] Capture-Verfall und Teamwechsel
- [x] deterministische Takeover-Auswahl
- [x] Pressure-Aktivierung exakt bei 20 Sekunden
- [x] Sudden Death exakt bei 0:00
- [ ] Shotgun verbraucht eine Shell pro Schuss
- [ ] Smoke blockiert Sicht, nicht Projektile
- [ ] Rundensieg nur einmal auslösbar
- [ ] Touchzustände nach Takeover vollständig gelöscht
- [ ] Match endet nach drei Rundensiegen

## 6.2 Manuelle Spieltests

- [ ] vollständiges Match mit Rifle
- [ ] vollständiges Match mit SMG
- [ ] vollständiges Match mit Shotgun
- [ ] Takeover mit jeder Waffenklasse
- [ ] Capture vor 0:00
- [ ] Capture während Sudden Death
- [ ] Elimination während Sudden Death
- [ ] leerer Reservebestand und partieller Reload
- [ ] Smoke zwischen Beobachter und Gegner
- [ ] Pause/Fokusverlust bei gehaltenem Fire-Button

## 6.3 Visuelle Abnahme

- [ ] Figuren ausnahmslos 90° Top-down
- [ ] Teamfarben bei 64 px klar unterscheidbar
- [ ] Waffen bei 64 px unterscheidbar
- [ ] Kollisionsgrenzen visuell nachvollziehbar
- [ ] HUD überdeckt keine wesentlichen Ziele
- [ ] Capturing, Contested und Sudden Death sofort verständlich
- [ ] keine ungewollten Texte, Logos oder Bildartefakte

---

# 7. Definition of Done für den Slice

Der Slice gilt erst als fertig, wenn alle Punkte erfüllt sind:

- [ ] Ein vollständiges Best-of-5-Match ist ohne Neustart spielbar.
- [ ] Loadout und feste Rundenausrüstung funktionieren.
- [ ] Munition kann nicht unbeabsichtigt erzeugt werden.
- [ ] Pressure Zone und Sudden Death entsprechen exakt der Spezifikation.
- [ ] Takeover funktioniert für alle lebenden Friendly Bots.
- [ ] Bots bleiben nicht dauerhaft hängen und respektieren Sichtblocker.
- [ ] Alle finalen Assets sind eigenständig, konsistent und echte Draufsicht.
- [ ] Keine Referenzatlanten befinden sich mehr im Runtime-Build.
- [ ] Das HUD funktioniert bei 720 × 360 und bis 21:9.
- [ ] Das Spiel erreicht das definierte Performanceziel auf Android.
- [ ] Build, Tests und Asset-Pipeline sind reproduzierbar.
- [ ] Quelldateien, Prompts, Metadaten und Lizenzen sind dokumentiert.

---

# 8. Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme | Status |
|---|---|---|
| Generierte Assets driften stilistisch | kleine Batches, freigegebene Anker, Kontaktbögen | offen |
| Perspektive wird erneut pseudo-isometrisch | harte 90°-Regeln und Prüfung vor Freigabe | offen |
| Character-Animationen wirken inkonsistent | Beine/Oberkörper/Waffe schichten und Animation klein halten | offen |
| Atlanten werden zu groß | Master und Runtime trennen; Größenbudget pro Batch | offen |
| HUD verdeckt Spielraum | frühe Tests ab 720 × 360 | offen |
| KI erzeugt Lastspitzen | Wahrnehmung und Navigation zeitlich staffeln | offen |
| Scope wächst während der Produktion | Slice-Grenzen in Abschnitt 1 verbindlich halten | offen |

---

# 9. Entscheidungsprotokoll

| Datum | Entscheidung | Begründung |
|---|---|---|
| 2026-09-03 | V7 bleibt reine Referenz | Produktionscode soll modular und wartbar sein |
| 2026-09-03 | TypeScript + Phaser 3 + Vite | geeignete 2D-Mobile-Web-Basis |
| 2026-09-03 | echte 90°-Draufsicht | einfachere Asset-Produktion, Rotation, Kollision und Sichtlinien |
| 2026-09-03 | eigene Assets statt Abhängigkeit von einem fremden Komplettpaket | konsistente Art Direction und vollständige Kontrolle |
| 2026-09-03 | Einzelasset-Generierung mit anschließendem Atlas-Packaging | bessere Konsistenz und Korrigierbarkeit |
| 2026-09-03 | Primary wird vor jeder Runde gewählt und danach gesperrt | klarere Rollen und deterministische Munition |
| 2026-09-03 | Takeover bleibt Kernmechanik | Teil der Singleplayer-Team-Shooter-Identität |
| 2026-09-03 | Pressure Zone ab 20 Sekunden, Sudden Death ab 0:00 | klare Endphase ohne unentschiedene Runde |
| 2026-09-03 | Matchzeit als isoliertes, getestetes Modell | Pressure-/Sudden-Death-Grenzen bleiben unabhängig von der Szene überprüfbar |
| 2026-09-03 | Seeded PRNG für Match-Entscheidungen | KI- und Streuungsabläufe können reproduziert und debuggt werden |
| 2026-09-03 | F3-Debug-Overlay im Entwicklungsbuild | Navigation, Kollisionen, Sicht- und Actorzustände sind direkt sichtbar |
| 2026-09-03 | B0 arbeitet nur mit einzeln generierten, transparenten Kandidaten | Top-down-Perspektive, Pivot und Runtime-Größe bleiben einzeln prüfbar |

---

# 10. Verifikationsprotokoll

| Datum | Bereich | Ergebnis |
|---|---|---|
| 2026-09-03 | TypeScript/Vite Production Build | erfolgreich |
| 2026-09-03 | Regeltests | 9/9 bestanden |
| 2026-09-03 | Dev-Server und Referenzatlanten | HTTP 200 |
| 2026-09-03 | automatisierte visuelle Browserprüfung | Browser-Steuerungsverbindung nicht verfügbar; erneut durchführen |
| 2026-09-03 | P0-Regel- und Modelltests | 13/13 bestanden: Ammo, Capture, Takeover, PRNG und Matchzeit |
| 2026-09-03 | P0-Produktions-Build | erfolgreich; Phaser weist nur auf eine große, erwartete Vendor-Chunk-Größe hin |
| 2026-09-03 | P0-Baseline-Snapshot | Commit `b134998` erstellt |
| 2026-09-03 | B0-Quellkandidaten | vier PNGs mit transparenten Ecken abgelegt; Ingame-Review steht aus |
| 2026-09-03 | B0-Review-Szene | Build erfolgreich; erreichbar über `?art-review`, visuelle Abnahme auf Zielgerät steht aus |
| 2026-09-03 | B0-Kandidaten-Snapshot | Commit `2bdccb5` erstellt |

---

# 11. Unmittelbar nächste Arbeitsreihenfolge

1. P0 abschließen und G1 freigeben.
2. Styleguide und Asset-Vertrag erstellen.
3. B0-Style-Anker einzeln generieren und im Spiel prüfen.
4. G2 gemeinsam abnehmen.
5. Asset-Pipeline automatisieren.
6. neue Map als Graybox entwickeln und G3 abnehmen.
7. B1 Character-Core produzieren und integrieren.
8. B2 Floor-/Map-Kit produzieren und integrieren.
9. B3 Props und Cover produzieren und integrieren.
10. B4 Pickups, Waffen und Objective produzieren und integrieren.
11. B5 Combat FX produzieren und integrieren.
12. B6 HUD/Touch-UI produzieren und integrieren.
13. B7 Audio produzieren und integrieren.
14. Referenzassets entfernen und G4 abnehmen.
15. KI, Game Feel, Mobile UX, Performance und Balance abschließen.
16. Release Candidate bauen und G5 abnehmen.
