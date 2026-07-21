import { randomUUID } from 'node:crypto'
import AppError from '../errors/AppError.js'
import auditEmitter from '../audit/audit-emitter.js'

/**
 * Übersetzt HTTP-Requests in Aufrufe an die Services und die Service-Ergebnisse zurück in HTTP-Responses.
 * Enthält selbst keine fachliche Logik.
 */
class Handler {

    /**
     * @param {*} patientRegistrationService - Service für Patientenregistrierung, an den registerPatient/createPatient delegieren.
     * @param {ConsentRetrieval} consentRetrievalService - Service for consent operations
     * @param {Authenticator} authenticator - Service for authentication operations
     */
    constructor(patientRegistrationService, consentRetrievalService, treatmentDocumentationService, authenticator) {
        this.patRegService = patientRegistrationService
        this.consentService = consentRetrievalService
        this.treatmentDocumentationService = treatmentDocumentationService
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
     */
    registerPatient = async (req, res) => {
        console.log(`[HANDLER] ${req.method} ${req.originalUrl} called`)
        const transactionId = randomUUID()
        const patientToRegisterJson = req.body //.patientJson // Der Input ist entsprechend des PatientSchema formatiert
        try {
            const registeredPatientId = await this.patRegService.registerPatient(patientToRegisterJson, transactionId)

            res.status(200).json({
                message: 'registerPatient request successfull',
                'patientId': registeredPatientId
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
     */
    createPatient = async (req, res) => {
        console.log(`[HANDLER] ${req.method} ${req.originalUrl} called`)
        const transactionId = randomUUID()
        //TBD remove or move to other service
        try {
            const patientCreated = await this.patRegService.createPatient(req.body, transactionId)
            res.status(200).json({ message: 'Patient successfully created' })
            auditEmitter.emit('auditEvent', { transactionId, timestamp: new Date().toISOString(), type: 'createPatient', eventStatus: 200 })
        }
        catch (e) {
            console.log('[HANDLER]: ', e)
            const statusCode = e.statusCode ?? 500
            auditEmitter.emit('auditEvent', { transactionId, timestamp: new Date().toISOString(), type: 'createPatient', eventStatus: statusCode })
            return res.status(statusCode).json({ error: e.message })
        }
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

            if (!patientId) {
                return res.status(400).json({ error: "Patient ID is required" })
            }

            const consent = await this.consentService.checkConsentForPatient(patientId)

            return res.status(200).json({
                message: "Valid consent found",
                consent
            })
        } catch (error) {
            console.error("[HANDLER] Error checking consent:", error.message)
            return res.status(error.statusCode || 500).json({
                error: error.message || "Failed to check consent"
            })
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
            const consent = await this.consentService.createConsent(req.body)
            return res.status(201).json({
                message: "Consent successfully created",
                consent: consent
            })
        } catch (error) {
            return res.status(error.statusCode || 500).json({ error: error.message })
        }
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

            if (!patientId) {
                return res.status(400).json({ error: "Patient ID is required" })
            }

            const consent = await this.consentService.checkConsentForPatient(patientId)

            return res.status(200).json({
                message: "Valid consent found",
                consent
            })
        } catch (error) {
            console.error("[HANDLER] Error checking consent:", error.message)
            return res.status(error.statusCode || 500).json({
                error: error.message || "Failed to check consent"
            })
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
            const consent = await this.consentService.createConsent(req.body)
            return res.status(201).json({
                message: "Consent successfully created",
                consent: consent
            })
        } catch (error) {
            return res.status(error.statusCode || 500).json({ error: error.message })
        }
    }

    createEncounter = async (req, res) => {
        try {
            const { patientId } = req.body;

            if (!patientId) {
                return res.status(400).json({ message: 'patientId is required' });
            }

            const created = await this.treatmentDocumentationService.createOpenEncounterTransaction(patientId);

            return res.status(201).json(created);
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({ message: error.message });
        }
    };
}

export default Handler
