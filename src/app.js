import DataBase from './db/db.js'
import PatientSchema from './db/schemas/Patient.schema.js'
const express = require('express')
const app = express()
const port = 3000

app.use(express.json())

// can be extracted to a different file, currently just a test example
const handleHelloWorld = (req, res) => {
    console.log(req.params)
    console.log(req.query)
    console.log(req.body)

    res.status(203).json({message: 'Hello World!'})
}

const main = async () => {
    const url = 'mongodb://localhost:27017/patients'
    // Die Connection zu mongoDB wird über den Port sicher gestellt, weil mongo im Docker Container
    // auf diese Portnummer horcht. Dieser ist gemapped auf den realen Port dieser Nummer. 
    const database = new DataBase(url)
    await database.connect()
    // api path definitions
    app.get('/test', handleHelloWorld)

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`)
    })

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

try {
    main()
} catch (e) {
    console.log(e)
}
