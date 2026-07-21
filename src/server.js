import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger.js'

/**
 * @openapi
 * components:
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
            if (req.path === '/ping' || req.path === '/getCertificate' || req.path === '/login') {
                return next()
            }
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
         * /registerPatient:
         *   post:
         *     summary: Sucht einen Patienten anhand des offiziellen Namens lokal und registriert ihn am Empfang
         *     requestBody:
         *       required: true
         *       description: Der Patient selbst als Body, muss mind. ein name-Element mit use "official" enthalten
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               token:
         *                 type: string
         *                 description: JWT-Token zur Authentifizierung
         *               patientJson:
         *                 type: object
         *                 description: Patient-Ressource nach dem Patient-Schema
         *             $ref: '#/components/schemas/Patient'
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
         *       401:
         *         description: Ungültiges Token
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
         * /ping:
         *   get:
         *     deprecated: true
         *     summary: Testet, ob der Server erreichbar ist (temporärer Debug-Endpoint, TBD Entfernen am Ende)
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
         *     summary: Erstellt ein JWT-Token für einen Benutzer
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               username:
         *                 type: string
         *                 description: Der Benutzername des Benutzers
         *               password:
         *                 type: string
         *                 description: Das Passwort des Benutzers
         *     responses:
         *       200:
         *         description: JWT-Token zurückgegeben
         */
        this.app.post('/login', handler.login)

        /**
         * @openapi
         * /createPatient:
         *   post:
         *     summary: Legt einen neuen Patienten in der lokalen DB an
         *     requestBody:
         *       required: true
         *       description: Der Patient selbst als Body, nach dem Patient-Schema
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/Patient'
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
