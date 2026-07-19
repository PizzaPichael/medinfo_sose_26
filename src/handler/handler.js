class Handler {

    /**
     * Constructor
     * @param {DataBaseClient} localDbClient - The database client responsible for talking to the local DB
     * @param {*} fhirClient - Client for FHIR operations
     * @param {PatientRegistration} patientRegistrationService - Service for patient registration
     * @param {ConsentRetrieval} consentRetrievalService - Service for consent operations
     */
    constructor(localDbClient, fhirClient, patientRegistrationService, consentRetrievalService) {
        this.dataBaseClient = localDbClient
        this.fhirClient = fhirClient
        this.patRegService = patientRegistrationService
        this.consentService = consentRetrievalService
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

    /**
     * Checks for an existing valid consent for a patient.
     * Handler responsibility: Accept request, validate HTTP parameters, delegate to service, return response
     * 
     * @param {Object} req - HTTP request with patientId in params
     * @param {Object} res - HTTP response
     * 
     * Returns:
     * - 200: Valid consent found
     * - 404: Patient not found or no valid consent found
     * - 400: Invalid patient ID format
     * - 500: Server error
     */
    checkConsent = async (req, res) => {
        try {
            const patientId = req.params.patientId

            // Step 1: Handler validates HTTP parameters
            if (!patientId) {
                return res.status(400).json({ error: "Patient ID is required" })
            }

            // Step 2: DB Client checks if patient exists
            /*const patient = await this.dataBaseClient.getPatientByDbId(patientId)
            if (!patient) {
                return res.status(404).json({ error: "Patient not found" })
            }*/

            // Step 3: Service retrieves and validates consent
            const checkResult = await this.consentService.checkConsentForPatient(patientId)

            // Step 4: Handler returns appropriate response based on validation result
            if (checkResult.isValid) {
                return res.status(200).json({
                    message: "Valid consent found",
                    consent: checkResult.consent
                })
            } else {
                return res.status(404).json({
                    message: "No valid consent found",
                    reason: checkResult.reason,
                    consent: checkResult.consent
                })
            }
        } catch (error) {
            console.error("[HANDLER] Error checking consent:", error.message)
            return res.status(500).json({ error: error.message || "Failed to check consent" })
        }
    }

    /**
     * Creates a new consent.
     * Handler responsibility: Accept request, validate HTTP parameters, return response
     * Delegates to service for business logic and to db client for persistence
     * 
     * @param {Object} req - HTTP request with consent data in body
     * @param {Object} res - HTTP response
     * 
     * Request body should contain:
     * - status: consent status, e.g. "active" (required)
     * - decision: "permit" or "deny" (required)
     * - provision: array of provision objects (required)
     * - subject: { reference: "Patient/123", display?: "Patient Name" } (required - needs patient ID)
     * - category, controller, sourceAttachment, regulatoryBasis: (optional)
     */
    createConsent = async (req, res) => {
        try {
            // Step 1: Handler receives and validates HTTP request
            if (!req.body) {
                return res.status(400).json({ error: "Request body is required" })
            }

            // Step 2: Service transforms request body into schema format and validates
            const consentSchemaData = this.consentService.buildConsentSchema(req.body)

            // Step 3: DB Client persists the consent to database
            await this.dataBaseClient.saveConsent(consentSchemaData)
            
            return res.status(201).json({ 
                message: "Consent created successfully",
                consentId: consentSchemaData.consentId
            })
        } catch (error) {
            console.error("[HANDLER] Error creating consent:", error.message)
            return res.status(500).json({ error: error.message || "Failed to create consent" })
        }
    }
}

export default Handler
