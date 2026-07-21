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
         *     summary: Sucht einen Patienten anhand des offiziellen Namens lokal und registriert ihn am Empfang
         *     requestBody:
         *       required: true
         *       description: Der Patient selbst als Body, muss mind. ein name-Element mit use "official" enthalten
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/AuthenticatedPatientRequest'
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
         * /encounter:
         *   post:
         *     security:
         *       - bearerAuth: []
         *     summary: Erstellt einen offenen Encounter für einen bestehenden Patienten
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               patientId:
         *                 type: string
         *     responses:
         *       201:
         *         description: Encounter erstellt
         */
        this.app.post('/encounter', handler.createEncounter)

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
