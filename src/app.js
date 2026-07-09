import DataBaseClient from './db/db-client.js'
import PatientSchema from './db/schemas/Patient.schema.js'
import Handler from './handler/handler.js'
import Server from './server.js'

/**
 * Entry Point für dne Service "Slice C — Behandlungsdokumentation & Prozeduren"
 */
const main = async () => {
    console.log('[APP] Starting...')
    const url = 'mongodb://localhost:27017/docAndProceduren'
    // Die Connection zu mongoDB wird über den Port sicher gestellt, weil mongo im Docker Container
    // auf diese Portnummer horcht. Dieser ist gemapped auf den realen Port dieser Nummer. 
    const databaseClient = new DataBaseClient(url)
    await databaseClient.connect()

    const handler = new Handler(databaseClient)

    const server = new Server(handler)
    server.listen(3000)

    /* Do stuff from here...
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
