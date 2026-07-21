import DataBaseClient from './db/db-client.js'
import PatientSchema from './db/schemas/Patient.schema.js'
import Handler from './handler/handler.js'
import Server from './server.js'
import FhirClient from './fhir/fhir-client.js'
import Authenticator from './auth/authenticator.js'
import PatientRegistration from './Services/patient-registration-service.js'

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

    // --- Setting up Authenticator
    const authenticator = new Authenticator()

    // --- Setting up PatientRegsitrationService
    const patientRegistrationService = new PatientRegistration()

    // --- Creating handler and wiring dbclient to it
    const handler = new Handler(databaseClient, fhirClient, patientRegistrationService, authenticator)

    // --- Creating Server and wiring handler to it
    const server = new Server(handler)
    server.listen(3000)

    /* 
    TODO delete when not neede as reference anymore

    Do stuff from here...
    const patientSchemaInstance = new PatientSchema({
        patientId: "3",
        id: "131896579",
        name: [
            {
                use: "official",
                family: "Ramirez",
                given: [
                    "Carlos"
                ]
            }
        ],
        gender: "male",
        birthDate: "1974-05-12",
        address: [
            {
                use: "home",
                line: [
                    "125 Community Way"
                ],
                city: "Springfield",
                state: "MA",
                postalCode: "01109",
                country: "US"
            }
        ]
    })
    await databaseClient.addPatient(patientSchemaInstance)
    //await database.updatePatientById(131896579, patientSchemaInstance)
    console.log(await databaseClient.getPatientByFilter({ id: '131896579' }))
    ...to here.*/
}

try {
    main()
} catch (e) {
    console.log(e)
}
