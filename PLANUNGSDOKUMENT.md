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

### Grundarchitektur

Wir sind eine API. Unsere Clients: Postman und Swagger-UI (`/api-docs`). Gegenüber dem öffentlichen HAPI-FHIR-Server (`https://hapi.fhir.org/baseR4`) sind wir selbst Client.

Aufbau als Schichten, jeder Request läuft denselben Weg:

- **Server** (`src/server.js`): nur Routing + OpenAPI-Kommentare
- **Handler** (`src/handler/handler.js`): übersetzt HTTP ↔ Service-Aufrufe, keine Fachlogik
- **Services** (`src/Services/`): die eigentlichen Transaktionen
- **Clients**: `DataBaseClient` (lokale MongoDB) und `FhirClient` (HAPI)

Verdrahtung komplett per Konstruktor-Injection in `src/app.js`. Grund: Tests können Fake-Objekte mit gleichen Methodennamen reingeben, kein Mocking-Framework nötig.

Kein NestJS o.ä.: Einarbeitung lohnt bei 4 Transaktionen nicht, Express kannten wir schon.

Beide Clients implementieren `getPatientByFilter` mit denselben FHIR-Suchparameternamen (`family`, `given`, `birthdate`). Dadurch ist die Suche lokal und in FHIR derselbe Codepfad. Lokal übersetzt `buildMongoFilter` die FHIR-Namen in Mongo-Feldpfade.

### Technologien

- **Node.js + Express 5**, ES Modules. JavaScript, JSDoc an allen Funktionen.
- **Yarn 4** mit `nodeLinker: node-modules`
- **`node:test`**
- **swagger-jsdoc + swagger-ui-express**: Doku direkt an den Routen. Rückblick: Kommentarblöcke in `server.js` sind lang geworden, auslagern wäre sauberer.
- **JWT (RS256)** via `jsonwebtoken`. Schlüsselpaar lokal generiert (`src/auth/gen-jwt-keys.mjs`), Testbenutzer aus `.env`. Keine Benutzer-DB, wäre für den Umfang übertrieben. Alle Routen außer `/ping` und `/login` brauchen Bearer-Token.

### Datenhaltung

- **MongoDB** per Docker (`yarn mongo`), **Mongoose** als ODM. Warum Mongo statt relational: FHIR-Ressourcen sind verschachteltes JSON mit vielen optionalen Feldern, auf Tabellen normalisieren wäre unnötiger Aufwand. Struktur kommt über Mongoose-Schemata (`src/db/schemas/`), an FHIR R4 orientiert.
- **Zwei getrennte DBs** auf einer Instanz: `docAndProcedures` (Fachdaten) und `audit`. Trennung war Vorgabe. Technische Folge: AuditClient braucht eigene `mongoose.createConnection`, weil die Default-Connection von der Fach-DB belegt ist. Audit-Schemata exportieren deshalb nur das rohe Schema, kein fertiges Model.
- **Lokale DB = Arbeitskopie, HAPI = gemeinsame Wahrheit.** Bei Registrierung wird in beiden gesucht:
    - nur in FHIR gefunden → lokal übernehmen, FHIR-id behalten
    - nirgends gefunden → zuerst in FHIR anlegen, lokale Kopie bekommt die FHIR-id (ids laufen nicht auseinander)
    - nur lokal gefunden → nach FHIR pushen
    - mehrere Treffer bei Name + Geburtsdatum → Tiebreaker über Familienstand, Adresse, Telefon; bleibt nichts Eindeutiges übrig → 400 statt raten
- **Verworfen**: alles direkt auf HAPI ohne lokale DB. Öffentlicher Server wird von allen Kursen beschrieben, ist teils langsam, und fürs Audit brauchten wir eh eigene Persistenz.
- **Bundles** werden nicht persistiert, sie leben nur während der Transaktion (Antwort auf Frage an Denny). `Bundle.schema.js` existiert, ist aktuell ungenutzt.

### Audit-System

- Observer-Pattern über geteilten `EventEmitter` (`src/audit/audit-emitter.js`). Handler und Services emittieren `auditEvent`s mit `transactionId`, Timestamp, Typ (z.B. `localSearch`, `fhirSearch`, `patientCreated`) und Statuscode. Services kennen den AuditClient nicht.
- `transactionId` wird pro Request im Handler erzeugt und durchgereicht → alle Teilschritte einer Transaktion in der Audit-DB korrelierbar.
- Audit-DB down darf weder Events verlieren noch den Service crashen: fehlgeschlagene Writes landen in einer NDJSON-Disk-Queue (`audit-queue.ndjson`), periodischer Timer + jeder neue Write stoßen den Flush an, Reihenfolge bleibt erhalten (fortlaufende `entryId` über atomare Counter-Collection).
- Verworfen: Audit in dieselbe DB wie Fachdaten. Hätte weder die geforderte Trennung noch die Ausfallsicherheit gebracht.

### Fehlerbehandlung

Eigene Klasse `AppError` (Message + HTTP-Statuscode). Services/Clients werfen mit passendem Code (400 Validierung, 404 nicht gefunden, 409 Konflikt, 500 DB), Handler mappt auf die Response, Default 500. Bewusst minimal.

### Transaktionen

#### 1. Patient*in abfragen in FHIR und lokal — `POST /registerPatient`
Wenn nicht existiert, anlegen (lokal + FHIR, siehe Datenhaltung).
Umsetzende: Micha

#### 2. DSGVO checken — `POST /consent`, `GET /consent/{patientId}`
Wenn existiert und gültig (Status `active`, Entscheidung `permit`, heute innerhalb der Gültigkeitsperiode), OK.
Wenn nicht, unterschreiben lassen (neuen Consent anlegen).
Umsetzende: Joh

#### 3. Anamnesebogen erfassen — `POST /anamnesis`
Input: FHIR-Bundle (transaction) mit Conditions (Vorerkrankungen) und MedicationStatements (Dauermedikamente).
Vorbedingungen: Patient:in existiert lokal, Consent gültig.
Wenn neue Patientin, dann Daten neu erfassen.
Wenn Bestandspatientin, dann Abgleich: vorhandene Einträge (gleicher Code der CodeableConcept) werden übersprungen, nur Neues gespeichert.
Beide Fälle sind derselbe Algorithmus, bei Neuen ist die Bestandsliste leer.
Umsetzende: Micha

#### 4. Gipsanlage (Prozedurdurchführung mit Dokumentation) — `POST /encounter` (erster Teil)
Dass Gips bekommen, wohin in welchen Raum, welche weiteren Maßnahmen getroffen.
Encounter wird mit jeder abgeschlossenen Procedure geupdated.
Stand: offener Encounter wird angelegt, 409 wenn schon einer `in-progress` ist. Procedure-Teil folgt.
Umsetzende: Joh

### Rückblick / würden wir heute anders machen

- `/createPatient` ist funktional Teilschritt von `/registerPatient`, könnte weg
- Token-Prüfung existiert doppelt (Middleware in `server.js` + `handler.authenticateJWT`)
- Consent-Pfad wirft teils generische `Error` statt `AppError` → Fehler kommen dort als 500 an
- `AppError`-Argumentreihenfolge an einzelnen Stellen vertauscht


### Was wir zeitlich nicht geschafft haben
#### Anamnese
1. FHIR-Sync der Anamnese-Daten\
Conditions und MedicationStatements werden nur lokal gespeichert, nichts geht an FHIR. Fehlt: Prüfung, ob die Einträge in FHIR schon existieren / aktuell sind, und Push der fehlenden per transaction-Bundle  (postTransactionBundle im FhirClient existiert noch nicht, createPatient und createEncounter sind da, das generische Bundle-POST nicht).

2. Encounter-Anbindung\
/encounter existiert inzwischen als eigene Transaktion, aber die Anamnese nutzt sie nicht: kein Check/Anlegen eines offenen Encounters im Anamnese-Flow, und neue Conditions/MedicationStatements bekommen keine encounter.reference bzw. context.reference gesetzt.

3. Datensparsamkeit\
Entscheidung, welche Patientenfelder nur in FHIR liegen dürfen, steht aus, danach lokales Löschen nach
erfolgreichem Sync. Hängt an Punkt 1, sonst Datenverlust.

4. Automatisierte Tests fehlen komplett\
test/Services/anamnesis-capture-service.test.js existiert nicht, auch
keine Handler-Tests für captureAnamnesis und keine db-client-Tests für die 4 Condition/MedicationStatement-Methoden. Bisher nur manuell/Smoke-getestet.

#### Generell
1. Provenance\
steht in den Vorgaben („Bei jedem Vorgang"), ist nirgends implementiert.

### Aufgabenaufteilung

- das Transaktionsdiagramm erstellen für jede Transaktion 
    - Pateinten Checkin (Micha)
    - Anamnese erstellen (Micha)
    - Consent abfragen (Joh)
    - Gipsanlage (Joh)
- Transaktionen implementieren
- Authentification (Joh)
- Audit (Micha)
- Schemata für unsere Resources definieren (an FHIR orientieren)
    Resourcen:
    - Patient (Micha)    
    - Condition (Micha)  
    - MedicationStatement (Micha)
    - Consent (Joh)
    - Encounter (Joh)
    - Procedure (Joh)
