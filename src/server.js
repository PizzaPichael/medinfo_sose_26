import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger.js'

/**
 * This is the Server class.
 * It is solely responsible for wiring the API endpoints to functions inside the handler.
 */
class Server {
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
         *     summary: Registriert einen Patienten am Empfang
         *     requestBody:
         *       required: true
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
         *     responses:
         *       200:
         *         description: Registrierung akzeptiert
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         *       401:
         *         description: Ungültiges Token
         */
        this.app.post('/registerPatient', handler.registerPatient)

        /**
         * @openapi
         * /ping:
         *   get:
         *     summary: Testet, ob der Server erreichbar ist
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
         * /getCertificate:
         *   get:
         *     tags:
         *       - Authentication
         *     summary: Gibt das JWT-Zertifikat zurück um JWT-Token zu generieren
         *     responses:
         *       200:
         *         description: JWT-Zertifikat zurückgegeben
         */
        this.app.get('/getCertificate', handler.getCertificate)

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
