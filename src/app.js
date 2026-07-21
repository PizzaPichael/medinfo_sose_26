import DataBaseClient from './db/db-client.js'
import PatientSchema from './db/schemas/Patient.schema.js'
import Handler from './handler/handler.js'
import Server from './server.js'
import FhirClient from './fhir/fhir-client.js'
import Authenticator from './auth/authenticator.js'
import PatientRegistration from './Services/patient-registration-service.js'
import AuditClient from './util/audit-client.js'
import auditEmitter from './audit/audit-emitter.js'
import ConsentRetrieval from './Services/consent-retrieval-service.js'

/**
 * Entry point for the service "Slice C — Behandlungsdokumentation & Prozeduren"
 */
const main = async () => {
    console.log('[APP] Starting...')
    // --- Setting up the mongo databse connection
    const localDbUrl = 'mongodb://localhost:27017/docAndProcedures' 
    const databaseClient = new DataBaseClient(localDbUrl)
    await databaseClient.connect()

    // --- Setting up fhir client
    const fhirServerUrl = 'https://hapi.fhir.org/baseR4'
    const fhirClient = new FhirClient(fhirServerUrl)

    // --- Setting up the audit database connection (separate DB, resilient to being unreachable)
    const auditDbUrl = 'mongodb://localhost:27017/audit'
    const auditClient = new AuditClient(auditDbUrl, auditEmitter)
    try {
        await auditClient.connect()
    } catch (e) {
        console.log('[APP] Audit-DB unavailable at startup, continuing without it for now...', e)
    }

    // --- Setting up the audit database connection (separate DB, resilient to being unreachable)
    const auditDbUrl = 'mongodb://localhost:27017/audit'
    const auditClient = new AuditClient(auditDbUrl, auditEmitter)
    try {
        await auditClient.connect()
    } catch (e) {
        console.log('[APP] Audit-DB unavailable at startup, continuing without it for now...', e)
    }

    // --- Setting up Authenticator
    const authenticator = new Authenticator()

    // --- Setting up Services
    const patientRegistrationService = new PatientRegistration(databaseClient, fhirClient)
    const consentRetrievalService = new ConsentRetrieval(databaseClient)

    // --- Creating handler and wiring services to it
    const handler = new Handler(patientRegistrationService, consentRetrievalService, authenticator)

    // --- Creating Server and wiring handler to it
    const server = new Server(handler)
    server.listen(3000)

    /**
     * Function for ending the connection to the local DB if a SIGINT = signal interruption accures.
     */
    process.on('SIGINT', async () => {
        await server.close()    // Stops accepting new requests and ends it, when all running requests are finished
        await databaseClient.endConnection()    // Ends the conenction to the db
        await auditClient.endConnection()    // Ends the connection to the audit db
        process.exit(0)
    })
}

try {
    main()
} catch (e) {
    console.log(e)
}
