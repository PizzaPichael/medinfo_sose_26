# Planungsdokument
## Gruppe
Slice C — Behandlungsdokumentation & Prozeduren

## Mitglieder
X
Y

## Modul
Medizinische Informationssysteme

## Entscheidungen zum Aufbau der Systemarchitektur

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


### Bis nächstes mal

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

### Fragen and Denny
- Stellen wir eine API bereit für unseren Service?
- Oder sind wir eine CLI?
- 