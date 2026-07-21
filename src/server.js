import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger.js'

/**
 * @openapi
 * security:
 *   - bearerAuth: []
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Patient:
 *       type: object
 *       properties:
 *         resourceType:
 *           type: string
 *           example: Patient
 *         id:
 *           type: string
 *         identifier:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               system:
 *                 type: string
 *               value:
 *                 type: string
 *         active:
 *           type: boolean
 *         name:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               use:
 *                 type: string
 *                 example: official
 *               family:
 *                 type: string
 *               given:
 *                 type: array
 *                 items:
 *                   type: string
 *         telecom:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               system:
 *                 type: string
 *               value:
 *                 type: string
 *               use:
 *                 type: string
 *         gender:
 *           type: string
 *         birthDate:
 *           type: string
 *           example: "1974-05-12"
 *         address:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               use:
 *                 type: string
 *               line:
 *                 type: array
 *                 items:
 *                   type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *         maritalStatus:
 *           type: object
 *         communication:
 *           type: array
 *           items:
 *             type: object
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Der Benutzername des Benutzers
 *         password:
 *           type: string
 *           description: Das Passwort des Benutzers
 *     AuthenticatedPatientRequest:
 *       type: object
 *       allOf:
 *         - $ref: '#/components/schemas/Patient'
 *     Reference:
 *       type: object
 *       required:
 *         - reference
 *       properties:
 *         reference:
 *           type: string
 *           description: Referenz auf ein anderes FHIR-Resource, z.B. Patient/123
 *         type:
 *           type: string
 *           description: Optionaler Ressourcentyp
 *         display:
 *           type: string
 *           description: Lesbarer Text zur Referenz
 *     ConsentProvision:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           description: Art der Berechtigung, z.B. "permit" oder "deny"
 *         period:
 *           type: object
 *           properties:
 *             start:
 *               type: string
 *               format: date-time
 *             end:
 *               type: string
 *               format: date-time
 *         actor:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               role:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *               reference:
 *                 $ref: '#/components/schemas/Reference'
 *         action:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               coding:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     system:
 *                       type: string
 *                     code:
 *                       type: string
 *                     display:
 *                       type: string
 *     Consent:
 *       type: object
 *       required:
 *         - status
 *         - decision
 *         - subject
 *       properties:
 *         resourceType:
 *           type: string
 *           example: Consent
 *         id:
 *           type: string
 *         status:
 *           type: string
 *           description: Einwilligungsstatus, z.B. "active"
 *         decision:
 *           type: string
 *           description: permit oder deny
 *           enum:
 *             - permit
 *             - deny
 *         scope:
 *           type: object
 *           properties:
 *             coding:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   system:
 *                     type: string
 *                   code:
 *                     type: string
 *                   display:
 *                     type: string
 *         category:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               coding:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     system:
 *                       type: string
 *                     code:
 *                       type: string
 *                     display:
 *                       type: string
 *         subject:
 *           $ref: '#/components/schemas/Reference'
 *         provision:
 *           $ref: '#/components/schemas/ConsentProvision'
 *         organization:
 *           $ref: '#/components/schemas/Reference'
 *         dateTime:
 *           type: string
 *           format: date-time
 *     AuthenticatedConsentRequest:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Einwilligungsstatus, z.B. "active"
 *         decision:
 *           type: string
 *           description: permit oder deny
 *         provision:
 *           type: array
 *           items:
 *             type: object
 *         subject:
 *           type: object
 *           description: Referenz auf Patient, z.B. Patient/123
 *     AnamnesisBundle:
 *       type: object
 *       required:
 *         - resourceType
 *         - type
 *         - entry
 *       properties:
 *         resourceType:
 *           type: string
 *           example: Bundle
 *         type:
 *           type: string
 *           example: transaction
 *         entry:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               fullUrl:
 *                 type: string
 *                 example: "urn:uuid:11111111-1111-1111-1111-111111111111"
 *               resource:
 *                 type: object
 *                 description: Condition oder MedicationStatement mit subject.reference "Patient/{id}"
 *               request:
 *                 type: object
 *                 properties:
 *                   method:
 *                     type: string
 *                     example: POST
 *                   url:
 *                     type: string
 *                     example: Condition
 */

/**
 * This is the Server class.
 * It is solely responsible for wiring the API endpoints to functions inside the handler.
 */
class Server {
    /**
     * @param {*} handler - Handler, dessen Funktionen an die API-Routen gebunden werden.
     */
    constructor(handler) {
        this.app = express()
        this.app.use(express.json())
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
        this.app.use((req, res, next) => {
            if (req.path === '/ping' || req.path === '/login') {
                return next()
            }

            const authHeader = req.headers.authorization
            const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : req.body?.token

            if (!token) {
                return res.status(401).json({ error: 'Authorization token required' })
            }

            req.headers.authorization = `Bearer ${token}`
            return handler.authenticateJWT(req, res, next)
        })
        this.httpServer = null
        this.#bindRoutes(handler)
        console.log('[SERVER] Created...')
    }

    /**
     * Wires HTTP-routes with handler-functions
     * @param {*} handler the handler, whose functions the api endpoints should be wired to
     */
    #bindRoutes = (handler) => {
        /**
         * @openapi
         * /ping:
         *   get:
         *     deprecated: true
         *     summary: Testet, ob der Server erreichbar ist (temporärer Debug-Endpoint, TBD Entfernen am Ende)
         *     security: []
         *     responses:
         *       203:
         *         description: Server antwortet
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         */
        this.app.get('/ping', handler.ping)

        /**
        * @openapi
        * tags:
        *   - name: Authentication
        *     description: Endpoints for user authentication and JWT handling
        */

        /**
         * @openapi
         * /login:
         *   post:
         *     tags:
         *       - Authentication
         *     security: []
         *     summary: Erstellt ein JWT-Token für einen Benutzer
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/LoginRequest'
         *     responses:
         *       200:
         *         description: JWT-Token zurückgegeben
         */
        this.app.post('/login', handler.login)

        /**
         * @openapi
         * /registerPatient:
         *   post:
         *     security:
         *       - bearerAuth: []
         *     summary: Sucht einen Patienten anhand des offiziellen Namens und Geburtsdatums lokal und registriert ihn am Empfang
         *     requestBody:
         *       required: true
         *       description: Der Patient selbst als Body, muss mind. ein name-Element mit use "official" enthalten
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/AuthenticatedPatientRequest'
         *           example:
         *             resourceType: Patient
         *             active: true
         *             name:
         *               - use: official
         *                 family: Ramirez
         *                 given:
         *                   - Carlos
         *             telecom:
         *               - system: phone
         *                 value: "+49 170 1234567"
         *                 use: mobile
         *             gender: male
         *             birthDate: "1974-05-12"
         *             address:
         *               - use: home
         *                 line:
         *                   - Musterstraße 12
         *                 city: Münster
         *                 state: NRW
         *                 postalCode: "48149"
         *                 country: DE
         *     responses:
         *       200:
         *         description: Eindeutiger lokaler Patient gefunden, Registrierung akzeptiert
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         *                 patientId:
         *                   type: string
         *             example:
         *               message: registerPatient request successfull
         *               patientId: 6a58e8e5-2bed-4aaf-b497-fab5f47a5342
         *       default:
         *         description: Fehler bei der lokalen DB-Abfrage (Statuscode je nach AppError, sonst 500)
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 error:
         *                   type: string
         */
        this.app.post('/registerPatient', handler.registerPatient)

        /**
         * @openapi
         * /createPatient:
         *   post:
         *     security:
         *       - bearerAuth: []
         *     summary: Legt einen neuen Patienten in der lokalen DB an
         *     requestBody:
         *       required: true
         *       description: Der Patient selbst als Body, nach dem Patient-Schema
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/AuthenticatedPatientRequest'
         *     responses:
         *       200:
         *         description: Patient erfolgreich angelegt
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         */
        this.app.post('/createPatient', handler.createPatient)
        /**
         * @openapi
         * /consent/{patientId}:
         *   get:
         *     security:
         *       - bearerAuth: []
         *     summary: Prüft die Einwilligung eines Patienten
         *     parameters:
         *       - in: path
         *         name: patientId
         *         required: true
         *         schema:
         *           type: string
         *         description: Die ID des Patienten
         *     responses:
         *       200:
         *         description: Einwilligung gefunden
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         *                 consent:
         *                   type: object
         *       400:
         *         description: Ungültige Anfrage (fehlende oder falsche Patient ID)
         *       404:
         *         description: Patient nicht gefunden oder keine gültige Einwilligung
         *       500:
         *         description: Serverfehler
         */
        this.app.get('/consent/:patientId', handler.checkConsent)
        /**
         * @openapi
         * /consent:
         *   post:
         *     security:
         *       - bearerAuth: []
         *     summary: Erstellt eine neue Einwilligung
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/AuthenticatedConsentRequest'
         *     responses:
         *       201:
         *         description: Einwilligung erfolgreich erstellt
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         *                 consentId:
         *                   type: string
         *       400:
         *         description: Ungültige Anfrage
         *       500:
         *         description: Serverfehler
         */
        this.app.post('/consent', handler.createConsent)

        /**
         * @openapi
         * /anamnesis:
         *   post:
         *     security:
         *       - bearerAuth: []
         *     summary: Erfasst den Anamnesebogen (FHIR-Bundle mit Conditions und MedicationStatements) für eine Patient:in
         *     requestBody:
         *       required: true
         *       description: FHIR-Bundle vom Typ "transaction". Jede entry.resource ist eine Condition oder ein MedicationStatement und referenziert dieselbe Patient:in via subject.reference "Patient/{id}".
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/AnamnesisBundle'
         *           example:
         *             resourceType: Bundle
         *             type: transaction
         *             entry:
         *               - fullUrl: "urn:uuid:11111111-1111-1111-1111-111111111111"
         *                 resource:
         *                   resourceType: Condition
         *                   clinicalStatus:
         *                     coding:
         *                       - system: http://terminology.hl7.org/CodeSystem/condition-clinical
         *                         code: active
         *                   verificationStatus:
         *                     coding:
         *                       - system: http://terminology.hl7.org/CodeSystem/condition-ver-status
         *                         code: confirmed
         *                   code:
         *                     coding:
         *                       - system: http://snomed.info/sct
         *                         code: "195967001"
         *                         display: Asthma
         *                     text: Asthma bronchiale
         *                   subject:
         *                     reference: Patient/6a58e8e5-2bed-4aaf-b497-fab5f47a5342
         *                   onsetDateTime: "2015-06-01"
         *                   recordedDate: "2026-07-21"
         *                 request:
         *                   method: POST
         *                   url: Condition
         *               - fullUrl: "urn:uuid:22222222-2222-2222-2222-222222222222"
         *                 resource:
         *                   resourceType: MedicationStatement
         *                   status: active
         *                   medicationCodeableConcept:
         *                     coding:
         *                       - system: http://snomed.info/sct
         *                         code: "320176004"
         *                         display: salbutamol 100micrograms/inhaler
         *                     text: Salbutamol Dosieraerosol
         *                   subject:
         *                     reference: Patient/6a58e8e5-2bed-4aaf-b497-fab5f47a5342
         *                   effectiveDateTime: "2026-07-21"
         *                   dosage:
         *                     - text: 2 Hübe bei Bedarf, max. alle 4 Stunden
         *                 request:
         *                   method: POST
         *                   url: MedicationStatement
         *     responses:
         *       200:
         *         description: Anamnese erfasst, nur neue Einträge wurden gespeichert (Abgleich bei Bestandspatient:innen)
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         *                 patientId:
         *                   type: string
         *                 created:
         *                   type: object
         *                   properties:
         *                     conditions:
         *                       type: array
         *                       items:
         *                         type: string
         *                     medicationStatements:
         *                       type: array
         *                       items:
         *                         type: string
         *                 skipped:
         *                   type: object
         *                   properties:
         *                     conditions:
         *                       type: array
         *                       items:
         *                         type: string
         *                     medicationStatements:
         *                       type: array
         *                       items:
         *                         type: string
         *       400:
         *         description: Ungültiges Bundle oder ungültiger Consent
         *       404:
         *         description: Patient:in lokal nicht vorhanden oder kein Consent
         *       500:
         *         description: Serverfehler
         */
        this.app.post('/anamnesis', handler.captureAnamnesis)
        console.log('[SERVER] Routes bound...')
    }

    /**
     * The functions that makes the server listen for http requests.
     * @param {*} port The port the server should listen on.
     */
    listen = (port) => {
        this.httpServer = this.app.listen(port, () => {
            console.log(`Server on http://localhost:${port}`)
        })
    }

    /**
     * Function to close the server.
     */
    async close() {
        console.log('[SERVER] Closing...')
        await this.httpServer?.close()
    }
}

export default Server
