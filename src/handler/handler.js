import { randomUUID } from 'node:crypto'
import auditEmitter from '../audit/audit-emitter.js'

/**
 * Übersetzt HTTP-Requests in Aufrufe an die Services und die Service-Ergebnisse zurück in HTTP-Responses.
 * Enthält selbst keine fachliche Logik.
 */
class Handler {

    /**
     * @param {*} patientRegistrationService - Service für Patientenregistrierung, an den registerPatient/createPatient delegieren.
     */
    constructor(patientRegistrationService) {
        this.patRegService = patientRegistrationService
        console.log('[HANDLER] Created...')
    }

    /**
     * Test function, wired to the /test endpoint 
     * @param {*} req API endpoint input
     * @param {*} res Endpoint response
     */
    test = (req, res) => {
        console.log(`[HANDLER] ${req.method} ${req.originalUrl} called`)
        res.status(203).json({ message: 'test Endpoint called' })
    }

    /**
     * Function to pass registerPatient api call to the patienti-registration-service
     * @param {*} req API Endpoint input object
     * @param {*} res Endpoint response object
     */
    registerPatient = async (req, res) => {
        console.log(`[HANDLER] ${req.method} ${req.originalUrl} called`)
        const transactionId = randomUUID()
        const patientToRegisterJson = req.body //.patientJson // Der Input ist entsprechend des PatientSchema formatiert
        try {
            const registeredPatientId = await this.patRegService.registerPatient(patientToRegisterJson, transactionId)

            res.status(200).json({
                message: 'registerPatient request successfull',
                'patientId':  registeredPatientId
            })
            auditEmitter.emit('auditEvent', { transactionId, timestamp: new Date().toISOString(), type: 'registerPatient', eventStatus: 200 })
        }
        catch (e) {
            console.log('[HANDLER]: ', e)
            // Returns either the status code of the AppError Instance or defaults to a 500 status
            const statusCode = e.statusCode ?? 500
            auditEmitter.emit('auditEvent', { transactionId, timestamp: new Date().toISOString(), type: 'registerPatient', eventStatus: statusCode })
            return res.status(statusCode).json({ error: e.message })
        }
    }

    /**
     * Triggers creation of the patient in the registrationService
     * @param {*} req API Endpoint input object
     * @param {*} res Endpoint response object
     * @param {string} transactionId - Wird intern per randomUUID() erzeugt, korreliert alle Audit-Events dieses Requests.
     * TBD add returnvalues
     */
    createPatient = async (req, res) => {
        console.log(`[HANDLER] ${req.method} ${req.originalUrl} called`)
        const transactionId = randomUUID()
        //TBD remove or move to other service
        try {
            const patientCreated = await this.patRegService.createPatient(req.body, transactionId)
            res.status(200).json({message: 'Patient successfully created'})
            auditEmitter.emit('auditEvent', { transactionId, timestamp: new Date().toISOString(), type: 'createPatient', eventStatus: 200 })
        }
        catch (e) {
            console.log('[HANDLER]: ', e)
            const statusCode = e.statusCode ?? 500
            auditEmitter.emit('auditEvent', { transactionId, timestamp: new Date().toISOString(), type: 'createPatient', eventStatus: statusCode })
            return res.status(statusCode).json({ error: e.message })
        }
    }
}

export default Handler
