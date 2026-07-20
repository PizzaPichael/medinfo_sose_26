import AppError from '../errors/AppError.js'

class Handler {

    /**
     * Constructor
     * @param {*} localDbClient The dataBaseClient thats responsible for talking to the local DB
     */
    constructor(localDbClient, fhirClient, patientRegistrationService, treatmentDocumentationService) {
        this.dataBaseClient = localDbClient
        this.fhirClient = fhirClient
        this.patRegService = patientRegistrationService
        this.treatmentDocumentationService = treatmentDocumentationService
        console.log('[HANDLER] Created...')
    }

    /**
     * Function for ending the connection to the local DB if needed.
     */
    endDbConenction = async () => {
        await this.databaseClient.endConnection()
    }

    /**
     * Test function, wired to the /test endpoint 
     * @param {*} req API endpoint input
     * @param {*} res Endpoint response
     */
    test = (req, res) => {
        res.status(203).json({ message: 'test Endpoint called' })
    }

    /**
     * Function to register a patient that shwos up at the frontdesk.
     * @param {*} req API Endpoint input
     * @param {*} res Endpoint response
     */
    registerPatient = (req, res) => {
        const patientJson = req.body.patientJson // Der Input ist entsprechend des PatientSchema formatiert

        res.status(200).json({ message: 'registerPatient request accepted' })
    }

    createEncounter = async (req, res) => {
        try {
            const { patientId } = req.body
            const encounter = await this.treatmentDocumentationService.createOpenEncounterTransaction(patientId)
            res.status(201).json(encounter)
        } catch (error) {
            const statusCode = error.statusCode || 500
            res.status(statusCode).json({ message: error.message })
        }
    }
}

export default Handler
