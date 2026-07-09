import express from 'express'

/**
 * This is the Server class.
 * It is solely responsible for wiring the API endpoints to functions inside the handler.
 */
class Server {
    constructor(handler) {
        this.app = express()
        this.app.use(express.json())
        this.httpServer = null
        this.#bindRoutes(handler)
        console.log('[SERVER] Created...')
    } 

    /**
     * Wires HTTP-routes with handler-functions
     * @param {*} handler the handler, whose functions the api endpoints should be wired to
     */
    #bindRoutes = (handler) => {
        this.app.post('/registerPatient', handler.registerPatient)
        this.app.get('/test', handler.test)
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
