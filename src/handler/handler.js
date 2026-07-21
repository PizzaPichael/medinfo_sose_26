class Handler {

    /**
     * Constructor
     * @param {*} localDbClient The dataBaseClient thats responsible for talking to the local DB
     */
    constructor(localDbClient, fhirClient, patientRegistrationService, authenticator) {
        this.dataBaseClient = localDbClient
        this.fhirClient = fhirClient
        this.patRegService = patientRegistrationService
        this.authenticator = authenticator
        console.log('[HANDLER] Created...')
    }

    /**
     * Function for ending the connection to the local DB if needed.
     */
    endDbConenction = async () => {
        await this.databaseClient.endConnection()
    }

    /**
     * Middleware function to authenticate JWT tokens in incoming requests.
     * Inspired by: https://generate-random.org/jwt-tokens/javascript
     */
    authenticateJWT = (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer token

        if (!token) {
            return res.sendStatus(401).json({ message: 'Missing JWT token' })
        }

        try {
            const user = this.authenticator.verifyToken(token);
            req.user = user;
            next();
        } catch (error) {
            return res.sendStatus(403).json({ message: 'Invalid JWT token' });
        }
    };

    /**
     * Test function, wired to the /ping endpoint
     * @param {*} req API endpoint input
     * @param {*} res Endpoint response
     */
    ping = (req, res) => {
        res.status(203).json({ message: 'Pong' })
    }

    /**
     * Function to get the public key for JWT verification.
     * @param {*} req API endpoint input
     * @param {*} res Endpoint response
     */
    getCertificate = (req, res) => {
        const cert = this.authenticator.getCertificate()
        res.status(200).json({ certificate: cert })
    }

    login = (req, res) => {
        const { user_id, username } = req.body;
        const role = 'user';
        const payload = this.authenticator.createTokenPayload(user_id, username, role);
        const token = this.authenticator.generateToken(payload);
        res.status(200).json({ token: token });
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
}

export default Handler
