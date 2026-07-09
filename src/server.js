import express from 'express'

class Server {
    constructor(handler) {
        this.app = express()
        this.app.use(express.json())
        this.httpServer = null
        this.#bindRoutes(handler)
        console.log('[SERVER] Created...')
    } 

    /**
     * Verdrahtet HTTP-routes mit handler-funktionen
     * @param {*} handler der Handler, dessen Funktionen verdrahtet werden sollen
     */
    #bindRoutes = (handler) => {
        this.app.post('/registerPatient', handler.registerPatient)
        this.app.get('/test', handler.test)
        console.log('[SERVER] Routes bound...')
    }

    listen = (port) => {
        this.httpServer = this.app.listen(port, () => {
            console.log(`Server on http://localhost:${port}`)
        })
    }

    async close() {
        console.log('[SERVER] Closing...')
        await this.httpServer?.close()
    }
}

export default Server
