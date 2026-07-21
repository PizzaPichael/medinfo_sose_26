# MedInfo SoSe 26 — Slice C: Behandlungsdokumentation & Prozeduren

KIS-Modul für Patientenaufnahme, DSGVO-Consent, Anamnesebogen und Encounter-Dokumentation.
REST-API auf Node.js/Express mit lokaler MongoDB und Anbindung an den öffentlichen HAPI-FHIR-Server.

Architektur- und Designentscheidungen: siehe [PLANUNGSDOKUMENT.md](PLANUNGSDOKUMENT.md).

# Setup

## 0. Voraussetzungen

- Node.js (Projekt entwickelt mit Node 22)
- Docker (für die lokale MongoDB)
- Yarn 4 (bei installiertem Node reicht einmalig `corepack enable`, die Version kommt aus `package.json`)

## 1. Dependencies installieren

```bash
yarn install
```

## 2. JWT-Keys und Environment Variables einrichten

RSA-Schlüsselpaar generieren (kein OpenSSL nötig), im Ordner `src/auth/` ausführen, damit die pem-Dateien dort landen:

```bash
cd src/auth
node gen-jwt-keys.mjs
cd ../..
```

Das erzeugt `private.pem` und `public.pem` in `src/auth/`.

Danach eine Datei `.env` **in `src/auth/`** anlegen mit folgendem Inhalt:

```env
PRIVATE_KEY_PATH=private.pem
PUBLIC_KEY_PATH=public.pem
TEST_USERNAME=<username>
TEST_PASSWORD=<password>
USER_ID=<id>
ROLE='user'
```

`TEST_USERNAME`/`TEST_PASSWORD` sind die Zugangsdaten für den `/login`-Endpoint (frei wählbar, es gibt keine Benutzerdatenbank).
`.env` und `.pem`-Dateien sind über `.gitignore` ausgeschlossen und dürfen nicht committet werden.

## 3. MongoDB starten

```bash
yarn mongo
```

Startet einen Mongo-Container auf Port 27017, die Daten liegen im Ordner `database/` des Repos.
Der Container muss laufen, bevor die App gestartet wird, sonst schlägt der Verbindungsaufbau fehl.
Die App legt automatisch zwei Datenbanken an: `docAndProcedures` (Fachdaten) und `audit` (Audit-Events).

## 4. App starten

Dev-Modus (Neustart bei Dateiänderung):

```bash
yarn dev
```

Normaler Start:

```bash
yarn start
```

Der Server läuft auf `http://localhost:3000`.

## 5. Tests ausführen

```bash
yarn test
```

Läuft über den eingebauten `node:test`-Runner, braucht weder laufende MongoDB noch FHIR-Erreichbarkeit (alles gemockt).

# API benutzen

Interaktive API-Doku mit Beispiel-Requests: `http://localhost:3000/api-docs`

Alle Endpoints außer `/ping` und `/login` brauchen ein Bearer-Token. Typischer Ablauf:

1. `POST /login` mit `{ "username": ..., "password": ... }` aus der `.env` → Token aus der Response kopieren
2. Token als Header `Authorization: Bearer <token>` bei allen weiteren Requests mitschicken
3. `POST /registerPatient` → legt Patient:in lokal und in FHIR an, liefert `patientId`
4. `POST /consent` → DSGVO-Einwilligung für die Patient:in anlegen
5. `POST /anamnesis` → Anamnesebogen als FHIR-Bundle (transaction) erfassen
6. `POST /encounter` → offenen Encounter anlegen
7. `POST /procedure` → Procedure anlegen

Beispiel-Bodies für alle Requests stehen in der Swagger-UI.

# Hinweise

- Der FHIR-Server ist der öffentliche HAPI-Testserver (`https://hapi.fhir.org/baseR4`), dort angelegte Testdaten sind für alle sichtbar.
- Fällt die Audit-DB aus, puffert die App Audit-Events in `audit-queue.ndjson` im Projektroot und trägt sie automatisch nach, sobald die DB wieder erreichbar ist. Die Datei ist gitignored.
