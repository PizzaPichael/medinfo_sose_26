# Planungsdokument
**Gruppe**

Slice C — Behandlungsdokumentation & Prozeduren

**Mitglieder**
Joh
Micha

**Modul**
Medizinische Informationssysteme

## 01 Vorgaben

### Bei jedem Vorgang

**Rolle**: Notaufnahme-Software (KIS-Modul)

**Touchpoint**: Patient:in wird aufgenommen, Anamnesebogen wird erfasst.

FHIR-Operationen:
- **/Patient** Sucher oder Neuanlage
- **/Patient** Suche per Krankenversichertennummer
- **/Bundle** (transaction) Patient + Condition (Vorerkrankungen) + MedicationStatement (Dauermedikamente) + Consent (DSGVO)
- **/AuditEvent**
- **/Provenance**

### Slice C — Behandlungsdokumentation & Prozeduren

**Rolle**: Stationsmodul / Pflegedokumentation

**Touchpoint**: Gipsanlage wird dokumentiert, Encounter wird laufend aktualisiert.

FHIR-Operationen:
- **/Patient**?...
- **/Encounter/{id}** — Encounter-Status und -Details aktualisieren
- **/Procedure** — Gipsanlage, Reposition
- **/Bundle** (transaction) — Procedure + aktualisierter Encounter + Provenance
- **/Encounter/{id}/_history** — Versionsverlauf des Encounters abrufen

## 02 Entscheidungen zum Aufbau der Systemarchitektur

### Transaktionen

#### 1. Patient*in abfragen in FHIR und lokal
Wenn nciht existiert, anlegen
Umsetzende: Micha

#### 2. DSGVO checken
Wenn exsitiert, OK
Wenn nicht, unterschreiben lassen
Umsetzende: Joh

#### 3. Anamnesebogen erfassen
Wenn neue Patientin, dann Daten neu erfassen
Wenn Bestandspatientin, dann Abgleich Anamnesebogen mit bestehenden Daten
Umsetzende: Micha

#### 4. Gipsanlage (Prozedurdurchführung mit Dokumentation)
Dass Gips bekommen, wohin in welchen Raum, welche weiteren Maßnahmen getroffen
Encounter wir mit jedem abgeschlossene Procedure geupdated
Umsetzende: Joh

### Aufgaben vom 19.06. - Bis nächstes mal 26.06.

- das Transaktionsdiagramm erstellen für jede Transaktion 
- die FHIR Endpoints für jede Transaktion auflisten 
- Notwendige interne Funktionen umschreiben (Was soll die Funktion machen, z.B. Datenbankzugriff)
- Schemata für unsere Resources definieren (and FHIR orientieren)
    Resourcen:
    - Patient (Micha)    
    - Condition (Micha)  
    - MedicationStatement (Micha)
    - Consent (Joh)
    - Encounter (Joh)
    - Procedure (Joh)

### Fragen an Denny
- Stellen wir eine API bereit für unseren Service?
- Oder sind wir eine CLI?
- Existieren Bundles über Transaktionen hinaus? Also werden sie als Instanzen in der DB gespeichert? Oder leben sie nur so lange, wie die Transaktion lebt?
- Werden Provenance Instanzen auch in der AuditDB gespeichert?
- Dürfen wir auch das Wiki als Planungsdokument angeben?