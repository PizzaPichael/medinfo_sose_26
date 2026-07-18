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
        this.httpServer = null
        this.#bindRoutes(handler)
        console.log('[SERVER] Created...')
    } 

    // app.use(SecurityVerification)

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
         */
        this.app.post('/registerPatient', handler.registerPatient)

        /**
         * @openapi
         * /test:
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
        this.app.get('/test', handler.test)
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
