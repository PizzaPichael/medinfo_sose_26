/**
 * Übersetzt HTTP-Requests in Aufrufe an die Services und die Service-Ergebnisse zurück in HTTP-Responses.
 * Enthält selbst keine fachliche Logik.
 */
class Handler {

    /**
     * @param {*} patientRegistrationService - Service für Patientenregistrierung, an den registerPatient/createPatient delegieren.
     */
    constructor(patientRegistrationService, authenticator) {
        this.patRegService = patientRegistrationService
        this.authenticator = authenticator
        console.log('[HANDLER] Created...')
    }

    /**
     * Middleware function to authenticate JWT tokens in incoming requests.
     * Inspired by: https://generate-random.org/jwt-tokens/javascript
     */
    authenticateJWT = (req, res, next) => {
        const auth = req.headers.authorization || '';
        const match = auth.match(/^Bearer\s+(.+)$/i);
        const token = match?.[1];

        if (!token) {
            return res.status(401).json({ message: 'Missing JWT token' });
        }

        try {
            const user = this.authenticator.verifyToken(token);
            req.user = user;
            return next();
        } catch (err) {
            return res.status(403).json({ message: 'Invalid JWT token' });
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
     * Function to log in a user and generate a JWT token.
     * @param {*} req API endpoint input
     * @param {*} res Endpoint response
     */
    login = (req, res) => {
        const { username, password } = req.body;

        let userId;
        let role;

        try {
            ({ user_id: userId, role } = this.authenticator.verifyUserCredentials(username, password));
        } catch (error) {
            return res.status(error.statusCode || 401).json({ message: error.message });
        }
        const payload = this.authenticator.createTokenPayload(userId, username, role);
        const token = this.authenticator.generateToken(payload);
        res.status(200).json({ token: token });
    }

    /**
     * Function to pass registerPatient api call to the patienti-registration-service
     * @param {*} req API Endpoint input object
     * @param {*} res Endpoint response object
     * TBD add returnvalues
     */
    registerPatient = async (req, res) => {
        console.log(`[HANDLER] ${req.method} ${req.originalUrl} called`)
        const patientToRegisterJson = req.body //.patientJson // Der Input ist entsprechend des PatientSchema formatiert
        try {
            const registeredPatientId = await this.patRegService.registerPatient(patientToRegisterJson)

            res.status(200).json({
                message: 'registerPatient request successfull',
                'patientId': registeredPatientId
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
        console.log(`[HANDLER] ${req.method} ${req.originalUrl} called`)
        //TBD remove or move to other service
        try {
            const patientCreated = await this.patRegService.createPatient(req.body)
            res.status(200).json({ message: 'Patient successfully created' })
        }
        catch (e) {
            console.log('[HANDLER]: ', e)
            return res.status(e.statusCode ?? 500).json({ error: e.message })
        }
    }
}

export default Handler
