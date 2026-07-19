class Handler {

    /**
     * Constructor
     * @param {*} patientRegistrationService
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
        res.status(203).json({ message: 'test Endpoint called' })
    }

    /**
     * Function to pass registerPatient api call to the patienti-registration-service
     * @param {*} req API Endpoint input object
     * @param {*} res Endpoint response object
     * TBD add returnvalues
     */
    registerPatient = async (req, res) => {
        const patientToRegisterJson = req.body //.patientJson // Der Input ist entsprechend des PatientSchema formatiert
        try {
            const wantedLocalPatientInstance = await this.patRegService.registerPatient(patientToRegisterJson)

            res.status(200).json({ 
                message: 'registerPatient request successfull',
                'patientId':  wantedLocalPatientInstance.id
            })
        }
        catch (e) {
            console.log('[HANDLER]: ', e)
            // Returns either the status code of the AppError Instance or defaults to a 500 status
            return res.status(e.statusCode ?? 500).json({ error: e.message })
        }
    }

    /**
     * Triggers creation of the patient in the registrationService
     * @param {*} req API Endpoint input object
     * @param {*} res Endpoint response object
     * TBD add returnvalues
     */
    createPatient = async (req, res) => {
        //TBD remove or move to other service
        try {
            const patientCreated = await this.patRegService.addPatient(req.body)
            res.status(200).json({message: 'Patient successfully created'})
        }
        catch (e) {
            console.log('[HANDLER]: ', e)
            return res.status(e.statusCode ?? 500).json({ error: e.message })
        }
    }
}

export default Handler
