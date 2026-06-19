import DataBase from './db/db.js'
import PatientSchema from './db/schemas/Patient.schema.js'

const main = async () => {
    const url = 'mongodb://localhost:27017/patients'    
    // Die Connection zu mongoDB wird über den Port sicher gestellt, weil mongo im Docker Container
    // auf diese Portnummer horcht. Dieser ist gemapped auf den realen Port dieser Nummer. 
    const database = new DataBase(url)
    await database.connect()
    // Do stuff from here...
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
    await database.addPatient(patientSchemaInstance)
    //await database.updatePatientById(131896579, patientSchemaInstance)
    console.log(await database.getPatientByFilter({ id: '131896579' }))
    //...to here.
    await database.endConnection()
}

main().catch(e => console.log(e))
