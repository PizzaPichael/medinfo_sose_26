class Handler {

    /**
     * Constructor
     * @param {*} localDbClient The dataBaseClient thats responsible for talking to the local DB
     */
    constructor(localDbClient, fhirClient, patientRegistrationService) {
        this.dataBaseClient = localDbClient
        this.fhirClient = fhirClient
        this.patRegService = patientRegistrationService
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
     * Checks for an existing valid consent.
     * Request body should be empty.
     * Returns the consent if it exists, or a 404 if not.
     */
    checkConsent = (req, res) => {
        const patientId = req.params.patientId;

        // check if patient exists in the database
        try {
            const patient = this.dataBaseClient.getPatientByDbId(patientId);
            console.log("Patient found:", patient);
        } catch (error) {
            return res.status(404).json({ error: "Patient not found" });
        }

        try {
            // TODO: check for decision to be permit and status to be active, if not continue to create a new consent form if data given or return an error if not.
            // TODO: also check if provision period is valid, if not continue to create a new consent form if data given or return an error if not.
            const consent = this.dataBaseClient.getConsentByPatientId(patientId);
            return res.status(200).json({
                consent
            });
        } catch (error) {
            console.error("Error checking consent:", error);
            return res.status(404).json({ error: "No valid consent found" });
        }
    }

    /**
     * Creates a new consent.
     * Requires the full request body.
     * @returns confirmation of created consent or an error.
     */
    createConsent = (req, res) => {
        try {
            saveConsentToDatabase(consentId, status, decision, provision);
            return res.status(201).json({ message: "Consent created successfully" });
        } catch (error) {
            console.error("Error creating consent:", error);
            return res.status(500).json({ error: "Failed to create consent" });
        }
    }
}

export default Handler
